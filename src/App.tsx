import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { bind } from "cuelume";

import Index from "./pages/Index";
import ServiceRequest from "./pages/ServiceRequest";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import Internship from "./pages/Internship";
import InternExperience from "./pages/InternExperience";
import TeamApplication from "./pages/TeamApplication";
import Pricing from "./pages/Pricing";
import DigitalMarketing from "./pages/DigitalMarketing";
import WebAppDevelopment from "./pages/WebAppDevelopment";
import WebsiteDevelopment from "./pages/WebsiteDevelopment";
import AISolutions from "./pages/AISolutions";
import VRARDevelopment from "./pages/VRARDevelopment";
import DigitalDesign from "./pages/DigitalDesign";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./providers/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import ScrollToTop from "./components/ScrollToTop";
import { useUser } from "./context/UserContext";
import StaffDashboard from "./pages/StaffDashboard";
import StaffTaskDetail from "./pages/StaffTaskDetail";
import StaffWork from "./pages/StaffWork";
import StaffLogin from "./pages/StaffLogin";
import TeamHeadDashboard from "./pages/TeamHeadDashboard";
import AccountDashboard from "./pages/AccountDashboard";
import ClientPortal from "./pages/ClientPortal";
import VAWCups from "./pages/VAWCups";
import VAWVendor from "./pages/VAWVendor";
import VAWSponsor from "./pages/VAWSponsor";
import VAWAdmin from "./pages/VAWAdmin";
import MyCoins from "./pages/MyCoins";
import ProjectMonitor from "./pages/ProjectMonitor";
import Install from "./pages/Install";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DigitalMarketingInternship from "./pages/DigitalMarketingInternship";
import ClientOnboarding from "./pages/ClientOnboarding";
import StaffIDCard from "./pages/StaffIDCard";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import LMSBuilder from "./pages/LMSBuilder";
import ReferralProgram from "./pages/ReferralProgram";
import ReferralFormPage from "./pages/ReferralFormPage";
import Team from "./pages/Team";
import QRRedirection from "./pages/QRRedirection";
import SalesDashboard from "./pages/SalesDashboard";
import SalesAgenda from "./components/sales/SalesAgenda";
import SalesPricing from "./components/sales/SalesPricing";
import SalesPlans from "./components/sales/SalesPlans";
import SalesOnboarding from "./components/sales/SalesOnboarding";
import MonthlyPlannerPage from "./pages/MonthlyPlannerPage";
import AddClient from "./pages/AddClient";
import Portal from "./pages/Portal";
import ClientFeedback from "./pages/ClientFeedback";
import GPSProposal from "./pages/GPSProposal";
import GPSAIProposal from "./pages/GPSAIProposal";
import VAWAcademy from "./pages/VAWAcademy";
import ToolsNexus from "./pages/ToolsNexus";
import InboxPage from "./pages/InboxPage";
import ChessPage from "./pages/ChessPage";
import NotesPage from "./pages/NotesPage";
import OnboardingPage from "./pages/OnboardingPage";
import LeavePage from "./pages/LeavePage";
import ActivityPage from "./pages/ActivityPage";
import DocsPage from "./pages/DocsPage";
import OperationsPage from "./pages/OperationsPage";
import ChannelsPage from "./pages/ChannelsPage";
import SketchItMakeIt from "./pages/SketchItMakeIt";



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
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (location.pathname.startsWith('/client')) {
      manifestLink?.setAttribute('href', '/client-manifest.json');
    } else if (
      location.pathname.startsWith('/staff') ||
      location.pathname.startsWith('/team-head')
    ) {
      manifestLink?.setAttribute('href', '/staff-manifest.json');
    } else {
      manifestLink?.setAttribute('href', '/manifest.json');
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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/service-request" element={<ServiceRequest />} />
          <Route path="/internship" element={<Internship />} />
          <Route path="/intern-experience" element={<InternExperience />} />
          <Route path="/team-application" element={<TeamApplication />} />
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
          <Route path="/hr/*" element={<HRDashboard />} />
          <Route path="/staff/profile" element={<Navigate to="/account" replace />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/staff/:room" element={<StaffDashboard />} />
          <Route path="/staff/tools-nexus" element={<ToolsNexus />} />
          <Route path="/staff/task/:taskId" element={<StaffTaskDetail />} />
          <Route path="/staff/work" element={<StaffWork />} />
          <Route path="/staff/inbox" element={<InboxPage />} />
          <Route path="/staff/chess" element={<ChessPage />} />
          <Route path="/staff/notes" element={<NotesPage />} />
          <Route path="/staff/onboarding" element={<OnboardingPage />} />
          <Route path="/staff/leave" element={<LeavePage />} />
          <Route path="/staff/activity" element={<ActivityPage />} />
          <Route path="/staff/docs" element={<DocsPage />} />
          <Route path="/staff/operations" element={<OperationsPage />} />
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
          <Route path="/sales/add-client" element={<AddClient />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/feedback/:token" element={<ClientFeedback />} />
          <Route path="/sketchit-makeit" element={<SketchItMakeIt />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
