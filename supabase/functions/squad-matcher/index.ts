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

    // Authenticate user
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
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // Get requesting user's profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("user_id, display_name, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent, location_last_set_at, blocked_users")
      .eq("user_id", user.id)
      .single();

    if (!myProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active nearby fans
    const { data: activeFans } = await supabase
      .from("profiles")
      .select("user_id, display_name, profile_photo, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent, location_last_set_at")
      .eq("is_banned", false)
      .eq("hidden_from_discover", false)
      .eq("onboarding_completed", true)
      .neq("game_status", "NotSet")
      .neq("user_id", user.id)
      .gte("location_last_set_at", sixHoursAgo)
      .limit(100);

    // Filter out blocked users
    const blockedSet = new Set(myProfile.blocked_users ?? []);
    const eligibleFans = (activeFans ?? []).filter(f => !blockedSet.has(f.user_id));

    // Get user locations for proximity
    const allUserIds = [user.id, ...eligibleFans.map(f => f.user_id)];
    const { data: locations } = await supabase
      .from("user_locations")
      .select("user_id, latitude, longitude")
      .in("user_id", allUserIds);

    const locMap = new Map(locations?.map(l => [l.user_id, { lat: l.latitude, lng: l.longitude }]) ?? []);

    // Build fan profiles for AI
    const fanProfiles = eligibleFans.map(f => ({
      id: f.user_id,
      name: f.display_name,
      status: f.game_status,
      bar: f.wrigleyville_bar,
      section: f.wrigley_section,
      intents: f.gameday_intents ?? [],
      fanStyle: f.fan_style ?? [],
      matchIntents: f.intent ?? [],
      hasLocation: locMap.has(f.user_id),
      locationAge: f.location_last_set_at
        ? Math.round((Date.now() - new Date(f.location_last_set_at).getTime()) / 60000)
        : null,
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

    // Known meeting spots
    const meetingSpots = [
      "Murphy's Bleachers", "Sluggers", "Casey Moran's", "Cubby Bear",
      "Bernie's Tap & Grill", "Sports Corner", "Old Crow Smokehouse",
      "Nisei Lounge", "Captain Morgan Club", "Gallagher Way",
      "Wrigley Field Main Gate", "Bleacher Gate"
    ];

    const systemPrompt = `You are an AI squad matchmaker for the "Cubbies Buddies" app — a social app for Cubs fans around Wrigley Field.

Your job: analyze active fan data and create optimal meetup squads of 3-6 people who would genuinely enjoy hanging out together.

Squad matching criteria (in priority order):
1. PROXIMITY: Fans at the same bar or section should be grouped first
2. VIBE MATCH: Group fans with similar gameday intents and fan styles together
3. ACTIVITY: Fans who checked in recently are more likely to be actively looking
4. BALANCE: Each squad should feel balanced (not all the same person type)

Squad types to create:
- "Party Squad" — fans looking for pre-game/post-game drinks, social energy
- "Hardcore Fan Squad" — scorecard keepers, BP arrivals, stay-till-the-9th types
- "Chill Crew" — relaxed fans, family friendly, casual hangout vibes

For each squad, suggest a specific meeting point from this list: ${meetingSpots.join(", ")}
Choose the meeting point based on where most squad members already are.

Generate an icebreaker message that the squad chat would start with — something fun and specific to the squad's vibe.`;

    const userPrompt = `Here is my profile:
${JSON.stringify(myData, null, 2)}

Here are ${fanProfiles.length} active fans nearby:
${JSON.stringify(fanProfiles, null, 2)}

Current time: ${new Date().toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" })}

Create 1-3 squads of 3-6 people (including me). Each squad should feel like a natural group.
Return the squads using the tool provided.`;

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
            name: "create_squads",
            description: "Create meetup squads from available fans",
            parameters: {
              type: "object",
              properties: {
                squads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      squad_name: { type: "string", description: "Fun name for this squad (e.g. 'Bleacher Brews Crew')" },
                      squad_type: { type: "string", enum: ["party", "hardcore", "chill"] },
                      member_ids: { type: "array", items: { type: "string" }, description: "User IDs of squad members (3-6 people)" },
                      meeting_point: { type: "string", description: "Specific bar or location to meet" },
                      meeting_time: { type: "string", description: "Suggested time like '5:30 PM'" },
                      reason: { type: "string", description: "Why these fans match well (1 sentence)" },
                      icebreaker: { type: "string", description: "Fun opening message for the squad chat" },
                      vibe_emoji: { type: "string", description: "Emoji that captures the squad vibe" },
                    },
                    required: ["squad_name", "squad_type", "member_ids", "meeting_point", "meeting_time", "reason", "icebreaker", "vibe_emoji"],
                  },
                },
              },
              required: ["squads"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_squads" } },
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
    let squads: any[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        squads = parsed.squads ?? [];
      } catch {
        console.error("Failed to parse squad data");
      }
    }

    // Enrich squads with member details
    const allMemberIds = new Set<string>();
    squads.forEach(s => s.member_ids?.forEach((id: string) => allMemberIds.add(id)));

    const { data: memberProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, profile_photo, gameday_intents, fan_style")
      .in("user_id", Array.from(allMemberIds));

    const profileMap = new Map(memberProfiles?.map(p => [p.user_id, p]) ?? []);

    const enrichedSquads = squads.map(s => ({
      ...s,
      members: (s.member_ids ?? []).map((id: string) => {
        const p = profileMap.get(id);
        return {
          id,
          name: p?.display_name ?? "Fan",
          photo: p?.profile_photo ?? null,
          intents: p?.gameday_intents ?? [],
          fanStyle: p?.fan_style ?? [],
          isMe: id === user.id,
        };
      }),
    }));

    return new Response(
      JSON.stringify({ squads: enrichedSquads, totalFans: eligibleFans.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("squad-matcher error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
