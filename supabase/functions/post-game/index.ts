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

    // Accept optional outcome from client, or default to unknown
    let body: { outcome?: string; cubs_score?: number; opponent_score?: number } = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const outcome = body.outcome as "win" | "loss" | "unknown" | undefined ?? "unknown";
    const cubsScore = body.cubs_score ?? null;
    const opponentScore = body.opponent_score ?? null;

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

    // Get user's profile for personalization
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("display_name, intent, fan_style, wrigleyville_bar, game_status, gameday_intents")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get fans who were active during the game
    const { data: activeFans } = await supabase
      .from("profiles")
      .select("user_id, display_name, game_status, wrigleyville_bar, intent, profile_photo")
      .eq("is_banned", false)
      .eq("onboarding_completed", true)
      .neq("game_status", "NotSet")
      .gte("location_last_set_at", recentGame.game_start)
      .limit(100);

    // Count fans by bar
    const barCounts: Record<string, number> = {};
    const barFans: Record<string, { user_id: string; display_name: string; profile_photo: string | null }[]> = {};
    const totalActiveFans = activeFans?.length ?? 0;

    (activeFans ?? []).forEach((f) => {
      if (f.wrigleyville_bar) {
        const bar = f.wrigleyville_bar as string;
        barCounts[bar] = (barCounts[bar] || 0) + 1;
        if (!barFans[bar]) barFans[bar] = [];
        if (barFans[bar].length < 5) {
          barFans[bar].push({
            user_id: f.user_id,
            display_name: f.display_name,
            profile_photo: f.profile_photo,
          });
        }
      }
    });

    const popularBars = Object.entries(barCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, fans: barFans[name] ?? [] }));

    // Get active meetups at venues
    const { data: activeMeetups } = await supabase
      .from("lineup_meetups")
      .select("id, location_name, description, meeting_time, max_members, status, creator_id")
      .eq("status", "active")
      .gte("expires_at", now.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    const meetupIds = (activeMeetups ?? []).map((m) => m.id);
    const { data: meetupMembers } = meetupIds.length > 0
      ? await supabase
          .from("lineup_members")
          .select("meetup_id, user_id")
          .in("meetup_id", meetupIds)
      : { data: [] };

    const meetupMemberCounts: Record<string, number> = {};
    (meetupMembers ?? []).forEach((m) => {
      meetupMemberCounts[m.meetup_id] = (meetupMemberCounts[m.meetup_id] || 0) + 1;
    });

    const nearbyGroups = (activeMeetups ?? []).map((m) => ({
      id: m.id,
      location: m.location_name,
      description: m.description,
      meeting_time: m.meeting_time,
      members: meetupMemberCounts[m.id] || 0,
      max_members: m.max_members,
    }));

    // Generate AI suggestions with outcome awareness
    let aiSuggestions: any[] = [];

    if (LOVABLE_API_KEY) {
      const currentTime = now.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
      });

      const outcomeContext = outcome === "win"
        ? `The Cubs WON! ${cubsScore !== null ? `Score: Cubs ${cubsScore} - ${recentGame.opponent} ${opponentScore}` : ""}. The crowd is ELECTRIC. Generate CELEBRATION suggestions — victory laps, party bars, trophy selfie spots.`
        : outcome === "loss"
        ? `The Cubs lost. ${cubsScore !== null ? `Score: Cubs ${cubsScore} - ${recentGame.opponent} ${opponentScore}` : ""}. Fans need CONSOLATION — comfort food spots, "there's always next game" solidarity, chill recovery hangs.`
        : `The Cubs vs ${recentGame.opponent} game just ended. The mood is mixed — generate suggestions for both celebrating great plays and unwinding after a tough game.`;

      const userContext = userProfile
        ? `This fan's style: ${(userProfile.fan_style as string[] ?? []).join(", ") || "casual"}. Their usual bar: ${userProfile.wrigleyville_bar || "none"}. Intents: ${(userProfile.intent as string[] ?? []).join(", ") || "general"}.`
        : "";

      const systemPrompt = `You are the "Cubbies Buddies" post-game social coordinator for Wrigleyville, Chicago.
Your job: match the MOOD of the game outcome to perfect meetup suggestions.
For WINS → high-energy celebration spots, group cheers, victory laps around Wrigleyville.
For LOSSES → cozy consolation hangs, "there's always tomorrow" solidarity, comfort food & drinks.
Always reference real Wrigleyville bars: Murphy's Bleachers, Sluggers, Casey Moran's, Cubby Bear, Bernie's Tap & Grill, Old Crow Smokehouse, HVAC Pub, Gallagher Way.
Keep it fun, specific, and emotionally resonant.`;

      const userPrompt = `${outcomeContext}
Current time: ${currentTime}
Active fans nearby: ${totalActiveFans}
Popular bars right now: ${JSON.stringify(popularBars.map(b => ({ name: b.name, count: b.count })))}
Active meetup groups: ${nearbyGroups.length}
${userContext}

Generate 4 post-game meetup suggestions. Return JSON with a "suggestions" array where each item has:
- "title": catchy event name matching the mood (max 40 chars)
- "description": one personalized sentence (max 100 chars)
- "bar": specific Wrigleyville bar name
- "vibe": one of "celebration", "consolation", "chill", "party"
- "emoji": fitting emoji
- "mood_tag": one of "lets-go", "next-time", "good-game", "rally"
- "group_size": suggested ideal group size (3-6)`;

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
                    description: "Return outcome-aware post-game meetup suggestions",
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
                              vibe: { type: "string", enum: ["celebration", "consolation", "chill", "party"] },
                              emoji: { type: "string" },
                              mood_tag: { type: "string", enum: ["lets-go", "next-time", "good-game", "rally"] },
                              group_size: { type: "number" },
                            },
                            required: ["title", "description", "bar", "vibe", "emoji", "mood_tag", "group_size"],
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
        outcome,
        cubsScore,
        opponentScore,
        game: {
          id: recentGame.id,
          opponent: recentGame.opponent,
          venue: recentGame.venue,
          game_end: recentGame.game_end,
        },
        totalFans: totalActiveFans,
        popularBars,
        nearbyGroups,
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
