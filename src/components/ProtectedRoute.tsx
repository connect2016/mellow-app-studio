import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const PUBLIC_PATHS = [
      "/discover", "/discover-fans", "/schedule", "/leaderboard",
      "/league-leaders", "/bar-map", "/bars", "/buddy-heatmap",
      "/meetups", "/eats", "/vibe", "/venues",
    ];
    const isPublicPath =
      PUBLIC_PATHS.includes(location.pathname) ||
      location.pathname.startsWith("/u/") ||
      location.pathname.startsWith("/profile/") ||
      location.pathname.startsWith("/meetups/");
    if (!isPublicPath) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to="/auth" replace state={{ from }} />;
    }
  }

  return <Outlet />;
}
