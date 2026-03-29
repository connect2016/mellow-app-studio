import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Camera, ShieldCheck, Loader2, CheckCircle2, ThumbsUp, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const POSE_INSTRUCTION = {
  emoji: '👍',
  label: 'Thumbs Up',
  description: 'Hold up a thumbs up next to your face',
};

export default function VerifyFan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<'intro' | 'camera' | 'preview' | 'uploading' | 'done'>('intro');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Already verified
  if (profile?.is_verified) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            You're a Verified Fan!
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Your blue checkmark is visible on your profile. You have full access to all community features.
          </p>
          <Button onClick={() => navigate('/discover')} className="rounded-xl">
            Back to Discover
          </Button>
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('camera');
    } catch {
      setCameraError('Camera access denied. Please allow camera access in your browser settings.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror the image (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep('preview');
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    await startCamera();
  };

  const submitVerification = async () => {
    if (!user || !capturedImage) return;
    setStep('uploading');

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const path = `verification/${user.id}/${Date.now()}.jpg`;

      // Upload to profile-photos bucket
      const { error: uploadErr } = await supabase.storage.from('profile-photos').upload(path, blob, {
        contentType: 'image/jpeg',
      });
      if (uploadErr) throw uploadErr;

      // Mark as verified
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('user_id', user.id);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast({ title: '✅ Verified Fan!', description: 'Your blue checkmark is now live on your profile.' });
      setStep('done');
    } catch (err: any) {
      toast({ title: 'Verification failed', description: err.message || 'Please try again.', variant: 'destructive' });
      setStep('preview');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <canvas ref={canvasRef} className="hidden" />

      <main className="mx-auto max-w-lg px-4 pt-6">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  Get Verified
                </h1>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Prove you're a real fan by taking a quick selfie with a pose. Verified fans get a blue checkmark and full access to community features.
                </p>
              </div>

              {/* What you unlock */}
              <div className="rounded-2xl border border-border bg-card p-4 text-left space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">What you unlock</p>
                <div className="space-y-2">
                  {[
                    { emoji: '💬', label: 'Join Section Chats & Lineup group chats' },
                    { emoji: '📸', label: 'Post to the Live Vibe Feed' },
                    { emoji: '✅', label: 'Blue checkmark on your profile' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pose instruction */}
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Your Verification Pose</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl">{POSE_INSTRUCTION.emoji}</span>
                  <div className="text-left">
                    <p className="text-base font-bold text-foreground">{POSE_INSTRUCTION.label}</p>
                    <p className="text-sm text-muted-foreground">{POSE_INSTRUCTION.description}</p>
                  </div>
                </div>
              </div>

              {cameraError && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-xl px-3 py-2">{cameraError}</p>
              )}

              <Button onClick={startCamera} className="w-full rounded-2xl py-6 text-base font-bold gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Camera className="h-5 w-5" />
                Open Camera
              </Button>
            </motion.div>
          )}

          {/* CAMERA */}
          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-2">
                <p className="text-sm font-semibold text-foreground">Show a {POSE_INSTRUCTION.emoji} {POSE_INSTRUCTION.label}</p>
                <p className="text-xs text-muted-foreground">{POSE_INSTRUCTION.description}</p>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* Pose guide overlay */}
                <div className="absolute inset-0 border-4 border-dashed border-primary/40 rounded-2xl pointer-events-none" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                  {POSE_INSTRUCTION.emoji} Hold your {POSE_INSTRUCTION.label.toLowerCase()} and tap capture
                </div>
              </div>

              <Button onClick={capturePhoto} className="w-full rounded-2xl py-6 text-base font-bold gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <Camera className="h-5 w-5" />
                Capture Selfie
              </Button>
            </motion.div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && capturedImage && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Looking good! 📸</p>
                <p className="text-xs text-muted-foreground">Make sure the {POSE_INSTRUCTION.label.toLowerCase()} is visible</p>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black aspect-square">
                <img src={capturedImage} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={retakePhoto} className="rounded-xl py-5 gap-2 font-semibold">
                  <RotateCcw className="h-4 w-4" /> Retake
                </Button>
                <Button onClick={submitVerification} className="rounded-xl py-5 gap-2 font-semibold">
                  <ThumbsUp className="h-4 w-4" /> Submit
                </Button>
              </div>
            </motion.div>
          )}

          {/* UPLOADING */}
          {step === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center pt-20 text-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-semibold text-foreground">Verifying your selfie…</p>
              <p className="text-xs text-muted-foreground mt-1">This'll be quick!</p>
            </motion.div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center pt-16 text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  You're Verified! ✅
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Your blue checkmark is live. You can now join group chats and post to the Vibe Feed.
                </p>
              </div>
              <Button onClick={() => navigate('/discover')} className="rounded-xl px-8">
                Back to Discover
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
