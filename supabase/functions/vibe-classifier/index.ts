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

    // Auth
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
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Gather activity signals
    const [profileRes, likesRes, hiRes, messagesRes, vibeRes, meetupRes, barVoteRes] = await Promise.all([
      supabase.from("profiles")
        .select("display_name, game_status, wrigleyville_bar, wrigley_section, gameday_intents, fan_style, intent, bio")
        .eq("user_id", user.id).single(),
      supabase.from("likes")
        .select("id, is_hi_five, message")
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
        .gte("created_at", oneDayAgo).limit(50),
      supabase.from("likes")
        .select("id")
        .eq("from_user", user.id).eq("is_hi_five", true)
        .gte("created_at", oneDayAgo),
      supabase.from("lineup_messages")
        .select("body")
        .eq("sender_id", user.id)
        .gte("created_at", oneHourAgo).limit(20),
      supabase.from("vibe_posts")
        .select("id, caption")
        .eq("user_id", user.id)
        .gte("created_at", oneDayAgo).limit(10),
      supabase.from("lineup_members")
        .select("id")
        .eq("user_id", user.id)
        .gte("joined_at", oneDayAgo),
      supabase.from("bar_votes")
        .select("vibe")
        .eq("user_id", user.id)
        .gte("created_at", oneHourAgo).limit(5),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signals = {
      status: profile.game_status,
      location: profile.wrigleyville_bar || profile.wrigley_section || "unknown",
      intents: profile.gameday_intents ?? [],
      fanStyle: profile.fan_style ?? [],
      matchIntents: profile.intent ?? [],
      bio: profile.bio ?? "",
      recentLikes: (likesRes.data ?? []).length,
      recentHiFives: (hiRes.data ?? []).length,
      recentMessages: (messagesRes.data ?? []).map(m => m.body).slice(0, 10),
      recentVibePosts: (vibeRes.data ?? []).length,
      meetupsJoined: (meetupRes.data ?? []).length,
      recentBarVibes: (barVoteRes.data ?? []).map(v => v.vibe),
      currentTime: new Date().toLocaleTimeString("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }),
    };

    const systemPrompt = `You are a vibe classifier for "Cubbies Buddies" — a Cubs fans social app.

Analyze a user's recent activity signals and classify them into ONE vibe state. 
Vibe states reflect the user's current social energy and mood.

Available vibe states:
- "lit" — High energy, party mode, celebrating, lots of activity (emoji: 🔥)
- "chill" — Relaxed, casual, watching from a mellow spot (emoji: 😎)
- "hype" — Excited, game-focused, competitive energy (emoji: ⚡)
- "social_butterfly" — Connecting with many people, lots of messages/likes (emoji: 🦋)
- "die_hard" — Intense fan mode, deep in the game, scoring, predicting (emoji: 💀)
- "new_in_town" — Low activity, seems new or exploring (emoji: 🌟)
- "rally_mode" — Come-from-behind energy, intense hope (emoji: 🚀)
- "victory_lap" — Post-win celebration mode (emoji: 🏆)

Consider:
1. Message tone and frequency (lots of exclamation marks = more energy)
2. Activity volume (likes, hi-fives, meetups joined)
3. Current location and time of day
4. Fan style preferences
5. Bar vibes they've voted for

Be decisive. Pick the single best-fitting state.`;

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
          { role: "user", content: `Classify this user's vibe:\n${JSON.stringify(signals)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_vibe",
            description: "Classify the user's current vibe state",
            parameters: {
              type: "object",
              properties: {
                vibe_state: {
                  type: "string",
                  enum: ["lit", "chill", "hype", "social_butterfly", "die_hard", "new_in_town", "rally_mode", "victory_lap"],
                },
                emoji: { type: "string", description: "Single emoji for this vibe" },
                reason: { type: "string", description: "One sentence why (shown to user)" },
                energy_level: { type: "number", description: "1-10 energy score" },
                match_tip: { type: "string", description: "Short tip for who they'd vibe with" },
              },
              required: ["vibe_state", "emoji", "reason", "energy_level", "match_tip"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_vibe" } },
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
    let classification = null;

    if (toolCall?.function?.arguments) {
      try {
        classification = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse vibe classification");
      }
    }

    if (!classification) {
      return new Response(JSON.stringify({ vibe: null, reason: "Couldn't classify right now" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with new vibe state
    await supabase.from("profiles").update({
      vibe_state: classification.vibe_state,
      vibe_emoji: classification.emoji,
      vibe_state_updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({ vibe: classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vibe-classifier error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
