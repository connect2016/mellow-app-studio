/**
 * ConceptIcon — single source of truth for translating an emoji or
 * named concept into a clean rounded-outline icon.
 *
 * Use this instead of inline emoji characters anywhere in the UI.
 *
 *   <ConceptIcon name="beer" className="h-4 w-4 text-primary" />
 *   <ConceptIcon name="🍺" />          // emoji string also works
 *   <ConceptIcon name="hotdog" size={20} />
 */

import { SVGProps } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSnow,
  Coffee,
  Crown,
  DollarSign,
  Eye,
  EyeOff,
  Flag,
  Flame,
  Gift,
  Hand,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Lock,
  MapPin,
  Megaphone,
  MessageCircle,
  Mic,
  Moon,
  Music,
  Navigation,
  PartyPopper,
  Phone,
  Pizza,
  Play,
  Rocket,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  ThumbsDown,
  ThumbsUp,
  Ticket,
  Timer,
  Trophy,
  Users,
  Utensils,
  UtensilsCrossed,
  Volume2,
  Wind,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  BaseballIcon,
  BearIcon,
  BeerMugIcon,
  HiFiveIcon,
  HotDogIcon,
  IvyIcon,
  PeanutIcon,
  ScoreboardIcon,
  WFlagIcon,
} from './CustomIcons';
import { cn } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComp = React.ComponentType<any>;

/**
 * Master mapping. Keys can be:
 *   - emoji characters (preferred when migrating existing data)
 *   - canonical concept names (preferred for new code)
 */
