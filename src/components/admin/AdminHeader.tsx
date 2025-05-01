
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const AdminHeader = () => {
  const navigate = useNavigate();
  const adminEmail = localStorage.getItem("admin_email") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_email");
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
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Logged in as: <span className="font-semibold">{adminEmail}</span>
            </span>
            <Button variant="outline" onClick={handleLogout} className="border-accent text-accent hover:bg-accent/10">
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
