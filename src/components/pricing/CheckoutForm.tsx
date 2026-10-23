import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from "./FormField";
import {
  TIMELINE_OPTIONS,
  buildPlanMessage,
  canSubmitNow,
  checkoutSchema,
  formatPrice,
  generateReference,
  markSubmitted,
  type CartSummary,
  type CheckoutValues,
} from "@/lib/pricing";
import { CONTACT_EMAIL, submitInquiry } from "@/lib/inquiries";

export interface SubmittedPlan {
  reference: string;
  name: string;
  email: string;
  phone: string;
  summary: CartSummary;
}

interface CheckoutFormProps {
  summary: CartSummary;
  coupon: string;
  onBack: () => void;
  onSubmitted: (result: SubmittedPlan) => void;
}

const NOTES_MAX = 1500;

const CheckoutForm = ({ summary, coupon, onBack, onSubmitted }: CheckoutFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", phone: "", company: "", domain: "", timeline: "", notes: "", coupon, consent: undefined, website: "" },
  });

  const notes = watch("notes") || "";

  const onSubmit = async (values: CheckoutValues) => {
    setSubmitError(null);
    if (values.website) return; // honeypot tripped – silently drop
    if (!canSubmitNow()) {
      setSubmitError("Your request was just sent. Please wait a few seconds before sending another.");
      return;
    }
    const reference = generateReference();
    const extra = summary.addons.length ? ` + ${summary.addons.length} add-on${summary.addons.length > 1 ? "s" : ""}` : "";
    const service = `${summary.pkg?.name ?? "Add-ons only"}${extra} - ${formatPrice(summary.subtotal)}`;
    try {
      await submitInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        service,
        message: buildPlanMessage(values, summary, reference),
      });
      markSubmitted();
      onSubmitted({ reference, name: values.name, email: values.email, phone: values.phone, summary });
    } catch (err) {
      console.error("Plan request failed:", err);
      setSubmitError(`We couldn't send your request. Please try again, or email us at ${CONTACT_EMAIL}.`);
    }
  };

  const err = (key: keyof CheckoutValues) => errors[key]?.message as string | undefined;
  const invalid = (key: keyof CheckoutValues) => (errors[key] ? true : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-border bg-card p-5 sm:p-7 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us who you are and anything we should know. We'll reply with a confirmed scope and price.</p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="co-name" label="Full name" required error={err("name")}>
          <Input id="co-name" autoComplete="name" placeholder="Your name" aria-invalid={invalid("name")} aria-describedby={errors.name ? "co-name-error" : undefined} {...register("name")} />
        </FormField>
        <FormField id="co-email" label="Email" required error={err("email")}>
          <Input id="co-email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" aria-invalid={invalid("email")} aria-describedby={errors.email ? "co-email-error" : undefined} {...register("email")} />
        </FormField>
        <FormField id="co-phone" label="Phone / WhatsApp" required error={err("phone")}>
          <Input id="co-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" aria-invalid={invalid("phone")} aria-describedby={errors.phone ? "co-phone-error" : undefined} {...register("phone")} />
        </FormField>
        <FormField id="co-company" label="Company or business" error={err("company")}>
          <Input id="co-company" autoComplete="organization" placeholder="Business name" {...register("company")} />
        </FormField>
        <FormField id="co-domain" label="Preferred domain name" error={err("domain")} hint="If you already have one in mind, e.g. yourbrand.com">
          <Input id="co-domain" autoCapitalize="none" autoCorrect="off" placeholder="yourbrand.com" {...register("domain")} />
        </FormField>
        <FormField id="co-timeline" label="When do you need it?" required error={err("timeline")}>
          <Controller
            control={control}
            name="timeline"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="co-timeline" aria-invalid={invalid("timeline")} aria-describedby={errors.timeline ? "co-timeline-error" : undefined}>
                  <SelectValue placeholder="Choose a timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField
        id="co-notes"
        label="Project notes"
        error={err("notes")}
        hint={
          <span className="flex justify-between gap-2">
            <span>Goals, pages or features, references you like.</span>
            <span className={notes.length > NOTES_MAX * 0.9 ? "text-amber-600 font-semibold" : ""}>
              {notes.length}/{NOTES_MAX}
            </span>
          </span>
        }
      >
        <Textarea id="co-notes" rows={4} maxLength={NOTES_MAX} placeholder="Tell us a little about your project" {...register("notes")} />
      </FormField>

      <FormField id="co-coupon" label="Coupon code" error={err("coupon")} hint="Our team verifies the code and applies it to your final quote.">
        <Input id="co-coupon" className="sm:max-w-xs uppercase" autoCapitalize="characters" {...register("coupon")} />
      </FormField>

      {/* Honeypot – hidden from people, attractive to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="co-website">Leave this field empty</label>
        <input id="co-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="co-consent"
                className="mt-0.5"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                aria-invalid={invalid("consent")}
              />
            )}
          />
          <label htmlFor="co-consent" className="text-sm text-muted-foreground leading-relaxed">
            I agree that VAW Technologies may contact me about this request. See our{" "}
            <a href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
            .
          </label>
        </div>
        {errors.consent && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            {err("consent")}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back to plan
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="font-semibold sm:min-w-[200px]">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send request"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CheckoutForm;
