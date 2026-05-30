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

    // Gather engagement signals in parallel
    const [
      profileRes, likesGivenRes, likesReceivedRes, meetupsCreatedRes,
      meetupsJoinedRes, vibePostsRes, pennantsRes, passportRes,
      scorerRes, crewsRes, memoriesRes, missionsRes,
    ] = await Promise.all([
      supabase.from("profiles")
        .select("user_id, display_name, created_at, game_status, fan_style, gameday_intents, intent, is_verified, bio, favorite_player, superstition, stretch_song, best_bar, wrigley_section")
        .eq("user_id", user.id).single(),
      supabase.from("likes").select("id, is_hi_five").eq("from_user", user.id),
      supabase.from("likes").select("id, is_hi_five").eq("to_user", user.id),
      supabase.from("lineup_meetups").select("id").eq("creator_id", user.id),
      supabase.from("lineup_members").select("id").eq("user_id", user.id),
      supabase.from("vibe_posts").select("id").eq("user_id", user.id),
      supabase.from("user_pennants").select("id, unlocked").eq("user_id", user.id),
      supabase.from("passport_checkins").select("id").eq("user_id", user.id),
      supabase.from("scorer_stats").select("games_scored, total_predictions, correct_predictions, prediction_points").eq("user_id", user.id).maybeSingle(),
      supabase.from("crew_members").select("id").eq("user_id", user.id),
      supabase.from("game_memories").select("id").eq("user_id", user.id),
      supabase.from("mission_progress").select("id, completed").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute raw XP from engagement
    const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000);
    const likesGiven = (likesGivenRes.data ?? []).length;
    const likesReceived = (likesReceivedRes.data ?? []).length;
    const hiFivesGiven = (likesGivenRes.data ?? []).filter(l => l.is_hi_five).length;
    const hiFivesReceived = (likesReceivedRes.data ?? []).filter(l => l.is_hi_five).length;
    const meetupsCreated = (meetupsCreatedRes.data ?? []).length;
    const meetupsJoined = (meetupsJoinedRes.data ?? []).length;
    const vibePosts = (vibePostsRes.data ?? []).length;
    const pennants = (pennantsRes.data ?? []).filter(p => p.unlocked).length;
    const passportStamps = (passportRes.data ?? []).length;
    const crews = (crewsRes.data ?? []).length;
    const memories = (memoriesRes.data ?? []).length;
    const missionsCompleted = (missionsRes.data ?? []).filter(m => m.completed).length;
    const scorer = scorerRes.data;

    // Profile completeness
    const profileFields = [
      profile.bio, profile.favorite_player, profile.superstition,
      profile.stretch_song, profile.best_bar, profile.wrigley_section,
    ];
    const profileCompleteness = profileFields.filter(f => f && f.trim().length > 0).length;

    const engagementPayload = {
      accountAgeDays,
      isVerified: profile.is_verified ?? false,
      fanStyle: profile.fan_style ?? [],
      intents: profile.intent ?? [],
      gamedayIntents: profile.gameday_intents ?? [],
      profileCompleteness: `${profileCompleteness}/6`,
      social: { likesGiven, likesReceived, hiFivesGiven, hiFivesReceived },
      meetups: { created: meetupsCreated, joined: meetupsJoined },
      content: { vibePosts, memories },
      badges: { pennants, passportStamps },
      scoring: scorer ? {
        gamesScored: scorer.games_scored,
        predictions: scorer.total_predictions,
        accuracy: scorer.total_predictions > 0
          ? Math.round((scorer.correct_predictions / scorer.total_predictions) * 100) : 0,
        points: scorer.prediction_points,
      } : null,
      community: { crews, missionsCompleted },
    };

    // Calculate raw XP
    const xp =
      likesGiven * 2 + likesReceived * 3 +
      hiFivesGiven * 3 + hiFivesReceived * 4 +
      meetupsCreated * 15 + meetupsJoined * 10 +
      vibePosts * 8 + memories * 5 +
      pennants * 25 + passportStamps * 20 +
      missionsCompleted * 10 +
      (scorer?.prediction_points ?? 0) +
      crews * 10 +
      profileCompleteness * 5 +
      (profile.is_verified ? 50 : 0) +
      Math.min(accountAgeDays, 365);

    const systemPrompt = `You are the Fan Identity Engine for "Wrigleyville Buddies" — a Cubs fans social app.

Analyze a user's FULL engagement history and classify them into a fan identity tier and personalized title.

Fan Tiers (ranked):
1. "rookie" (0-99 XP) — New fan, just getting started
2. "regular" (100-299 XP) — Consistent presence, building connections 
3. "superfan" (300-599 XP) — Deeply engaged, community pillar
4. "legend" (600-999 XP) — Elite status, major contributor
5. "hall_of_fame" (1000+ XP) — Iconic presence, app ambassador

Your job:
1. Confirm or adjust the tier based on QUALITY of engagement (not just quantity)
2. Create a personalized fan TITLE that reflects their unique style (e.g., "Bleacher Philosopher", "Rally Cap Commander", "Wrigley Historian")
3. Identify their dominant fan archetype for matching purposes
4. Suggest what tier-appropriate perks they should unlock

Fan Archetypes (pick 1-2):
- "connector" — Brings people together (high meetup/social activity)
- "hype_beast" — Energy source (lots of hi-fives, vibe posts)
- "analyst" — Stats nerd (active scorer, high prediction accuracy)
- "historian" — Knows Cubs lore (profile depth, memories)
- "explorer" — Passport stamps, bar hopping, tries everything
- "leader" — Creates crews, organizes meetups
- "loyalist" — Consistent daily engagement over time

Make the title creative, Cubs-themed, and personality-driven. Max 3 words.`;

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
          { role: "user", content: `Classify this fan (raw XP: ${xp}):\n${JSON.stringify(engagementPayload)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_fan_identity",
            description: "Set the fan's identity tier and title",
            parameters: {
              type: "object",
              properties: {
                tier: { type: "string", enum: ["rookie", "regular", "superfan", "legend", "hall_of_fame"] },
                title: { type: "string", description: "Creative 2-3 word fan title" },
                emoji: { type: "string", description: "Single emoji representing this fan" },
                archetypes: {
                  type: "array", items: { type: "string" },
                  description: "1-2 dominant fan archetypes",
                },
                summary: { type: "string", description: "One sentence describing this fan's identity" },
                next_milestone: { type: "string", description: "What they should do to level up" },
                match_boost: { type: "string", description: "Who they'd pair best with based on archetype" },
              },
              required: ["tier", "title", "emoji", "archetypes", "summary", "next_milestone", "match_boost"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_fan_identity" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
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
    let identity = null;

    if (toolCall?.function?.arguments) {
      try {
        identity = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse fan identity");
      }
    }

    if (!identity) {
      return new Response(JSON.stringify({ identity: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist to profile
    await supabase.from("profiles").update({
      fan_tier: identity.tier,
      fan_xp: xp,
      fan_title: identity.title,
      fan_tier_emoji: identity.emoji,
      fan_identity_updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({ identity: { ...identity, xp } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fan-identity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
