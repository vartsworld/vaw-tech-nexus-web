import { CheckCircle2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartSummaryPanel from "./CartSummaryPanel";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from "@/lib/inquiries";
import type { SubmittedPlan } from "./CheckoutForm";

interface RequestSentProps {
  result: SubmittedPlan;
  onStartOver: () => void;
}

const RequestSent = ({ result, onStartOver }: RequestSentProps) => (
  <div className="mx-auto max-w-3xl space-y-6" role="status">
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-8 text-center text-white">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-foreground">Request received, thank you {result.name.split(" ")[0]}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We'll review your plan and get in touch on <span className="font-medium text-foreground">{result.email}</span> or{" "}
        <span className="font-medium text-foreground">{result.phone}</span>.
      </p>
      <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Your reference</p>
      <p className="mt-1 inline-block rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-sm font-semibold text-foreground">
        {result.reference}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild variant="outline">
          <a href={CONTACT_PHONE_HREF}>
            <Phone className="h-4 w-4" /> {CONTACT_PHONE}
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Plan request ${result.reference}`)}`}>
            <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
          </a>
        </Button>
      </div>
    </div>

    <div className="rounded-2xl border border-white/10 bg-[#111116] p-5">
      <CartSummaryPanel summary={result.summary} />
    </div>

    <div className="text-center">
      <Button type="button" variant="ghost" onClick={onStartOver}>
        Start a new plan
      </Button>
    </div>
  </div>
);

export default RequestSent;
