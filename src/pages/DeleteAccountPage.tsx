import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete Your Account"
      updated="August 13, 2026"
      seoTitle="Delete Your Account | Wrigleyville Buddies"
      seoDescription="How to request deletion of your Wrigleyville Buddies account and what happens to your data."
    >
      <h2>How to request deletion</h2>
      <p>You can delete your account at any time. To request it:</p>
      <ol className="mt-3 list-decimal pl-6">
        <li>Email <strong>connect@wrigleyvillebuddies.com</strong> from the email address tied to your account.</li>
        <li>Put "Delete My Account" in the subject line.</li>
        <li>We'll confirm your identity and process the deletion within 30 days. You'll get an email confirming when it's done.</li>
      </ol>

      <h2>What happens to your data</h2>
      <p>
        When your account is deleted, the following is permanently removed: your name and
        profile details, email address and login credentials, profile photo, status notes and
        meetups you posted, direct messages you sent to other fans, and your buddy connections
        and referral history.
      </p>
      <p>We may retain:</p>
      <ul>
        <li>Records we're legally required to keep (such as for fraud prevention or tax) where applicable</li>
        <li>Anonymized aggregated data that can't identify you</li>
      </ul>
      <p>
        Any retained records are kept only as long as required and deleted once that period ends.
      </p>
      <p>
        Deletion is permanent — you'll need to create a new account to use Wrigleyville Buddies
        again.
      </p>
    </LegalPageLayout>
  );
}
