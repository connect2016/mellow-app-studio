import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamedayModeProvider } from "@/contexts/GamedayModeContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { MessageToastListener } from "@/components/MessageToastListener";
import { BucketListPanel } from "@/components/BucketListPanel";
import { IcebreakerNotifier } from "@/components/IcebreakerNotifier";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

import Onboarding from "./pages/Onboarding";
import QuickStart from "./pages/QuickStart";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import GameDay from "./pages/GameDay";
import ShareSeat from "./pages/ShareSeat";
import CheckIn from "./pages/CheckIn";
import HiFives from "./pages/HiFives";
import BeerMoney from "./pages/BeerMoney";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import VibeFeed from "./pages/VibeFeed";
import Loyalty from "./pages/Loyalty";
import Crews from "./pages/Crews";
import CrewDetail from "./pages/CrewDetail";
import Missions from "./pages/Missions";
import Memories from "./pages/Memories";
import Notifications from "./pages/Notifications";
import ScoreLobby from "./pages/ScoreLobby";
import ScoreGame from "./pages/ScoreGame";
import BallparkBuddy from "./pages/BallparkBuddy";
import WrigleyPassport from "./pages/WrigleyPassport";
import BarMap from "./pages/BarMap";
import BuddyHeatmap from "./pages/BuddyHeatmap";
import SectionChat from "./pages/SectionChat";
import VerifyFan from "./pages/VerifyFan";
import Venues from "./pages/Venues";
import PubCrawl from "./pages/PubCrawl";
import Meetups from "./pages/Meetups";
import MeetupDetail from "./pages/MeetupDetail";
import NotFound from "./pages/NotFound";
import ClaimBeer from "./pages/ClaimBeer";
import WrigleyvilleEats from "./pages/WrigleyvilleEats";
import Dugout from "./pages/Dugout";
import { preloadReactionImages } from "@/lib/reaction-cache";

// Preload reaction images on app boot for instant rendering
preloadReactionImages();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GuestModeProvider>
          <GamedayModeProvider>
            <MessageToastListener />
            <BucketListPanel />
            <IcebreakerNotifier />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/quick-start" element={<QuickStart />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/game-day" element={<GameDay />} />
            <Route path="/share-seat" element={<ShareSeat />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/hi-fives" element={<HiFives />} />
            <Route path="/beer-money" element={<BeerMoney />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/vibe" element={<VibeFeed />} />
            <Route path="/loyalty" element={<Loyalty />} />
            <Route path="/crews" element={<Crews />} />
            <Route path="/crews/:id" element={<CrewDetail />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/score" element={<ScoreLobby />} />
            <Route path="/score/:id" element={<ScoreGame />} />
            <Route path="/ballpark-buddy" element={<BallparkBuddy />} />
            <Route path="/wrigley-passport" element={<WrigleyPassport />} />
            <Route path="/bar-map" element={<BarMap />} />
            <Route path="/buddy-heatmap" element={<BuddyHeatmap />} />
            <Route path="/section-chat" element={<SectionChat />} />
            <Route path="/verify" element={<VerifyFan />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/pub-crawl" element={<PubCrawl />} />
            <Route path="/meetups" element={<Meetups />} />
             <Route path="/meetups/:id" element={<MeetupDetail />} />
             <Route path="/claim/:code" element={<ClaimBeer />} />
             <Route path="/eats" element={<WrigleyvilleEats />} />
             <Route path="/dugout" element={<Dugout />} />
             <Route path="*" element={<NotFound />} />
          </Routes>
          </GamedayModeProvider>
          </GuestModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
