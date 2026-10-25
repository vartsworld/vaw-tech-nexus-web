import type { LucideIcon } from "lucide-react";
import {
  Award, Megaphone, BarChart3, Briefcase, Building2, Calendar, CalendarOff, CheckSquare, Code, CreditCard, DollarSign, FolderKanban, GraduationCap,
  HandCoins, Image as ImageIcon, Inbox, LayoutDashboard, LifeBuoy, MessageCircle, MessageSquare, QrCode, Settings2, ShieldCheck, Sparkles,
  UserPlus, Users, Video, Wallet, Globe, Gift, Trophy, Gamepad2,
  TrendingUp, MailOpen, Receipt, Clapperboard, FileText, MessageSquareQuote,
} from "lucide-react";

export interface HRRoom {
  id: string;
  name: string;
  /** One-line explanation shown in the command palette and top bar */
  description: string;
  icon: LucideIcon;
  keywords?: string;
}

export interface HRSection {
  title: string;
  icon: LucideIcon;
  items: HRRoom[];
}

/**
 * The HR sidebar, grouped by the job each page does.
 * Order follows a typical HR day: check in → handle incoming leads and requests → people → work → money → site settings.
 */
export const HR_SECTIONS: HRSection[] = [
  {
    title: "Workspace",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", name: "Overview", description: "Today at a glance and what needs your attention", icon: LayoutDashboard, keywords: "home dashboard summary" },
      { id: "calendar", name: "Calendar", description: "Your monthly planner", icon: Calendar, keywords: "planner schedule" },
      { id: "chat", name: "Team Chat", description: "Message your team", icon: MessageCircle, keywords: "inbox messages" },
      { id: "meeting", name: "Meeting Room", description: "Start or join a video meeting", icon: Video, keywords: "call video" },
      { id: "emma", name: "EMMA AI", description: "Ask the AI assistant for help with HR work", icon: Sparkles, keywords: "assistant ai help" },
      { id: "arcade", name: "Arcade", description: "Take a break with chess, quizzes and quick games", icon: Gamepad2, keywords: "games play break chess snake quiz" },
    ],
  },
  {
    title: "Sales & Clients",
    icon: Briefcase,
    items: [
      { id: "pricing-requests", name: "Pricing Requests", description: "Plans and custom requests from the pricing page", icon: Inbox, keywords: "leads quotes orders requests" },
      { id: "inquiries", name: "General Inquiries", description: "Messages from the website contact forms", icon: MessageSquare, keywords: "contact leads messages" },
      { id: "clients", name: "Clients", description: "Client accounts and onboarding", icon: Briefcase, keywords: "customers accounts" },
      { id: "manage-projects", name: "Projects", description: "Client projects and their progress", icon: FolderKanban, keywords: "delivery" },
      { id: "support", name: "Support Tickets", description: "Client feedback and support requests", icon: LifeBuoy, keywords: "help desk feedback" },
      { id: "academy", name: "Academy Enquiries", description: "Course and academy enquiries", icon: Award, keywords: "courses training" },
    ],
  },
  {
    title: "People & Hiring",
    icon: Users,
    items: [
      { id: "staff", name: "Staff Directory", description: "Add, edit and manage staff accounts", icon: Users, keywords: "employees team members passcode" },
      { id: "departments", name: "Departments", description: "Departments, heads and team structure", icon: Building2, keywords: "teams org" },
      { id: "attendance", name: "Attendance", description: "Daily check-ins, late arrivals and reports", icon: HandCoins, keywords: "present late reports" },
      { id: "leave", name: "Leave Requests", description: "Approve or reject staff leave", icon: CalendarOff, keywords: "holiday vacation time off approve" },
      { id: "applications", name: "Team Applications", description: "People applying to join the team", icon: UserPlus, keywords: "hiring recruit candidates jobs" },
      { id: "interns", name: "Intern Applications", description: "Internship applications and KYC", icon: GraduationCap, keywords: "internship students" },
    ],
  },
  {
    title: "Work & Performance",
    icon: CheckSquare,
    items: [
      { id: "tasks", name: "Task Board", description: "Create and track tasks across the team", icon: CheckSquare, keywords: "assign todo kanban" },
      { id: "templates", name: "Task Templates", description: "Reusable task and checklist templates", icon: Settings2, keywords: "checklist recurring" },
      { id: "performance", name: "Performance", description: "Team and individual performance metrics", icon: BarChart3, keywords: "metrics reviews kpi" },
      { id: "points", name: "Points & Analytics", description: "Points, coins and leaderboards", icon: Trophy, keywords: "coins leaderboard" },
      { id: "rewards", name: "Rewards & Store", description: "Rewards catalogue and redemption approvals", icon: Gift, keywords: "redeem store" },
    ],
  },
  {
    title: "Finance & Pricing",
    icon: Wallet,
    items: [
      { id: "financials", name: "Financial Oversight", description: "Payments, payroll and spending", icon: DollarSign, keywords: "money payroll salary invoices" },
      { id: "pricing", name: "Pricing & Coupons", description: "Packages, add-ons, the promo offer and coupon stats", icon: CreditCard, keywords: "packages addons offer discount coupon code" },
    ],
  },
  {
    title: "Website & System",
    icon: Globe,
    items: [
      { id: "announcements", name: "Announcements", description: "Notifications to staff and banners shown across the apps", icon: Megaphone, keywords: "banner notification alert push broadcast message" },
      { id: "qr", name: "QR Manager", description: "Generate and manage QR codes", icon: QrCode, keywords: "codes" },
      { id: "api-integration", name: "API Integrations", description: "Keys and webhooks for connected services", icon: Code, keywords: "webhook keys" },
      { id: "admin", name: "Admin Console", description: "Security checks, audit logs, data exports and system health", icon: ShieldCheck, keywords: "legacy audit export csv security health logs" },
    ],
  },
  {
    title: "Marketing",
    icon: TrendingUp,
    items: [
      { id: "market-enquiries", name: "Marketing Enquiries", description: "Enquiries from the marketing website, kept separate from the main inquiries", icon: MailOpen, keywords: "marketing leads website contact enquiry market" },
      { id: "market-quotes", name: "Plan Quotes", description: "Plans and quotes visitors built on the marketing website", icon: Receipt, keywords: "marketing quote plan builder pricing calculator" },
      { id: "market-work", name: "Our Work", description: "Case studies and projects shown on the marketing website", icon: Clapperboard, keywords: "marketing portfolio case studies projects works" },
      { id: "market-blog", name: "Blog", description: "Articles published on the marketing website", icon: FileText, keywords: "marketing articles posts seo content" },
      { id: "market-testimonials", name: "Testimonials", description: "Client feedback shown on the marketing website", icon: MessageSquareQuote, keywords: "marketing reviews quotes feedback" },
    ],
  },
];

export const ALL_ROOMS: (HRRoom & { section: string })[] = HR_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })));

const ROOM_ALIASES: Record<string, string> = { banners: "announcements", notifications: "announcements", legacy: "admin" };

/** Individual games live under the Arcade page; they are not sidebar items. */
export const GAME_ROOM_IDS = ["chess", "tictactoe", "pingpong", "codetyper", "colormatch", "codepuzzle", "quickquiz", "snake", "memory"];

export const findRoom = (rawId: string) => {
  const id = ROOM_ALIASES[rawId] ?? rawId;
  return ALL_ROOMS.find((r) => r.id === id || (id === "planner" && r.id === "calendar") || (id === "home" && r.id === "dashboard") || (id === "inbox" && r.id === "chat"));
};

/** Shape expected by VirtualOfficeLayout / MobileBottomNav */
export const toSidebarLinks = () =>
  HR_SECTIONS.map((s) => ({
    title: s.title,
    icon: s.icon,
    items: s.items.map((i) => ({ id: i.id, name: i.name, icon: i.icon, path: `/hr?${i.id}` })),
  }));

