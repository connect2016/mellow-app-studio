/**
 * Curated icebreaker prompts for the Social Pulse notification system.
 * Randomly selected when a user enters a bar with 3+ Buddies.
 */

export const ICEBREAKER_PROMPTS = [
  {
    emoji: '⚾',
    text: "The Clubhouse says: Ask the person next to you who they think the MVP is today.",
  },
  {
    emoji: '🏟️',
    text: "Trivia Challenge: Did you know Wrigley is the 2nd oldest park in MLB? Mention that to a fellow fan!",
  },
  {
    emoji: '⚡',
    text: "The Vibe is Electric! Ask a nearby Buddy where they're heading after the game.",
  },
  {
    emoji: '🌭',
    text: "Hot Take Time: Ask someone nearby — ketchup on a Chicago dog: yes or no?",
  },
  {
    emoji: '🎵',
    text: "7th Inning Stretch Quiz: Ask a Buddy if they know who sang the stretch today!",
  },
  {
    emoji: '🍺',
    text: "Round Table: Ask the nearest Buddy what their go-to Wrigleyville bar order is.",
  },
  {
    emoji: '🏆',
    text: "Championship Chat: Ask a fellow fan — what's your all-time favorite Cubs moment?",
  },
  {
    emoji: '📣',
    text: "Rally Time! Start a 'Let's Go Cubbies!' chant with the Buddies around you.",
  },
  {
    emoji: '🧢',
    text: "Hat Check: Ask a nearby fan about their favorite Cubs hat or jersey.",
  },
  {
    emoji: '🌿',
    text: "Ivy League: Ask a Buddy if they've ever caught a ball stuck in the ivy!",
  },
];

export function getRandomIcebreaker() {
  return ICEBREAKER_PROMPTS[Math.floor(Math.random() * ICEBREAKER_PROMPTS.length)];
}

export const MICRO_INTRO_TEMPLATES = [
  (name: string) => `${name} is nearby and wants to chat about the lineup!`,
  (name: string) => `${name} is close by — say hey and talk Cubs!`,
  (name: string) => `${name} is just a few feet away. Time for a high-five?`,
  (name: string) => `${name} spotted you nearby! Ready to talk game?`,
];

export function getRandomMicroIntro(name: string) {
  const template = MICRO_INTRO_TEMPLATES[Math.floor(Math.random() * MICRO_INTRO_TEMPLATES.length)];
  return template(name);
}
