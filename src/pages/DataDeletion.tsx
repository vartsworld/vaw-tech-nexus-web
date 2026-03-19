import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, ShieldCheck } from "lucide-react";

const DataDeletion = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Data Deletion Instructions"
        description="VAW Technologies Data Deletion - Learn how to request deletion of your personal data from our systems."
      />
      <Navbar />
      <MobileHeader />

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] mb-8">
          Data <span className="text-accent">Deletion</span> Instructions
        </h1>
        <p className="text-muted-foreground mb-8">
          At VAW Technologies, we respect your right to control your personal data. This page explains how you can request the deletion of your data from our systems.
        </p>

        <div className="space-y-8">
          {/* Step-by-step instructions */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Step 1</h3>
              <p className="text-sm text-muted-foreground">
                Send a data deletion request email to{" "}
                <a href="mailto:privacy@vawtech.com" className="text-accent hover:underline">
                  privacy@vawtech.com
                </a>
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Step 2</h3>
              <p className="text-sm text-muted-foreground">
                We will verify your identity and process your request within 30 business days.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Step 3</h3>
              <p className="text-sm text-muted-foreground">
                Your data will be permanently deleted and you'll receive a confirmation email.
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6 text-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">What to Include in Your Request</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Your full name and email address associated with your account</li>
                <li>Company name (if applicable)</li>
                <li>A clear statement requesting data deletion</li>
                <li>Any specific data or accounts you want deleted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">What Data Will Be Deleted</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Account profile information</li>
                <li>Contact and communication records</li>
                <li>Project-related data (upon project completion and settlement)</li>
                <li>Usage analytics linked to your identity</li>
                <li>Any files or documents you have uploaded</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data We May Retain</h2>
              <p className="text-muted-foreground mb-2">
                Certain data may be retained as required by law or legitimate business purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Financial transaction records (tax and accounting compliance)</li>
                <li>Legal correspondence and contractual obligations</li>
                <li>Anonymized/aggregated analytics data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Processing Timeline</h2>
              <p className="text-muted-foreground">
                We aim to process all deletion requests within 30 business days. You will receive an acknowledgment within 3 business days of your request. If additional time is needed, we will inform you of the reason and expected timeline.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold mb-3">Ready to submit a request?</h3>
            <p className="text-muted-foreground mb-6">
              Email us with your deletion request and we'll take care of the rest.
            </p>
            <a href="mailto:privacy@vawtech.com?subject=Data Deletion Request">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground px-8">
                <Mail className="w-4 h-4 mr-2" />
                Send Deletion Request
              </Button>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DataDeletion;
