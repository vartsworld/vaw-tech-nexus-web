import type { ReactNode } from "react";
import { AlertCircle, Database, ImageIcon, Play, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { platformInfo } from "@/lib/postit/platforms";
import { fullText, mediaKind, textLength } from "@/lib/postit/schedule";
import type { PlatformKey } from "@/lib/postit/types";
import { cn } from "@/lib/utils";

export const PlatformBadge = ({ platform, className, title }: { platform: PlatformKey; className?: string; title?: string }) => {
  const info = platformInfo(platform);
  return (
    <span
      title={title ?? info.name}
      aria-label={info.name}
      className={cn("inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1 text-[10px] font-black leading-none", className)}
      style={{ backgroundColor: `${info.color}2e`, color: info.color, boxShadow: `inset 0 0 0 1px ${info.color}55` }}
    >
      {info.mark}
    </span>
  );
};

export const StatTile = ({ label, value, hint, tone, onClick }: { label: string; value: string | number; hint?: string; tone?: string; onClick?: () => void }) => {
  const body = (
    <CardContent className="space-y-0.5 p-3 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 sm:text-[11px]">{label}</p>
      <p className={cn("text-xl font-black tabular-nums sm:text-2xl", tone)}>{value}</p>
      {hint && <p className="truncate text-[11px] text-white/45">{hint}</p>}
    </CardContent>
  );
  return (
    <Card className={cn("border-white/10 bg-white/[0.04]", onClick && "transition-colors hover:border-white/25")}>
      {onClick ? <button type="button" onClick={onClick} className="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{body}</button> : body}
    </Card>
  );
};

export const SetupNotice = () => (
  <Card className="border-amber-500/30 bg-amber-500/5">
    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
      <Database className="h-8 w-8 text-amber-400" />
      <p className="text-base font-bold">The Post Scheduler database isn't set up yet</p>
      <p className="max-w-md text-sm text-white/60">
        Run <span className="font-mono text-white">supabase/migrations/20261026000000_post_scheduler.sql</span> in the Supabase SQL editor, then reload this page.
      </p>
    </CardContent>
  </Card>
);

export const ErrorCard = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Card className="border-red-500/30 bg-red-500/5">
    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="h-7 w-7 text-red-400" />
      <p className="text-sm text-white/80">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>
    </CardContent>
  </Card>
);

export const EmptyState = ({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) => (
  <Card className="border-dashed border-white/15 bg-transparent">
    <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
      <Icon className="h-8 w-8 text-white/30" />
      <p className="font-bold">{title}</p>
      <p className="max-w-sm text-sm text-white/55">{body}</p>
      {action}
    </CardContent>
  </Card>
);

export const SkeletonRows = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-2" aria-busy="true">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />)}</div>
);

/** A simple "what will it look like" card. It's an approximation, not each network's exact layout. */
export const PostPreview = ({
  platform, accountName, handle, title, caption, hashtags, media, link,
}: {
  platform: PlatformKey; accountName: string; handle?: string | null; title?: string; caption: string; hashtags: string[]; media: string[]; link?: string | null;
}) => {
  const info = platformInfo(platform);
  const len = textLength(caption, hashtags);
  const over = len > info.charLimit;
  const first = media[0];
  const text = fullText(caption, hashtags);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center gap-2.5 border-b border-white/10 p-3">
        <PlatformBadge platform={platform} className="h-8 min-w-8 text-xs" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">{accountName || `${info.name} account`}</p>
          <p className="truncate text-[11px] text-white/45">{handle || info.name} · now</p>
        </div>
      </div>
      {first && (
        <div className="relative aspect-video bg-black/50">
          {mediaKind(first) === "video" ? (
            <>
              <video src={first} className="h-full w-full object-contain" muted playsInline preload="metadata" />
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold"><Play className="h-3 w-3" /> Video</span>
            </>
          ) : (
            <img src={first} alt="" className="h-full w-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
          )}
          {media.length > 1 && <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">1/{media.length}</span>}
        </div>
      )}
      {!first && info.mediaRequired && (
        <div className="flex aspect-video items-center justify-center gap-2 bg-white/[0.03] text-xs text-white/40"><ImageIcon className="h-4 w-4" /> No media yet</div>
      )}
      <div className="space-y-2 p-3">
        {info.hasTitle && title && <p className="text-sm font-bold">{title}</p>}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/85">{text || <span className="text-white/35">Your caption will appear here.</span>}</p>
        {link && info.hasLink && <p className="truncate text-xs text-sky-300">{link}</p>}
        <p className={cn("text-right text-[11px] tabular-nums", over ? "font-bold text-red-400" : "text-white/40")}>{len.toLocaleString()} / {info.charLimit.toLocaleString()}</p>
      </div>
    </div>
  );
};
