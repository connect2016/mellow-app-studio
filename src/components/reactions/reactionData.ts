import homerunImg from '@/assets/reactions/homerun.png';
import fireImg from '@/assets/reactions/fire.png';
import badcallImg from '@/assets/reactions/badcall.png';
import strikeoutImg from '@/assets/reactions/strikeout.png';
import doubleplayImg from '@/assets/reactions/doubleplay.png';
import shockedImg from '@/assets/reactions/shocked.png';
import gocubsImg from '@/assets/reactions/gocubs.png';

export interface ReactionDef {
  key: string;
  label: string;
  image: string;
  shortText: string;
}

export const REACTIONS: ReactionDef[] = [
  { key: 'homerun', label: 'HR!!!', image: homerunImg, shortText: 'HR!!!' },
  { key: 'fire', label: "Let's go!", image: fireImg, shortText: "Let's go!" },
  { key: 'badcall', label: 'Bad call!', image: badcallImg, shortText: 'Bad call!' },
  { key: 'strikeout', label: 'K!', image: strikeoutImg, shortText: 'K!' },
  { key: 'doubleplay', label: 'DP!', image: doubleplayImg, shortText: 'DP!' },
  { key: 'shocked', label: 'No way!', image: shockedImg, shortText: 'No way!' },
  { key: 'gocubs', label: 'Go Cubs!', image: gocubsImg, shortText: 'Go Cubs!' },
];

export function getReactionByKey(key: string): ReactionDef | undefined {
  return REACTIONS.find(r => r.key === key);
}

export function getReactionFromBody(body: string): ReactionDef | undefined {
  return REACTIONS.find(r => body.includes(r.shortText));
}
