// Game Day Push — runs hourly via pg_cron. When a Cubs HOME game starts in
// ~2 hours, broadcasts one notification per opted-in user. Deduped by gamePk.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CUBS_TEAM_ID = 112;
const TARGET_LEAD_MIN = 120;
const WINDOW_MIN = 35; // fire if 105 ≤ minsUntilFirstPitch ≤ 140

function chicagoDateMMDDYYYY(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${m}/${day}/${y}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authenticate the caller: only internal callers (pg_cron) that know the
    // shared secret stored in private.app_config may invoke this.
    const provided = req.headers.get('X-Internal-Secret') ?? '';
    const { data: verified, error: verifyErr } = await supabase.rpc('verify_internal_secret', { _secret: provided });
    if (verifyErr || verified !== true) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const date = chicagoDateMMDDYYYY();
    const schedRes = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${CUBS_TEAM_ID}&date=${encodeURIComponent(date)}`,
    );
    if (!schedRes.ok) {
      return new Response(JSON.stringify({ skipped: 'schedule-fetch-failed', status: schedRes.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const sched = await schedRes.json();
    const game = sched?.dates?.[0]?.games?.[0];
    if (!game) {
      return new Response(JSON.stringify({ skipped: 'no-game-today' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cubsAreHome = game?.teams?.home?.team?.id === CUBS_TEAM_ID;
    if (!cubsAreHome) {
      return new Response(JSON.stringify({ skipped: 'away-game' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const gameDate = game?.gameDate;
    const gamePk: number = game?.gamePk;
    if (!gameDate || !gamePk) {
      return new Response(JSON.stringify({ skipped: 'missing-game-fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const minsUntil = Math.round((new Date(gameDate).getTime() - Date.now()) / 60000);
    const inWindow = Math.abs(minsUntil - TARGET_LEAD_MIN) <= WINDOW_MIN / 2 + 10;
    if (!inWindow) {
      return new Response(JSON.stringify({ skipped: 'outside-window', minsUntil }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dedup: bail if we've already sent for this gamePk in the last 12h
    const twelveHoursAgo = new Date(Date.now() - 12 * 3600_000).toISOString();
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'game_day_alert')
      .gte('created_at', twelveHoursAgo)
      .contains('metadata', { gamePk })
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ skipped: 'already-sent', gamePk }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const opponent =
      game?.teams?.away?.team?.name ??
      game?.teams?.away?.team?.teamName ??
      'today\'s opponent';

    // Recipients: users who opted in AND have an active push subscription
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id');
    const subUserIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
    if (subUserIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no-subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: optedIn } = await supabase
      .from('profiles')
      .select('user_id')
      .in('user_id', subUserIds)
      .eq('game_day_notifications', true)
      .eq('is_banned', false);

    const recipientIds: string[] = (optedIn ?? []).map((p: any) => p.user_id);
    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no-opted-in' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Best-effort count of nearby active fans (last 6h)
    const sixHoursAgo = new Date(Date.now() - 6 * 3600_000).toISOString();
    const { count: nearbyCount } = await supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .gte('location_last_set_at', sixHoursAgo)
      .eq('is_banned', false);

    const countCopy =
      typeof nearbyCount === 'number' && nearbyCount > 0
        ? `${nearbyCount} buddies already checked in near you.`
        : 'Your crew is gearing up.';

    const rows = recipientIds.map((uid) => ({
      user_id: uid,
      type: 'game_day_alert',
      title: '⚾ Game day!',
      body: `${opponent} at Wrigley — ${countCopy} Tap to find your crew.`,
      emoji: '⚾',
      action_url: '/discover',
      metadata: { gamePk, gameDate, opponent },
    }));

    // Chunk inserts so we never blow the request size
    let inserted = 0;
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('notifications').insert(chunk);
      if (insErr) {
        console.error('insert chunk failed', insErr);
      } else {
        inserted += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ sent: inserted, recipients: recipientIds.length, gamePk, opponent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('gameday-push error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
