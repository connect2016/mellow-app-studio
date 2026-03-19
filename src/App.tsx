import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
