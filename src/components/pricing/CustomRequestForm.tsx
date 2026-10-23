import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from "./FormField";
import {
  BUDGET_OPTIONS,
  REQUEST_TYPES,
  TIMELINE_OPTIONS,
  buildCustomMessage,
  canSubmitNow,
  customRequestSchema,
  generateReference,
  markSubmitted,
  type CartSummary,
  type CustomRequestValues,
} from "@/lib/pricing";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, submitInquiry } from "@/lib/inquiries";

interface CustomRequestFormProps {
  /** Current cart, offered as optional context */
  summary: CartSummary;
}

const DETAILS_MAX = 2000;

const CustomRequestForm = ({ summary }: CustomRequestFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomRequestValues>({
    resolver: zodResolver(customRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      requestType: "",
      budget: "",
      timeline: "",
      details: "",
      includeCart: summary.itemCount > 0,
      consent: undefined,
      website: "",
    },
  });

  const details = watch("details") || "";

  const onSubmit = async (values: CustomRequestValues) => {
    setSubmitError(null);
    if (values.website) return;
    if (!canSubmitNow()) {
      setSubmitError("Your request was just sent. Please wait a few seconds before sending another.");
      return;
    }
    const ref = generateReference();
    try {
      await submitInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone,
        service: `Custom Request - ${values.requestType}`,
        message: buildCustomMessage(values, values.includeCart ? summary : null, ref),
      });
      markSubmitted();
      setReference(ref);
    } catch (err) {
      console.error("Custom request failed:", err);
      setSubmitError(`We couldn't send your request. Please try again, or email us at ${CONTACT_EMAIL}.`);
    }
  };

  const err = (key: keyof CustomRequestValues) => errors[key]?.message as string | undefined;
  const invalid = (key: keyof CustomRequestValues) => (errors[key] ? true : undefined);

  if (reference) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Request received</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks, we've got the details. Quote this reference if you contact us:
        </p>
        <p className="mt-3 inline-block rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-sm font-semibold text-foreground">{reference}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <a href={CONTACT_PHONE_HREF}>
              <Phone className="h-4 w-4" /> {CONTACT_PHONE}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
            </a>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-4"
          onClick={() => {
            reset();
            setReference(null);
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-xl border border-border bg-card p-5 sm:p-7 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tell us what you need</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Don't see the right package? Describe your project and we'll prepare a tailored proposal.
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="cr-name" label="Full name" required error={err("name")}>
          <Input id="cr-name" autoComplete="name" aria-invalid={invalid("name")} aria-describedby={errors.name ? "cr-name-error" : undefined} {...register("name")} />
        </FormField>
        <FormField id="cr-email" label="Email" required error={err("email")}>
          <Input id="cr-email" type="email" autoComplete="email" inputMode="email" aria-invalid={invalid("email")} aria-describedby={errors.email ? "cr-email-error" : undefined} {...register("email")} />
        </FormField>
        <FormField id="cr-phone" label="Phone / WhatsApp" required error={err("phone")}>
          <Input id="cr-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" aria-invalid={invalid("phone")} aria-describedby={errors.phone ? "cr-phone-error" : undefined} {...register("phone")} />
        </FormField>
        <FormField id="cr-company" label="Company or business" error={err("company")}>
          <Input id="cr-company" autoComplete="organization" {...register("company")} />
        </FormField>

        <FormField id="cr-type" label="What do you need?" required error={err("requestType")}>
          <Controller
            control={control}
            name="requestType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cr-type" aria-invalid={invalid("requestType")} aria-describedby={errors.requestType ? "cr-type-error" : undefined}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField id="cr-budget" label="Budget range" required error={err("budget")}>
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cr-budget" aria-invalid={invalid("budget")} aria-describedby={errors.budget ? "cr-budget-error" : undefined}>
                  <SelectValue placeholder="Choose a range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField id="cr-timeline" label="When do you need it?" required error={err("timeline")} className="sm:col-span-2">
          <Controller
            control={control}
            name="timeline"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cr-timeline" aria-invalid={invalid("timeline")} aria-describedby={errors.timeline ? "cr-timeline-error" : undefined}>
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
        id="cr-details"
        label="Describe your request"
        required
        error={err("details")}
        hint={
          <span className="flex justify-between gap-2">
            <span>What are you building, for whom, and what does success look like?</span>
            <span className={details.length > DETAILS_MAX * 0.9 ? "text-amber-600 font-semibold" : ""}>
              {details.length}/{DETAILS_MAX}
            </span>
          </span>
        }
      >
        <Textarea id="cr-details" rows={6} maxLength={DETAILS_MAX} aria-invalid={invalid("details")} aria-describedby={errors.details ? "cr-details-error" : undefined} {...register("details")} />
      </FormField>

      {summary.itemCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <Controller
            control={control}
            name="includeCart"
            render={({ field }) => (
              <Checkbox id="cr-cart" className="mt-0.5" checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
            )}
          />
          <label htmlFor="cr-cart" className="text-sm text-muted-foreground leading-relaxed">
            Include the {summary.itemCount} item{summary.itemCount > 1 ? "s" : ""} I already selected
            {summary.pkg ? ` (${summary.pkg.name}${summary.addons.length ? ` + ${summary.addons.length} add-on${summary.addons.length > 1 ? "s" : ""}` : ""})` : ""} as a starting point.
          </label>
        </div>
      )}

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cr-website">Leave this field empty</label>
        <input id="cr-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="cr-consent"
                className="mt-0.5"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true ? true : undefined)}
                aria-invalid={invalid("consent")}
              />
            )}
          />
          <label htmlFor="cr-consent" className="text-sm text-muted-foreground leading-relaxed">
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

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full font-semibold sm:w-auto sm:min-w-[220px]">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send custom request"
        )}
      </Button>
    </form>
  );
};

export default CustomRequestForm;
