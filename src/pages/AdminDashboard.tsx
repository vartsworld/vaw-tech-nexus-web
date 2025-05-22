
import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link, Outlet } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import InquiryList from "@/components/admin/InquiryList";
import TestimonialManagement from "@/components/admin/TestimonialManagement";
import PartnersManagement from "@/components/admin/PartnersManagement";
import ProjectsManagement from "@/components/admin/ProjectsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import CheckStorageBuckets from "@/components/admin/CheckStorageBuckets";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("inquiries");
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();
  const [initializing, setInitializing] = useState(true);

  // Add an effect to ensure we check the login status once
  useEffect(() => {
    // Short timeout to allow the component to mount and check
    // the isLoggedIn state from context
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // If still initializing, show nothing (prevents flash of redirect)
  if (initializing) {
    return null;
  }

  // Only check for redirect after initialization
  if (!isLoggedIn) {
    console.log("User is not logged in, redirecting to /admin");
    return <Navigate to="/admin" replace={true} />;
  }

  return (
    <div>
      {/* This component checks and initializes storage buckets */}
      <CheckStorageBuckets />
      
      <AdminHeader />
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="inquiries" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="inquiries">
            <InquiryList />
          </TabsContent>
          <TabsContent value="testimonials">
            <TestimonialManagement />
          </TabsContent>
          <TabsContent value="partners">
            <PartnersManagement />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
