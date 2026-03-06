import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Briefcase,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Key,
  Lock,
  Eye,
  EyeOff,
  Folder,
  Loader2,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SharedProjectForm from "../projects/SharedProjectForm";
import { syncClientToBilling, fetchClientFromBilling, searchClientsInBilling } from "@/utils/syncUtils";

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedClientForPassword, setSelectedClientForPassword] = useState<any>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [selectedClientForSync, setSelectedClientForSync] = useState<any>(null);
  const [syncCode, setSyncCode] = useState("");
  const [externalClientPreview, setExternalClientPreview] = useState<any>(null);
  const [linkedBillingClient, setLinkedBillingClient] = useState<any>(null);
  const [isLoadingLinkedClient, setIsLoadingLinkedClient] = useState(false);
  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalSearchQuery, setExternalSearchQuery] = useState("");

  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: "active"
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const { toast } = useToast();

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedClientForProjects, setSelectedClientForProjects] = useState<any>(null);
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    project_type: "website" as "website" | "marketing" | "design" | "ai" | "vr-ar" | "other"
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    console.log('Fetching clients from table: clients');
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Client Fetch Result:', { data, error });
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients.",
        variant: "destructive",
      });
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const handleAddClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a client.",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating client with user:', user.id);

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...newClient,
          created_by: user.id
        })
        .select('id, company_name, contact_person, email, phone, address, status, notes, created_at, billing_sync_id')
        .single();

      if (error) {
        console.error('Client creation error:', error);
        throw error;
      }

      setClients([data, ...clients]);
      setIsAddDialogOpen(false);
      setNewClient({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        status: "active"
      });

      toast({
        title: "Success",
        description: "Client created successfully. Use the Sync Bridge to connect with billing software.",
      });
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Check if you have proper permissions.",
        variant: "destructive",
      });
    }
  };

  const handleSavePassword = async () => {
    if (!selectedClientForPassword) return;

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    const action = selectedClientForPassword.user_id ? 'reset' : 'create';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in.");
      }

      const res = await fetch(`https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/client-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          client_profile_id: selectedClientForPassword.id,
          email: selectedClientForPassword.email,
          action,
          password: password
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast({
        title: "Success",
        description: `Password ${action === 'create' ? 'created' : 'updated'} successfully for ${selectedClientForPassword.company_name}.`
      });

      // Refresh clients to update user_id linkage if created
      await fetchClients();

      setIsPasswordDialogOpen(false);
      setPassword("");
      setConfirmPassword("");
      setSelectedClientForPassword(null);

    } catch (error: any) {
      console.error('Error saving password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save password.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const fetchClientProjects = async (clientId) => {
    setIsLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('client_projects')
        .select('id, title, description, status, project_type, progress, created_at, client_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectSuccess = (newProject: any) => {
    setClientProjects([newProject, ...clientProjects]);
    setIsAddProjectDialogOpen(false);
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from('client_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setClientProjects(clientProjects.filter(p => p.id !== projectId));
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          company_name: editingClient.company_name,
          contact_person: editingClient.contact_person,
          email: editingClient.email,
          phone: editingClient.phone,
          address: editingClient.address,
          notes: editingClient.notes,
          status: editingClient.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingClient.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // Refresh client list from database
      await fetchClients();

      setIsEditDialogOpen(false);
      setEditingClient(null);

      toast({
        title: "Success",
        description: "Client updated successfully.",
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyExternalCode = async () => {
    if (!syncCode || syncCode.length < 3) return;
    setIsVerifyingCode(true);
    setExternalClientPreview(null);
    try {
      const client = await fetchClientFromBilling(syncCode);
      if (client) {
        setExternalClientPreview(client);
        toast({
          title: "Client Verified",
          description: `Found: ${client.name} (${client.client_code})`
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not find client in billing software.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSearchExternalClients = async () => {
    if (!externalSearchQuery || externalSearchQuery.length < 2) return;
    setIsSearchingExternal(true);
    try {
      const results = await searchClientsInBilling(externalSearchQuery);
      setExternalSearchResults(Array.isArray(results) ? results : (results ? [results] : []));
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search external clients.",
        variant: "destructive"
      });
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const handleSyncClient = async (codeToUse: string, externalClient?: any) => {
    if (!selectedClientForSync || !codeToUse) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ billing_sync_id: codeToUse })
        .eq('id', selectedClientForSync.id);

      if (error) throw error;

      // Also update client_profiles if it exists
      if (selectedClientForSync.email) {
        await supabase
          .from('client_profiles')
          .update({ billing_sync_id: codeToUse })
          .eq('email', selectedClientForSync.email);
      }

      // Try external sync but don't block the link operation
      try {
        await syncClientToBilling(selectedClientForSync, codeToUse);
      } catch (extError) {
        console.warn('External sync notification failed (link still saved):', extError);
      }

      await fetchClients();
      setIsSyncDialogOpen(false);
      setSyncCode("");
      setExternalClientPreview(null);
      setExternalSearchResults([]);
      setExternalSearchQuery("");
      setSelectedClientForSync(null);

      toast({
        title: "Link Successful",
        description: `Client bridged with billing software (ID: ${codeToUse}).`
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to link client.",
        variant: "destructive"
      });
    }
  };

  const handleUnlinkClient = async () => {
    if (!selectedClientForSync) return;
    try {
      await supabase.from('clients').update({ billing_sync_id: null }).eq('id', selectedClientForSync.id);
      if (selectedClientForSync.email) {
        await supabase.from('client_profiles').update({ billing_sync_id: null }).eq('email', selectedClientForSync.email);
      }
      await fetchClients();
      setIsSyncDialogOpen(false);
      setSelectedClientForSync(null);
      toast({ title: "Unlinked", description: "Client disconnected from billing software." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== clientId));
      toast({
        title: "Success",
        description: "Client deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Client Management</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={newClient.contact_person}
                  onChange={(e) => setNewClient({ ...newClient, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newClient.status} onValueChange={(value) => setNewClient({ ...newClient, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddClient}>
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company name, contact person, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.company_name}</div>
                    {client.address && (
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {client.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{client.contact_person}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setSelectedClientForSync(client);
                          setSyncCode(client.billing_sync_id || "");
                          setLinkedBillingClient(null);
                          setIsSyncDialogOpen(true);
                          if (client.billing_sync_id) {
                            setIsLoadingLinkedClient(true);
                            try {
                              const billingData = await fetchClientFromBilling(client.billing_sync_id);
                              setLinkedBillingClient(billingData || null);
                            } catch (e) {
                              console.warn('Could not fetch linked billing client:', e);
                            } finally {
                              setIsLoadingLinkedClient(false);
                            }
                          }
                        }
                        className={client.billing_sync_id ? "text-green-600" : "text-amber-600"}
                        title={client.billing_sync_id ? `Synced: ${client.billing_sync_id}` : "Sync with Billing"}
                      >
                        <RefreshCw className={`h-4 w-4 ${client.billing_sync_id ? "" : "animate-pulse"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!client.email) {
                            toast({
                              title: "Missing Email",
                              description: "Please update the client email before creating a password.",
                              variant: "destructive"
                            });
                            return;
                          }
                          setSelectedClientForPassword(client);
                          setPassword("");
                          setConfirmPassword("");
                          setIsPasswordDialogOpen(true);
                        }}
                        className="text-blue-600"
                        title={client.user_id ? "Change Password" : "Create Login"}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClientForProjects(client);
                          fetchClientProjects(client.id);
                          setIsProjectDialogOpen(true);
                        }}
                        className="text-indigo-600"
                        title="Manage Projects"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingClient(client);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No clients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      {editingClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_company_name">Company Name</Label>
                <Input
                  id="edit_company_name"
                  value={editingClient.company_name}
                  onChange={(e) => setEditingClient({ ...editingClient, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="edit_contact_person">Contact Person</Label>
                <Input
                  id="edit_contact_person"
                  value={editingClient.contact_person}
                  onChange={(e) => setEditingClient({ ...editingClient, contact_person: e.target.value })}
                  placeholder="Enter contact person name"
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="edit_phone">Phone (Optional)</Label>
                <Input
                  id="edit_phone"
                  value={editingClient.phone || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit_address">Address (Optional)</Label>
                <Input
                  id="edit_address"
                  value={editingClient.address || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="edit_notes">Notes (Optional)</Label>
                <Textarea
                  id="edit_notes"
                  value={editingClient.notes || ""}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={editingClient.status} onValueChange={(value) => setEditingClient({ ...editingClient, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingClient(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleEditClient}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Password Management Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClientForPassword?.user_id ? 'Change Password' : 'Create Client Login'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
              Creating login credentials for <strong>{selectedClientForPassword?.email}</strong>
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePassword} disabled={isSavingPassword}>
                {isSavingPassword ? "Saving..." : "Save Password"}
              </Button>
            </div>
            <div className="flex justify-center border-t pt-4 mt-2">
              <Button
                variant="link"
                size="sm"
                className="text-xs text-gray-500"
                onClick={() => {
                  setPassword("vaw123*");
                  setConfirmPassword("vaw123*");
                }}
              >
                Set Default: vaw123*
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Management Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>Projects - {selectedClientForProjects?.company_name}</DialogTitle>
              <Button size="sm" onClick={() => setIsAddProjectDialogOpen(true)} className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                New Project
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {isLoadingProjects ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : clientProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No projects found for this client.
              </div>
            ) : (
              <div className="grid gap-3">
                {clientProjects.map((project) => (
                  <Card key={project.id} className="border-gray-100 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{project.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {project.project_type}
                          </Badge>
                          <Badge className="text-[10px] uppercase" variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="max-w-md bg-[#0f0f0f] border-white/5 text-white">
          <DialogHeader>
            <DialogTitle>Initialize New Project</DialogTitle>
          </DialogHeader>
          <SharedProjectForm
            clientId={selectedClientForProjects?.id}
            onSuccess={handleProjectSuccess}
            onCancel={() => setIsAddProjectDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Sync Bridge Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={(open) => {
        setIsSyncDialogOpen(open);
        if (!open) {
          setSyncCode("");
          setExternalClientPreview(null);
          setExternalSearchResults([]);
          setExternalSearchQuery("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Billing Software Sync Bridge</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 rounded-lg text-white">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-indigo-900">Bridge Connection Matrix</h4>
              </div>
              <p className="text-sm text-indigo-800">
                Connect <strong>{selectedClientForSync?.company_name}</strong> to the billing software using its unique Client Code to synchronize financial entries.
              </p>
            </div>

            {/* Show linked info if already synced */}
            {selectedClientForSync?.billing_sync_id && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Currently Linked</p>
                    <p className="text-sm font-bold text-green-900 mt-1">Billing Code: {selectedClientForSync.billing_sync_id}</p>
                  </div>
                  <Badge className="bg-green-600 text-white">{selectedClientForSync.billing_sync_id}</Badge>
                </div>

                {/* Client details from billing API */}
                <div className="space-y-1.5 text-sm text-green-900 border-t border-green-200 pt-2">
                  {isLoadingLinkedClient ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                      <span className="text-green-700 text-xs">Fetching from billing software...</span>
                    </div>
                  ) : linkedBillingClient ? (
                    <>
                      {(linkedBillingClient.company_name || linkedBillingClient.name) && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-green-600" />
                          <span className="font-medium">{linkedBillingClient.company_name || linkedBillingClient.name}</span>
                        </div>
                      )}
                      {(linkedBillingClient.contact_person) && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xs">👤</span>
                          <span>{linkedBillingClient.contact_person}</span>
                        </div>
                      )}
                      {linkedBillingClient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-green-600" />
                          <span>{linkedBillingClient.email}</span>
                        </div>
                      )}
                      {linkedBillingClient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-green-600" />
                          <span>{linkedBillingClient.phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-green-700 italic">Could not fetch details from billing software.</p>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleUnlinkClient}
                >
                  Unlink from Billing Software
                </Button>
              </div>
            )}

            {!selectedClientForSync?.billing_sync_id && (
            <Tabs defaultValue="search" className="space-y-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="search">Search Database</TabsTrigger>
                <TabsTrigger value="manual">Manual Code</TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search client name or code..."
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchExternalClients()}
                  />
                  <Button size="icon" onClick={handleSearchExternalClients} disabled={isSearchingExternal}>
                    {isSearchingExternal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {Array.isArray(externalSearchResults) && externalSearchResults.map((client: any) => (
                    <button
                      key={client.id || client.client_code}
                      onClick={() => handleSyncClient(client.client_code, client)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-indigo-50 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-900">
                            {client.name || client.company_name || "Unnamed Client"}
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium">
                            {client.email || "No email provided"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-[10px] font-bold">
                          {client.client_code}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {externalSearchResults.length === 0 && !isSearchingExternal && (
                    <p className="text-xs text-gray-500 text-center py-4">Search for an external client to link.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 pt-2">
                <div className="space-y-3">
                  <div className="flex gap-2 text-black">
                    <Input
                      placeholder="Enter Client Code (e.g. F30745)"
                      value={syncCode}
                      onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                      className="text-center font-bold"
                    />
                    <Button onClick={handleVerifyExternalCode} disabled={isVerifyingCode || !syncCode}>
                      {isVerifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>

                  {externalClientPreview && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Matched Client</p>
                          <h4 className="text-sm font-bold text-green-900">{externalClientPreview.name}</h4>
                        </div>
                        <Badge className="bg-green-600">{externalClientPreview.client_code}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-green-800">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {externalClientPreview.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {externalClientPreview.phone}
                        </div>
                      </div>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl mt-2"
                        onClick={() => handleSyncClient(externalClientPreview.client_code, externalClientPreview)}
                      >
                        Confirm & Link
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsSyncDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default ClientManagement;