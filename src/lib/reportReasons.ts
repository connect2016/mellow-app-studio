export interface ReportReason {
  value: string;
  label: string;
  desc: string;
}

export const USER_REPORT_REASONS: ReportReason[] = [
  { value: 'harassment', label: 'Harassment', desc: 'Threatening or abusive behavior' },
  { value: 'spam', label: 'Spam', desc: 'Unwanted or repetitive messages' },
  { value: 'fake_profile', label: 'Fake Profile', desc: 'Impersonation or misleading info' },
  { value: 'other', label: 'Other', desc: 'Something else that feels wrong' },
];
