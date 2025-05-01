
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, this would clear authentication tokens
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  return (
    <header className="bg-card border-b border-muted/20 py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-xl font-['Space_Grotesk'] text-gradient">
              VAW<span className="text-accent">tech</span> Admin
            </span>
          </Link>
          
          <Button variant="outline" onClick={handleLogout} className="border-accent text-accent hover:bg-accent/10">
            Log Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
