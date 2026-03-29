// @ts-ignore
import '@fontsource/norwester';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Beer, Users, MapPin, Shield, Heart, ChevronRight, Star, Eye } from 'lucide-react';
import { useGuestMode } from '@/contexts/GuestModeContext';
import wrigleyHero from '@/assets/wrigley-hero.jpg';
import HeroVideo from '@/components/landing/HeroVideo';
import fansCheering from '@/assets/fans-cheering.jpg';
import beerCheers from '@/assets/beer-cheers.jpg';

const features = [
{
  icon: Users,
  title: 'Find Your Crew',
  description: 'Match with fans who share your vibe—friends, beer buddies, or something more.'
},
{
  icon: MapPin,
  title: 'Game-Day Mode',
  description: "Share your spot at Wrigley or your favorite Wrigleyville bar. Connect in real-time."
},
{
  icon: Zap,
  title: 'Hi-Fives',
  description: 'Low-commitment poke. Send a Hi-Five to break the ice without the pressure.'
},
{
  icon: Beer,
  title: 'Send Beer Money',
  description: "Buy someone a round. Send a few bucks with a note—it's the ultimate icebreaker."
},
{
  icon: Heart,
  title: 'Real Connections',
  description: 'Choose your intent: watch a game, grab a beer, post-game hangs, or dating.'
},
{
  icon: Shield,
  title: 'Safe & Private',
  description: 'Control who sees your location. Block, report, and stay comfortable.'
}];


const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } }
};

const stats = [
{ label: 'Cubs Fans', value: '1,200+' },
{ label: 'Hi-Fives Sent', value: '8,400+' },
{ label: 'Game-Day Meetups', value: '3,100+' }];


export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Video Hero ── */}
      <HeroVideo />

      {/* ── Social proof banner ── */}
      <section className="relative -mt-1 overflow-hidden bg-primary py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-6 text-center text-sm font-medium text-primary-foreground">
          <Star className="h-4 w-4 fill-[hsl(var(--cubs-red))] text-[hsl(var(--cubs-red))]" />
          <span>The #1 social app for Wrigleyville fans</span>
          <Star className="h-4 w-4 fill-[hsl(var(--cubs-red))] text-[hsl(var(--cubs-red))]" />
        </div>
      </section>

      {/* ── Fan Culture Photo Strip ── */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center">
            
            <h2
              className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: 'Space Grotesk' }}>
              
              More Than a Game.{' '}
              <span className="text-secondary">It's a Community.</span>
            </h2>
            <p className="text-muted-foreground">
              Pregame beers, seventh-inning sing-alongs, and friendships that last way beyond the final out.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-2xl">
              
              <img
                src={fansCheering}
                alt="Cubs fans cheering at a Wrigleyville bar"
                className="h-64 w-full object-cover sm:h-80" />
              
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="overflow-hidden rounded-2xl">
              
              <img
                src={beerCheers}
                alt="Friends clinking beers at the ballpark"
                className="h-64 w-full object-cover sm:h-80" />
              
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center">
            
            <h2
              className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
              style={{ fontFamily: 'Space Grotesk' }}>
              
              Everything You Need on{' '}
              <span className="text-primary">Game Day</span>
            </h2>
            <p className="text-muted-foreground">Six ways Cubbies Buddies makes your Wrigley experience legendary.</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            
            {features.map((f) =>
            <motion.div
              key={f.title}
              variants={item}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-secondary/10">
                  <f.icon className="h-6 w-6 text-primary group-hover:text-secondary" />
                </div>
                <h3
                className="mb-1 text-lg font-semibold text-card-foreground"
                style={{ fontFamily: 'Space Grotesk' }}>
                
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="absolute inset-0 opacity-10">
          <img src={wrigleyHero} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-lg px-6 text-center">
          <h2
            className="mb-3 text-3xl font-bold text-primary-foreground sm:text-4xl">
            
            Ready to find your crew?
          </h2>
          <p className="mb-8 text-primary-foreground/70">
            Get in the game. Your next Wrigleyville friend is already here.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full bg-secondary px-10 text-base font-bold shadow-lg hover:bg-secondary/90">
              
              Get in the Game
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-background py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Cubbies Buddies · Made with ❤️ in Wrigleyville</p>
      </footer>
    </div>);

}