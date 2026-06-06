import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Seed 8 demo fan profiles. Idempotent — re-running upserts the same users.
const DEMO_FANS = [
  { email: 'jake.m@demo.cubbiesbuddies.com', display_name: 'Jake M', age: 31, pronouns: 'he/him',
    bio: 'Bleacher regular since 2009. Section 305 forever.',
    intent: ['FriendToWatch'], game_status: 'AtWrigley', wrigley_section: '305',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' },
  { email: 'sara.l@demo.cubbiesbuddies.com', display_name: 'Sara L', age: 28, pronouns: 'she/her',
    bio: "Post-game hangs at Murphy's, always down for a round.",
    intent: ['ShareABeer'], game_status: 'AtBar', wrigleyville_bar: "Murphy's Bleachers",
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face' },
  { email: 'tony.r@demo.cubbiesbuddies.com', display_name: 'Tony R', age: 44, pronouns: 'he/him',
    bio: 'Season ticket holder, row 4 on the third base line.',
    intent: ['FriendToWatch'], game_status: 'AtWrigley', wrigley_section: '128', wrigley_row: '4',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face' },
  { email: 'mel.c@demo.cubbiesbuddies.com', display_name: 'Mel C', age: 26, pronouns: 'she/her',
    bio: 'New to Chicago, trying to find my Cubs crew.',
    intent: ['FriendToWatch', 'PostGameMeetup'], game_status: 'WatchingRemote',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face' },
  { email: 'brian.k@demo.cubbiesbuddies.com', display_name: 'Brian K', age: 38, pronouns: 'he/him',
    bio: '7th inning stretch singer. Unprompted.',
    intent: ['FriendToWatch'], game_status: 'AtWrigley', wrigley_section: '208', stretch_song: 'Go Cubs Go',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' },
  { email: 'ash.w@demo.cubbiesbuddies.com', display_name: 'Ash W', age: 30, pronouns: 'they/them',
    bio: 'Sheffield Ave bar crawl veteran. Know every bartender by name.',
    intent: ['ShareABeer'], game_status: 'AtBar', wrigleyville_bar: "Bernie's", best_bar: "Bernie's",
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face' },
  { email: 'dom.p@demo.cubbiesbuddies.com', display_name: 'Dom P', age: 33, pronouns: 'he/him',
    bio: 'Flew in from Detroit just for this series. Worth it.',
    intent: ['FriendToWatch'], game_status: 'AtWrigley', wrigley_section: '418',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face' },
  { email: 'carly.s@demo.cubbiesbuddies.com', display_name: 'Carly S', age: 27, pronouns: 'she/her',
    bio: 'Here for the vibes, staying for the W.',
    intent: ['Dating'], game_status: 'AtBar', wrigleyville_bar: 'Sluggers',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face' },
];

// Random points within ~1mi of Wrigley Field (41.9484, -87.6553)
function nearWrigley() {
  return {
    lat: 41.9484 + (Math.random() - 0.5) * 0.02,
    lng: -87.6553 + (Math.random() - 0.5) * 0.02,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: Array<{ email: string; user_id: string; status: string }> = [];

    for (const fan of DEMO_FANS) {
      // Create or fetch auth user
      let userId: string | null = null;
      const created = await admin.auth.admin.createUser({
        email: fan.email,
        password: crypto.randomUUID() + 'Aa1!',
        email_confirm: true,
        user_metadata: { full_name: fan.display_name, avatar_url: fan.photo, is_demo: true },
      });

      if (created.data?.user) {
        userId = created.data.user.id;
      } else {
        // Likely already exists — look it up
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users.find((u) => u.email === fan.email);
        if (!existing) throw new Error(`Could not create or find ${fan.email}: ${created.error?.message}`);
        userId = existing.id;
      }

      const coords = nearWrigley();

      // Upsert profile (handle_new_user trigger may have created a row)
      const { error: upErr } = await admin
        .from('profiles')
        .update({
          display_name: fan.display_name,
          profile_photo: fan.photo,
          age: fan.age,
          pronouns: fan.pronouns,
          bio: fan.bio,
          intent: fan.intent,
          game_status: fan.game_status,
          wrigley_section: fan.wrigley_section ?? null,
          wrigley_row: fan.wrigley_row ?? null,
          wrigleyville_bar: fan.wrigleyville_bar ?? null,
          best_bar: fan.best_bar ?? null,
          stretch_song: fan.stretch_song ?? null,
          onboarding_completed: true,
          is_verified: true,
          hidden_from_discover: false,
          location_last_set_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      if (upErr) throw upErr;

      // Persist location for map/nearby discovery
      await admin.from('user_locations').upsert(
        { user_id: userId, latitude: coords.lat, longitude: coords.lng },
        { onConflict: 'user_id' }
      );
      await admin.rpc('set_profile_location', { p_lat: coords.lat, p_lng: coords.lng }).then(
        () => {},
        () => {} // RPC requires auth.uid(); fall back via direct SQL below
      );

      results.push({ email: fan.email, user_id: userId, status: 'seeded' });
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('seed-demo-fans error', e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
