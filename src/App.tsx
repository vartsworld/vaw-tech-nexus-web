import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import IntroScreen from "./components/IntroScreen";
import { useUser } from "./context/UserContext";
import StaffDashboard from "./pages/StaffDashboard";
import StaffLogin from "./pages/StaffLogin";
import TeamHeadDashboard from "./pages/TeamHeadDashboard";
import AccountDashboard from "./pages/AccountDashboard";
import ClientPortal from "./pages/ClientPortal";
import VAWCups from "./pages/VAWCups";
import VAWVendor from "./pages/VAWVendor";
import VAWSponsor from "./pages/VAWSponsor";
import VAWAdmin from "./pages/VAWAdmin";
import MyCoins from "./pages/MyCoins";

const queryClient = new QueryClient();

const AppContent = () => {
  const { hasCompletedIntro } = useUser();

  return (
    <>
      {!hasCompletedIntro && <IntroScreen />}
      <BrowserRouter>
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/team-head/dashboard" element={<TeamHeadDashboard />} />
          <Route path="/mycoins" element={<MyCoins />} />
          <Route path="/account" element={<AccountDashboard />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/vaw-cups" element={<VAWCups />} />
          <Route path="/vaw-cups/vendor" element={<VAWVendor />} />
          <Route path="/vaw-cups/sponsor" element={<VAWSponsor />} />
          <Route path="/vaw-cups/admin" element={<VAWAdmin />} />
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
