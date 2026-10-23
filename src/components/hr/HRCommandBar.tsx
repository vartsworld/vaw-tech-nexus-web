import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, PanelLeftOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ALL_ROOMS, HR_SECTIONS, findRoom } from "@/components/hr/hrNavigation";

interface HRCommandBarProps {
  currentRoom: string;
  onNavigate: (room: string) => void;
  badges: Record<string, number>;
  sidebarCollapsed: boolean;
  onExpandSidebar: () => void;
}

/** Slim bar above every HR page: where you are + a search box (Ctrl/⌘ K) that jumps to any page. */
const HRCommandBar = ({ currentRoom, onNavigate, badges, sidebarCollapsed, onExpandSidebar }: HRCommandBarProps) => {
  const [open, setOpen] = useState(false);
  const room = findRoom(currentRoom);
  const section = ALL_ROOMS.find((r) => r.id === room?.id)?.section;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isMac = useMemo(() => typeof navigator !== "undefined" && /mac/i.test(navigator.platform), []);

  const go = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md sm:px-4 lg:px-6">
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 text-white/70 hover:text-white lg:inline-flex" aria-label="Expand sidebar" title="Expand sidebar" onClick={onExpandSidebar}>
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        )}
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          {section && room?.id !== "dashboard" && (
            <>
              <span className="hidden truncate text-muted-foreground sm:inline">{section}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:inline" />
            </>
          )}
          <span className="truncate font-semibold text-foreground">{room?.name ?? "Overview"}</span>
          {room?.description && <span className="ml-2 hidden truncate text-xs text-muted-foreground xl:inline">{room.description}</span>}
        </nav>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-9 gap-2 border-white/10 bg-white/5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Search pages"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Go to page…</span>
          <kbd className="ml-2 hidden rounded border border-white/15 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] sm:inline">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, e.g. leave, coupon, attendance…" />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No page matches that. Try another word.</CommandEmpty>
          {HR_SECTIONS.map((sec) => (
            <CommandGroup key={sec.title} heading={sec.title}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const n = badges[item.id] || 0;
                return (
                  <CommandItem key={item.id} value={`${item.name} ${item.description} ${item.keywords ?? ""} ${sec.title}`} onSelect={() => go(item.id)} className="gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                    </span>
                    {n > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-4 text-white">{n}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          <CommandGroup heading="Shortcuts">
            <CommandItem value="open public pricing page website" onSelect={() => { setOpen(false); window.open("/pricing", "_blank", "noopener"); }} className="gap-3">
              <ExternalLink className="h-4 w-4 text-muted-foreground" /> Open the public pricing page
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default HRCommandBar;
