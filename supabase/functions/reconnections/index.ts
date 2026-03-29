import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ─── Gather interaction signals ───

    // 1. Past matches
    const { data: matches } = await supabase
      .from("matches")
      .select("user_a, user_b, created_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    // 2. Hi-fives sent/received
    const { data: hiFives } = await supabase
      .from("likes")
      .select("from_user, to_user, created_at, message")
      .eq("is_hi_five", true)
      .or(`from_user.eq.${userId},to_user.eq.${userId}`);

    // 3. Conversations with message counts
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, participant_a, participant_b, last_message_at")
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

    // 4. Shared meetups (lineup)
    const { data: myLineupMemberships } = await supabase
      .from("lineup_members")
      .select("meetup_id")
      .eq("user_id", userId);

    const myMeetupIds = (myLineupMemberships || []).map(m => m.meetup_id);

    let sharedMeetupUsers: { user_id: string; meetup_id: string }[] = [];
    if (myMeetupIds.length > 0) {
      const { data } = await supabase
        .from("lineup_members")
        .select("user_id, meetup_id")
        .in("meetup_id", myMeetupIds.slice(0, 50))
        .neq("user_id", userId);
      sharedMeetupUsers = data || [];
    }

    // 5. Shared crews
    const { data: myCrews } = await supabase
      .from("crew_members")
      .select("crew_id")
      .eq("user_id", userId);

    const myCrewIds = (myCrews || []).map(c => c.crew_id);

    let sharedCrewUsers: { user_id: string; crew_id: string }[] = [];
    if (myCrewIds.length > 0) {
      const { data } = await supabase
        .from("crew_members")
        .select("user_id, crew_id")
        .in("crew_id", myCrewIds)
        .neq("user_id", userId);
      sharedCrewUsers = data || [];
    }

    // 6. Flash meetup co-members
    const { data: myFlashMemberships } = await supabase
      .from("flash_meetup_members")
      .select("meetup_id")
      .eq("user_id", userId);

    const myFlashIds = (myFlashMemberships || []).map(m => m.meetup_id);

    let sharedFlashUsers: { user_id: string }[] = [];
    if (myFlashIds.length > 0) {
      const { data } = await supabase
        .from("flash_meetup_members")
        .select("user_id")
        .in("meetup_id", myFlashIds.slice(0, 50))
        .neq("user_id", userId);
      sharedFlashUsers = data || [];
    }

    // ─── Build connection scores ───
    const connectionScores: Record<string, {
      score: number;
      signals: string[];
      lastInteraction: string;
      otherUserId: string;
    }> = {};

    const addSignal = (otherId: string, points: number, signal: string, date: string) => {
      if (!connectionScores[otherId]) {
        connectionScores[otherId] = { score: 0, signals: [], lastInteraction: date, otherUserId: otherId };
      }
      connectionScores[otherId].score += points;
      if (!connectionScores[otherId].signals.includes(signal)) {
        connectionScores[otherId].signals.push(signal);
      }
      if (date > connectionScores[otherId].lastInteraction) {
        connectionScores[otherId].lastInteraction = date;
      }
    };

    // Score matches (high value)
    for (const m of matches || []) {
      const otherId = m.user_a === userId ? m.user_b : m.user_a;
      addSignal(otherId, 30, "matched", m.created_at);
    }

    // Score hi-fives
    for (const hf of hiFives || []) {
      const otherId = hf.from_user === userId ? hf.to_user : hf.from_user;
      addSignal(otherId, 15, "hi_fived", hf.created_at);
    }

    // Score conversations (more recent = higher)
    for (const conv of conversations || []) {
      const otherId = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
      const lastMsg = conv.last_message_at || conv.id; // fallback
      addSignal(otherId, 20, "messaged", lastMsg);
    }

    // Score shared meetups
    for (const sm of sharedMeetupUsers) {
      addSignal(sm.user_id, 25, "shared_meetup", now.toISOString());
    }

    // Score shared crews
    for (const sc of sharedCrewUsers) {
      addSignal(sc.user_id, 20, "same_crew", now.toISOString());
    }

    // Score flash meetup co-members
    for (const sf of sharedFlashUsers) {
      addSignal(sf.user_id, 15, "flash_meetup_together", now.toISOString());
    }

    // ─── Filter: only suggest users NOT recently interacted with ───
    const staleConnections = Object.values(connectionScores)
      .filter(c => c.lastInteraction < sevenDaysAgo && c.score >= 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (staleConnections.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Enrich with profile data ───
    const targetIds = staleConnections.map(c => c.otherUserId);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, profile_photo, game_status, vibe_state, vibe_emoji, fan_tier, fan_tier_emoji, wrigleyville_bar, location_last_set_at")
      .in("user_id", targetIds)
      .eq("is_banned", false)
      .eq("hidden_from_discover", false);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    const suggestions = staleConnections
      .map(conn => {
        const profile = profileMap.get(conn.otherUserId);
        if (!profile) return null;

        const isActive = profile.location_last_set_at && profile.location_last_set_at > sixHoursAgo;
        const daysSince = Math.floor((now.getTime() - new Date(conn.lastInteraction).getTime()) / (1000 * 60 * 60 * 24));

        // Generate reconnection reason
        const signalLabels: Record<string, string> = {
          matched: "You matched before",
          hi_fived: "Exchanged Hi-Fives",
          messaged: "Had a conversation",
          shared_meetup: "Met up together",
          same_crew: "In the same crew",
          flash_meetup_together: "Joined a flash meetup",
        };
        const reasons = conn.signals.map(s => signalLabels[s] || s);

        return {
          user_id: conn.otherUserId,
          display_name: profile.display_name,
          profile_photo: profile.profile_photo,
          game_status: profile.game_status,
          vibe_emoji: profile.vibe_emoji,
          fan_tier_emoji: profile.fan_tier_emoji,
          wrigleyville_bar: profile.wrigleyville_bar,
          is_active_now: !!isActive,
          connection_score: conn.score,
          days_since_interaction: daysSince,
          reasons,
          suggested_action: isActive ? "say_hi" : "send_hifive",
        };
      })
      .filter(Boolean)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
