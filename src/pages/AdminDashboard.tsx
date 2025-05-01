
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import InquiryList from "@/components/admin/InquiryList";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("admin_token");
    const role = localStorage.getItem("admin_role");
    
    if (!token || !role || !['admin', 'superadmin'].includes(role)) {
      navigate("/admin");
      return;
    }
    
    setIsAuthorized(true);
  }, [navigate]);

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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Total Inquiries</p>
                <h3 className="text-3xl font-bold">24</h3>
              </div>
              <div className="p-4 rounded-full bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">+5 since last week</p>
          </div>
          
          <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">New Messages</p>
                <h3 className="text-3xl font-bold">12</h3>
              </div>
              <div className="p-4 rounded-full bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">+3 since yesterday</p>
          </div>
          
          <div className="bg-card border border-muted/20 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Pending Follow-ups</p>
                <h3 className="text-3xl font-bold">7</h3>
              </div>
              <div className="p-4 rounded-full bg-secondary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">2 due today</p>
          </div>
        </div>
        
        <InquiryList />
      </main>
    </div>
  );
};

export default AdminDashboard;
