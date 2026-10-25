import type { ReactNode } from "react";
import { AlertCircle, Database, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) => (
  <Card className="border-white/10 bg-card/70">
    <CardContent className="space-y-1 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-black tracking-tight tabular-nums", tone)}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

/** Shown instead of the page when the market_* migration hasn't been applied to this Supabase project. */
export const SetupNotice = () => (
  <Card className="border-amber-500/30 bg-amber-500/5">
    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
      <Database className="h-9 w-9 text-amber-400" />
      <p className="font-semibold">The marketing website tables aren't set up yet</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Run <span className="font-mono text-foreground">supabase/migrations/20261025000000_marketing_site_market_tables.sql</span> in the Supabase SQL editor, then reload this page.
      </p>
    </CardContent>
  </Card>
);

export const ErrorCard = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card className="border-destructive/40 bg-destructive/10">
    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
    </CardContent>
  </Card>
);

export const EmptyState = ({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) => (
  <Card className="border-dashed border-white/15 bg-transparent">
    <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action}
    </CardContent>
  </Card>
);

export const ListSkeleton = ({ rows = 3, height = "h-32" }: { rows?: number; height?: string }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className={cn(height, "rounded-xl")} />
    ))}
  </div>
);

export const ConfirmDelete = ({
  open, title, description, onCancel, onConfirm, confirmLabel = "Delete",
}: { open: boolean; title: string; description: string; onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const waLink = (phone: string | null | undefined, text?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

export const downloadCsv = (filename: string, head: string[], lines: string[][]) => {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([`\uFEFF${[head, ...lines].map((r) => r.map(esc).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
