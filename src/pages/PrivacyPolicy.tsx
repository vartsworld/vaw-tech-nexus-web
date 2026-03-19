import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Privacy Policy"
        description="VAW Technologies Privacy Policy - Learn how we collect, use, and protect your personal data."
      />
      <Navbar />
      <MobileHeader />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] mb-8">
          Privacy <span className="text-accent">Policy</span>
        </h1>
        <p className="text-muted-foreground mb-6">Last updated: March 11, 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We may collect the following types of information:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and billing address provided through forms or account registration.</li>
              <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, and interaction patterns collected automatically.</li>
              <li><strong>Project Data:</strong> Files, content, and materials shared with us for project delivery.</li>
              <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>To provide and improve our services</li>
              <li>To communicate with you about projects, updates, and support</li>
              <li>To process payments and manage billing</li>
              <li>To send marketing communications (with your consent)</li>
              <li>To comply with legal obligations</li>
              <li>To protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share information with trusted third-party service providers (hosting, payment processing, analytics) who assist in operating our platform, subject to confidentiality agreements. We may also disclose data when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including encryption, secure servers, and access controls to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain personal data for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Project data is retained for the duration of the client relationship and a reasonable period thereafter.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (see our <a href="/data-deletion" className="text-accent hover:underline">Data Deletion</a> page)</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent for marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under 16. We do not knowingly collect personal data from children. If we become aware of such collection, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this policy periodically. Changes will be posted on this page with a revised date. Continued use of our services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries, contact us at{" "}
              <a href="mailto:privacy@vawtech.com" className="text-accent hover:underline">
                privacy@vawtech.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
