import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Beer, Users, MapPin, Shield, Heart } from 'lucide-react';
import logo from '@/assets/logo.png';
import wrigleyvilleBg from '@/assets/wrigleyville-bg.png';

const features = [
  {
    icon: Users,
    title: 'Find Your Crew',
    description: 'Match with fans who share your vibe—friends, beer buddies, or something more.',
  },
  {
    icon: MapPin,
    title: 'Game-Day Mode',
    description: "Share your spot at Wrigley or your favorite Wrigleyville bar. Connect in real-time.",
  },
  {
    icon: Zap,
    title: 'Hi-Five',
    description: 'Low-commitment poke. Send a Hi-Five to break the ice without the pressure.',
  },
  {
    icon: Beer,
    title: 'Send Beer Money',
    description: "Buy someone a round. Send a few bucks with a note—it's the ultimate icebreaker.",
  },
  {
    icon: Heart,
    title: 'Real Connections',
    description: 'Choose your intent: watch a game, grab a beer, post-game hangs, or dating.',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    description: 'Control who sees your location. Block, report, and stay comfortable.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={wrigleyvilleBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        </div>
        <div className="relative mx-auto max-w-lg px-6 pb-16 pt-10 text-center" style={{ minHeight: '100vh' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
            style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img src={logo} alt="Cubbies Buddies" className="w-full max-w-lg drop-shadow-xl" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-2 text-4xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Your Wrigleyville{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Connection Hub
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-4 text-2xl font-semibold tracking-wide text-foreground/80"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Sync. Meet. Celebrate.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 text-base text-muted-foreground"
          >
            Discover your Wrigleyville crew for friendships, pre and post-game meetups, or a fun sports date. Connect with fans who truly get it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link to="/auth">
              <Button size="lg" className="rounded-full px-8 text-base font-semibold shadow-lg">
                Join Cubbies Buddies
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-lg px-6 pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="border-t bg-muted/50 py-12 text-center">
        <p className="mb-4 text-muted-foreground">Ready to find your crew?</p>
        <Link to="/auth">
          <Button variant="outline" className="rounded-full px-6">
            Get Started
          </Button>
        </Link>
      </section>
    </div>
  );
}
