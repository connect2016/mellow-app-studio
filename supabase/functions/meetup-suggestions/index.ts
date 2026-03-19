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

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current user from JWT
    const anonClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
    } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    // Fetch active fans nearby
    const { data: activeFans } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, game_status, wrigleyville_bar, wrigley_section, intent"
      )
      .eq("is_banned", false)
      .eq("onboarding_completed", true)
      .neq("game_status", "NotSet")
      .neq("user_id", user.id)
      .gte("location_last_set_at", sixHoursAgo)
      .limit(50);

    // Fetch user's own profile
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("display_name, game_status, wrigleyville_bar, wrigley_section, intent")
      .eq("user_id", user.id)
      .single();

    // Get active game
    const now = new Date().toISOString();
    const { data: activeGame } = await supabase
      .from("games")
      .select("opponent, venue, game_start")
      .eq("is_home", true)
      .lte("game_start", now)
      .gte("game_end", now)
      .limit(1)
      .maybeSingle();

    // Group fans by status and location
    const barGroups: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const intentCounts: Record<string, number> = {};

    (activeFans ?? []).forEach((f) => {
      const status = f.game_status as string;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (f.wrigleyville_bar) {
        barGroups[f.wrigleyville_bar as string] =
          (barGroups[f.wrigleyville_bar as string] || 0) + 1;
      }

      const intents = (f.intent as string[]) ?? [];
      intents.forEach((i) => {
        intentCounts[i] = (intentCounts[i] || 0) + 1;
      });
    });

    const fanSummary = {
      totalActive: activeFans?.length ?? 0,
      statusBreakdown: statusCounts,
      barBreakdown: barGroups,
      intentBreakdown: intentCounts,
      activeGame: activeGame
        ? `Cubs vs ${activeGame.opponent} at ${activeGame.venue}`
        : null,
      myStatus: myProfile?.game_status,
      myBar: myProfile?.wrigleyville_bar,
      myIntents: myProfile?.intent,
      currentTime: new Date().toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    const systemPrompt = `You are a fun, friendly Cubs fan meetup assistant for the "Cubbies Buddies" app. 
You help fans connect at Wrigley Field and Wrigleyville bars.

Given data about active nearby fans, generate 2-3 smart meetup suggestions.
Each suggestion should feel natural and exciting — like a friend nudging you to go hang out.

Rules:
- Keep suggestions short, punchy, and fun
- Use Cubs/baseball culture references naturally
- Include specific bars or locations from Wrigleyville (Murphy's Bleachers, Sluggers, Casey Moran's, Cubby Bear, Bernie's Tap & Grill, Sports Corner, Old Crow Smokehouse, Nisei Lounge)
- Suggest realistic times based on the current time
- Match suggestions to the user's intents and current status
- If a game is active, lean into game-day energy`;

    const userPrompt = `Here's the current fan activity data:
${JSON.stringify(fanSummary, null, 2)}

Generate 2-3 meetup suggestions. Return a JSON array where each item has:
- "headline": catchy one-liner (e.g. "5 fans want to grab a drink at Sluggers")
- "description": brief context (1 sentence)  
- "location": suggested bar or spot name
- "suggested_time": time string (e.g. "5:30 PM")
- "suggested_message": a ready-to-send group message (casual, fun tone)
- "emoji": fitting emoji for the suggestion`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_meetups",
                description: "Return meetup suggestions for Cubs fans",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          headline: { type: "string" },
                          description: { type: "string" },
                          location: { type: "string" },
                          suggested_time: { type: "string" },
                          suggested_message: { type: "string" },
                          emoji: { type: "string" },
                        },
                        required: [
                          "headline",
                          "description",
                          "location",
                          "suggested_time",
                          "suggested_message",
                          "emoji",
                        ],
                      },
                    },
                  },
                  required: ["suggestions"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "suggest_meetups" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again shortly" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions ?? [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(
      JSON.stringify({ suggestions, fanCount: activeFans?.length ?? 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("meetup-suggestions error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
