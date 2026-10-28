import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, Image as ImageIcon, MoreHorizontal, Pencil, Play, RotateCw, Send, Trash2, Undo2, Zap, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { platformInfo } from "@/lib/postit/platforms";
import { isDue, mediaKind, STATUS_META } from "@/lib/postit/schedule";
import type { PostitAccount, PostitPost } from "@/lib/postit/types";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "./postitUi";

export interface PostActions {
  edit: (p: PostitPost) => void;
  duplicate: (p: PostitPost) => void;
  markPosted: (p: PostitPost) => void;
  retry: (p: PostitPost) => void;
  publishNow: (p: PostitPost) => void;
  toDraft: (p: PostitPost) => void;
  remove: (p: PostitPost) => void;
  copy: (p: PostitPost) => void;
}

const snippet = (p: PostitPost) => (p.title && p.platform !== "instagram" ? p.title : "") || p.caption.replace(/\s+/g, " ").trim() || (p.media_urls.length ? "(media only)" : "(empty)");

/** Compact post for calendar cells. */
export const PostChip = ({ post, showClient, onOpen, draggable }: { post: PostitPost; showClient?: string; onOpen: (p: PostitPost) => void; draggable: boolean }) => {
  const info = platformInfo(post.platform);
  const due = isDue(post);
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData("text/postit", post.id); e.dataTransfer.effectAllowed = "move"; }}
      onClick={(e) => { e.stopPropagation(); onOpen(post); }}
      title={`${info.name}${showClient ? ` · ${showClient}` : ""}: ${snippet(post)}`}
      className={cn(
        "flex w-full items-center gap-1.5 rounded border-l-2 bg-white/[0.06] px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        post.status === "draft" && "border-dashed opacity-80",
        post.status === "published" && "opacity-60",
        post.status === "failed" && "bg-red-500/15",
        due && "bg-amber-500/20",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
      style={{ borderLeftColor: info.color }}
    >
      <PlatformBadge platform={post.platform} className="h-4 min-w-4 text-[9px]" />
      {post.scheduled_at && <span className="shrink-0 font-semibold tabular-nums text-white/70">{format(new Date(post.scheduled_at), "h:mma").toLowerCase()}</span>}
      <span className="min-w-0 flex-1 truncate text-white/85">{showClient ? `${showClient}: ` : ""}{snippet(post)}</span>
      {post.status === "published" && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />}
      {post.status === "failed" && <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />}
    </button>
  );
};

export const PostMenu = ({ post, account, actions, canPublishNow }: { post: PostitPost; account: PostitAccount | null; actions: PostActions; canPublishNow: boolean }) => {
  const info = platformInfo(post.platform);
  const editable = post.status !== "published" && post.status !== "publishing";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/60 hover:text-white" aria-label="Post actions"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {editable && <DropdownMenuItem onClick={() => actions.edit(post)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => actions.duplicate(post)}><FilePlus2 className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.copy(post)}><Copy className="mr-2 h-4 w-4" /> Copy caption</DropdownMenuItem>
        {editable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={account?.profile_url || info.composeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open {info.name}</a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.markPosted(post)}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as posted</DropdownMenuItem>
            {canPublishNow && <DropdownMenuItem onClick={() => actions.publishNow(post)}><Zap className="mr-2 h-4 w-4" /> Publish now</DropdownMenuItem>}
            {post.status === "failed" && <DropdownMenuItem onClick={() => actions.retry(post)}><RotateCw className="mr-2 h-4 w-4" /> Retry</DropdownMenuItem>}
            {post.status === "scheduled" && <DropdownMenuItem onClick={() => actions.toDraft(post)}><Undo2 className="mr-2 h-4 w-4" /> Move back to draft</DropdownMenuItem>}
          </>
        )}
        {post.status === "published" && post.published_url && /^https?:\/\//.test(post.published_url) && (
          <DropdownMenuItem asChild><a href={post.published_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> View live post</a></DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => actions.remove(post)} className="text-red-400 focus:text-red-400"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Full-width row used by the list view and the mobile day agenda. */
export const PostRow = ({
  post, clientName, creator, account, actions, canPublishNow, showDate,
}: {
  post: PostitPost; clientName: string; creator?: string; account: PostitAccount | null; actions: PostActions; canPublishNow: boolean; showDate?: boolean;
}) => {
  const info = platformInfo(post.platform);
  const meta = STATUS_META[post.status];
  const due = isDue(post);
  const thumb = post.media_urls[0];
  return (
    <div className={cn("flex gap-3 rounded-xl border bg-white/[0.04] p-3 sm:p-4", due ? "border-amber-500/40" : post.status === "failed" ? "border-red-500/30" : "border-white/10")}>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/40 sm:h-16 sm:w-16">
        {thumb ? (
          mediaKind(thumb) === "video" ? <><video src={thumb} className="h-full w-full object-cover" muted preload="metadata" /><Play className="absolute inset-0 m-auto h-5 w-5 text-white/90 drop-shadow" /></> : <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/25"><ImageIcon className="h-5 w-5" /></div>
        )}
        <PlatformBadge platform={post.platform} className="absolute left-1 top-1" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-bold">{clientName}</span>
          <span className="text-xs text-white/50">{info.name}{account ? ` · ${account.account_name}` : ""}</span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", meta.tone)}>{meta.label}</span>
          {post.publish_mode === "auto" && post.status !== "published" && <span className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300"><Zap className="h-3 w-3" /> Auto</span>}
          {due && post.publish_mode === "manual" && <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300"><Clock className="h-3 w-3" /> Time to post</span>}
        </div>
        <p className="line-clamp-2 break-words text-sm text-white/80">{snippet(post)}</p>
        <p className="flex flex-wrap items-center gap-x-3 text-[11px] text-white/45">
          {post.scheduled_at ? <span>{format(new Date(post.scheduled_at), showDate ? "EEE d MMM, h:mm a" : "h:mm a")}</span> : <span>No date yet</span>}
          {post.status === "published" && post.published_at && <span>posted {format(new Date(post.published_at), "d MMM, h:mm a")}</span>}
          {creator && <span>by {creator}</span>}
        </p>
        {post.status === "failed" && post.error && <p className="text-xs text-red-300">{post.error}</p>}
        {due && post.publish_mode === "manual" && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => actions.copy(post)}><Copy className="h-3.5 w-3.5" /> Copy caption</Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" asChild><a href={account?.profile_url || info.composeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open {info.name}</a></Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => actions.markPosted(post)}><Send className="h-3.5 w-3.5" /> Mark as posted</Button>
          </div>
        )}
      </div>
      <PostMenu post={post} account={account} actions={actions} canPublishNow={canPublishNow} />
    </div>
  );
};
