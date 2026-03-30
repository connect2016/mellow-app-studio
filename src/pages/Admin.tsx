import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_USERS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, Ban, Eye } from 'lucide-react';

interface MockReport {
  id: string;
  reporterName: string;
  reportedUserId: string;
  reason: string;
  details: string;
  status: 'open' | 'reviewing' | 'closed';
  date: string;
}

const MOCK_REPORTS: MockReport[] = [
  { id: '1', reporterName: 'Anonymous', reportedUserId: '3', reason: 'Spam', details: 'Sending promotional messages', status: 'open', date: '2 hours ago' },
  { id: '2', reporterName: 'Anonymous', reportedUserId: '5', reason: 'Fake Profile', details: 'Photos look fake/AI generated', status: 'open', date: '5 hours ago' },
  { id: '3', reporterName: 'Anonymous', reportedUserId: '2', reason: 'Harassment', details: 'Unwanted messages after blocking', status: 'reviewing', date: '1 day ago' },
];

export default function Admin() {
  const { toast } = useToast();
  const [reports, setReports] = useState(MOCK_REPORTS);

  const closeReport = (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'closed' as const } : r));
    toast({ title: 'Report closed' });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[
            { label: 'Open Reports', value: reports.filter((r) => r.status === 'open').length, color: 'text-destructive' },
            { label: 'Total Users', value: MOCK_USERS.length, color: 'text-primary' },
            { label: 'Banned', value: MOCK_USERS.filter((u) => u.is_banned).length, color: 'text-muted-foreground' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Reports */}
        <h3 className="mb-3 font-semibold text-sm">Reports Queue</h3>
        <div className="space-y-2">
          {reports.filter((r) => r.status !== 'closed').map((report) => {
            const reportedUser = MOCK_USERS.find((u) => u.id === report.reportedUserId);
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
                    <Badge variant={report.status === 'open' ? 'destructive' : 'secondary'} className="text-xs">
                      {report.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{report.date}</span>
                </div>

                {reportedUser && (
                  <div className="flex items-center gap-2 mb-2">
                    <img src={reportedUser.profile_photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="text-sm font-medium">{reportedUser.display_name}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-1"><strong>Reason:</strong> {report.reason}</p>
                <p className="text-xs text-muted-foreground mb-3">{report.details}</p>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs">
                    <Eye className="h-3 w-3" /> View Profile
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 rounded-lg text-xs" onClick={() => toast({ title: 'User banned' })}>
                    <Ban className="h-3 w-3" /> Ban
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => closeReport(report.id)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
