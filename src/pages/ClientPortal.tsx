import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Package, FileText, Clock, CheckCircle, XCircle, Mail, Phone, MapPin, LayoutDashboard, Settings } from "lucide-react";
import { ClientProjectPreview, ClientProjectData, ProjectMilestone } from "@/components/client-portal/ClientProjectPreview";

const ClientPortal = () => {
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projectData, setProjectData] = useState<ClientProjectData | undefined>(undefined);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Fetch service requests
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("email", searchEmail.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("email", searchEmail.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (inquiriesError) throw inquiriesError;

      const requests = servicesData || [];
      const userInquiries = inquiriesData || [];

      setServiceRequests(requests);
      setInquiries(userInquiries);

      if (requests.length === 0 && userInquiries.length === 0) {
        toast.error("No records found for this email");
        setIsAuthenticated(false);
        setProjectData(undefined);
        return;
      } else {
        toast.success("Welcome back!");
        setIsAuthenticated(true);

        // Transform the latest service request into Project Data
        if (requests.length > 0) {
          const latestRequest = requests[0];
          mapRequestToProject(latestRequest);
        } else {
          setProjectData(undefined);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your information");
    } finally {
      setLoading(false);
    }
  };

  const mapRequestToProject = (request: any) => {
    // Logic to map service request status to project milestones and progress
    let progress = 0;
    let milestones: ProjectMilestone[] = [];
    const createdDate = new Date(request.created_at).toLocaleDateString();

    switch (request.status) {
      case 'new':
        progress = 15;
        milestones = [
          { id: '1', title: 'Request Submission', status: 'completed', date: createdDate },
          { id: '2', title: 'Requirement Analysis', status: 'current' },
          { id: '3', title: 'Proposal & Planning', status: 'pending' },
          { id: '4', title: 'Development', status: 'pending' },
          { id: '5', title: 'Deployment', status: 'pending' }
        ];
        break;
      case 'in_progress':
        progress = 60;
        milestones = [
          { id: '1', title: 'Request Submission', status: 'completed', date: createdDate },
          { id: '2', title: 'Requirement Analysis', status: 'completed' },
          { id: '3', title: 'Proposal & Planning', status: 'completed' },
          { id: '4', title: 'Development', status: 'current' },
          { id: '5', title: 'Deployment', status: 'pending' }
        ];
        break;
      case 'completed':
        progress = 100;
        milestones = [
          { id: '1', title: 'Request Submission', status: 'completed', date: createdDate },
          { id: '2', title: 'Requirement Analysis', status: 'completed' },
          { id: '3', title: 'Proposal & Planning', status: 'completed' },
          { id: '4', title: 'Development', status: 'completed' },
          { id: '5', title: 'Deployment', status: 'completed', date: new Date(request.updated_at || Date.now()).toLocaleDateString() }
        ];
        break;
      default: // cancelled or other
        progress = 0;
        milestones = [
          { id: '1', title: 'Request Submission', status: 'completed', date: createdDate },
          { id: '2', title: 'Project Cancelled', status: 'completed' }
        ];
    }

    const data: ClientProjectData = {
      name: request.company_name || `${request.full_name}'s Project`,
      type: request.services && request.services.length > 0 ? request.services.join(", ") : "Custom Service",
      status: request.status || 'new',
      progress: progress,
      milestones: milestones,
      previewUrl: undefined,
      repoUrl: undefined,
      renewalDate: request.status === 'completed' ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString() : undefined
    };

    setProjectData(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "New", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

        <div className="w-full max-w-md space-y-8 z-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Client Portal</h1>
            <p className="text-muted-foreground">Access your project dashboard, requests, and timeline.</p>
          </div>

          <Card className="border-primary/10 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Client Access</CardTitle>
              <CardDescription>Enter your email to view your personalized dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              V
            </div>
            <span>VAW Tech Nexus</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{searchEmail}</span>
            <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] h-auto p-1 bg-muted/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-background py-2">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Project Hub
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-background py-2">
              <Package className="h-4 w-4 mr-2" />
              Requests
              {serviceRequests.length > 0 && <Badge variant="secondary" className="ml-2 h-5 px-1.5">{serviceRequests.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="data-[state=active]:bg-background py-2">
              <FileText className="h-4 w-4 mr-2" />
              Inquiries
              {inquiries.length > 0 && <Badge variant="secondary" className="ml-2 h-5 px-1.5">{inquiries.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background py-2">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <ClientProjectPreview project={projectData} />
          </TabsContent>

          <TabsContent value="services" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {serviceRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  No service requests found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {serviceRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className="truncate max-w-[150px]">{request.full_name}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(request.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                      <div>
                        <p className="font-medium mb-1.5 text-xs text-muted-foreground uppercase tracking-wider">Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {request.services?.slice(0, 3).map((service: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs font-normal">
                              {service}
                            </Badge>
                          ))}
                          {request.services?.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal">+{request.services.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {inquiries.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  No inquiries found
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inquiries.map((inquiry) => (
                  <Card key={inquiry.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getStatusIcon(inquiry.status)}
                            {inquiry.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {inquiry.service && (
                        <div>
                          <Badge variant="outline" className="font-normal">{inquiry.service}</Badge>
                        </div>
                      )}
                      <div className="bg-muted/50 p-3 rounded text-muted-foreground italic text-xs line-clamp-3">
                        "{inquiry.message}"
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Settings panel coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;
