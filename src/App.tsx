import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamedayModeProvider } from "@/contexts/GamedayModeContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { MessageToastListener } from "@/components/MessageToastListener";
import { BucketListPanel } from "@/components/BucketListPanel";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { IcebreakerNotifier } from "@/components/IcebreakerNotifier";
import { AchievementNotifier } from "@/components/notifications/AchievementNotifier";
import { PushPermissionPrompt } from "@/components/PushPermissionPrompt";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FirstActionMicroflow } from "@/components/onboarding/FirstActionMicroflow";
import { CreateMeetupProvider } from "@/contexts/CreateMeetupContext";
import { CreateMeetupFab } from "@/components/CreateMeetupFab";
import { BottomNav } from "@/components/layout/BottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OfflineMonitor } from "@/components/system/OfflineMonitor";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

import Onboarding from "./pages/Onboarding";
import QuickStart from "./pages/QuickStart";
import Discover from "./pages/Discover";
import DiscoverFans from "./pages/DiscoverFans";
import Schedule from "./pages/Schedule";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Messages from "./pages/Messages";
import GameDay from "./pages/GameDay";
import ShareSeat from "./pages/ShareSeat";
import CheckIn from "./pages/CheckIn";
import HiFives from "./pages/HiFives";
import BeerMoney from "./pages/BeerMoney";
import Settings from "./pages/Settings";
import NotificationPreferences from "./pages/NotificationPreferences";
import Admin from "./pages/Admin";
import AdminSeed from "./pages/AdminSeed";
import VibeFeed from "./pages/VibeFeed";
import Loyalty from "./pages/Loyalty";
import LeagueLeaders from "./pages/LeagueLeaders";
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
import FanMap from "./pages/FanMap";
import BuddyHeatmap from "./pages/BuddyHeatmap";
import SectionChat from "./pages/SectionChat";
import VerifyFan from "./pages/VerifyFan";
import Venues from "./pages/Venues";
import PubCrawl from "./pages/PubCrawl";
import Meetups from "./pages/Meetups";
import MeetupDetail from "./pages/MeetupDetail";
import NotFound from "./pages/NotFound";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ClaimBeer from "./pages/ClaimBeer";
import CheckoutReturn from "./pages/CheckoutReturn";
import WrigleyvilleEats from "./pages/WrigleyvilleEats";
import Dugout from "./pages/Dugout";
import Join from "./pages/Join";
import Partners from "./pages/Partners";
import { preloadReactionImages } from "@/lib/reaction-cache";
import { FanStreakTracker } from "@/hooks/useFanStreak";

// Preload reaction images on app boot for instant rendering
preloadReactionImages();

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineMonitor />
      <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <GuestModeProvider>
          <GamedayModeProvider>
            <CreateMeetupProvider>
            <MessageToastListener />
            <BucketListPanel />
            <DisclaimerModal />
            <IcebreakerNotifier />
            <AchievementNotifier />
            <PushPermissionPrompt />
            <InstallPrompt />
            <FirstActionMicroflow />
            <FanStreakTracker />
            <BottomNav />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/join" element={<Join />} />
            <Route path="/partners" element={<Partners />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/quick-start" element={<QuickStart />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/discover-fans" element={<DiscoverFans />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/game-day" element={<GameDay />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/hi-fives" element={<HiFives />} />
              <Route path="/beer-money" element={<BeerMoney />} />
              <Route path="/vibe" element={<VibeFeed />} />
              <Route path="/loyalty" element={<Loyalty />} />
              <Route path="/crews" element={<Crews />} />
              <Route path="/crews/:id" element={<CrewDetail />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/score" element={<ScoreLobby />} />
              <Route path="/score/:id" element={<ScoreGame />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/claim/:code" element={<ClaimBeer />} />
              <Route path="/dugout" element={<Dugout />} />
            </Route>
            <Route path="/share-seat" element={<ShareSeat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/notifications" element={<NotificationPreferences />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/seed" element={<AdminSeed />} />
            </Route>
            <Route path="/ballpark-buddy" element={<BallparkBuddy />} />
            <Route path="/wrigley-passport" element={<WrigleyPassport />} />
            <Route path="/bar-map" element={<FanMap />} />
            <Route path="/bars" element={<BarMap />} />
            <Route path="/buddy-heatmap" element={<BuddyHeatmap />} />
            <Route path="/section-chat" element={<SectionChat />} />
            <Route path="/verify" element={<VerifyFan />} />
            <Route path="/pub-crawl" element={<PubCrawl />} />
            <Route path="/meetups" element={<Meetups />} />
            <Route path="/meetups/:id" element={<MeetupDetail />} />
            <Route path="/eats" element={<WrigleyvilleEats />} />
            <Route path="/league-leaders" element={<LeagueLeaders />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <CreateMeetupFab />
          <SiteFooter />
          </CreateMeetupProvider>
          </GamedayModeProvider>
          </GuestModeProvider>
        </AuthProvider>
      </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
