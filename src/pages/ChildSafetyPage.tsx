import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function ChildSafetyPage() {
  return (
    <LegalPageLayout
      title="Child Safety Standards"
      updated="August 14, 2026"
      seoTitle="Child Safety Standards | Wrigleyville Buddies"
      seoDescription="Wrigleyville Buddies' standards against child sexual abuse and exploitation (CSAE), and how to report concerns."
    >
      <h2>Our commitment</h2>
      <p>
        Wrigleyville Buddies is an adults' social app for Chicago Cubs fans. We have zero
        tolerance for child sexual abuse and exploitation (CSAE), including any content or
        conduct that sexualizes, endangers, or exploits minors. This page describes the
        standards we enforce and how anyone can report a concern.
      </p>

      <h2>Who can use Wrigleyville Buddies</h2>
      <p>
        Wrigleyville Buddies is intended for users aged 18 and over. Accounts are for adults
        arranging in-person meetups and social connection around Cubs games and the
        Wrigleyville neighborhood. We do not knowingly allow anyone under 18 to create an
        account, and we remove accounts we determine to belong to minors.
      </p>

      <h2>What is prohibited</h2>
      <p>The following are strictly prohibited on Wrigleyville Buddies:</p>
      <ul>
        <li>Any content that sexualizes, exploits, or endangers a minor.</li>
        <li>Child sexual abuse material (CSAM) in any form.</li>
        <li>Grooming, solicitation, or any attempt to sexualize contact with a minor.</li>
        <li>Attempting to use the app to identify, contact, or arrange to meet a minor.</li>
        <li>Sharing, requesting, or linking to CSAE content anywhere in the app.</li>
      </ul>
      <p>
        Violations result in immediate account termination and, where required, referral to
        the appropriate authorities, including the National Center for Missing &amp; Exploited
        Children (NCMEC).
      </p>

      <h2>How to report a concern</h2>
      <p>If you encounter content or behavior that may endanger a minor, report it right away:</p>
      <ul>
        <li>
          <strong>In-app reporting:</strong> Use the report option on a user's profile or on a
          meetup to flag content or conduct. Reports are reviewed by our moderation team.
        </li>
        <li>
          <strong>Blocking:</strong> You can block any user to immediately stop contact between
          your account and theirs.
        </li>
        <li>
          <strong>Email:</strong> Contact us directly at{' '}
          <strong>connect@wrigleyvillebuddies.com</strong> with "Child Safety" in the subject
          line. Include any relevant usernames or details so we can act quickly.
        </li>
      </ul>

      <h2>How we respond</h2>
      <p>When a CSAE concern is reported, our moderation team:</p>
      <ol className="mt-3 list-decimal pl-6">
        <li>Reviews the report and the reported account.</li>
        <li>Removes prohibited content and restricts or bans the account as warranted.</li>
        <li>Preserves relevant information and reports to NCMEC and law enforcement where required by law.</li>
      </ol>
      <p>
        Accounts that accumulate reports are automatically restricted pending review, and
        confirmed violations are permanently banned.
      </p>

      <h2>Reporting to authorities</h2>
      <p>
        Suspected child sexual abuse or exploitation can be reported directly to the National
        Center for Missing &amp; Exploited Children (NCMEC) through the CyberTipline at{' '}
        <strong>report.cybertip.org</strong>, or to your local law enforcement. If a child is in
        immediate danger, contact emergency services right away.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these standards can be sent to{' '}
        <strong>connect@wrigleyvillebuddies.com</strong>.
      </p>
    </LegalPageLayout>
  );
}
