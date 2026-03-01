import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IntentChip } from '@/components/IntentChip';
import { IntentType, WRIGLEYVILLE_BARS, PrivacyLevel } from '@/types';
import { ChevronLeft, ChevronRight, Camera, AlertCircle } from 'lucide-react';

const TOTAL_STEPS = 4;

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
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [intents, setIntents] = useState<IntentType[]>([]);
  const [favoritePlayer, setFavoritePlayer] = useState('');
  const [favoriteMoment, setFavoriteMoment] = useState('');
  const [momentError, setMomentError] = useState('');
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [bar, setBar] = useState('');
  const [locationPrivacy, setLocationPrivacy] = useState<PrivacyLevel>('MatchesOnly');
  const [barPrivacy, setBarPrivacy] = useState<PrivacyLevel>('MatchesOnly');

  const toggleIntent = (i: IntentType) => {
    setIntents((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const handleMomentChange = (val: string) => {
    setFavoriteMoment(val);
    if (val && !validateMoment(val)) {
      setMomentError("Pick a moment other than the 2016 World Series—go deeper cut!");
    } else {
      setMomentError('');
    }
  };

  const next = () => {
    if (step === 3 && favoriteMoment && !validateMoment(favoriteMoment)) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
    else navigate('/discover');
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress */}
      <div className="border-b px-6 py-4">
        <div className="mx-auto max-w-sm">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <button onClick={back} className={step === 1 ? 'invisible' : ''}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span>Step {step} of {TOTAL_STEPS}</span>
            <div className="w-5" />
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-1 items-start justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Let's set up your profile</h2>

                <div className="flex justify-center">
                  <button className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-muted text-muted-foreground hover:bg-primary/5 transition-colors">
                    <Camera className="h-8 w-8" />
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input placeholder="How fans will know you" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" placeholder="21+" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pronouns (optional)</Label>
                    <Input placeholder="e.g. she/her" value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>What are you looking for?</h2>
                <p className="text-sm text-muted-foreground">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {(['FriendToWatch', 'ShareABeer', 'PostGameMeetup', 'Dating'] as IntentType[]).map((i) => (
                    <IntentChip key={i} intent={i} selected={intents.includes(i)} onClick={() => toggleIntent(i)} size="md" />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Fan credentials</h2>
                <div className="space-y-2">
                  <Label>Favorite Player</Label>
                  <Input placeholder="Current or all-time" value={favoritePlayer} onChange={(e) => setFavoritePlayer(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Favorite Fan Moment</Label>
                  <Textarea
                    placeholder="Your most memorable Cubs moment..."
                    value={favoriteMoment}
                    onChange={(e) => handleMomentChange(e.target.value)}
                    className={momentError ? 'border-destructive' : ''}
                  />
                  {momentError && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {momentError}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Game-day setup (optional)</h2>
                <p className="text-sm text-muted-foreground">Where do you usually sit or hang?</p>

                <div className="space-y-3">
                  <Label>Wrigley Field Seats</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} />
                    <Input placeholder="Row" value={row} onChange={(e) => setRow(e.target.value)} />
                    <Input placeholder="Seat" value={seat} onChange={(e) => setSeat(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Seat visibility</Label>
                    <Select value={locationPrivacy} onValueChange={(v) => setLocationPrivacy(v as PrivacyLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Everyone</SelectItem>
                        <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                        <SelectItem value="Hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Favorite Wrigleyville Bar</Label>
                  <Select value={bar} onValueChange={setBar}>
                    <SelectTrigger><SelectValue placeholder="Select a bar" /></SelectTrigger>
                    <SelectContent>
                      {WRIGLEYVILLE_BARS.map((b) => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Bar visibility</Label>
                    <Select value={barPrivacy} onValueChange={(v) => setBarPrivacy(v as PrivacyLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Everyone</SelectItem>
                        <SelectItem value="MatchesOnly">Matches Only</SelectItem>
                        <SelectItem value="Hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto max-w-sm">
          <Button onClick={next} className="w-full rounded-xl py-6 text-base font-semibold" disabled={step === 3 && !!momentError}>
            {step === TOTAL_STEPS ? "Let's Go!" : 'Continue'}
            {step < TOTAL_STEPS && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
