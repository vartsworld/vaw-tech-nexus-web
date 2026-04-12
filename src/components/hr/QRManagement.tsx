import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Layers, 
  User, 
  Check,
  Building,
  Key,
  Shield,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const QRManagement = () => {
  const [portals, setPortals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPortalOpen, setIsAddPortalOpen] = useState(false);
  const [isEditPortalOpen, setIsEditPortalOpen] = useState(false);
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<any>(null);
  const [portalLinks, setPortalLinks] = useState<any[]>([]);
  
  const [newPortal, setNewPortal] = useState({
    client_id: "",
    description: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPortals();
    fetchClients();
  }, []);

  const fetchPortals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('client_portals')
        .select(`
          *,
          client:clients(*),
          portal_links:portal_links(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortals(data || []);
    } catch (error) {
      console.error('Error fetching portals:', error);
      toast({
        title: "Error",
        description: "Failed to load portals.",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, email, phone')
        .order('company_name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchPortalLinks = async (clientId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('portal_links')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPortalLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const handleAddPortal = async () => {
    try {
      if (!newPortal.client_id) {
        toast({
          title: "Incomplete",
          description: "Please select a client.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await (supabase as any)
        .from('client_portals')
        .insert([newPortal])
        .select(`
          *,
          client:clients(*)
        `);

      if (error) throw error;

      setPortals([...portals, data[0]]);
      setIsAddPortalOpen(false);
      setNewPortal({ client_id: "", description: "" });
      
      toast({
        title: "Success",
        description: "Client added to portals.",
      });
    } catch (error: any) {
      console.error('Error adding portal:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePortal = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client?")) return;

    try {
      const { error } = await (supabase as any)
        .from('client_portals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPortals(portals.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Client removed.",
      });
    } catch (error) {
      console.error('Error deleting portal:', error);
      toast({
        title: "Error",
        description: "Failed to remove client.",
        variant: "destructive",
      });
    }
  };

  const handleAddPortalLink = async (clientId: string) => {
    try {
      const newCard = {
        client_id: clientId,
        title: "New Page",
        url: "",
        description: "Simple description for the client",
        icon: "layers",
        page_id: "",
        password: "",
        is_active: true
      };

      const { data, error } = await (supabase as any)
        .from('portal_links')
        .insert([newCard])
        .select();

      if (error) throw error;
      setPortalLinks([...portalLinks, data[0]]);
      toast({ title: "New page added" });
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const handleUpdatePortalLink = async (id: string, updates: any) => {
    try {
      const { error } = await (supabase as any)
        .from('portal_links')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setPortalLinks(portalLinks.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (error) {
      console.error('Error updating page:', error);
    }
  };

  const handleDeletePortalLink = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('portal_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPortalLinks(portalLinks.filter(l => l.id !== id));
      toast({ title: "Page removed" });
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const filteredPortals = portals.filter(p => 
    p.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client?.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Layers className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Client Portals</h2>
            <p className="text-muted-foreground text-sm font-medium">Add and manage pages for each client.</p>
          </div>
        </div>
        
        <Dialog open={isAddPortalOpen} onOpenChange={setIsAddPortalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 border-0 h-10 px-6 font-bold">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-white/5 backdrop-blur-2xl text-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Select Client</DialogTitle>
              <CardDescription className="font-semibold italic">Choose a client from your records.</CardDescription>
            </DialogHeader>
            <div className="space-y-6 py-6 font-primary">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-40 italic">Client List</Label>
                <Select 
                  value={newPortal.client_id} 
                  onValueChange={(val) => setNewPortal({...newPortal, client_id: val})}
                >
                  <SelectTrigger className="rounded-2xl bg-muted/50 border-0 h-12">
                    <SelectValue placeholder="Click to see all clients" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/5 backdrop-blur-3xl max-h-[300px]">
                    {clients.length > 0 ? clients.map(client => (
                      <SelectItem key={client.id} value={client.id} className="rounded-xl my-1">
                        <div className="flex flex-col text-left py-1">
                          <span className="font-black text-sm">{client.company_name}</span>
                          <span className="text-[10px] opacity-60 font-bold">{client.email || client.phone || "No contact info"}</span>
                        </div>
                      </SelectItem>
                    )) : (
                      <div className="p-4 text-center text-sm font-bold opacity-40">No clients found in records.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-40 italic">Portal Description</Label>
                <Input 
                  placeholder="e.g. Service Portal" 
                  value={newPortal.description}
                  onChange={(e) => setNewPortal({...newPortal, description: e.target.value})}
                  className="rounded-2xl bg-muted/50 border-0 h-12 font-medium"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsAddPortalOpen(false)} className="rounded-2xl flex-1 h-12 font-bold transition-all">Cancel</Button>
              <Button onClick={handleAddPortal} className="rounded-2xl flex-1 bg-amber-500 hover:bg-amber-600 h-12 font-bold">Save Portal</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditPortalOpen} onOpenChange={setIsEditPortalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl bg-card border-white/5 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Edit Portal</DialogTitle>
              <CardDescription className="font-semibold italic">Change the details for this client.</CardDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-40 italic">Client Name</Label>
                <Input 
                  value={selectedPortal?.client?.company_name || ""} 
                  disabled
                  className="rounded-2xl bg-muted/30 border-0 h-12 font-bold opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black opacity-40 italic">Description</Label>
                <Input 
                  placeholder="What is this portal for?" 
                  defaultValue={selectedPortal?.description || ""}
                  onBlur={(e) => setSelectedPortal({...selectedPortal, description: e.target.value})}
                  className="rounded-2xl bg-muted/50 border-0 h-12 font-medium"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsEditPortalOpen(false)} className="rounded-2xl flex-1 h-12 font-bold transition-all">Cancel</Button>
              <Button 
                onClick={async () => {
                  try {
                    const { error } = await (supabase as any)
                      .from('client_portals')
                      .update({ description: selectedPortal.description })
                      .eq('id', selectedPortal.id);
                    if (error) throw error;
                    setPortals(portals.map(p => p.id === selectedPortal.id ? selectedPortal : p));
                    setIsEditPortalOpen(false);
                    toast({ title: "Updated successfully" });
                  } catch (e) {
                    console.error(e);
                  }
                }} 
                className="rounded-2xl flex-1 bg-amber-500 hover:bg-amber-600 h-12 font-bold"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-white/5 bg-background/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border">
        <CardHeader className="border-b border-white/5 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <Shield className="h-6 w-6 text-amber-500" />
            Active Portals
          </CardTitle>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-full bg-muted/30 border-0 focus:ring-amber-500/20 transition-all font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-white/5 hover:bg-transparent h-16">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest italic">Client Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest italic">Contact Info</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest italic">Description</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest italic">Tools</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPortals.length > 0 ? filteredPortals.map((p) => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all group h-24">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                        <Building className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg -mb-1">{p.client?.company_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500/60 tracking-widest uppercase">
                          <Check className="h-3 w-3" />
                          Active
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {p.client?.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {p.client?.phone || "No phone"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                       <span className="text-sm font-medium opacity-60 italic max-w-xs block truncate bg-muted/20 px-3 py-1.5 rounded-xl border border-white/5">
                        {p.description || "Client Workspace"}
                      </span>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/10 text-[10px] font-black">
                            {p.portal_links?.[0]?.count || 0} Pages Added
                         </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 border border-amber-500/10 font-black"
                        onClick={() => {
                          setSelectedPortal(p);
                          fetchPortalLinks(p.client_id);
                          setIsCardsDialogOpen(true);
                        }}
                        title="Manage Pages"
                      >
                        <Plus className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-amber-500 hover:bg-white/10 border border-white/10"
                        title="Edit Info"
                        onClick={() => {
                          setSelectedPortal({ ...p });
                          setIsEditPortalOpen(true);
                        }}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-white/10 border border-white/10"
                        title="Open Portal"
                        onClick={() => window.open('/portal', '_blank')}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-destructive/10"
                        onClick={() => handleDeletePortal(p.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-96 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <Layers className="h-20 w-20 mb-2" />
                      <p className="text-2xl font-black tracking-tighter uppercase">No clients added yet</p>
                      <p className="text-sm font-bold uppercase tracking-[0.2em]">Start by adding a client portal</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Portal Pages Management Dialog */}
      <Dialog open={isCardsDialogOpen} onOpenChange={setIsCardsDialogOpen}>
        <DialogContent className="sm:max-w-[750px] rounded-[3rem] bg-card border-white/5 backdrop-blur-3xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-3xl font-black tracking-tighter">PORTAL PAGES</DialogTitle>
            <CardDescription className="text-lg font-bold opacity-60">
              Adding pages for <span className="text-amber-500 font-black">{selectedPortal?.client?.company_name}</span>
            </CardDescription>
          </DialogHeader>

          <div className="space-y-6 py-8 overflow-y-auto max-h-[65vh] px-8 custom-scrollbar">
            <div className="flex justify-between items-center bg-gradient-to-r from-amber-500/10 via-transparent to-transparent p-6 rounded-[2rem] border border-amber-500/20 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                   <h4 className="font-black text-lg tracking-tight">Add a Page</h4>
                   <p className="text-xs font-bold opacity-40 uppercase tracking-widest italic">Create a new link for this client</p>
                </div>
              </div>
              <Button 
                onClick={() => handleAddPortalLink(selectedPortal?.client_id)} 
                className="rounded-2xl h-12 px-8 bg-amber-500 hover:bg-amber-600 font-black shadow-lg shadow-amber-500/10"
              >
                ADD PAGE
              </Button>
            </div>

            <div className="grid gap-6">
              {portalLinks.map((link, index) => (
                <div key={link.id} className="relative group/card bg-muted/20 hover:bg-muted/30 transition-all rounded-[2rem] p-6 border border-white/5 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                          <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">Page Title</Label>
                          <Input 
                            defaultValue={link.title} 
                            onBlur={(e) => handleUpdatePortalLink(link.id, { title: e.target.value })}
                            className="h-12 bg-background/50 border-0 rounded-2xl font-black text-lg focus:ring-amber-500/20"
                          />
                        </div>
                        <div className="space-y-2 w-32">
                          <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">Icon</Label>
                          <Select 
                            value={link.icon} 
                            onValueChange={(val) => handleUpdatePortalLink(link.id, { icon: val })}
                          >
                            <SelectTrigger className="h-12 bg-background/50 border-0 rounded-2xl focus:ring-primary/20 transition-all">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/5 backdrop-blur-2xl">
                              <SelectItem value="layers"><div className="flex items-center gap-2 font-bold"><Layers className="h-4 w-4" /> Default</div></SelectItem>
                              <SelectItem value="user"><div className="flex items-center gap-2 font-bold"><User className="h-4 w-4" /> Profile</div></SelectItem>
                              <SelectItem value="card"><div className="flex items-center gap-2 font-bold"><Building className="h-4 w-4" /> ID Card</div></SelectItem>
                              <SelectItem value="settings"><div className="flex items-center gap-2 font-bold"><Edit className="h-4 w-4" /> Admin</div></SelectItem>
                              <SelectItem value="shield"><div className="flex items-center gap-2 font-bold"><Shield className="h-4 w-4" /> Secure</div></SelectItem>
                              <SelectItem value="key"><div className="flex items-center gap-2 font-bold"><Key className="h-4 w-4" /> Credentials</div></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">Link / URL</Label>
                        <div className="relative">
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                          <Input 
                             defaultValue={link.url} 
                             onBlur={(e) => handleUpdatePortalLink(link.id, { url: e.target.value })}
                             placeholder="vawtech.in/admin-v2"
                             className="pl-12 h-12 bg-background/50 border-0 rounded-2xl font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">Description</Label>
                        <Input 
                           defaultValue={link.description} 
                           onBlur={(e) => handleUpdatePortalLink(link.id, { description: e.target.value })}
                           className="h-12 bg-background/50 border-0 rounded-2xl font-medium text-sm"
                        />
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between border-t border-white/5">
                        <div className="flex gap-4">
                           <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">User ID / Login</Label>
                              <Input 
                                 defaultValue={link.page_id || ""} 
                                 onBlur={(e) => handleUpdatePortalLink(link.id, { page_id: e.target.value })}
                                 placeholder="USERID"
                                 className="h-10 w-36 bg-background/50 border-0 rounded-xl font-bold"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black opacity-30 tracking-widest pl-1 italic">Password / Key</Label>
                              <Input 
                                 defaultValue={link.password || ""} 
                                 onBlur={(e) => handleUpdatePortalLink(link.id, { password: e.target.value })}
                                 placeholder="PASSWORD"
                                 className="h-10 w-36 bg-background/50 border-0 rounded-xl font-bold"
                              />
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-auto">
                          <div className="flex items-center gap-2 bg-background/40 px-4 py-2.5 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black uppercase opacity-60">Shown</span>
                            <Switch 
                               checked={link.is_active} 
                               onCheckedChange={(val) => handleUpdatePortalLink(link.id, { is_active: val })}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => handleDeletePortalLink(link.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {portalLinks.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-[3rem] border border-dashed border-white/10">
                   <h4 className="text-xl font-black opacity-60">NO PAGES ADDED</h4>
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 max-w-[200px] mx-auto mt-2">Initialize your first page to build the portal</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-8 pb-8 flex justify-end gap-3 translate-y-[-10px]">
             <Button 
               onClick={() => setIsCardsDialogOpen(false)} 
               className="rounded-2xl h-12 px-10 bg-amber-500 hover:bg-amber-600 font-black"
             >
               Save Changes
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRManagement;
