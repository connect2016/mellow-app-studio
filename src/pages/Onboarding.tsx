import { useState, useEffect, useRef, useMemo } from 'react';
import wrigleySeatsImg from '@/assets/wrigley-seats.jpg';
import bgConcourse from '@/assets/bg-concourse.jpg';
import bgField from '@/assets/bg-field.jpg';

import cubsFansParade from '@/assets/cubs-fans-parade.webp';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IntentType, WRIGLEYVILLE_BARS, PrivacyLevel, GamedayIntentType, GAMEDAY_INTENT_LABELS, GAMEDAY_INTENT_EMOJI, FanStyleType, FAN_STYLE_OPTIONS } from '@/types';
import { ChevronLeft, ChevronRight, Camera, AlertCircle, User, Heart, Star, MapPin, Beer, Sparkles, Eye, Lock, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { ConceptIcon } from '@/components/icons/ConceptIcon';
import { ConceptVisual } from '@/components/icons/ConceptThumb';
import { PersonaIcon } from '@/components/icons/PersonaIcons';

const TOTAL_STEPS = 5;

const stepMeta = [
  { icon: User, title: 'Your Profile', subtitle: 'Let fans know who you are', emoji: '' },
  { icon: Heart, title: 'Your Intent', subtitle: 'What are you looking for?', emoji: '' },
  { icon: Star, title: 'Cubs Identity', subtitle: 'Show off your fan credentials', emoji: '' },
  { icon: MapPin, title: 'Game Day Setup', subtitle: 'Where do you watch?', emoji: '' },
  { icon: Star, title: 'Scouting Report', subtitle: 'What kind of fan are you?', emoji: '' },
];

const intentCards: { value: IntentType; label: string; emoji: string; desc: string }[] = [
  { value: 'FriendToWatch', label: 'Friend to Watch', emoji: '', desc: 'Find someone to catch the game with' },
  { value: 'ShareABeer', label: 'Share a Beer', emoji: '', desc: 'Grab a cold one with a fellow fan' },
  { value: 'PostGameMeetup', label: 'Post-Game Meetup', emoji: '', desc: 'Keep the party going after the W' },
  { value: 'Dating', label: 'Dating', emoji: '', desc: 'Find your Wrigley romance' },
];

const gamedayIntentCards: { value: GamedayIntentType; label: string; emoji: string; desc: string }[] = [
  { value: 'BleacherRegular', label: 'Bleacher Regular', emoji: '', desc: 'The bleachers are your second home' },
  { value: 'FamilyFriendly', label: 'Family Friendly', emoji: '', desc: 'Bringing the kids to the ballpark' },
  { value: 'PreGameDrinks', label: 'Pre-game Drinks', emoji: '', desc: 'The party starts before first pitch' },
  { value: 'ScoringTheGame', label: 'Scoring the Game', emoji: '', desc: 'Keeping the book like a true fan' },
  { value: 'PostGameCelebration', label: 'Post-game Celebration', emoji: '', desc: 'Wrigleyville after the final out' },
  { value: 'WrigleyvilleLocal', label: 'Wrigleyville Local', emoji: '', desc: 'You live in the neighborhood' },
];

const vibeChips: { value: string; label: string; emoji: string }[] = [
  { value: 'new_friends', label: 'Make new friends', emoji: '' },
  { value: 'pregame_hangs', label: 'Pregame hangs', emoji: '' },
  { value: 'postgame_food', label: 'Postgame food', emoji: '' },
  { value: 'open_meeting', label: 'Open to meeting fellow fans', emoji: '' },
  { value: 'crew_tonight', label: 'Looking for a crew tonight', emoji: '⭐' },
  { value: 'spontaneous', label: 'Down for spontaneous meetups', emoji: '' },
];

const privacyOptions: { value: PrivacyLevel; label: string; icon: typeof Eye }[] = [
  { value: 'Public', label: 'Everyone', icon: Eye },
  { value: 'MatchesOnly', label: 'Matches Only', icon: Lock },
  { value: 'Hidden', label: 'Hidden', icon: EyeOff },
];

function validateMoment(text: string): boolean {
  const lower = text.toLowerCase();
  const has2016 = lower.includes('2016');
  const hasWS = lower.includes('world series') || lower.includes(' ws ') || lower.startsWith('ws ') || lower.endsWith(' ws');
  const hasGame7 = lower.includes('game 7') || lower.includes('game seven');
  if (has2016 && (hasWS || hasGame7)) return false;
  if (has2016 && hasWS) return false;
  return true;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [intents, setIntents] = useState<IntentType[]>([]);
  const [gamedayIntents, setGamedayIntents] = useState<GamedayIntentType[]>([]);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [fanStyles, setFanStyles] = useState<FanStyleType[]>([]);
  const [favoritePlayer, setFavoritePlayer] = useState('');
  const [favoriteMoment, setFavoriteMoment] = useState('');
  const [momentError, setMomentError] = useState('');
  const [superstition, setSuperstition] = useState('');
  const [stretchSong, setStretchSong] = useState('');
  const [bestBar, setBestBar] = useState('');
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [bar, setBar] = useState('');
  const [locationPrivacy, setLocationPrivacy] = useState<PrivacyLevel>('MatchesOnly');
  const [barPrivacy, setBarPrivacy] = useState<PrivacyLevel>('MatchesOnly');
  const [gamedayPersona, setGamedayPersona] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, uploading: photoUploading } = usePhotoUpload();

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please choose a photo under 5MB.', variant: 'destructive' });
      return;
    }
    // Show preview immediately
    setPhotoPreview(URL.createObjectURL(file));
    try {
      await uploadPhoto(file);
      toast({ title: ' Photo uploaded!' });
    } catch {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
      setPhotoPreview(null);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const toggleIntent = (i: IntentType) => {
    setIntents((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const toggleGamedayIntent = (i: GamedayIntentType) => {
    setGamedayIntents((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, i];
    });
  };

  const toggleFanStyle = (s: FanStyleType) => {
    setFanStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleMomentChange = (val: string) => {
    setFavoriteMoment(val);
    if (val && !validateMoment(val)) {
      setMomentError("Pick a moment other than the 2016 World Series—go deeper cut!");
    } else {
      setMomentError('');
    }
  };

  const next = async () => {
    if (step === 3 && favoriteMoment && !validateMoment(favoriteMoment)) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      try {
        await updateProfile.mutateAsync({
          display_name: displayName,
          age: age ? parseInt(age) : null,
          pronouns: pronouns || null,
          intent: intents,
          gameday_intents: gamedayIntents,
          fan_style: fanStyles,
          favorite_player: favoritePlayer,
          favorite_moment: favoriteMoment,
          favorite_moment_is_valid: favoriteMoment ? validateMoment(favoriteMoment) : true,
          superstition: superstition || null,
          stretch_song: stretchSong || null,
          best_bar: bestBar || null,
          wrigley_section: section || null,
          wrigley_row: row || null,
          wrigley_seat: seat || null,
          wrigley_location_privacy: locationPrivacy,
          wrigleyville_bar: bar || null,
          bar_location_privacy: barPrivacy,
          gameday_persona: gamedayPersona,
          onboarding_completed: true,
        });
        setShowCelebration(true);
        setTimeout(() => navigate('/discover'), 2500);
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to save profile. Please try again.', variant: 'destructive' });
      }
    }
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const STEP_BACKGROUNDS = useMemo(() => [bgConcourse, bgField, cubsFansParade, wrigleySeatsImg, bgField], []);
  const stepBg = STEP_BACKGROUNDS[step - 1];

  if (loading) return null;

  // Celebration overlay
  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="text-7xl mb-6"
          >
            
          </motion.div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Welcome to the crew!
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-1">You're in the lineup.</p>
          <p className="text-primary-foreground/60 text-sm">Your first mission unlocks on game day.</p>
        </motion.div>

        {/* Confetti-like particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
              backgroundColor: i % 3 === 0 ? 'hsl(var(--secondary))' : i % 3 === 1 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--accent))',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, Math.random() * -200 - 50],
            }}
            transition={{
              duration: 2,
              delay: Math.random() * 0.8,
              repeat: Infinity,
              repeatDelay: Math.random() * 1,
            }}
          />
        ))}
      </div>
    );
  }

  const currentMeta = stepMeta[step - 1];


  return (
    <div
      className="flex min-h-screen flex-col bg-background relative"
      style={{
        backgroundImage: `url(${stepBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-background/25" />
      {/* Top bar with progress */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-md px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={back}
              className={`flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-xs font-medium text-muted-foreground">{step} of {TOTAL_STEPS}</span>
            <div className="w-12" />
          </div>
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: i < step ? '100%' : i === step - 1 ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col px-5 py-6 relative z-[1]">
        <div className="mx-auto w-full max-w-md flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                  <ConceptVisual name={currentMeta.emoji} size="sm" />
                </div>
                <div>
                  <h2
                    className="text-2xl sm:text-3xl font-extrabold"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      color: 'hsl(222, 82%, 29%)',
                      WebkitTextStroke: '2px white',
                      paintOrder: 'stroke fill',
                      filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.5))',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {currentMeta.title}
                  </h2>
                  <p
                    className="text-base sm:text-lg font-semibold"
                    style={{
                      color: 'white',
                      WebkitTextStroke: '0.5px black',
                      paintOrder: 'stroke fill',
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))',
                    }}
                  >
                    {currentMeta.subtitle}
                  </p>
                </div>
              </div>

              {/* Step 1: Profile */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-muted hover:bg-primary/5 transition-colors overflow-hidden"
                      disabled={photoUploading}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        {photoUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">+</span>
                        )}
                      </div>
                    </motion.button>
                  </div>
                  <p className="text-center text-secondary-foreground bg-destructive-foreground text-sm shadow-sm">
                    {photoUploading ? 'Uploading…' : 'Tap to add your photo'}
                  </p>

                  <div className="space-y-2">
                    <Label className="text-base font-bold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Display Name</Label>
                    <Input
                      placeholder="How fans will know you"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                     <Label className="text-base font-bold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Age</Label>
                      <Input
                        type="number"
                        placeholder="21+"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-bold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Pronouns</Label>
                      <Input
                        placeholder="e.g. she/her"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Intent Selection */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Friendly onboarding header */}
                  <div className="rounded-2xl bg-card/95 backdrop-blur border border-border px-4 py-4 shadow-sm">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      Cubs fans are some of the friendliest in baseball. Let's help you find your crew.
                    </p>
                  </div>

                  {/* ── Vibe Chips (multi-select) ── */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                      <Sparkles className="h-4 w-4" /> Your Vibe
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">Pick anything that fits — multi-select.</p>
                    <div className="flex flex-wrap gap-2">
                      {vibeChips.map((chip) => {
                        const isSelected = vibeTags.includes(chip.value);
                        return (
                          <button
                            key={chip.value}
                            type="button"
                            onClick={() =>
                              setVibeTags((prev) =>
                                prev.includes(chip.value)
                                  ? prev.filter((v) => v !== chip.value)
                                  : [...prev, chip.value]
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 min-h-[44px] text-sm font-semibold transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-card text-foreground hover:border-primary/40'
                            }`}
                          >
                            <span className="text-base leading-none"><ConceptVisual name={chip.emoji} size="sm" /></span>
                            <span>{chip.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Primary Intent ── */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                      <Heart className="h-4 w-4" /> Primary Intent
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">What brings you here?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {intentCards.map((card) => {
                        const isSelected = intents.includes(card.value);
                        return (
                          <button
                            key={card.value}
                            onClick={() => toggleIntent(card.value)}
                            className={`relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border bg-card hover:border-primary/30'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-primary-foreground text-[9px] font-bold"></span>
                              </div>
                            )}
                            <span className="text-2xl"><ConceptVisual name={card.emoji} size="sm" /></span>
                            <div>
                              <span className="block text-sm font-semibold text-foreground">{card.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setIntents(
                          intents.length === 4
                            ? []
                            : ['FriendToWatch', 'ShareABeer', 'PostGameMeetup', 'Dating']
                        )
                      }
                      className={`w-full rounded-xl border py-3 text-sm font-semibold transition-all ${
                        intents.length === 4
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      }`}
                    >
                       Open to All
                    </button>
                  </div>

                  {/* ── Gameday Badges ── */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                       Gameday Badges
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">Pick up to 3 — shown on your card</p>
                    <div className="grid grid-cols-2 gap-3">
                      {gamedayIntentCards.map((card) => {
                        const isSelected = gamedayIntents.includes(card.value);
                        const atMax = gamedayIntents.length >= 3 && !isSelected;
                        return (
                          <button
                            key={card.value}
                            onClick={() => toggleGamedayIntent(card.value)}
                            disabled={atMax}
                            className={`relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                              isSelected
                                ? 'border-secondary bg-secondary/5 shadow-sm'
                                : atMax
                                ? 'border-border bg-card opacity-40 cursor-not-allowed'
                                : 'border-border bg-card hover:border-secondary/30'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-secondary flex items-center justify-center">
                                <span className="text-secondary-foreground text-[9px] font-bold"></span>
                              </div>
                            )}
                            <span className="text-2xl"><ConceptVisual name={card.emoji} size="sm" /></span>
                            <span className="text-sm font-semibold text-foreground">{card.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Cubs Identity */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* ── Section: Your Player ── */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                      <Star className="h-4 w-4" /> Your Player
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Favorite Cub</Label>
                      <Input
                        placeholder="Current or all-time hero"
                        value={favoritePlayer}
                        onChange={(e) => setFavoritePlayer(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>Best Cubs Memory</Label>
                      <Textarea
                        placeholder="That one moment you'll never forget…"
                        value={favoriteMoment}
                        onChange={(e) => handleMomentChange(e.target.value)}
                        className={`rounded-xl min-h-[72px] ${momentError ? 'border-destructive' : ''}`}
                      />
                      {momentError && (
                        <p className="flex items-center gap-1.5 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {momentError}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground italic">
                        Go deeper cut than the obvious one 
                      </p>
                    </div>
                  </div>

                  {/* ── Section: Fan Flavor ── */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                      <Sparkles className="h-4 w-4" /> Fan Flavor
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">My superstition</Label>
                        <Input
                          placeholder="e.g. Same hat every game"
                          value={superstition}
                          onChange={(e) => setSuperstition(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-destructive-foreground">Favorite 7th-inning singer besides Harry</Label>
                        <Input
                          placeholder="e.g. Go Cubs Go (obviously)"
                          value={stretchSong}
                          onChange={(e) => setStretchSong(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Section: Fan Style ── */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                       Your Style
                    </h3>
                    <p className="text-xs font-medium text-destructive-foreground">Tap all that fit</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {FAN_STYLE_OPTIONS.map((opt) => {
                        const isSelected = fanStyles.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleFanStyle(opt.value)}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                              isSelected
                                ? 'border-accent bg-accent text-accent-foreground shadow-sm'
                                : 'border-border bg-card text-foreground hover:border-accent/40'
                            }`}
                          >
                            <span className="text-xl"><ConceptVisual name={opt.emoji} size="sm" /></span>
                            <span className="text-sm font-semibold">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Game Day Preferences */}
              {step === 4 && (
                <div className="space-y-5">
                  <p className="text-base font-semibold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>All optional — fill in what you like</p>

                  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Your Usual Spot</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Section</Label>
                        <Input placeholder="e.g. 228" value={section} onChange={(e) => setSection(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Row</Label>
                        <Input placeholder="e.g. 5" value={row} onChange={(e) => setRow(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Seat</Label>
                        <Input placeholder="e.g. 12" value={seat} onChange={(e) => setSeat(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Seat visibility</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {privacyOptions.map((p) => {
                          const PIcon = p.icon;
                          return (
                            <button
                              key={p.value}
                              onClick={() => setLocationPrivacy(p.value)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${
                                locationPrivacy === p.value
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                              }`}
                            >
                              <PIcon className="h-3.5 w-3.5" />
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Beer className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Favorite Bar</span>
                    </div>
                    <Select value={bestBar} onValueChange={setBestBar}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick your go-to bar" /></SelectTrigger>
                      <SelectContent>
                        {WRIGLEYVILLE_BARS.map((b) => (
                          <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Bar visibility</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {privacyOptions.map((p) => {
                          const PIcon = p.icon;
                          return (
                            <button
                              key={p.value}
                              onClick={() => setBarPrivacy(p.value)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${
                                barPrivacy === p.value
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                              }`}
                            >
                              <PIcon className="h-3.5 w-3.5" />
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Step 5: Scouting Report / Persona */}
              {step === 5 && (
                <div className="space-y-5">
                  <p className="text-base font-semibold" style={{ color: 'white', WebkitTextStroke: '0.5px black', paintOrder: 'stroke fill', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }}>
                    Pick the persona that fits you best
                  </p>
                  <div className="space-y-3">
                    {([
                      { value: 'die_hard', label: 'The Die-Hard', desc: 'You live and breathe the score. Every pitch matters.', gradient: 'from-red-600 to-red-800', border: 'border-red-500' },
                      { value: 'social_butterfly', label: 'The Social Butterfly', desc: "You're here for the vibes, the beers, and the new friends.", gradient: 'from-amber-500 to-orange-600', border: 'border-amber-400' },
                      { value: 'bleacher_creature', label: 'Bleacher Creature', desc: "Sun, suds, and section 309. You ARE the bleachers.", gradient: 'from-emerald-600 to-green-700', border: 'border-emerald-400' },
                      { value: 'stats_nerd', label: 'Stats Nerd', desc: 'OPS, WAR, exit velo — you keep score with a pencil.', gradient: 'from-indigo-600 to-blue-700', border: 'border-indigo-400' },
                      { value: 'foodie_fan', label: 'Foodie Fan', desc: 'You map your day around tacos and a cold one.', gradient: 'from-rose-500 to-pink-600', border: 'border-rose-400' },
                      { value: 'first_timer', label: 'First-Timer', desc: "Your first Wrigley game. We'll show you the ropes.", gradient: 'from-teal-500 to-cyan-600', border: 'border-teal-400' },
                      { value: 'tourist', label: 'The Tourist', desc: "Visiting Chicago? Let's make Wrigley unforgettable.", gradient: 'from-sky-500 to-blue-600', border: 'border-sky-400' },
                    ] as const).map((p) => {
                      const isSelected = gamedayPersona === p.value;
                      return (
                        <motion.button
                          key={p.value}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setGamedayPersona(p.value)}
                          className={`relative w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                            isSelected
                              ? `${p.border} bg-gradient-to-r ${p.gradient} shadow-lg shadow-black/20`
                              : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center"
                            >
                              <span className="text-white text-xs font-bold"></span>
                            </motion.div>
                          )}
                          <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                              isSelected ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <PersonaIcon name={p.value} size={28} strokeWidth={1.8} />
                          </span>
                          <div>
                            <span className={`block text-lg font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>{p.label}</span>
                            <span className={`block text-sm leading-snug ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>{p.desc}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0 px-5 py-4">
        <div className="mx-auto max-w-md">
          <Button
            onClick={next}
            className="w-full rounded-2xl py-6 text-base font-semibold"
            disabled={(step === 3 && !!momentError) || updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              'Saving...'
            ) : step === TOTAL_STEPS ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Let's Go!
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
