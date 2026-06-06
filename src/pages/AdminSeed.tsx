import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSeed() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-fans");
      if (error) {
        throw error;
      }
      setResult({ type: "success", message: data?.message || "8 demo fans seeded successfully!" });
    } catch (err: any) {
      setResult({ type: "error", message: err.message || "Failed to seed demo fans." });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md bg-slate-900/90 border-slate-700/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold text-slate-50 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Seed Demo Fans
          </CardTitle>
          <CardDescription className="text-slate-400">
            Populate the app with 8 fake fan profiles for testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
          >
            {seeding ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Seed 8 Demo Fans
              </>
            )}
          </Button>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                result.type === "success"
                  ? "bg-green-500/15 text-green-400 border border-green-500/30"
                  : "bg-red-500/15 text-red-400 border border-red-500/30"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
