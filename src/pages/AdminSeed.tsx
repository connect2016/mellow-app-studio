import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";

export default function AdminSeed() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-demo-fans`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(edgeFunctionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setResult({ type: "error", message: "Failed to copy URL to clipboard." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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

          <div className="rounded-lg border border-slate-700/40 bg-slate-800/60 p-3 space-y-2">
            <p className="text-xs text-slate-400 font-medium">Edge Function URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-slate-300 bg-slate-950/60 rounded px-2 py-1.5 truncate font-mono">
                {edgeFunctionUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="shrink-0 text-slate-300 hover:text-slate-50 hover:bg-slate-700/50"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

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
