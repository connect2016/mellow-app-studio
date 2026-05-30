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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    // Get user profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("user_id, display_name, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent, blocked_users")
      .eq("user_id", user.id)
      .single();

    if (!myProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active fans
    const { data: activeFans } = await supabase
      .from("profiles")
      .select("user_id, display_name, profile_photo, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent")
      .eq("is_banned", false)
      .eq("hidden_from_discover", false)
      .eq("onboarding_completed", true)
      .neq("game_status", "NotSet")
      .neq("user_id", user.id)
      .gte("location_last_set_at", threeHoursAgo)
      .limit(80);

    const blockedSet = new Set(myProfile.blocked_users ?? []);
    const eligible = (activeFans ?? []).filter(f => !blockedSet.has(f.user_id));

    if (eligible.length < 2) {
      return new Response(JSON.stringify({
        match: null,
        reason: "Not enough fans nearby right now. Check back closer to game time!",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get recent interactions to find behaviorally compatible fans
    const { data: myLikes } = await supabase
      .from("likes")
      .select("to_user")
      .eq("from_user", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20);

    const likedUsers = new Set((myLikes ?? []).map(l => l.to_user));

    const fanData = eligible.map(f => ({
      id: f.user_id,
      name: f.display_name,
      status: f.game_status,
      bar: f.wrigleyville_bar,
      section: f.wrigley_section,
      intents: f.gameday_intents ?? [],
      fanStyle: f.fan_style ?? [],
      matchIntents: f.intent ?? [],
      previouslyLiked: likedUsers.has(f.user_id),
    }));

    const myData = {
      name: myProfile.display_name,
      status: myProfile.game_status,
      bar: myProfile.wrigleyville_bar,
      section: myProfile.wrigley_section,
      intents: myProfile.gameday_intents ?? [],
      fanStyle: myProfile.fan_style ?? [],
      matchIntents: myProfile.intent ?? [],
    };

    const meetingSpots = [
      "Murphy's Bleachers", "Sluggers", "Casey Moran's", "Cubby Bear",
      "Old Crow Smokehouse", "HVAC Pub", "Gallagher Way", "Bernie's",
      "Wrigley Field Main Gate", "Bleacher Gate",
    ];

    const systemPrompt = `You are an instant matchmaker for "Wrigleyville Buddies" — a Cubs fans social app.

Your mission: pick the SINGLE BEST group of 3-5 fans for this user to instantly meet up with RIGHT NOW. 
Zero decision-making required from the user — you decide everything:
- WHO they should meet (pick specific fans by ID)
- WHERE they should meet (a specific spot)
- WHEN (right now or within 15 minutes)
- WHY this group works

Prioritize:
1. Same location (bar or section) = instant match
2. Previously liked fans = social signal
3. Complementary fan styles (one hype person + chill people = balanced)
4. Similar intents (both want beer? match them)

IMPORTANT: Only return ONE group. This is a one-tap action — no choices.`;

    const userPrompt = `My profile:
${JSON.stringify(myData)}

Available fans (${fanData.length}):
${JSON.stringify(fanData)}

Time: ${new Date().toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })}
Meeting spots: ${meetingSpots.join(", ")}

Pick the best instant group for me. Use the tool to respond.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "instant_match",
            description: "Create an instant group match",
            parameters: {
              type: "object",
              properties: {
                group_name: { type: "string", description: "Fun name like 'Bleacher Brew Crew'" },
                member_ids: { type: "array", items: { type: "string" }, description: "3-5 fan IDs" },
                meeting_spot: { type: "string" },
                energy: { type: "string", enum: ["celebration", "hype", "chill"] },
                reason: { type: "string", description: "Why this group clicks (1 sentence)" },
                icebreaker: { type: "string", description: "Opening chat message" },
                emoji: { type: "string" },
              },
              required: ["group_name", "member_ids", "meeting_spot", "energy", "reason", "icebreaker", "emoji"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "instant_match" } },
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
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let match = null;

    if (toolCall?.function?.arguments) {
      try {
        match = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse instant match data");
      }
    }

    if (!match) {
      return new Response(JSON.stringify({ match: null, reason: "Couldn't find a match right now" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrich with member profiles
    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, profile_photo, fan_style, gameday_intents")
      .in("user_id", match.member_ids);

    match.members = (memberProfiles ?? []).map(p => ({
      id: p.user_id,
      name: p.display_name,
      photo: p.profile_photo,
      fanStyle: p.fan_style ?? [],
    }));

    return new Response(
      JSON.stringify({ match }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("instant-match error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
