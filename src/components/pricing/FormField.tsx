import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label + control + inline error, wired for screen readers. */
const FormField = ({ id, label, required, error, hint, children, className }: FormFieldProps) => (
  <div className={className}>
    <Label htmlFor={id} className="mb-1.5 block text-sm font-medium">
      {label}
      {required ? (
        <span className="text-red-500 ml-0.5" aria-hidden="true">
          *
        </span>
      ) : (
        <span className="text-muted-foreground font-normal ml-1.5">(optional)</span>
      )}
    </Label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

export default FormField;
