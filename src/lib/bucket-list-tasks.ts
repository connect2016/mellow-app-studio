/**
 * Curated Wrigleyville Bucket List tasks for gameday.
 */

export interface BucketListTask {
  key: string;
  title: string;
  emoji: string;
  description: string;
}

export const BUCKET_LIST_TASKS: BucketListTask[] = [
  {
    key: 'dog_at_murphys',
    title: "Grab a dog at Murphy's",
    emoji: '🌭',
    description: "Nothing beats a classic Chicago dog before first pitch.",
  },
  {
    key: 'hifive_section',
    title: 'High-five a fellow Buddy in Section 204',
    emoji: '🖐️',
    description: 'Send a Hi-Five to someone seated near you.',
  },
  {
    key: 'log_first_inning',
    title: 'Log the 1st Inning on a Scorecard',
    emoji: '📝',
    description: 'Open a scoring session and record the first inning.',
  },
  {
    key: 'join_pub_crawl',
    title: 'Join a Pub Crawl before the 7th Inning Stretch',
    emoji: '🍺',
    description: 'Find or create a crawl and hit the bars.',
  },
  {
    key: 'check_in_bar',
    title: 'Check in at a Wrigleyville bar',
    emoji: '📍',
    description: 'Let the crew know where you are.',
  },
  {
    key: 'vibe_post',
    title: 'Post a Vibe to the feed',
    emoji: '📸',
    description: 'Share the energy — snap a photo or video.',
  },
  {
    key: 'meet_new_buddy',
    title: 'Send an icebreaker to someone new',
    emoji: '👋',
    description: 'Break the ice with a nearby fan.',
  },
];
