import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Globe, Server, Calendar, ExternalLink, RefreshCw, Trash2, Edit, CheckCircle, XCircle, AlertTriangle, Facebook, Filter, ArrowUpDown, Search, Users, Instagram, Twitter, Linkedin, BarChart2, PieChart, TrendingUp, Hash } from "lucide-react";
import { addDays } from "date-fns";
import { format, differenceInDays, isPast, addMonths, addYears } from "date-fns";

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
}

interface ProjectMonitor {
  id: string;
  client_id: string | null;
  project_name: string;
  website_url: string;
  domain_renewal_date: string | null;
  server_renewal_date: string | null;
  domain_renewal_cycle: string | null;
  server_renewal_cycle: string | null;
  facebook_token_renewal_date: string | null;
  facebook_token_renewal_cycle: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  clients?: Client;
}

const ProjectMonitorPage = ({ standalone = false }: { standalone?: boolean }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMonitor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectMonitor | null>(null);
  const [renewalProject, setRenewalProject] = useState<ProjectMonitor | null>(null);
  const [websiteStatuses, setWebsiteStatuses] = useState<Record<string, 'checking' | 'online' | 'offline' | 'error'>>({});

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");
  const [formData, setFormData] = useState({
    client_id: "",
    project_name: "",
    website_url: "",
    domain_renewal_date: "",
    server_renewal_date: "",
    domain_renewal_cycle: "yearly",
    server_renewal_cycle: "yearly",
    facebook_token_renewal_date: "",
    facebook_token_renewal_cycle: "90days",
    notes: ""
  });

  const [renewalFormData, setRenewalFormData] = useState({
    domain_renewal_date: "",
    server_renewal_date: "",
    domain_renewal_cycle: "yearly",
    server_renewal_cycle: "yearly",
    facebook_token_renewal_date: "",
    facebook_token_renewal_cycle: "90days",
    update_domain: false,
    update_server: false,
    update_facebook: false
  });

  // Marketing Analytics State for manual entry
  const [marketingLinks, setMarketingLinks] = useState<{ id: string; clientId: string; platform: string; url: string; notes: string }[]>([]);
  const [isMarketingDialogOpen, setIsMarketingDialogOpen] = useState(false);
  const [marketingForm, setMarketingForm] = useState({ clientId: "", platform: "Instagram", url: "", notes: "" });

  const handleAddMarketingLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingForm.clientId || !marketingForm.url) return;
    setMarketingLinks(prev => [...prev, { ...marketingForm, id: Math.random().toString() }]);
    setIsMarketingDialogOpen(false);
    setMarketingForm({ clientId: "", platform: "Instagram", url: "", notes: "" });
    toast.success("Social media link added successfully");
  };

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        supabase
          .from('project_monitors')
          .select('*, clients(id, company_name, contact_person)')
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, company_name, contact_person')
          .eq('status', 'active')
          .order('company_name')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      if (!isMounted.current) return;

      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);

      // BOLT OPTIMIZATION: Bulk initialize status mapping to prevent N sequential re-renders
      const initialStatuses: Record<string, 'checking' | 'online' | 'offline' | 'error'> = {};
      const activeProjects = projectsRes.data || [];
      activeProjects.forEach(project => {
        initialStatuses[project.id] = 'checking';
      });
      setWebsiteStatuses(initialStatuses);

      // Check status for each project with showCheckingState = false (as it is already bulk-initialized)
      activeProjects.forEach(project => {
        checkWebsiteStatus(project.id, project.website_url, false);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load projects');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const checkWebsiteStatus = async (projectId: string, url: string, showCheckingState = true) => {
    if (showCheckingState && isMounted.current) {
      setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'checking' }));
    }

    try {
      // We'll use a simple approach - try to load an image from the domain
      // This is a workaround since we can't make direct fetch requests due to CORS
      const img = new Image();
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'error' }));
        }
      }, 10000);

      img.onload = () => {
        clearTimeout(timeoutId);
        if (isMounted.current) {
          setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'online' }));
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        // Even if image fails, domain might be up - mark as online with caveat
        if (isMounted.current) {
          setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'online' }));
        }
      };

      // Try to load favicon as a proxy for site availability
      const domain = new URL(url).origin;
      img.src = `${domain}/favicon.ico?t=${Date.now()}`;
    } catch {
      if (isMounted.current) {
        setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'error' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const payload = {
        client_id: formData.client_id || null,
        project_name: formData.project_name,
        website_url: formData.website_url.startsWith('http') ? formData.website_url : `https://${formData.website_url}`,
        domain_renewal_date: formData.domain_renewal_date || null,
        server_renewal_date: formData.server_renewal_date || null,
        domain_renewal_cycle: formData.domain_renewal_cycle,
        server_renewal_cycle: formData.server_renewal_cycle,
        facebook_token_renewal_date: formData.facebook_token_renewal_date || null,
        facebook_token_renewal_cycle: formData.facebook_token_renewal_cycle,
        notes: formData.notes || null,
        created_by: user.id
      };

      if (editingProject) {
        const { error } = await supabase
          .from('project_monitors')
          .update(payload)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success('Project updated successfully');
      } else {
        const { error } = await supabase
          .from('project_monitors')
          .insert(payload);

        if (error) throw error;
        toast.success('Project added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error(error.message || 'Failed to save project');
    }
  };

  const handleEdit = (project: ProjectMonitor) => {
    setEditingProject(project);
    setFormData({
      client_id: project.client_id || "",
      project_name: project.project_name,
      website_url: project.website_url,
      domain_renewal_date: project.domain_renewal_date || "",
      server_renewal_date: project.server_renewal_date || "",
      domain_renewal_cycle: project.domain_renewal_cycle || "yearly",
      server_renewal_cycle: project.server_renewal_cycle || "yearly",
      facebook_token_renewal_date: project.facebook_token_renewal_date || "",
      facebook_token_renewal_cycle: project.facebook_token_renewal_cycle || "90days",
      notes: project.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('project_monitors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Project deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      client_id: "",
      project_name: "",
      website_url: "",
      domain_renewal_date: "",
      server_renewal_date: "",
      domain_renewal_cycle: "yearly",
      server_renewal_cycle: "yearly",
      facebook_token_renewal_date: "",
      facebook_token_renewal_cycle: "90days",
      notes: ""
    });
  };

  const calculateNextRenewalDate = (currentDate: string | null, cycle: string) => {
    const baseDate = currentDate ? new Date(currentDate) : new Date();
    let nextDate = baseDate;

    // If current date is in past, calculate from today
    if (currentDate && isPast(new Date(currentDate))) {
      nextDate = new Date();
    }

    switch (cycle) {
      case 'monthly':
        nextDate = addMonths(nextDate, 1);
        break;
      case 'quarterly':
        nextDate = addMonths(nextDate, 3);
        break;
      case '90days':
        nextDate = addDays(nextDate, 90);
        break;
      case 'yearly':
      default:
        nextDate = addYears(nextDate, 1);
        break;
    }

    return format(nextDate, 'yyyy-MM-dd');
  };

  const handleUpdateRenewal = (project: ProjectMonitor) => {
    setRenewalProject(project);

    const domainCycle = project.domain_renewal_cycle || 'yearly';
    const serverCycle = project.server_renewal_cycle || 'yearly';
    const facebookCycle = project.facebook_token_renewal_cycle || '90days';

    setRenewalFormData({
      domain_renewal_date: calculateNextRenewalDate(project.domain_renewal_date, domainCycle),
      server_renewal_date: calculateNextRenewalDate(project.server_renewal_date, serverCycle),
      domain_renewal_cycle: domainCycle,
      server_renewal_cycle: serverCycle,
      facebook_token_renewal_date: calculateNextRenewalDate(project.facebook_token_renewal_date, facebookCycle),
      facebook_token_renewal_cycle: facebookCycle,
      update_domain: false,
      update_server: false,
      update_facebook: false
    });
    setIsRenewalDialogOpen(true);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalProject) return;

    if (!renewalFormData.update_domain && !renewalFormData.update_server && !renewalFormData.update_facebook) {
      toast.error('Please select at least one renewal to update');
      return;
    }

    try {
      const updatePayload: Record<string, any> = {};

      if (renewalFormData.update_domain) {
        updatePayload.domain_renewal_date = renewalFormData.domain_renewal_date || null;
        updatePayload.domain_renewal_cycle = renewalFormData.domain_renewal_cycle;
      }

      if (renewalFormData.update_server) {
        updatePayload.server_renewal_date = renewalFormData.server_renewal_date || null;
        updatePayload.server_renewal_cycle = renewalFormData.server_renewal_cycle;
      }

      if (renewalFormData.update_facebook) {
        updatePayload.facebook_token_renewal_date = renewalFormData.facebook_token_renewal_date || null;
        updatePayload.facebook_token_renewal_cycle = renewalFormData.facebook_token_renewal_cycle;
      }

      const { error } = await supabase
        .from('project_monitors')
        .update(updatePayload as any)
        .eq('id', renewalProject.id);

      if (error) throw error;
      toast.success('Renewal dates updated');
      setIsRenewalDialogOpen(false);
      setRenewalProject(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update renewal dates');
    }
  };

  const getRenewalStatus = (date: string | null) => {
    if (!date) return null;

    const renewalDate = new Date(date);
    const daysUntil = differenceInDays(renewalDate, new Date());

    if (isPast(renewalDate)) {
      return { status: 'expired', label: 'Expired', color: 'bg-destructive text-destructive-foreground' };
    } else if (daysUntil <= 7) {
      return { status: 'critical', label: `${daysUntil}d left`, color: 'bg-destructive text-destructive-foreground' };
    } else if (daysUntil <= 30) {
      return { status: 'warning', label: `${daysUntil}d left`, color: 'bg-yellow-500 text-white' };
    } else {
      return { status: 'ok', label: format(renewalDate, 'MMM dd, yyyy'), color: 'bg-green-500 text-white' };
    }
  };

  const getStatusIcon = (status: 'checking' | 'online' | 'offline' | 'error' | undefined) => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />;
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Globe className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get urgency level for a project (based on closest renewal)
  const getProjectUrgency = (project: ProjectMonitor) => {
    const dates = [
      project.domain_renewal_date,
      project.server_renewal_date,
      project.facebook_token_renewal_date
    ].filter(Boolean);

    if (dates.length === 0) return 'none';

    const closestDays = Math.min(...dates.map(d => differenceInDays(new Date(d!), new Date())));

    if (closestDays < 0) return 'expired';
    if (closestDays <= 7) return 'critical';
    if (closestDays <= 30) return 'warning';
    return 'ok';
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = project.project_name.toLowerCase().includes(query);
        const matchesUrl = project.website_url.toLowerCase().includes(query);
        const matchesClient = project.clients?.company_name.toLowerCase().includes(query);
        if (!matchesName && !matchesUrl && !matchesClient) return false;
      }

      // Client filter
      if (filterClient !== "all" && project.client_id !== filterClient) return false;

      // Urgency filter
      if (filterUrgency !== "all") {
        const urgency = getProjectUrgency(project);
        if (filterUrgency === "expiring" && urgency !== "warning" && urgency !== "critical") return false;
        if (filterUrgency === "expired" && urgency !== "expired") return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.project_name.localeCompare(b.project_name);
        case "name_desc":
          return b.project_name.localeCompare(a.project_name);
        case "created_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "domain_renewal":
          const aDomain = a.domain_renewal_date ? new Date(a.domain_renewal_date).getTime() : Infinity;
          const bDomain = b.domain_renewal_date ? new Date(b.domain_renewal_date).getTime() : Infinity;
          return aDomain - bDomain;
        case "server_renewal":
          const aServer = a.server_renewal_date ? new Date(a.server_renewal_date).getTime() : Infinity;
          const bServer = b.server_renewal_date ? new Date(b.server_renewal_date).getTime() : Infinity;
          return aServer - bServer;
        case "urgency":
          const urgencyOrder = { expired: 0, critical: 1, warning: 2, ok: 3, none: 4 };
          return urgencyOrder[getProjectUrgency(a)] - urgencyOrder[getProjectUrgency(b)];
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={standalone ? "" : "min-h-screen bg-background"}>
      <div className={standalone ? "" : "container mx-auto p-4 sm:p-6"}>
        {!standalone && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Project Monitor</h1>
                <p className="text-muted-foreground text-sm">Track client websites and renewal dates</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Client (Optional)</Label>
                    <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Project Name *</Label>
                    <Input
                      value={formData.project_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                      placeholder="My Awesome Project"
                      required
                    />
                  </div>

                  <div>
                    <Label>Website URL *</Label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://example.com"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Domain Renewal
                        </Label>
                        <Input
                          type="date"
                          value={formData.domain_renewal_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, domain_renewal_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Domain Cycle</Label>
                        <Select value={formData.domain_renewal_cycle} onValueChange={(v) => setFormData(prev => ({ ...prev, domain_renewal_cycle: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          Server Renewal
                        </Label>
                        <Input
                          type="date"
                          value={formData.server_renewal_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, server_renewal_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Server Cycle</Label>
                        <Select value={formData.server_renewal_cycle} onValueChange={(v) => setFormData(prev => ({ ...prev, server_renewal_cycle: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProject ? 'Update' : 'Add Project'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {standalone && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Project Integrity Monitor</h2>
              <p className="text-gray-500 mt-1">Real-time status tracking and asset renewal lifecycle</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Monitor Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0f0f0f] border-white/5 text-white">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Refine Asset Parameters' : 'Register New Asset'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-gray-400">Client Partner</Label>
                    <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue placeholder="Select Client Partner" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-gray-400">Project Designation</Label>
                    <Input
                      value={formData.project_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                      placeholder="Infrastructure Unit"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400">Endpoint URL</Label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="vaw.tech"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Domain Renewal</Label>
                        <Input
                          type="date"
                          value={formData.domain_renewal_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, domain_renewal_date: e.target.value }))}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-400">Cycle</Label>
                        <Select value={formData.domain_renewal_cycle} onValueChange={(v) => setFormData(prev => ({ ...prev, domain_renewal_cycle: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Commit to Monitor</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Filter and Sort Bar */}
        <Tabs defaultValue="tech" className="w-full">
          <div className="flex items-center justify-center mb-8">
            <TabsList className="bg-white/5 border border-white/10 rounded-full p-1 h-14 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <TabsTrigger value="tech" className="rounded-full px-8 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white/60 transition-all font-semibold">
                <Globe className="w-4 h-4 mr-2" />
                Tech Monitor
              </TabsTrigger>
              <TabsTrigger value="marketing" className="rounded-full px-8 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/60 transition-all font-semibold">
                <PieChart className="w-4 h-4 mr-2" />
                Marketing Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tech" className="mt-0 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest First</SelectItem>
                <SelectItem value="created_asc">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
                <SelectItem value="urgency">Most Urgent</SelectItem>
                <SelectItem value="domain_renewal">Domain Renewal</SelectItem>
                <SelectItem value="server_renewal">Server Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        {projects.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Add your first project to start monitoring</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching projects</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterClient("all"); setFilterUrgency("all"); }}>
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map(project => {
              const domainStatus = getRenewalStatus(project.domain_renewal_date);
              const serverStatus = getRenewalStatus(project.server_renewal_date);
              const facebookStatus = getRenewalStatus(project.facebook_token_renewal_date);

              return (
                <Card key={project.id} className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.2)] flex flex-col">
                  {/* Website Preview */}
                  <div className="relative h-48 bg-black/60 border-b border-white/5 overflow-hidden rounded-t-xl">
                    <iframe
                      src={project.website_url}
                      className="w-full h-full pointer-events-none border-0"
                      title={project.project_name}
                      sandbox="allow-scripts allow-same-origin"
                      loading="lazy"
                    />
                    
                    {/* Status & Redirection - Moved to Bottom Right */}
                    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                      <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border border-white/10 shadow-lg">
                        {getStatusIcon(websiteStatuses[project.id])}
                      </div>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-full transition-colors"
                        onClick={() => window.open(project.website_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col items-center text-center relative z-20 bg-gradient-to-b from-white/5 to-transparent">
                    {/* Edit/Delete Actions (Absolute Top Right of Content) */}
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white rounded-full" onClick={() => handleEdit(project)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Centered Title & Client */}
                    <div className="mb-4 mt-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1">{project.project_name}</h3>
                      {project.clients && (
                        <p className="text-white/50 font-medium text-sm flex items-center justify-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {project.clients.company_name}
                        </p>
                      )}
                    </div>

                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors truncate max-w-full mb-6 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20"
                    >
                      <Globe className="w-4 h-4" />
                      {project.website_url}
                    </a>

                    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto mb-6">
                      {domainStatus && (
                        <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-3 hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${domainStatus.color.replace('text-', 'bg-').replace('100', '500/20').replace('800', '400')}`}>
                               <Globe className={`w-4 h-4 ${domainStatus.color.replace('bg-', 'text-').replace('100', '400')}`} />
                             </div>
                             <div className="text-left">
                               <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Domain</p>
                               <p className="text-sm font-semibold text-white/90">{domainStatus.label}</p>
                             </div>
                           </div>
                           <Badge variant="outline" className={`border-white/10 bg-white/5 text-white/70 px-2 py-0.5 rounded-lg`}>
                             {project.domain_renewal_cycle}
                           </Badge>
                        </div>
                      )}
                      
                      {serverStatus && (
                        <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-3 hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${serverStatus.color.replace('text-', 'bg-').replace('100', '500/20').replace('800', '400')}`}>
                               <Server className={`w-4 h-4 ${serverStatus.color.replace('bg-', 'text-').replace('100', '400')}`} />
                             </div>
                             <div className="text-left">
                               <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Server</p>
                               <p className="text-sm font-semibold text-white/90">{serverStatus.label}</p>
                             </div>
                           </div>
                           <Badge variant="outline" className={`border-white/10 bg-white/5 text-white/70 px-2 py-0.5 rounded-lg`}>
                             {project.server_renewal_cycle}
                           </Badge>
                        </div>
                      )}

                      {facebookStatus && (
                        <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl p-3 hover:bg-white/5 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${facebookStatus.color.replace('text-', 'bg-').replace('100', '500/20').replace('800', '400')}`}>
                               <Facebook className={`w-4 h-4 ${facebookStatus.color.replace('bg-', 'text-').replace('100', '400')}`} />
                             </div>
                             <div className="text-left">
                               <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">FB Token</p>
                               <p className="text-sm font-semibold text-white/90">{facebookStatus.label}</p>
                             </div>
                           </div>
                           <Badge variant="outline" className={`border-white/10 bg-white/5 text-white/70 px-2 py-0.5 rounded-lg`}>
                             {project.facebook_token_renewal_cycle}
                           </Badge>
                        </div>
                      )}
                    </div>

                    {project.notes && (
                      <div className="w-full max-w-sm mx-auto bg-black/20 rounded-2xl p-4 mb-6 border border-white/5">
                        <p className="text-sm text-white/60 font-medium italic text-center">"{project.notes}"</p>
                      </div>
                    )}
                    
                    <div className="mt-auto w-full pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Registry Date</span>
                        <span className="text-xs font-semibold text-white/50">
                          {format(new Date(project.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRenewal(project)}
                          className="bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors h-9 px-4"
                        >
                          <Calendar className="w-3.5 h-3.5 mr-2" />
                          Update
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => checkWebsiteStatus(project.id, project.website_url)}
                          className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-all hover:rotate-180"
                          title="Refresh Status"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Renewal Update Dialog */}
        <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Renewal Dates</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRenewalSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update_domain"
                    checked={renewalFormData.update_domain}
                    onCheckedChange={(checked) => setRenewalFormData(prev => ({ ...prev, update_domain: !!checked }))}
                  />
                  <Label htmlFor="update_domain" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Globe className="w-4 h-4" />
                    Domain Renewal
                  </Label>
                </div>
                {renewalFormData.update_domain && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cycle</Label>
                      <Select
                        value={renewalFormData.domain_renewal_cycle}
                        onValueChange={(v) => {
                          setRenewalFormData(prev => ({
                            ...prev,
                            domain_renewal_cycle: v,
                            domain_renewal_date: calculateNextRenewalDate(renewalProject?.domain_renewal_date || null, v)
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Date</Label>
                      <Input
                        type="date"
                        value={renewalFormData.domain_renewal_date}
                        onChange={(e) => setRenewalFormData(prev => ({ ...prev, domain_renewal_date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update_server"
                    checked={renewalFormData.update_server}
                    onCheckedChange={(checked) => setRenewalFormData(prev => ({ ...prev, update_server: !!checked }))}
                  />
                  <Label htmlFor="update_server" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Server className="w-4 h-4" />
                    Server Renewal
                  </Label>
                </div>
                {renewalFormData.update_server && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cycle</Label>
                      <Select
                        value={renewalFormData.server_renewal_cycle}
                        onValueChange={(v) => {
                          setRenewalFormData(prev => ({
                            ...prev,
                            server_renewal_cycle: v,
                            server_renewal_date: calculateNextRenewalDate(renewalProject?.server_renewal_date || null, v)
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Date</Label>
                      <Input
                        type="date"
                        value={renewalFormData.server_renewal_date}
                        onChange={(e) => setRenewalFormData(prev => ({ ...prev, server_renewal_date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update_facebook"
                    checked={renewalFormData.update_facebook}
                    onCheckedChange={(checked) => setRenewalFormData(prev => ({ ...prev, update_facebook: !!checked }))}
                  />
                  <Label htmlFor="update_facebook" className="flex items-center gap-2 font-medium cursor-pointer">
                    <Facebook className="w-4 h-4" />
                    Facebook Token Renewal
                  </Label>
                </div>
                {renewalFormData.update_facebook && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cycle</Label>
                      <Select
                        value={renewalFormData.facebook_token_renewal_cycle}
                        onValueChange={(v) => {
                          setRenewalFormData(prev => ({
                            ...prev,
                            facebook_token_renewal_cycle: v,
                            facebook_token_renewal_date: calculateNextRenewalDate(renewalProject?.facebook_token_renewal_date || null, v)
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="90days">90 Days</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Date</Label>
                      <Input
                        type="date"
                        value={renewalFormData.facebook_token_renewal_date}
                        onChange={(e) => setRenewalFormData(prev => ({ ...prev, facebook_token_renewal_date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsRenewalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </TabsContent>

        <TabsContent value="marketing" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Social Media Assets</h2>
            <Dialog open={isMarketingDialogOpen} onOpenChange={setIsMarketingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0f0f0f] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Add Social Media Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMarketingLink} className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <Label className="text-gray-400">Client</Label>
                    <Select value={marketingForm.clientId} onValueChange={v => setMarketingForm(prev => ({ ...prev, clientId: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select Client" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400">Platform</Label>
                    <Select value={marketingForm.platform} onValueChange={v => setMarketingForm(prev => ({ ...prev, platform: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Twitter">Twitter</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400">Profile URL</Label>
                    <Input required value={marketingForm.url} onChange={e => setMarketingForm(prev => ({ ...prev, url: e.target.value }))} className="bg-white/5 border-white/10" placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400">Additional Notes</Label>
                    <Textarea value={marketingForm.notes} onChange={e => setMarketingForm(prev => ({ ...prev, notes: e.target.value }))} className="bg-white/5 border-white/10" placeholder="Login info, target demographic, etc." />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsMarketingDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save Link</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clients.filter(c => marketingLinks.some(l => l.clientId === c.id)).length === 0 && (
              <Card className="p-12 text-center col-span-full border-white/10 bg-white/5">
                <PieChart className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-white mb-2">No Marketing Links Yet</h3>
                <p className="text-muted-foreground mb-4">Add social media links to track client profiles</p>
                <Button onClick={() => setIsMarketingDialogOpen(true)} variant="outline" className="border-white/10">Add First Link</Button>
              </Card>
            )}
            
            {clients.filter(c => marketingLinks.some(l => l.clientId === c.id)).map(client => {
              const clientLinks = marketingLinks.filter(l => l.clientId === client.id);
              return (
              <Card key={client.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    {client.company_name}
                  </h3>
                  <p className="text-white/50 text-sm font-medium">Social Media Profiles</p>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col gap-4 bg-gradient-to-b from-white/5 to-transparent">
                  {clientLinks.map((link) => {
                    const Icon = link.platform === 'Instagram' ? Instagram : link.platform === 'Facebook' ? Facebook : link.platform === 'Twitter' ? Twitter : Linkedin;
                    const color = link.platform === 'Instagram' ? 'text-pink-500' : link.platform === 'Facebook' ? 'text-blue-500' : link.platform === 'Twitter' ? 'text-sky-400' : 'text-sky-600';
                    const bg = link.platform === 'Instagram' ? 'bg-pink-500/10' : link.platform === 'Facebook' ? 'bg-blue-500/10' : 'bg-sky-500/10';

                    return (
                      <div key={link.id} className="flex flex-col p-4 rounded-xl bg-black/30 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${bg}`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white/90">{link.platform}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 truncate block">
                              {link.url}
                            </a>
                          </div>
                        </div>
                        {link.notes && (
                          <div className="bg-white/5 rounded p-2 text-xs text-white/60 italic border-l-2 border-purple-500/50">
                            {link.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              );
            })}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectMonitorPage;
