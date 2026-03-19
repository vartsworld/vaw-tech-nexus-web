import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Terms of Service"
        description="VAW Technologies Terms of Service - Read our terms and conditions for using our services and website."
      />
      <Navbar />
      <MobileHeader />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] mb-8">
          Terms of <span className="text-accent">Service</span>
        </h1>
        <p className="text-muted-foreground mb-6">Last updated: March 11, 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the services provided by VAW Technologies (a subsidiary of V Arts World Pvt. Ltd.), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Services</h2>
            <p className="text-muted-foreground">
              VAW Technologies provides digital solutions including but not limited to website development, web application development, AI solutions, VR/AR development, digital marketing, and digital design services. The scope, deliverables, and timelines for each project will be defined in individual project agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground">
              Certain features of our platform require account registration. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, designs, code, and materials created by VAW Technologies remain our intellectual property until full payment is received and ownership is explicitly transferred as per the project agreement. You may not reproduce, distribute, or create derivative works without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
            <p className="text-muted-foreground">
              Payment terms are outlined in individual project agreements. Late payments may result in service suspension. All fees are non-refundable unless otherwise stated in the project agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              VAW Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount paid by you for the specific service in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
            <p className="text-muted-foreground">
              Either party may terminate the service agreement with written notice as specified in the project agreement. Upon termination, you must pay for all services rendered up to the termination date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kerala, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of our services constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground">
              For questions regarding these terms, contact us at{" "}
              <a href="mailto:contact@vawtech.com" className="text-accent hover:underline">
                contact@vawtech.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
