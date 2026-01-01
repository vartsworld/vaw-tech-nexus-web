import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, Package, FileText, Clock, CheckCircle, XCircle,
  LayoutDashboard, Settings, CreditCard, HelpCircle,
  MessageSquare, File, Download, AlertTriangle, Lightbulb
} from "lucide-react";
import { ClientProjectPreview, ClientProjectData, ProjectMilestone } from "@/components/client-portal/ClientProjectPreview";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Mock data removed

// ... existing imports ...

const ClientPortal = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [projectData, setProjectData] = useState<ClientProjectData | undefined>(undefined);

  // Support Form State
  const [supportType, setSupportType] = useState("bug");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // Permission States
  const [permissions, setPermissions] = useState({
    camera: 'prompt',
    microphone: 'prompt',
    notifications: 'prompt',
    geolocation: 'prompt'
  });

  useEffect(() => {
    if (uniqueId) {
      handleAutoLogin(uniqueId);
    }
    checkPermissions();
  }, [uniqueId]);

  const checkPermissions = async () => {
    // Simple permission check - browser dependent
    const checkName = async (name: string) => {
      try {
        // @ts-ignore
        const result = await navigator.permissions.query({ name });
        return result.state;
      } catch (e) {
        return 'unknown';
      }
    };

    setPermissions({
      camera: await checkName('camera'),
      microphone: await checkName('microphone'),
      notifications: await checkName('notifications'),
      geolocation: await checkName('geolocation')
    });
  };

  const requestPermission = async (type: string) => {
    try {
      switch (type) {
        case 'camera':
          await navigator.mediaDevices.getUserMedia({ video: true });
          toast.success("Camera access granted");
          break;
        case 'microphone':
          await navigator.mediaDevices.getUserMedia({ audio: true });
          toast.success("Microphone access granted");
          break;
        case 'geolocation':
          navigator.geolocation.getCurrentPosition(() => toast.success("Location access granted"));
          break;
        case 'notifications':
          await Notification.requestPermission();
          toast.success("Notification settings updated");
          break;
      }
      checkPermissions();
    } catch (e) {
      toast.error(`Could not access ${type}`);
    }
  };

  const handleAutoLogin = async (id: string) => {
    setLoading(true);
    const isEmail = id.includes("@");

    try {
      let query = supabase.from("service_requests").select("*");

      if (isEmail) {
        query = query.eq("email", id.toLowerCase());
        setSearchEmail(id);
      } else {
        query = query.eq("id", id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const email = data[0].email;
        if (!isEmail) setSearchEmail(email);
        await fetchData(email);
      } else {
        toast.error("Invalid Client Link");
        navigate("/client-portal");
      }
    } catch (e) {
      console.error("Auto login error", e);
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (email: string) => {
    try {
      // Fetch service requests
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (inquiriesError) throw inquiriesError;

      // Note: payments and project_documents tables don't exist in the schema
      // These features can be enabled once the tables are created
      const paymentsData: any[] = [];
      const docsData: any[] = [];

      setServiceRequests(servicesData || []);
      setInquiries(inquiriesData || []);
      setPayments(paymentsData);
      setDocuments(docsData);

      if ((!servicesData || servicesData.length === 0) && (!inquiriesData || inquiriesData.length === 0)) {
        toast.error("No records found for this email");
        setIsAuthenticated(false);
        setProjectData(undefined);
      } else {
        if (!uniqueId) toast.success("Welcome back!");
        setIsAuthenticated(true);
        if (servicesData && servicesData.length > 0) {
          mapRequestToProject(servicesData[0]);
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your information");
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    await fetchData(searchEmail);
    setLoading(false);
  };

  const mapRequestToProject = (request: any) => {
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
      default:
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

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmittingSupport(true);
    setTimeout(() => {
      toast.success("Ticket submitted successfully! We'll be in touch shortly.");
      setIsSubmittingSupport(false);
      setSupportSubject("");
      setSupportMessage("");
      setSupportType("bug");
    }, 1500);
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
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress": return <Clock className="h-5 w-5 text-blue-500" />;
      case "cancelled": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Package className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
                  {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary">
          <Clock className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PWAInstallPrompt />
      <div className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">
            <img
              src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
              alt="VAW Tech Logo"
              className="w-8 h-8 rounded object-cover"
            />
            <span>VAW Tech Nexus</span>
            <Badge variant="outline" className="ml-2 hidden sm:flex">Client Access</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{searchEmail}</span>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsAuthenticated(false);
              navigate("/client-portal");
            }}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted/50 hover:[&::-webkit-scrollbar-thumb]:bg-muted">
            <TabsList className="inline-flex w-auto min-w-full justify-start p-1 bg-muted/50">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <Package className="h-4 w-4 mr-2" />
                <span>Projects</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <CreditCard className="h-4 w-4 mr-2" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <File className="h-4 w-4 mr-2" />
                <span>Docs</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Support</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-background py-2.5 px-6 min-w-[100px]">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <ClientProjectPreview
              project={projectData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Requests</h2>
              <Button size="sm" onClick={() => navigate("/service-request")}>New Request</Button>
            </div>
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

          <TabsContent value="payments" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View and download your past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No payment history available.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "Paid" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="match-height animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Assets</CardTitle>
                <CardDescription>Files shared with you for your project</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No documents found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Report an Issue / Suggestion</CardTitle>
                  <CardDescription>Let us know how we can help or improve</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={supportType} onValueChange={setSupportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">Report a Bug</SelectItem>
                          <SelectItem value="feature">Suggest a Feature</SelectItem>
                          <SelectItem value="content">Content Update</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Brief description of the issue"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea
                        placeholder="Please provide as much detail as possible..."
                        className="min-h-[120px]"
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmittingSupport}>
                      {isSubmittingSupport ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Previous Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {inquiries.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-4">No past inquiries found.</p>
                    ) : (
                      <div className="space-y-3">
                        {inquiries.slice(0, 3).map(inq => (
                          <div key={inq.id} className="border-l-2 border-primary pl-4 py-1">
                            <p className="font-medium text-sm">{inq.service || "General Inquiry"}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{inq.message}</p>
                            <span className="text-[10px] text-muted-foreground">{new Date(inq.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Did you know?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    You can directly email our priority support line at <strong className="text-foreground">support@vawtech.com</strong> for urgent matters.
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your profile and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Notifications</Label>
                    <div className="flex items-center justify-between border p-3 rounded bg-card/50">
                      <span className="text-sm">Receive project updates</span>
                      <Badge>Enabled</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme Preference</Label>
                    <div className="flex items-center justify-between border p-3 rounded bg-card/50">
                      <span className="text-sm">Current Theme</span>
                      <Badge variant="outline">Dark</Badge>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button variant="destructive" size="sm">Sign Out Everywhere</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Permissions</CardTitle>
                  <CardDescription>Manage application access to your device capabilities.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><span className="text-xl">📷</span></div>
                      <div>
                        <p className="font-medium text-sm">Camera</p>
                        <p className="text-xs text-muted-foreground capitalize">{permissions.camera}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestPermission('camera')}>Request</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><span className="text-xl">🎤</span></div>
                      <div>
                        <p className="font-medium text-sm">Microphone</p>
                        <p className="text-xs text-muted-foreground capitalize">{permissions.microphone}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestPermission('microphone')}>Request</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><span className="text-xl">📍</span></div>
                      <div>
                        <p className="font-medium text-sm">Location</p>
                        <p className="text-xs text-muted-foreground capitalize">{permissions.geolocation}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestPermission('geolocation')}>Request</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full"><span className="text-xl">🔔</span></div>
                      <div>
                        <p className="font-medium text-sm">Notifications</p>
                        <p className="text-xs text-muted-foreground capitalize">{permissions.notifications}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => requestPermission('notifications')}>Request</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPortal;
