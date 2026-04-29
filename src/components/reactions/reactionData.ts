/**
 * Reactions migrated from custom Cubs-themed images to clean
 * rounded-outline icons via ConceptIcon. The `icon` field is the key
 * passed to <ConceptIcon name={...} />.
 *
 * `image` remains as a deprecated fallback for any callers we missed,
 * but UI should consume `icon`.
 */

import { getConceptIcon } from '@/components/icons/ConceptIcon';

export interface ReactionDef {
  key: string;
  label: string;
  /** Concept name passed to <ConceptIcon name={icon} /> */
  icon: string;
  shortText: string;
}

export const REACTIONS: ReactionDef[] = [
  { key: 'homerun', label: 'HR!!!', icon: 'baseball', shortText: 'HR!!!' },
  { key: 'fire', label: "Let's go!", icon: 'fire', shortText: "Let's go!" },
  { key: 'badcall', label: 'Bad call!', icon: 'thumbsdown', shortText: 'Bad call!' },
  { key: 'strikeout', label: 'K!', icon: 'zap', shortText: 'K!' },
  { key: 'doubleplay', label: 'DP!', icon: 'hifive', shortText: 'DP!' },
  { key: 'shocked', label: 'No way!', icon: 'help', shortText: 'No way!' },
  { key: 'gocubs', label: 'Go Cubs!', icon: 'bear', shortText: 'Go Cubs!' },
  { key: 'beercheers', label: 'Cheers!', icon: 'beer', shortText: 'Cheers!' },
  { key: 'wflag', label: 'Fly the W!', icon: 'wflag', shortText: 'Fly the W!' },
  { key: 'ivywall', label: 'Ivy!', icon: 'ivy', shortText: 'Ivy!' },
  { key: 'scoreboard', label: 'Lights!', icon: 'scoreboard', shortText: 'Lights!' },
  { key: 'hotdog', label: 'Hot Dog!', icon: 'hotdog', shortText: 'Hot Dog!' },
  { key: 'crowd', label: 'Roar!', icon: 'megaphone', shortText: 'Roar!' },
  { key: 'sunset', label: 'Golden!', icon: 'sun', shortText: 'Golden!' },
];

export function getReactionByKey(key: string): ReactionDef | undefined {
  return REACTIONS.find(r => r.key === key);
}

export function getReactionFromBody(body: string): ReactionDef | undefined {
  return REACTIONS.find(r => body.includes(r.shortText));
}

export function getReactionIcon(reactionKey: string) {
  const r = getReactionByKey(reactionKey);
  return getConceptIcon(r?.icon ?? 'sparkles');
}
