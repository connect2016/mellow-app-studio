import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      updated="May 2026"
      seoTitle="Privacy Policy | Wrigleyville Buddies"
      seoDescription="How Wrigleyville Buddies collects, uses, and protects your information."
    >
      <p>
        Wrigleyville Buddies is a social app for Chicago Cubs fans. We keep this short and
        plain because you came here to make friends, not read fine print.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Profile info you give us:</strong> display name, profile photo, age, pronouns, bio, favorite player, fan style.</li>
        <li><strong>Location info:</strong> zip code, favorite gate, and (only if you turn it on) your approximate game-day location.</li>
        <li><strong>Usage data:</strong> the pages you visit, the people you connect with, and basic device info to keep the app working.</li>
        <li><strong>Account info:</strong> email address from your Google sign-in.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>Match you with nearby fans who share your gameday vibe.</li>
        <li>Show your profile to other fans you might want to meet.</li>
        <li>Power features like Crews, Meetups, Messages, and Live Vibe.</li>
        <li>Keep the bleachers safe — we use reports to enforce our rules.</li>
      </ul>
      <p>We never sell your data. We don't run third-party ads inside the app.</p>

      <h2>Where your data lives</h2>
      <p>
        Wrigleyville Buddies uses Supabase as our managed backend (database, auth, and file storage).
        Your data is stored on Supabase's secure infrastructure. Profile photos live in our
        encrypted storage bucket.
      </p>

      <h2>Location privacy</h2>
      <p>
        Live location is fuzzed by ~200m on the map, and we automatically exclude any
        broadcast within 100m of the home or work address you set. You can switch your
        visibility to <em>Public</em>, <em>Matches Only</em>, or <em>Hidden</em> at any time.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li><strong>Export:</strong> email us and we'll send you a copy of your data.</li>
        <li><strong>Delete:</strong> delete your account from Settings — your profile, photos, and messages are removed.</li>
        <li><strong>Correct:</strong> edit your profile any time from the Profile screen.</li>
        <li><strong>Opt out of marketing:</strong> unsubscribe from any email we send.</li>
      </ul>

      <h2>Kids</h2>
      <p>You must be 21+ to use Wrigleyville Buddies. We don't knowingly collect data from anyone under 21.</p>

      <h2>Contact</h2>
      <p>
        Privacy questions or requests? Email <a href="mailto:privacy@wrigleyvillebuddies.com">privacy@wrigleyvillebuddies.com</a>.
      </p>
    </LegalPageLayout>
  );
}
