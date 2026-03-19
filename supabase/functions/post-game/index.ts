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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();

    // Find a game that ended within the last 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recentGame } = await supabase
      .from("games")
      .select("id, opponent, venue, game_start, game_end")
      .eq("is_home", true)
      .lte("game_end", now.toISOString())
      .gte("game_end", twoHoursAgo)
      .order("game_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recentGame) {
      return new Response(
        JSON.stringify({ active: false, message: "No recent game ended" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get fans who were active during the game
    const gameStart = recentGame.game_start;
    const { data: activeFans } = await supabase
      .from("profiles")
      .select("user_id, display_name, game_status, wrigleyville_bar, intent")
      .eq("is_banned", false)
      .eq("onboarding_completed", true)
      .neq("game_status", "NotSet")
      .gte("location_last_set_at", gameStart)
      .limit(100);

    // Count fans by bar for popularity ranking
    const barCounts: Record<string, number> = {};
    const totalActiveFans = activeFans?.length ?? 0;

    (activeFans ?? []).forEach((f) => {
      if (f.wrigleyville_bar) {
        const bar = f.wrigleyville_bar as string;
        barCounts[bar] = (barCounts[bar] || 0) + 1;
      }
    });

    const popularBars = Object.entries(barCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Use AI to generate post-game suggestions if available
    let aiSuggestions: any[] = [];

    if (LOVABLE_API_KEY) {
      const gameEndTime = new Date(recentGame.game_end);
      const currentTime = now.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
      });

      const systemPrompt = `You are a fun Cubs after-party coordinator for "Cubbies Buddies". 
The game just ended! Help fans find the best post-game spots in Wrigleyville.
Keep suggestions exciting, specific, and action-oriented.
Reference actual Wrigleyville bars: Murphy's Bleachers, Sluggers, Casey Moran's, Cubby Bear, Bernie's Tap & Grill, Sports Corner, Old Crow Smokehouse, Nisei Lounge.`;

      const userPrompt = `The Cubs vs ${recentGame.opponent} game just ended at ${recentGame.venue}.
Current time: ${currentTime}
Active fans: ${totalActiveFans}
Popular bars right now: ${JSON.stringify(popularBars)}

Generate 3 post-game event suggestions. Return JSON with a "suggestions" array where each item has:
- "title": catchy event name (e.g. "Post-Game Victory Beers 🍺")
- "description": one fun sentence
- "bar": specific Wrigleyville bar name
- "vibe": one of "chill", "party", "sports-talk", "celebration"
- "emoji": fitting emoji`;

      try {
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
                    name: "suggest_postgame",
                    description: "Return post-game event suggestions",
                    parameters: {
                      type: "object",
                      properties: {
                        suggestions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              description: { type: "string" },
                              bar: { type: "string" },
                              vibe: { type: "string", enum: ["chill", "party", "sports-talk", "celebration"] },
                              emoji: { type: "string" },
                            },
                            required: ["title", "description", "bar", "vibe", "emoji"],
                          },
                        },
                      },
                      required: ["suggestions"],
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "suggest_postgame" } },
            }),
          }
        );

        if (response.ok) {
          const aiResult = await response.json();
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            try {
              const parsed = JSON.parse(toolCall.function.arguments);
              aiSuggestions = parsed.suggestions ?? [];
            } catch { /* ignore parse error */ }
          }
        } else if (response.status === 429) {
          console.warn("AI rate limited for post-game suggestions");
        } else if (response.status === 402) {
          console.warn("AI credits exhausted for post-game suggestions");
        }
      } catch (e) {
        console.error("AI call failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        active: true,
        game: {
          id: recentGame.id,
          opponent: recentGame.opponent,
          venue: recentGame.venue,
          game_end: recentGame.game_end,
        },
        totalFans: totalActiveFans,
        popularBars,
        suggestions: aiSuggestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("post-game error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
