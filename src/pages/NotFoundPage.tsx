import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { SEOMeta } from "@/components/SEOMeta";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMeta
        title="Page Not Found | Cubbies Buddies"
        description="You swung and missed. That URL doesn't exist."
      />
      <AppHeader />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-6">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            Strike Three
          </h1>
          <p className="text-xl text-muted-foreground">
            You swung and missed. That URL doesn't exist.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="min-h-12 px-8"
          >
            Go Home
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
