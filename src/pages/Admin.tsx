import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '@/components/AppHeader';
import { SEOMeta } from '@/components/SEOMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { USER_REPORT_REASONS } from '@/lib/reportReasons';
import { Shield, AlertTriangle, Ban, Eye, Sparkles, Loader2 } from 'lucide-react';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

interface AdminProfileSummary {
  user_id: string;
  display_name: string;
  profile_photo: string | null;
  is_banned: boolean;
  hidden_from_discover: boolean;
  ban_reason: string | null;
}

export default function Admin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select('id, reporter_id, reported_user_id, reason, details, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserReport[];
    },
  });

  const profileIds = [...new Set(reports.flatMap((r) => [r.reporter_id, r.reported_user_id]))];

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profile-summaries', profileIds.slice().sort().join(',')],
    queryFn: async () => {
      if (profileIds.length === 0) return [];
      const { data, error } = await supabase.rpc('get_admin_profile_summaries' as any, {
        _user_ids: profileIds,
      });
      if (error) throw error;
      return (data ?? []) as AdminProfileSummary[];
    },
    enabled: profileIds.length > 0,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_user_stats' as any);
      if (error) throw error;
      return (data as { total_users: number; banned_count: number }[])?.[0] ?? { total_users: 0, banned_count: 0 };
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin-profile-summaries'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
  };

  const banUser = useMutation({
    mutationFn: async ({ targetId, reason }: { targetId: string; reason: string }) => {
      const { error } = await supabase.rpc('ban_user' as any, { p_target_id: targetId, p_reason: reason });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User banned' });
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: 'Could not ban user', description: e.message, variant: 'destructive' }),
  });

  const closeReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from('user_reports').update({ status: 'actioned' }).eq('id', reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Report closed' });
      invalidateAll();
    },
    onError: (e: Error) => toast({ title: 'Could not close report', description: e.message, variant: 'destructive' }),
  });

  const seedDemoFans = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-fans');
      if (error) throw error;
      toast({ title: 'Demo fans seeded', description: `${data?.count ?? 8} profiles ready in Discover, Map & Fans.` });
    } catch (e) {
      toast({ title: 'Seed failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOMeta
        title="Admin — Wrigleyville Buddies"
        description="Internal moderation dashboard for Wrigleyville Buddies trust & safety reports."
        url="/admin"
        noindex
      />
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[
            { label: 'Open Reports', value: reports.length, color: 'text-destructive' },
            { label: 'Total Users', value: stats?.total_users ?? '—', color: 'text-primary' },
            { label: 'Banned', value: stats?.banned_count ?? '—', color: 'text-muted-foreground' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Demo seeding */}
        <div className="mb-6 rounded-xl border bg-card p-4">
          <h3 className="mb-1 font-semibold text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> Demo Data
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Seeds 8 demo fan profiles into Discover, the map, and the fan list. Safe to re-run.
          </p>
          <Button onClick={seedDemoFans} disabled={seeding} size="sm">
            {seeding ? 'Seeding…' : 'Seed 8 Demo Fans'}
          </Button>
        </div>

        {/* Reports */}
        <h3 className="mb-3 font-semibold text-sm">Reports Queue</h3>
        {reportsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
            No open reports.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const reportedUser = profileMap.get(report.reported_user_id);
              const reasonLabel = USER_REPORT_REASONS.find((r) => r.value === report.reason)?.label ?? report.reason;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border bg-card p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-secondary" />
                      <Badge variant="destructive" className="text-xs">
                        {report.status}
                      </Badge>
                      {reportedUser?.is_banned && (
                        <Badge variant="outline" className="text-xs">already banned</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {reportedUser && (
                    <div className="flex items-center gap-2 mb-2">
                      {reportedUser.profile_photo ? (
                        <img src={reportedUser.profile_photo} alt="" className="h-8 w-8 rounded-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted" />
                      )}
                      <span className="text-sm font-medium">{reportedUser.display_name || 'Fan'}</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-1"><strong>Reason:</strong> {reasonLabel}</p>
                  {report.details && <p className="text-xs text-muted-foreground mb-3">{report.details}</p>}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 rounded-lg text-xs"
                      onClick={() => navigate(`/u/${report.reported_user_id}`)}
                    >
                      <Eye className="h-3 w-3" /> View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 rounded-lg text-xs"
                      disabled={banUser.isPending || reportedUser?.is_banned}
                      onClick={() => banUser.mutate({ targetId: report.reported_user_id, reason: reasonLabel })}
                    >
                      <Ban className="h-3 w-3" /> {reportedUser?.is_banned ? 'Banned' : 'Ban'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-xs"
                      disabled={closeReport.isPending}
                      onClick={() => closeReport.mutate(report.id)}
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
