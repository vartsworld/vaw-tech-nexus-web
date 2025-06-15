import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ServiceRequest from "./pages/ServiceRequest";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Internship from "./pages/Internship";
import Pricing from "./pages/Pricing";
import DigitalMarketing from "./pages/DigitalMarketing";
import WebAppDevelopment from "./pages/WebAppDevelopment";
import AISolutions from "./pages/AISolutions";
import VRARDevelopment from "./pages/VRARDevelopment";
import DigitalDesign from "./pages/DigitalDesign";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./providers/ThemeProvider";
import { UserProvider } from "./context/UserContext";
import IntroScreen from "./components/IntroScreen";
import { useUser } from "./context/UserContext";
import StaffDashboard from "./pages/StaffDashboard";

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
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/digital-marketing" element={<DigitalMarketing />} />
          <Route path="/webapp-development" element={<WebAppDevelopment />} />
          <Route path="/ai-solutions" element={<AISolutions />} />
          <Route path="/vr-ar-development" element={<VRARDevelopment />} />
          <Route path="/digital-design" element={<DigitalDesign />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
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
