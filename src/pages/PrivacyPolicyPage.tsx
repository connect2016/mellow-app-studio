import { LegalPageLayout } from '@/components/layout/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      updated="August 10, 2026"
      seoTitle="Privacy Policy | Wrigleyville Buddies"
      seoDescription="How Wrigleyville Buddies collects, uses, and protects your information."
    >
      <p>
        Wrigleyville Buddies LLC ("Wrigleyville Buddies," "we," "us," or "our") operates the
        Wrigleyville Buddies mobile application and website at wrigleyvillebuddies.com (together,
        the "Service"). This Privacy Policy explains what information we collect, how we use it,
        who we share it with, and the choices you have.
      </p>
      <p>
        By using the Service, you agree to the collection and use of information as described in
        this policy.
      </p>

      <h2>Who we are</h2>
      <p>
        The Service is a hyperlocal social platform for Chicago Cubs fans in the Wrigleyville
        neighborhood. It lets fans discover one another, signal game-day plans, arrange meetups,
        view a neighborhood bar map, and message other fans.
      </p>
      <p>
        If you have questions about this policy or your data, contact us at{' '}
        <strong>connect@wrigleyvillebuddies.com</strong>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account information.</strong> When you create an account, we collect your email address and name. You can sign up with Google (via Google Sign-In) or with an email address and password. If you use Google Sign-In, Google shares your basic profile information (name and email) with us; we do not receive your Google password.</li>
        <li><strong>Profile information.</strong> Information you choose to add to your fan profile, such as your fan tier, an optional Instagram handle, and other details you enter on your profile.</li>
        <li><strong>Location information.</strong> With your permission, the Service uses your device location to place you on the fan map, show nearby fans, and display crowd-energy activity around the neighborhood. You can control location access through your device settings. If you deny location access, some map features may not work.</li>
        <li><strong>Content you create.</strong> Status notes, meetup posts, buddy requests, and other content you submit through the Service. Status notes are short and expire automatically after a few hours.</li>
        <li><strong>Messages.</strong> Messages you send to other users through the Service's messaging feature.</li>
        <li><strong>Usage and activity data.</strong> Information about how you use the Service, including gamification data such as points and activity, and standard technical information (such as device type and general log data) generated when you interact with the Service.</li>
      </ul>

      <h2>How we use your information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account and authenticate you</li>
        <li>Provide core features: fan discovery, the fan map, meetups, messaging, and gamification</li>
        <li>Show you relevant nearby fans and neighborhood activity based on location</li>
        <li>Send you account-related emails, such as sign-up confirmation and password resets</li>
        <li>Maintain the security and integrity of the Service and prevent abuse</li>
        <li>Respond to your requests and provide support</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising.</p>

      <h2>How your information is shared</h2>
      <p>
        <strong>With other users.</strong> By design, certain information is visible to other
        users of the Service — for example, your profile details, your position on the fan map,
        status notes, and messages you send to other fans. Do not share anything you consider
        private in these features.
      </p>
      <p>
        <strong>With service providers.</strong> We use trusted third-party providers to operate
        the Service. They process data only on our behalf and under agreements that require them
        to protect it:
      </p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication, and storage of your account and content data</li>
        <li><strong>Vercel</strong> — application hosting and delivery</li>
        <li><strong>Resend</strong> — sending transactional emails (such as confirmations and password resets)</li>
        <li><strong>Google</strong> — Google Sign-In authentication, if you choose to sign in with Google</li>
      </ul>
      <p>
        We do not currently process payments. If we enable payments in the future (for example,
        tipping features), we will update this policy and use a payment processor such as Stripe;
        we would not store your full payment card details ourselves.
      </p>
      <p>
        <strong>For legal reasons.</strong> We may disclose information if required by law, or to
        protect the rights, safety, or property of Wrigleyville Buddies, our users, or others.
      </p>
      <p>
        <strong>In a business transfer.</strong> If we are involved in a merger, acquisition, or
        sale of assets, your information may be transferred as part of that transaction. We will
        notify you of any change in ownership or use of your personal information.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your personal information for as long as your account is active or as needed to
        provide the Service. Some content, such as status notes, expires automatically. When you
        delete your account, we delete or de-identify your personal information within a
        reasonable period, except where we are required to retain it for legal or security
        reasons.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li><strong>Access and update.</strong> You can view and update your profile information within the app.</li>
        <li><strong>Location.</strong> You can turn location access on or off at any time in your device settings.</li>
        <li><strong>Account deletion.</strong> You can request deletion of your account and associated personal data by contacting us at connect@wrigleyvillebuddies.com. We will also honor deletion requests submitted through any in-app account-deletion feature.</li>
        <li><strong>Email.</strong> Transactional emails (like password resets) are necessary to operate your account. If we add promotional emails in the future, you will be able to opt out.</li>
      </ul>
      <p>
        Depending on where you live, you may have additional rights over your personal
        information (such as the right to access, correct, or delete it). To exercise any of
        these rights, contact us at connect@wrigleyvillebuddies.com.
      </p>

      <h2>Age requirement</h2>
      <p>
        The Service is intended only for adults aged 21 and older. It is not directed to minors,
        and we do not knowingly collect personal information from anyone under 21. If you believe
        someone under 21 has provided us with personal information, contact us and we will delete
        it.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable technical and organizational measures, including encryption in transit
        and access controls, to protect your information. No method of transmission or storage is
        completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the "Last
        updated" date above and, where appropriate, notify you within the Service. Your continued
        use of the Service after changes take effect means you accept the updated policy.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have any questions or requests regarding this Privacy Policy or your personal
        information, contact us at:
      </p>
      <p>
        <strong>Wrigleyville Buddies LLC</strong>
        <br />
        Email: <a href="mailto:connect@wrigleyvillebuddies.com">connect@wrigleyvillebuddies.com</a>
        <br />
        Website: <a href="https://wrigleyvillebuddies.com" target="_blank" rel="noopener noreferrer">wrigleyvillebuddies.com</a>
      </p>
    </LegalPageLayout>
  );
}
