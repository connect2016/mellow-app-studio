import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    // Gather all signals in parallel
    const [profileRes, barVotesRes, activeFansRes, meetupsRes, likesRes, gameRes] = await Promise.all([
      // User's profile
      supabase.from("profiles")
        .select("user_id, display_name, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent, vibe_state, vibe_emoji, blocked_users")
        .eq("user_id", user.id).single(),
      // Recent bar votes (crowd density proxy)
      supabase.from("bar_votes")
        .select("bar_name, vibe, wait_time, user_id")
        .gte("created_at", threeHoursAgo),
      // Active fans by location
      supabase.from("profiles")
        .select("user_id, game_status, wrigleyville_bar, wrigley_section, vibe_state, vibe_emoji, fan_style, gameday_intents")
        .eq("is_banned", false).eq("hidden_from_discover", false).eq("onboarding_completed", true)
        .neq("game_status", "NotSet").neq("user_id", user.id)
        .gte("location_last_set_at", threeHoursAgo).limit(100),
      // Active meetups
      supabase.from("lineup_meetups")
        .select("id, location_name, description, meeting_time, max_members, creator_id, status")
        .eq("status", "active").gte("expires_at", new Date().toISOString()).limit(20),
      // User's recent interactions (behavioral pattern)
      supabase.from("likes")
        .select("to_user, is_hi_five")
        .eq("from_user", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).limit(30),
      // Current/upcoming game
      supabase.from("games")
        .select("id, opponent, game_start, game_end")
        .gte("game_end", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .lte("game_start", new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString())
        .order("game_start", { ascending: true }).limit(1),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get meetup member counts
    const meetupIds = (meetupsRes.data ?? []).map(m => m.id);
    let meetupMemberCounts: Record<string, number> = {};
    if (meetupIds.length > 0) {
      const { data: members } = await supabase.from("lineup_members")
        .select("meetup_id").in("meetup_id", meetupIds);
      (members ?? []).forEach(m => {
        meetupMemberCounts[m.meetup_id] = (meetupMemberCounts[m.meetup_id] || 0) + 1;
      });
    }

    // Build venue crowd density map
    const venueDensity: Record<string, { fans: number; vibes: string[]; waitTimes: string[] }> = {};
    (activeFansRes.data ?? []).forEach(f => {
      if (f.game_status === "AtBar" && f.wrigleyville_bar) {
        const v = venueDensity[f.wrigleyville_bar] || { fans: 0, vibes: [], waitTimes: [] };
        v.fans++;
        venueDensity[f.wrigleyville_bar] = v;
      }
    });
    (barVotesRes.data ?? []).forEach(v => {
      const entry = venueDensity[v.bar_name] || { fans: 0, vibes: [], waitTimes: [] };
      entry.vibes.push(v.vibe);
      entry.waitTimes.push(v.wait_time);
      venueDensity[v.bar_name] = entry;
    });

    // Section density
    const sectionDensity: Record<string, number> = {};
    (activeFansRes.data ?? []).forEach(f => {
      if (f.game_status === "AtWrigley" && f.wrigley_section) {
        sectionDensity[f.wrigley_section] = (sectionDensity[f.wrigley_section] || 0) + 1;
      }
    });

    // Behavioral patterns
    const blockedSet = new Set(profile.blocked_users ?? []);
    const likedUsers = new Set((likesRes.data ?? []).map(l => l.to_user));
    const hiFiveCount = (likesRes.data ?? []).filter(l => l.is_hi_five).length;

    // Determine game phase
    const game = gameRes.data?.[0];
    let gamePhase = "no_game";
    if (game) {
      const now = Date.now();
      const start = new Date(game.game_start).getTime();
      const end = new Date(game.game_end).getTime();
      if (now < start - 90 * 60 * 1000) gamePhase = "pre_game";
      else if (now < start) gamePhase = "gates_open";
      else if (now < end) gamePhase = "in_game";
      else gamePhase = "post_game";
    }

    // Vibe distribution among active fans
    const vibeDistribution: Record<string, number> = {};
    (activeFansRes.data ?? []).forEach(f => {
      if (f.vibe_state) vibeDistribution[f.vibe_state] = (vibeDistribution[f.vibe_state] || 0) + 1;
    });

    const contextPayload = {
      myProfile: {
        status: profile.game_status,
        currentBar: profile.wrigleyville_bar,
        currentSection: profile.wrigley_section,
        intents: profile.gameday_intents ?? [],
        fanStyle: profile.fan_style ?? [],
        matchIntents: profile.intent ?? [],
        vibeState: profile.vibe_state,
      },
      gamePhase,
      opponent: game?.opponent ?? "unknown",
      currentTime: new Date().toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }),
      venueDensity,
      sectionDensity,
      vibeDistribution,
      activeMeetups: (meetupsRes.data ?? []).map(m => ({
        id: m.id,
        location: m.location_name,
        description: m.description,
        members: meetupMemberCounts[m.id] ?? 0,
        maxMembers: m.max_members,
        meetingTime: m.meeting_time,
      })),
      behavioral: {
        totalLikes: (likesRes.data ?? []).length,
        hiFives: hiFiveCount,
        socialnessScore: Math.min(10, Math.round(((likesRes.data ?? []).length + hiFiveCount) / 3)),
      },
      totalActiveFans: (activeFansRes.data ?? []).length,
    };

    const systemPrompt = `You are the "Next Move" recommendation engine for "Wrigleyville Buddies" — a Cubs fans social app in Wrigleyville, Chicago.

Your job: analyze live crowd data, the user's behavior patterns, and current game phase to recommend the BEST next move for this fan. You produce exactly 3 ranked recommendations.

Each recommendation is one of:
- "go_to_venue" — Move to a specific bar/venue 
- "join_meetup" — Join an active meetup group
- "stay_put" — Stay where you are (with a reason)
- "explore_section" — Check out a stadium section (if at Wrigley)
- "start_meetup" — Create a new meetup at a suggested spot

Decision factors:
1. CROWD DENSITY — Recommend venues that aren't too packed (sweet spot: 5-15 fans) unless user is "lit" or "hype" vibe
2. VIBE MATCH — Match the user's vibe state to venue energy (chill users → quieter spots, lit users → packed spots)
3. BEHAVIORAL PATTERNS — Social users get group recommendations, quieter users get smaller intimate suggestions
4. GAME PHASE — Pre-game: bars. In-game: sections. Post-game: celebration/consolation venues
5. MOMENTUM — If a venue is trending up (many recent check-ins), it's a hot pick
6. MEETUP OPENINGS — Prioritize meetups with space that match user intents

Be specific, decisive, and fun. Each recommendation needs a compelling reason.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Recommend my next move:\n${JSON.stringify(contextPayload)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_next_moves",
            description: "Return 3 ranked next-move recommendations",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rank: { type: "number", description: "1 = best, 2, 3" },
                      type: { type: "string", enum: ["go_to_venue", "join_meetup", "stay_put", "explore_section", "start_meetup"] },
                      title: { type: "string", description: "Short action title like 'Head to Murphy's Bleachers'" },
                      location: { type: "string", description: "Venue or section name" },
                      reason: { type: "string", description: "One compelling sentence why" },
                      crowd_level: { type: "string", enum: ["empty", "chill", "buzzing", "packed"] },
                      vibe_match: { type: "number", description: "1-10 how well this matches user's vibe" },
                      emoji: { type: "string" },
                      meetup_id: { type: "string", description: "If type is join_meetup, the meetup ID" },
                      urgency: { type: "string", enum: ["now", "soon", "whenever"], description: "How urgent is this move" },
                    },
                    required: ["rank", "type", "title", "location", "reason", "crowd_level", "vibe_match", "emoji", "urgency"],
                  },
                },
                headline: { type: "string", description: "One-line summary of the situation (e.g., 'Murphy's is heating up — perfect timing to slide in')" },
              },
              required: ["recommendations", "headline"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_next_moves" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let result = null;

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse next-move data");
      }
    }

    if (!result) {
      return new Response(JSON.stringify({ recommendations: [], headline: "Couldn't generate recommendations right now" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("next-move error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
