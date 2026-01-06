
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import InquiryList from "@/components/admin/InquiryList";
import PricingInquiryList from "@/components/admin/PricingInquiryList";
import InternshipApplicationsList from "@/components/admin/InternshipApplicationsList";
import InternExperiencesList from "@/components/admin/InternExperiencesList";
import TeamApplicationsList from "@/components/admin/TeamApplicationsList";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import ProjectsManagement from "@/components/admin/ProjectsManagement";
import PartnersManagement from "@/components/admin/PartnersManagement";
import ClientLogosManagement from "@/components/admin/ClientLogosManagement";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for admin session from edge function authentication
      const sessionData = sessionStorage.getItem("admin_session");
      
      if (!sessionData) {
        navigate("/admin");
        return;
      }

      const session = JSON.parse(sessionData);
      
      // Check if session has expired
      if (new Date(session.expires_at) < new Date()) {
        sessionStorage.removeItem("admin_session");
        navigate("/admin");
        return;
      }

      // Verify token exists
      if (!session.token || !session.admin_id) {
        sessionStorage.removeItem("admin_session");
        navigate("/admin");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      sessionStorage.removeItem("admin_session");
      navigate("/admin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="inquiries" className="space-y-4 sm:space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 w-full gap-1 h-auto p-1">
            <TabsTrigger value="inquiries" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">General </span>Inquiries
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">Pricing </span>Inquiries
            </TabsTrigger>
            <TabsTrigger value="internships" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">Internship </span>Applications
            </TabsTrigger>
            <TabsTrigger value="experiences" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">Intern </span>Experiences
            </TabsTrigger>
            <TabsTrigger value="team-applications" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">Team </span>Applications
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              Projects
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              Partners
            </TabsTrigger>
            <TabsTrigger value="logos" className="text-xs sm:text-sm px-2 py-2 sm:px-3">
              <span className="hidden sm:inline">Client </span>Logos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inquiries">
            <InquiryList />
          </TabsContent>
          
          <TabsContent value="pricing">
            <PricingInquiryList />
          </TabsContent>
          
          <TabsContent value="internships">
            <InternshipApplicationsList />
          </TabsContent>
          
          <TabsContent value="experiences">
            <InternExperiencesList />
          </TabsContent>
          
          <TabsContent value="team-applications">
            <TeamApplicationsList />
          </TabsContent>
          
          <TabsContent value="testimonials">
            <TestimonialManagement />
          </TabsContent>
          
          <TabsContent value="projects">
            <ProjectsManagement />
          </TabsContent>
          
          <TabsContent value="partners">
            <PartnersManagement />
          </TabsContent>
          
          <TabsContent value="logos">
            <ClientLogosManagement />
          </TabsContent>
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div>
  );
};

export default AdminDashboard;
