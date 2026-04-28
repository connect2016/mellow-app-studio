import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  body: string;
  emoji: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    // Get today's games
    const { data: games } = await supabase
      .from("games")
      .select("*")
      .eq("is_home", true)
      .lte("game_start", new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString())
      .gte("game_end", twoHoursAgo);

    const notifications: NotificationPayload[] = [];

    // Determine game phase
    let gamePhase: "pre" | "during" | "post" | "none" = "none";
    let activeGame = null;
    for (const game of games || []) {
      const start = new Date(game.game_start);
      const end = new Date(game.game_end);
      if (now < start) { gamePhase = "pre"; activeGame = game; break; }
      if (now >= start && now <= end) { gamePhase = "during"; activeGame = game; break; }
      if (now > end && now.getTime() - end.getTime() < 2 * 60 * 60 * 1000) {
        gamePhase = "post"; activeGame = game; break;
      }
    }

    // Get all active users
    const { data: activeProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, game_status, wrigleyville_bar, location_last_set_at")
      .eq("is_banned", false)
      .eq("onboarding_completed", true);

    const recentlyActive = (activeProfiles || []).filter(
      (p) => p.location_last_set_at && new Date(p.location_last_set_at).getTime() > new Date(sixHoursAgo).getTime()
    );

    // Get crew memberships for "crew heading out" notifications
    const { data: crewMembers } = await supabase
      .from("crew_members")
      .select("crew_id, user_id");

    const { data: crews } = await supabase
      .from("crews")
      .select("id, name");

    const crewMap = new Map((crews || []).map((c) => [c.id, c.name]));

    // Build crew membership lookup: user -> [{crew_id, crew_name}]
    const userCrews = new Map<string, { crew_id: string; crew_name: string }[]>();
    for (const cm of crewMembers || []) {
      const list = userCrews.get(cm.user_id) || [];
      list.push({ crew_id: cm.crew_id, crew_name: crewMap.get(cm.crew_id) || "your crew" });
      userCrews.set(cm.user_id, list);
    }

    // Get recent unread beer money (likes with beer context could be modeled here)
    // For now check recent matches and hi-fives for notification triggers

    // Avoid duplicate notifications: check recent ones
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("user_id, type")
      .gte("created_at", oneHourAgo);

    const recentSet = new Set(
      (recentNotifs || []).map((n) => `${n.user_id}:${n.type}`)
    );

    const shouldNotify = (userId: string, type: string) =>
      !recentSet.has(`${userId}:${type}`);

    // ─── PRE-GAME NOTIFICATIONS ───
    if (gamePhase === "pre" && activeGame) {
      const allUsers = activeProfiles || [];

      for (const user of allUsers) {
        // "Your crew is heading out"
        const myCrews = userCrews.get(user.user_id) || [];
        for (const crew of myCrews) {
          const crewMemberIds = (crewMembers || [])
            .filter((cm) => cm.crew_id === crew.crew_id && cm.user_id !== user.user_id)
            .map((cm) => cm.user_id);

          const activeCrewMates = recentlyActive.filter(
            (p) => crewMemberIds.includes(p.user_id) && p.game_status !== "NotSet"
          );

          if (activeCrewMates.length >= 1 && shouldNotify(user.user_id, "crew_active")) {
            notifications.push({
              user_id: user.user_id,
              type: "crew_active",
              title: `${crew.crew_name} is heading out! 🎉`,
              body: `${activeCrewMates.length} crew member${activeCrewMates.length > 1 ? "s" : ""} already checked in for the ${activeGame.opponent} game`,
              emoji: "👥",
              action_url: `/crews`,
              metadata: { crew_id: crew.crew_id, game_id: activeGame.id },
            });
            break; // One crew notification per user
          }
        }

        // "Game starts soon" reminder
        const minsToGame = Math.floor(
          (new Date(activeGame.game_start).getTime() - now.getTime()) / 60000
        );
        if (minsToGame > 0 && minsToGame <= 60 && shouldNotify(user.user_id, "game_reminder")) {
          const fansActive = recentlyActive.length;
          notifications.push({
            user_id: user.user_id,
            type: "game_reminder",
            title: `Cubs vs ${activeGame.opponent} in ${minsToGame} min ⚾`,
            body: `${fansActive} fan${fansActive !== 1 ? "s" : ""} already active — set your status and join the action!`,
            emoji: "⏰",
            action_url: "/discover",
            metadata: { game_id: activeGame.id },
          });
        }
      }
    }

    // ─── DURING GAME NOTIFICATIONS ───
    if (gamePhase === "during") {
      const atWrigley = recentlyActive.filter((p) => p.game_status === "AtWrigley");
      const atBars = recentlyActive.filter((p) => p.game_status === "AtBar");

      for (const user of activeProfiles || []) {
        // "Fans near you are active"
        if (
          recentlyActive.length >= 3 &&
          shouldNotify(user.user_id, "fans_active")
        ) {
          const isAtGame = recentlyActive.find((p) => p.user_id === user.user_id);
          if (!isAtGame) {
            notifications.push({
              user_id: user.user_id,
              type: "fans_active",
              title: "Fans near you are going off! 🔥",
              body: `${atWrigley.length} at the game, ${atBars.length} at bars — don't miss out!`,
              emoji: "📍",
              action_url: "/discover",
            });
          }
        }

        // "Your section is poppin" for users at game
        const userAtGame = recentlyActive.find(
          (p) => p.user_id === user.user_id && p.game_status === "AtWrigley"
        );
        if (userAtGame && atWrigley.length >= 5 && shouldNotify(user.user_id, "section_active")) {
          notifications.push({
            user_id: user.user_id,
            type: "section_active",
            title: "Wrigley is buzzing! 🏟️",
            body: `${atWrigley.length} fans checked in — browse nearby fans and send a Hi-Five!`,
            emoji: "⚡",
            action_url: "/discover",
          });
        }
      }
    }

    // ─── POST-GAME NOTIFICATIONS ───
    if (gamePhase === "post" && activeGame) {
      // Find popular bars
      const barCounts: Record<string, number> = {};
      for (const p of recentlyActive) {
        if (p.game_status === "AtBar" && p.wrigleyville_bar) {
          barCounts[p.wrigleyville_bar] = (barCounts[p.wrigleyville_bar] || 0) + 1;
        }
      }
      const topBar = Object.entries(barCounts).sort((a, b) => b[1] - a[1])[0];

      for (const user of activeProfiles || []) {
        if (shouldNotify(user.user_id, "post_game")) {
          const body = topBar
            ? `${topBar[1]} fans heading to ${topBar[0]} — where are you going? 🍺`
            : "Where is everyone going after? Check post-game meetups!";

          notifications.push({
            user_id: user.user_id,
            type: "post_game",
            title: "Game's over — the night's just starting! 🌙",
            body,
            emoji: "🎉",
            action_url: "/discover",
            metadata: { game_id: activeGame.id },
          });
        }
      }
    }

    // ─── FELLOW FANS NUDGES (proximity / time-of-day / gameday) ───
    // Top bar by current check-ins
    const allBarCounts: Record<string, number> = {};
    for (const p of recentlyActive) {
      if (p.game_status === "AtBar" && p.wrigleyville_bar) {
        allBarCounts[p.wrigleyville_bar] = (allBarCounts[p.wrigleyville_bar] || 0) + 1;
      }
    }
    const topBarOverall = Object.entries(allBarCounts).sort((a, b) => b[1] - a[1])[0];

    // Section counts (for "your section has X buddies")
    const { data: sectionProfiles } = await supabase
      .from("profiles")
      .select("user_id, wrigley_section")
      .eq("is_banned", false)
      .not("wrigley_section", "is", null)
      .gte("location_last_set_at", twoHoursAgo);

    const sectionCounts: Record<string, number> = {};
    for (const p of sectionProfiles || []) {
      if (p.wrigley_section) {
        sectionCounts[p.wrigley_section] = (sectionCounts[p.wrigley_section] || 0) + 1;
      }
    }

    // Nearby flash meetups starting soon
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const { data: upcomingMeetups } = await supabase
      .from("lineup_meetups")
      .select("id, location_name, meeting_time")
      .gte("meeting_time", now.toISOString())
      .lte("meeting_time", thirtyMinFromNow);

    // Brand-new fans (joined in last 2h) signal "say hi"
    const { data: newFans } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("onboarding_completed", true)
      .eq("is_banned", false)
      .gte("created_at", twoHoursAgo);
    const newFanCount = (newFans || []).length;

    const minsToFirstPitch =
      gamePhase === "pre" && activeGame
        ? Math.floor((new Date(activeGame.game_start).getTime() - now.getTime()) / 60000)
        : null;

    const wrigleyvilleBuzzing = recentlyActive.length >= 8;

    for (const user of activeProfiles || []) {
      // 1) Fans gathering at top bar
      if (
        topBarOverall &&
        topBarOverall[1] >= 3 &&
        user.wrigleyville_bar !== topBarOverall[0] &&
        shouldNotify(user.user_id, "fellow_bar_gather")
      ) {
        notifications.push({
          user_id: user.user_id,
          type: "fellow_bar_gather",
          title: "Fellow fans nearby 🍺",
          body: `Fans are gathering at ${topBarOverall[0]} — want to join?`,
          emoji: "🍺",
          action_url: "/bar-map",
          metadata: { bar: topBarOverall[0], count: topBarOverall[1] },
        });
      }

      // 2) Your section has X buddies
      const myProfile = (sectionProfiles || []).find((p) => p.user_id === user.user_id);
      if (myProfile?.wrigley_section) {
        const count = (sectionCounts[myProfile.wrigley_section] || 1) - 1;
        if (count >= 2 && shouldNotify(user.user_id, "section_buddies")) {
          notifications.push({
            user_id: user.user_id,
            type: "section_buddies",
            title: "Your section is loaded 🏟️",
            body: `Your section has ${count} Buddies nearby.`,
            emoji: "📍",
            action_url: "/discover",
            metadata: { section: myProfile.wrigley_section, count },
          });
        }
      }

      // 3) Meetup starting 2 blocks away
      if ((upcomingMeetups || []).length > 0 && shouldNotify(user.user_id, "meetup_nearby")) {
        const m = upcomingMeetups![0];
        notifications.push({
          user_id: user.user_id,
          type: "meetup_nearby",
          title: "Meetup starting soon 📍",
          body: `A meetup is starting 2 blocks away at ${m.location_name}.`,
          emoji: "🏃",
          action_url: `/meetups/${m.id}`,
          metadata: { meetup_id: m.id },
        });
      }

      // 4) New fan just joined
      if (newFanCount >= 1 && shouldNotify(user.user_id, "new_fan_nearby")) {
        notifications.push({
          user_id: user.user_id,
          type: "new_fan_nearby",
          title: "Fresh face in Wrigleyville 👋",
          body: "A new fan just joined near you — say hi!",
          emoji: "👋",
          action_url: "/discover",
        });
      }

      // 5) Wrigleyville is buzzing (broad activity)
      if (wrigleyvilleBuzzing && shouldNotify(user.user_id, "wrigleyville_buzz")) {
        notifications.push({
          user_id: user.user_id,
          type: "wrigleyville_buzz",
          title: "The neighborhood is alive ⚡",
          body: "Wrigleyville is buzzing — jump into the action.",
          emoji: "⚡",
          action_url: "/discover",
        });
      }

      // 6) Almost first pitch — find your crew
      if (
        minsToFirstPitch !== null &&
        minsToFirstPitch > 0 &&
        minsToFirstPitch <= 30 &&
        shouldNotify(user.user_id, "almost_first_pitch")
      ) {
        notifications.push({
          user_id: user.user_id,
          type: "almost_first_pitch",
          title: "Almost first pitch ⚾",
          body: "It's almost first pitch — find your crew.",
          emoji: "⏰",
          action_url: "/discover",
        });
      }
    }

    // New hi-fives received in last hour
    const { data: recentHiFives } = await supabase
      .from("likes")
      .select("to_user, from_user, message")
      .eq("is_hi_five", true)
      .gte("created_at", oneHourAgo);

    for (const hf of recentHiFives || []) {
      if (shouldNotify(hf.to_user, `hifive_${hf.from_user}`)) {
        const sender = (activeProfiles || []).find((p) => p.user_id === hf.from_user);
        notifications.push({
          user_id: hf.to_user,
          type: `hifive_${hf.from_user}`,
          title: `${sender?.display_name || "A fan"} sent you a Hi-Five! 🖐️`,
          body: hf.message || "Someone wants to connect — Hi-Five back!",
          emoji: "🖐️",
          action_url: "/hi-fives",
        });
      }
    }

    // New matches in last hour
    const { data: recentMatches } = await supabase
      .from("matches")
      .select("user_a, user_b")
      .gte("created_at", oneHourAgo);

    for (const match of recentMatches || []) {
      for (const userId of [match.user_a, match.user_b]) {
        const otherId = userId === match.user_a ? match.user_b : match.user_a;
        if (shouldNotify(userId, `match_${otherId}`)) {
          const other = (activeProfiles || []).find((p) => p.user_id === otherId);
          notifications.push({
            user_id: userId,
            type: `match_${otherId}`,
            title: `It's a match with ${other?.display_name || "a fan"}! 🎉`,
            body: "You can now message each other — say hey!",
            emoji: "❤️",
            action_url: "/messages",
          });
        }
      }
    }

    // Batch insert notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(
        notifications.map((n) => ({
          user_id: n.user_id,
          type: n.type,
          title: n.title,
          body: n.body,
          emoji: n.emoji,
          action_url: n.action_url || null,
          metadata: n.metadata || {},
        }))
      );
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        phase: gamePhase,
        sent: notifications.length,
        game: activeGame?.opponent || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
