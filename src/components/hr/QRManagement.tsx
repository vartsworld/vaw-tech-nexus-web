import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  QrCode, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Link as LinkIcon,
  Copy,
  Check,
  Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const QRManagement = () => {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newQr, setNewQr] = useState({
    qr_id: "",
    target_url: "",
    description: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchQrCodes();
  }, []);

  const fetchQrCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_redirections')
        .select('*')
        .order('qr_id', { ascending: true });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to load QR code data.",
        variant: "destructive",
      });
    }
  };

  const handleAddQr = async () => {
    try {
      if (!newQr.qr_id || !newQr.target_url) {
        toast({
          title: "Missing fields",
          description: "Please fill in both QR ID and Target URL.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('qr_redirections')
        .insert([newQr])
        .select();

      if (error) throw error;

      setQrCodes([...qrCodes, data[0]]);
      setIsAddDialogOpen(false);
      setNewQr({ qr_id: "", target_url: "", description: "" });
      
      toast({
        title: "Success",
        description: "QR redirection added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding QR:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add QR redirection.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQr = async () => {
    try {
      if (!editingQr.qr_id || !editingQr.target_url) {
        toast({
          title: "Missing fields",
          description: "Please fill in both QR ID and Target URL.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('qr_redirections')
        .update({
          qr_id: editingQr.qr_id,
          target_url: editingQr.target_url,
          description: editingQr.description
        })
        .eq('id', editingQr.id);

      if (error) throw error;

      setQrCodes(qrCodes.map(qr => qr.id === editingQr.id ? editingQr : qr));
      setIsEditDialogOpen(false);
      setEditingQr(null);

      toast({
        title: "Success",
        description: "QR redirection updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating QR:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update QR redirection.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQr = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QR redirection?")) return;

    try {
      const { error } = await supabase
        .from('qr_redirections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQrCodes(qrCodes.filter(qr => qr.id !== id));
      toast({
        title: "Success",
        description: "QR redirection deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting QR:', error);
      toast({
        title: "Error",
        description: "Failed to delete QR redirection.",
        variant: "destructive",
      });
    }
  };

  const copyQrUrl = (qrId: string) => {
    const url = `${window.location.origin}/qr?id=${qrId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(qrId);
    toast({
      title: "Copied!",
      description: "QR URL copied to clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQrCodes = qrCodes.filter(qr => 
    qr.qr_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">QR Redirections</h2>
            <p className="text-muted-foreground text-sm">Manage where your printed QR codes lead.</p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Redirection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card border-border backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Redirection</DialogTitle>
              <CardDescription>Configure a new QR code target.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="qr_id" className="text-sm font-semibold">QR ID (e.g., 001, 82)</Label>
                <Input 
                  id="qr_id" 
                  placeholder="Enter ID from the printed card" 
                  value={newQr.qr_id}
                  onChange={(e) => setNewQr({...newQr, qr_id: e.target.value})}
                  className="rounded-xl bg-muted/50 border-border focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_url" className="text-sm font-semibold">Target Website URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="target_url" 
                    placeholder="https://client-portal.com" 
                    value={newQr.target_url}
                    onChange={(e) => setNewQr({...newQr, target_url: e.target.value})}
                    className="pl-10 rounded-xl bg-muted/50 border-border focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
                <Input 
                  id="description" 
                  placeholder="e.g., Client X Portal" 
                  value={newQr.description}
                  onChange={(e) => setNewQr({...newQr, description: e.target.value})}
                  className="rounded-xl bg-muted/50 border-border focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddQr} className="rounded-xl px-8">Save Link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-xl">
        <CardHeader className="border-b border-border p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Active Links
          </CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-full bg-muted/50 border-border focus:ring-primary transition-all text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[100px] font-bold text-muted-foreground">ID</TableHead>
                <TableHead className="font-bold text-muted-foreground">Target Destination</TableHead>
                <TableHead className="font-bold text-muted-foreground">Description</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQrCodes.length > 0 ? filteredQrCodes.map((qr) => (
                <TableRow key={qr.id} className="border-border hover:bg-muted/20 transition-colors group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-sm px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-lg">
                      {qr.qr_id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-md">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground truncate">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        {qr.target_url}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>Redirects from:</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-primary">vawtech.in/qr?id={qr.qr_id}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground italic">
                      {qr.description || "No description provided"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => copyQrUrl(qr.qr_id)}
                        title="Copy QR URL"
                      >
                        {copiedId === qr.qr_id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        onClick={() => window.open(qr.target_url.startsWith('http') ? qr.target_url : `https://${qr.target_url}`, '_blank')}
                        title="Test Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
                        onClick={() => {
                          setEditingQr(qr);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={() => handleDeleteQr(qr.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <QrCode className="h-12 w-12 mb-4 opacity-10" />
                      <p className="text-base font-medium">No QR links found</p>
                      <p className="text-sm opacity-60">Create your first redirection to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card border-border backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Redirection</DialogTitle>
            <CardDescription>Update configuration for QR ID {editingQr?.qr_id}</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_qr_id" className="text-sm font-semibold">QR ID</Label>
              <Input 
                id="edit_qr_id" 
                value={editingQr?.qr_id || ""}
                onChange={(e) => setEditingQr({...editingQr, qr_id: e.target.value})}
                className="rounded-xl bg-muted/50 border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_target_url" className="text-sm font-semibold">Target Website URL</Label>
              <Input 
                id="edit_target_url" 
                value={editingQr?.target_url || ""}
                onChange={(e) => setEditingQr({...editingQr, target_url: e.target.value})}
                className="rounded-xl bg-muted/50 border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description" className="text-sm font-semibold">Description</Label>
              <Input 
                id="edit_description" 
                value={editingQr?.description || ""}
                onChange={(e) => setEditingQr({...editingQr, description: e.target.value})}
                className="rounded-xl bg-muted/50 border-border focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpdateQr} className="rounded-xl px-8">Update Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRManagement;
