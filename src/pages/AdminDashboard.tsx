
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import InquiryList from "@/components/admin/InquiryList";
import PricingInquiryList from "@/components/admin/PricingInquiryList";
import InternshipApplicationsList from "@/components/admin/InternshipApplicationsList";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import ProjectsManagement from "@/components/admin/ProjectsManagement";
import PartnersManagement from "@/components/admin/PartnersManagement";
import ClientLogosManagement from "@/components/admin/ClientLogosManagement";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
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
      
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="inquiries" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="inquiries">General Inquiries</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Inquiries</TabsTrigger>
            <TabsTrigger value="internships">Internship Applications</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="logos">Client Logos</TabsTrigger>
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
    </div>
  );
};

export default AdminDashboard;
