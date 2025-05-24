import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import InquiryList from "@/components/admin/InquiryList";
import PartnersManagement from "@/components/admin/PartnersManagement";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import ProjectsManagement from "@/components/admin/ProjectsManagement";
import ClientLogosManagement from "@/components/admin/ClientLogosManagement";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState({
    inquiries: 0,
    projects: 0,
    testimonials: 0,
    partners: 0,
    clientLogos: 0,
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("admin_token");
    const role = localStorage.getItem("admin_role");
    
    if (!token || !role || !['admin', 'superadmin'].includes(role)) {
      navigate("/admin");
      return;
    }
    
    setIsAuthorized(true);
    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      // Start with default values
      let stats = {
        inquiries: 0,
        projects: 0,
        testimonials: 0,
        partners: 0,
        clientLogos: 0,
      };
      
      // Try to fetch counts from Supabase tables
      try {
        const [inquiryCount, projectCount, testimonialCount, partnerCount, clientLogoCount] = await Promise.all([
          supabase.from('inquiries').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('id', { count: 'exact', head: true }),
          supabase.from('testimonials').select('id', { count: 'exact', head: true }),
          supabase.from('partners').select('id', { count: 'exact', head: true }),
          supabase.from('client_logos').select('id', { count: 'exact', head: true }),
        ]);

        // Update stats with counts from Supabase when available
        stats = {
          inquiries: inquiryCount.count || 0,
          projects: projectCount.count || 0,
          testimonials: testimonialCount.count || 0,
          partners: partnerCount.count || 0,
          clientLogos: clientLogoCount.count || 0,
        };
      } catch (error) {
        console.log('Error fetching from Supabase, using localStorage fallback');
        
        // Fallback to localStorage for inquiries
        try {
          const localInquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
          stats.inquiries = localInquiries.length;
        } catch (e) {
          console.error('Error reading inquiries from localStorage', e);
        }
      }

      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!isAuthorized) {
    return null; // Don't render anything until authorization is confirmed
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 font-['Space_Grotesk']">
          Admin <span className="text-gradient">Dashboard</span>
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Total Inquiries</p>
                    <h3 className="text-3xl font-bold">{dashboardStats.inquiries}</h3>
                  </div>
                  <div className="p-4 rounded-full bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Portfolio Projects</p>
                    <h3 className="text-3xl font-bold">{dashboardStats.projects}</h3>
                  </div>
                  <div className="p-4 rounded-full bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Testimonials</p>
                    <h3 className="text-3xl font-bold">{dashboardStats.testimonials}</h3>
                  </div>
                  <div className="p-4 rounded-full bg-secondary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Partners</p>
                    <h3 className="text-3xl font-bold">{dashboardStats.partners}</h3>
                  </div>
                  <div className="p-4 rounded-full bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Client Logos</p>
                    <h3 className="text-3xl font-bold">{dashboardStats.clientLogos}</h3>
                  </div>
                  <div className="p-4 rounded-full bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recent Inquiries</h2>
              <InquiryList />
            </div>
          </TabsContent>
          
          <TabsContent value="inquiries">
            <InquiryList />
          </TabsContent>
          
          <TabsContent value="projects">
            <ProjectsManagement />
          </TabsContent>
          
          <TabsContent value="content" className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Partners Management</h2>
              <PartnersManagement />
            </div>
            
            <div className="mt-8 pt-8 border-t border-muted/20">
              <h2 className="text-2xl font-bold mb-4">Client Logos Management</h2>
              <ClientLogosManagement />
            </div>
            
            <div className="mt-8 pt-8 border-t border-muted/20">
              <h2 className="text-2xl font-bold mb-4">Testimonials Management</h2>
              <TestimonialManagement />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
