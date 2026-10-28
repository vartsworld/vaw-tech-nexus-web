import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { bind } from "cuelume";

import Index from "./pages/Index";
const ServiceRequest = lazy(() => import("./pages/ServiceRequest"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const HRDashboard = lazy(() => import("./pages/HRDashboard"));
const Internship = lazy(() => import("./pages/Internship"));
const InternshipRegistration = lazy(() => import("./pages/InternshipRegistration"));
const InternExperience = lazy(() => import("./pages/InternExperience"));
const TeamApplication = lazy(() => import("./pages/TeamApplication"));
const TrackApplication = lazy(() => import("./pages/TrackApplication"));
const ReKYCPage = lazy(() => import("./pages/ReKYCPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const DigitalMarketing = lazy(() => import("./pages/DigitalMarketing"));
const WebAppDevelopment = lazy(() => import("./pages/WebAppDevelopment"));
const WebsiteDevelopment = lazy(() => import("./pages/WebsiteDevelopment"));
const AISolutions = lazy(() => import("./pages/AISolutions"));
const VRARDevelopment = lazy(() => import("./pages/VRARDevelopment"));
const DigitalDesign = lazy(() => import("./pages/DigitalDesign"));
const About = lazy(() => import("./pages/About"));
const Career = lazy(() => import("./pages/Career"));
const Contact = lazy(() => import("./pages/Contact"));
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./providers/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import ScrollToTop from "./components/ScrollToTop";
import { useUser } from "./context/UserContext";
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const StaffTaskDetail = lazy(() => import("./pages/StaffTaskDetail"));
const StaffWork = lazy(() => import("./pages/StaffWork"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const TeamHeadDashboard = lazy(() => import("./pages/TeamHeadDashboard"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const VAWCups = lazy(() => import("./pages/VAWCups"));
const VAWVendor = lazy(() => import("./pages/VAWVendor"));
const VAWSponsor = lazy(() => import("./pages/VAWSponsor"));
const VAWAdmin = lazy(() => import("./pages/VAWAdmin"));
const MyCoins = lazy(() => import("./pages/MyCoins"));
const ProjectMonitor = lazy(() => import("./pages/ProjectMonitor"));
const Install = lazy(() => import("./pages/Install"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const DigitalMarketingInternship = lazy(() => import("./pages/DigitalMarketingInternship"));
const ClientOnboarding = lazy(() => import("./pages/ClientOnboarding"));
const StaffIDCard = lazy(() => import("./pages/StaffIDCard"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const LMSBuilder = lazy(() => import("./pages/LMSBuilder"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const ReferralFormPage = lazy(() => import("./pages/ReferralFormPage"));
const Team = lazy(() => import("./pages/Team"));
const QRRedirection = lazy(() => import("./pages/QRRedirection"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const SalesAgenda = lazy(() => import("./components/sales/SalesAgenda"));
const SalesPricing = lazy(() => import("./components/sales/SalesPricing"));
const SalesPlans = lazy(() => import("./components/sales/SalesPlans"));
const SalesOnboarding = lazy(() => import("./components/sales/SalesOnboarding"));
const MonthlyPlannerPage = lazy(() => import("./pages/MonthlyPlannerPage"));
const PostScheduler = lazy(() => import("./pages/PostScheduler"));
const AddClient = lazy(() => import("./pages/AddClient"));
const Portal = lazy(() => import("./pages/Portal"));
const ClientFeedback = lazy(() => import("./pages/ClientFeedback"));
const GPSProposal = lazy(() => import("./pages/GPSProposal"));
const GPSAIProposal = lazy(() => import("./pages/GPSAIProposal"));
const FintechProposal = lazy(() => import("./pages/FintechProposal"));
const FintechProposal2 = lazy(() => import("./pages/FintechProposal2"));
const VAWAcademy = lazy(() => import("./pages/VAWAcademy"));
const ToolsNexus = lazy(() => import("./pages/ToolsNexus"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const LeavePage = lazy(() => import("./pages/LeavePage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const ChannelsPage = lazy(() => import("./pages/ChannelsPage"));
const SketchItMakeIt = lazy(() => import("./pages/SketchItMakeIt"));



const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading page">
    <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchInterval: 30 * 1000, // 30 seconds - background refetch interval
      retry: 2, // Retry failed queries twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

const ManifestSwitcher = () => {
  const location = useLocation();

  useEffect(() => {
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }
    if (location.pathname.startsWith('/client')) {
      manifestLink.setAttribute('href', '/client-manifest.json');
    } else if (
      location.pathname.startsWith('/staff') ||
      location.pathname.startsWith('/team-head')
    ) {
      manifestLink.setAttribute('href', '/staff-manifest.json');
    } else {
      manifestLink.setAttribute('href', '/manifest.json');
    }
  }, [location.pathname]);

  return null;
};

const AppContent = () => {
  useEffect(() => {
    bind();
  }, []);

  return (

    <>
      <BrowserRouter>
        <ScrollToTop />
        <ManifestSwitcher />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Career />} />
          <Route path="/career" element={<Career />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/service-request" element={<ServiceRequest />} />
          <Route path="/internship" element={<Internship />} />
          <Route path="/internship/registration" element={<InternshipRegistration />} />
          <Route path="/intern-experience" element={<InternExperience />} />
          <Route path="/team-application" element={<TeamApplication />} />
          <Route path="/track-application" element={<TrackApplication />} />
          <Route path="/track" element={<TrackApplication />} />
          <Route path="/re-kyc" element={<ReKYCPage />} />
          <Route path="/re-kyc/:id" element={<ReKYCPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/digital-marketing" element={<DigitalMarketing />} />
          <Route path="/website-development" element={<WebsiteDevelopment />} />
          <Route path="/webapp-development" element={<WebAppDevelopment />} />
          <Route path="/ai-solutions" element={<AISolutions />} />
          <Route path="/vr-ar-development" element={<VRARDevelopment />} />
          <Route path="/digital-design" element={<DigitalDesign />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/super-admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/hr/legacy/*" element={<Navigate to="/hr?admin" replace />} />
          <Route path="/hr/*" element={<HRDashboard />} />
          <Route path="/staff/profile" element={<Navigate to="/account" replace />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/:room" element={<StaffDashboard />} />
          <Route path="/staff/tools-nexus" element={<ToolsNexus />} />
          <Route path="/staff/task/:taskId" element={<StaffTaskDetail />} />
          <Route path="/staff/work" element={<StaffWork />} />
          <Route path="/staff/inbox" element={<InboxPage />} />
          <Route path="/staff/notes" element={<NotesPage />} />
          <Route path="/staff/onboarding" element={<OnboardingPage />} />
          <Route path="/staff/leave" element={<LeavePage />} />
          <Route path="/staff/activity" element={<ActivityPage />} />
          <Route path="/staff/docs" element={<Navigate to="/staff" replace />} />
          <Route path="/staff/operations" element={<Navigate to="/staff" replace />} />
          <Route path="/staff/channels" element={<ChannelsPage />} />
          <Route path="/team-head" element={<TeamHeadDashboard />} />
          <Route path="/team-head/:room" element={<TeamHeadDashboard />} />
          <Route path="/mycoins" element={<MyCoins />} />
          <Route path="/account" element={<AccountDashboard />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/client-portal/:uniqueId" element={<ClientPortal />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/client/dashboard/*" element={<ClientDashboard />} />
          <Route path="/super-admin/dashboard/*" element={<SuperAdminDashboard />} />
          <Route path="/vaw-cups" element={<VAWCups />} />
          <Route path="/vaw-cups/vendor" element={<VAWVendor />} />
          <Route path="/vaw-cups/sponsor" element={<VAWSponsor />} />
          <Route path="/vaw-cups/admin" element={<VAWAdmin />} />
          <Route path="/project-monitor" element={<ProjectMonitor />} />
          <Route path="/install" element={<Install />} />
          <Route path="/digital-marketing-internship" element={<DigitalMarketingInternship />} />
          <Route path="/onboard/:token" element={<ClientOnboarding />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/lms" element={<LMSBuilder />} />
          <Route path="/referral-program" element={<ReferralProgram />} />
          <Route path="/refer/:code" element={<ReferralFormPage />} />
          <Route path="/proposal/gps" element={<GPSProposal />} />
          <Route path="/proposal/gps-ai" element={<GPSAIProposal />} />
          <Route path="/proposal/fintech" element={<FintechProposal />} />
          <Route path="/proposal/fintech2" element={<FintechProposal2 />} />
          <Route path="/fintech-proposal" element={<FintechProposal />} />
          <Route path="/gps-ai" element={<GPSAIProposal />} />
          <Route path="/academy" element={<VAWAcademy />} />
          <Route path="/vaw-academy" element={<VAWAcademy />} />
          <Route path="/:id" element={<StaffIDCard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/qr" element={<QRRedirection />} />
          <Route path="/sales/dashboard" element={<SalesDashboard />}>
            <Route path="agenda" element={<SalesAgenda />} />
            <Route path="pricing" element={<SalesPricing />} />
            <Route path="plans" element={<SalesPlans />} />
            <Route path="onboarding" element={<SalesOnboarding />} />
          </Route>
          <Route path="/monthlyplanner" element={<MonthlyPlannerPage />} />
          <Route path="/postit" element={<PostScheduler />} />
          <Route path="/sales/add-client" element={<AddClient />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/feedback/:token" element={<ClientFeedback />} />
          <Route path="/sketchit-makeit" element={<SketchItMakeIt />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
