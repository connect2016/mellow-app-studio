import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      updated="May 2026"
      seoTitle="Terms of Service | Cubbies Buddies"
      seoDescription="The rules of the bleachers — how to use Cubbies Buddies."
    >
      <p>
        Welcome to Cubbies Buddies. By using the app you agree to these terms. Keep it
        friendly, keep it real, and we'll all have a great season.
      </p>

      <h2>Acceptance of terms</h2>
      <p>
        By creating an account or using Cubbies Buddies, you agree to these Terms of Service
        and our Privacy Policy. If you don't agree, please don't use the app.
      </p>

      <h2>Who can use the app</h2>
      <ul>
        <li>You must be at least <strong>18 years old</strong> to use Cubbies Buddies.</li>
        <li>You must be at least <strong>21 years old</strong> to use beer-purchase features (Send a Round, Buy a Beer, Beer Money tips).</li>
        <li>You're a real Cubs fan creating one real profile — no bots, no impersonation, no fake accounts.</li>
        <li>You're responsible for what happens on your account; keep your login safe.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Don't be that fan. Specifically, you agree NOT to:</p>
      <ul>
        <li>Harass, threaten, dox, or stalk anyone — on the app or off.</li>
        <li>Post hateful, sexually explicit, illegal, or violent content.</li>
        <li>Spam, scrape, or use the app for commercial promotion without our okay.</li>
        <li>Lie about who you are or use someone else's photos.</li>
        <li>Attempt to break, reverse-engineer, or disrupt the service.</li>
      </ul>
      <p>
        We can suspend or remove accounts that break these rules. Three-strike reporting
        and shadow-bans are enforced automatically.
      </p>

      <h2>Your content</h2>
      <p>
        You own the photos and content you post. By uploading them you give us a limited
        license to display them inside the app so other fans can see them. You can delete
        your content any time.
      </p>

      <h2>Beer purchase terms</h2>
      <p>
        Some features let you buy a beer or send Beer Money to another fan. By using these features
        you confirm you're 21 or older and agree to the following:
      </p>
      <ul>
        <li>All beer purchases and Beer Money tips are <strong>final once delivered</strong> — no refunds after the recipient has received or claimed the beer.</li>
        <li>You have a <strong>24-hour dispute window</strong> from the time of purchase to report a problem (wrong recipient, non-delivery, technical error). Email <a href="mailto:legal@cubbiesbuddies.com">legal@cubbiesbuddies.com</a> within 24 hours.</li>
        <li>Disputes opened after the 24-hour window will not be eligible for refund.</li>
        <li>Cubbies Buddies is not responsible for the consumption choices of any recipient.</li>
      </ul>

      <h2>Meetups happen in the real world</h2>
      <p>
        We help you find fans, but anything that happens off the app — meetups, bar runs,
        rideshares — is between you and the people you meet. Use common sense, share
        your plans with a friend, and use the in-app Meetup Safety Timer.
      </p>

      <h2>The app is provided "as is"</h2>
      <p>
        We work hard to keep Cubbies Buddies fun and reliable, but we can't guarantee it
        will always be available, error-free, or that any match leads to lifelong friendship.
        To the maximum extent allowed by law, Cubbies Buddies is not liable for indirect,
        incidental, or consequential damages arising from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the app grows. If we make a material change, we'll
        let you know in the app. Continued use after an update means you accept the new terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Illinois, USA. Any disputes
        will be handled in the state or federal courts located in Cook County, Illinois.
      </p>

      <h2>Not affiliated with the Cubs</h2>
      <p>
        Cubbies Buddies is an independent fan-made app. It is not affiliated with, endorsed,
        or sponsored by the Chicago Cubs or Major League Baseball.
      </p>

      <h2>Contact</h2>
      <p>
        Legal questions, beer-purchase disputes, or terms inquiries:
        <a href="mailto:legal@cubbiesbuddies.com"> legal@cubbiesbuddies.com</a>.
      </p>
      <p>
        General questions: <a href="mailto:hello@cubbiesbuddies.com">hello@cubbiesbuddies.com</a>.
      </p>
    </LegalPageLayout>
  );
}