const ICON_MAP: Record<string, IconComp> = {
  // ===== Baseball / Cubs =====
  '⚾': BaseballIcon,
  baseball: BaseballIcon,
  '🐻': BearIcon,
  bear: BearIcon,
  cubs: BearIcon,
  '🏳️': WFlagIcon,
  '🏳': WFlagIcon,
  wflag: WFlagIcon,
  flag: Flag,
  '🚩': Flag,
  '🌿': IvyIcon,
  '🍃': IvyIcon,
  ivy: IvyIcon,
  scoreboard: ScoreboardIcon,
  '📊': ScoreboardIcon,

  // ===== Food & Drink =====
  '🌭': HotDogIcon,
  hotdog: HotDogIcon,
  '🍺': BeerMugIcon,
  '🍻': BeerMugIcon,
  '🍷': BeerMugIcon,
  '🍹': BeerMugIcon,
  '🥃': BeerMugIcon,
  beer: BeerMugIcon,
  drink: BeerMugIcon,
  '🍕': Pizza,
  pizza: Pizza,
  '🍔': UtensilsCrossed,
  '🥪': UtensilsCrossed,
  '🥨': UtensilsCrossed,
  '🍟': UtensilsCrossed,
  '🌮': UtensilsCrossed,
  '🍗': UtensilsCrossed,
  '🍖': UtensilsCrossed,
  '🍿': UtensilsCrossed,
  '🥜': PeanutIcon,
  peanut: PeanutIcon,
  '🍴': Utensils,
  '🍽️': Utensils,
  food: Utensils,
  eats: Utensils,
  '☕': Coffee,
  coffee: Coffee,

  // ===== People & Social =====
  '👥': Users,
  '👫': Users,
  '👬': Users,
  '👭': Users,
  people: Users,
  crew: Users,
  '🙌': HiFiveIcon,
  '🖐️': HiFiveIcon,
  '🖐': HiFiveIcon,
  '✋': HiFiveIcon,
  hifive: HiFiveIcon,
  '👋': Hand,
  wave: Hand,
  '👍': ThumbsUp,
  thumbsup: ThumbsUp,
  '👎': ThumbsDown,
  thumbsdown: ThumbsDown,
  '👏': HiFiveIcon,
  clap: HiFiveIcon,
  '❤️': Heart,
  '♥️': Heart,
  '💕': Heart,
  '💖': Heart,
  '💗': Heart,
  '💘': Heart,
  '💞': Heart,
  '💓': Heart,
  heart: Heart,
  '😀': Smile,
  '😁': Smile,
  '😄': Smile,
  '😊': Smile,
  '🙂': Smile,
  smile: Smile,

  // ===== Place / Map =====
  '📍': MapPin,
  '📌': MapPin,
  pin: MapPin,
  location: MapPin,
  '🏠': Home,
  '🏡': Home,
  home: Home,
  '🧭': Navigation,
  navigation: Navigation,

  // ===== Time / Calendar =====
  '📅': Calendar,
  '🗓️': Calendar,
  calendar: Calendar,
  '⏰': Timer,
  '⏱️': Timer,
  '⏳': Timer,
  '⌛': Timer,
  timer: Timer,

  // ===== Game / Achievement =====
  '🏆': Trophy,
  trophy: Trophy,
  '🥇': Trophy,
  '🥈': Award,
  '🥉': Award,
  '🏅': Award,
  '🎖️': Award,
  award: Award,
  '⭐': Star,
  '🌟': Star,
  '✨': Sparkles,
  star: Star,
  sparkles: Sparkles,
  '🎉': PartyPopper,
  '🎊': PartyPopper,
  '🎈': PartyPopper,
  '🎁': Gift,
  gift: Gift,
  '🎯': Target,
  target: Target,
  '👑': Crown,
  crown: Crown,
  '💪': Zap,
  strong: Zap,
  '🚀': Rocket,
  rocket: Rocket,
  '🔥': Flame,
  fire: Flame,
  '⚡': Zap,
  '💥': Zap,
  '💣': Zap,
  zap: Zap,

  // ===== Weather =====
  '☀️': Sun,
  '🌞': Sun,
  sun: Sun,
  '☁️': Cloud,
  '⛅': Cloud,
  cloud: Cloud,
  '🌧️': CloudRain,
  '🌦️': CloudRain,
  '🌨️': CloudSnow,
  '❄️': CloudSnow,
  '🌙': Moon,
  '🌚': Moon,
  '🌛': Moon,
  moon: Moon,
  '🌅': Sun,
  '🌇': Sun,
  '🌆': Moon,
  sunset: Sun,
  '💨': Wind,
  wind: Wind,

  // ===== Communication =====
  '💬': MessageCircle,
  '🗨️': MessageCircle,
  message: MessageCircle,
  '🔔': Bell,
  '🛎️': Bell,
  bell: Bell,
  '📣': Megaphone,
  '📢': Megaphone,
  megaphone: Megaphone,
  '📞': Phone,
  '☎️': Phone,
  phone: Phone,
  '🎤': Mic,
  mic: Mic,
  '🔊': Volume2,
  volume: Volume2,
  '📩': Send,
  '📨': Send,
  send: Send,

  // ===== Status / Safety =====
  '✅': CheckCircle2,
  '☑️': CheckCircle2,
  check: CheckCircle2,
  '❌': XCircle,
  '✖️': X,
  x: X,
  '⚠️': AlertTriangle,
  warning: AlertTriangle,
  '🛡️': Shield,
  shield: Shield,
  '🔒': Lock,
  '🔐': Lock,
  lock: Lock,
  '👁️': Eye,
  '👀': Eye,
  eye: Eye,
  '🙈': EyeOff,
  hide: EyeOff,
  '🔍': Search,
  '🔎': Search,
  search: Search,
  '💡': Lightbulb,
  idea: Lightbulb,
  '❓': HelpCircle,
  '❔': HelpCircle,
  help: HelpCircle,
  'ℹ️': Info,
  info: Info,
  '⚙️': Settings,
  settings: Settings,
  '↗️': Share2,
  share: Share2,
  '➡️': ChevronRight,
  next: ChevronRight,
  '▶️': Play,
  play: Play,

  // ===== Money / Activity =====
  '💰': DollarSign,
  '💵': DollarSign,
  '💸': DollarSign,
  money: DollarSign,
  '🛍️': ShoppingBag,
  '🎟️': Ticket,
  '🎫': Ticket,
  ticket: Ticket,
  '🎵': Music,
  '🎶': Music,
  music: Music,
  '📸': Camera,
  '📷': Camera,
  camera: Camera,
  '🖼️': ImageIcon,
  image: ImageIcon,
  '📈': Activity,
  activity: Activity,

  // ===== Verified =====
  '✔️': ShieldCheck,
  verified: ShieldCheck,
};

const FALLBACK = Sparkles;

export interface ConceptIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'name'> {
  /** Emoji character or canonical concept name */
  name: string | undefined | null;
  /** Pixel size; prefer Tailwind h-/w- classes via className. */
  size?: number | string;
  strokeWidth?: number;
  className?: string;
}

export function ConceptIcon({ name, size, strokeWidth = 2, className, ...rest }: ConceptIconProps) {
  const key = (name ?? '').trim();
  const Comp = ICON_MAP[key] ?? ICON_MAP[key.toLowerCase()] ?? FALLBACK;
  return (
    <Comp
      size={size}
      strokeWidth={strokeWidth}
      className={cn('inline-block align-middle', className)}
      {...rest}
    />
  );
}

/**
 * Strip emoji characters from a string.
 * Useful when feeding existing copy through a component that now supplies its own icon.
 */
export function stripEmoji(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Lookup component for advanced cases. */
export function getConceptIcon(name: string | undefined | null): IconComp {
  const key = (name ?? '').trim();
  return ICON_MAP[key] ?? ICON_MAP[key.toLowerCase()] ?? FALLBACK;
}
