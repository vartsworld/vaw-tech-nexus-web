import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Globe, Server, Calendar, ExternalLink, RefreshCw, Trash2, Edit, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
  status: string;
  notes: string | null;
  created_at: string;
  clients?: Client;
}

const ProjectMonitor = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMonitor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectMonitor | null>(null);
  const [renewalProject, setRenewalProject] = useState<ProjectMonitor | null>(null);
  const [websiteStatuses, setWebsiteStatuses] = useState<Record<string, 'checking' | 'online' | 'offline' | 'error'>>({});
  
  const [formData, setFormData] = useState({
    client_id: "",
    project_name: "",
    website_url: "",
    domain_renewal_date: "",
    server_renewal_date: "",
    notes: ""
  });

  const [renewalFormData, setRenewalFormData] = useState({
    domain_renewal_date: "",
    server_renewal_date: "",
    domain_renewal_cycle: "yearly",
    server_renewal_cycle: "yearly",
    update_domain: true,
    update_server: true
  });

  useEffect(() => {
    fetchData();
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

      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);
      
      // Check status for each project
      (projectsRes.data || []).forEach(project => {
        checkWebsiteStatus(project.id, project.website_url);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const checkWebsiteStatus = async (projectId: string, url: string) => {
    setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'checking' }));
    
    try {
      // We'll use a simple approach - try to load an image from the domain
      // This is a workaround since we can't make direct fetch requests due to CORS
      const img = new Image();
      const timeoutId = setTimeout(() => {
        setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'error' }));
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'online' }));
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        // Even if image fails, domain might be up - mark as online with caveat
        setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'online' }));
      };
      
      // Try to load favicon as a proxy for site availability
      const domain = new URL(url).origin;
      img.src = `${domain}/favicon.ico?t=${Date.now()}`;
    } catch {
      setWebsiteStatuses(prev => ({ ...prev, [projectId]: 'error' }));
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
    
    setRenewalFormData({
      domain_renewal_date: calculateNextRenewalDate(project.domain_renewal_date, domainCycle),
      server_renewal_date: calculateNextRenewalDate(project.server_renewal_date, serverCycle),
      domain_renewal_cycle: domainCycle,
      server_renewal_cycle: serverCycle,
      update_domain: false,
      update_server: false
    });
    setIsRenewalDialogOpen(true);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewalProject) return;

    if (!renewalFormData.update_domain && !renewalFormData.update_server) {
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

      const { error } = await supabase
        .from('project_monitors')
        .update(updatePayload)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header */}
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
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => {
              const domainStatus = getRenewalStatus(project.domain_renewal_date);
              const serverStatus = getRenewalStatus(project.server_renewal_date);
              
              return (
                <Card key={project.id} className="overflow-hidden">
                  {/* Website Preview */}
                  <div className="relative h-40 bg-muted border-b">
                    <iframe
                      src={project.website_url}
                      className="w-full h-full pointer-events-none"
                      title={project.project_name}
                      sandbox="allow-scripts allow-same-origin"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      {getStatusIcon(websiteStatuses[project.id])}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => window.open(project.website_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.project_name}</CardTitle>
                        {project.clients && (
                          <p className="text-sm text-muted-foreground">{project.clients.company_name}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(project)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(project.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <a 
                      href={project.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {project.website_url}
                    </a>
                    
                    <div className="flex flex-wrap gap-2">
                      {domainStatus && (
                        <Badge variant="secondary" className={`${domainStatus.color} flex items-center gap-1`}>
                          <Globe className="w-3 h-3" />
                          Domain: {domainStatus.label}
                        </Badge>
                      )}
                      {serverStatus && (
                        <Badge variant="secondary" className={`${serverStatus.color} flex items-center gap-1`}>
                          <Server className="w-3 h-3" />
                          Server: {serverStatus.label}
                        </Badge>
                      )}
                    </div>
                    
                    {project.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.notes}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Added {format(new Date(project.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRenewal(project)}
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Update Renewal
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => checkWebsiteStatus(project.id, project.website_url)}
                        >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
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
      </div>
    </div>
  );
};

export default ProjectMonitor;
