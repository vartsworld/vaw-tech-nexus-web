import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Trash2, Eye, EyeOff, AlertTriangle, Info, CheckCircle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";

interface Department {
  id: string;
  name: string;
}

interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  department_id: string | null;
}

const BannerManagement = () => {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    content: '',
    banner_type: 'info',
    target_audience: 'all',
    link_url: '',
    priority: 0,
    expires_at: '',
  });

  const { data: banners, refetch } = useRealtimeQuery<any[]>({
    queryKey: ['announcement-banners'],
    table: 'announcement_banners',
    select: '*',
    order: { column: 'created_at', ascending: false },
  });

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, []);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('id, name').order('name');
    if (data) setDepartments(data);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from('staff_profiles').select('id, user_id, full_name, department_id').eq('is_active', true).order('full_name');
    if (data) setStaffList(data);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Missing fields", description: "Title and content are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('announcement_banners').insert({
      title: form.title,
      content: form.content,
      banner_type: form.banner_type,
      target_audience: form.target_audience,
      target_department_ids: form.target_audience === 'department' ? selectedDeptIds : [],
      target_staff_ids: form.target_audience === 'selected_staff' ? selectedStaffIds : [],
      link_url: form.link_url || null,
      priority: form.priority,
      expires_at: form.expires_at || null,
      created_by: 'hr',
      created_by_role: 'hr',
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner created", description: "Announcement is now live" });
      setShowCreate(false);
      setForm({ title: '', content: '', banner_type: 'info', target_audience: 'all', link_url: '', priority: 0, expires_at: '' });
      setSelectedDeptIds([]);
      setSelectedStaffIds([]);
      refetch();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    await supabase.from('announcement_banners').update({ is_active: !currentState }).eq('id', id);
    refetch();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('announcement_banners').delete().eq('id', id);
    toast({ title: "Banner deleted" });
    refetch();
  };

  const toggleDept = (deptId: string) => {
    setSelectedDeptIds(prev => prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]);
  };

  const toggleStaff = (staffUserId: string) => {
    setSelectedStaffIds(prev => prev.includes(staffUserId) ? prev.filter(s => s !== staffUserId) : [...prev, staffUserId]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      event: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return <Badge className={colors[type] || colors.info}>{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Announcement Banners</h2>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Announcement Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Banner message..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.banner_type} onValueChange={v => setForm({ ...form, banner_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Warning</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="success">✅ Success</SelectItem>
                      <SelectItem value="event">📅 Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select value={form.target_audience} onValueChange={v => setForm({ ...form, target_audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 All Members</SelectItem>
                    <SelectItem value="department">🏢 Specific Departments</SelectItem>
                    <SelectItem value="selected_staff">👤 Selected Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.target_audience === 'department' && (
                <div>
                  <Label>Select Departments</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {departments.map(dept => (
                      <Badge
                        key={dept.id}
                        variant={selectedDeptIds.includes(dept.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDept(dept.id)}
                      >
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {form.target_audience === 'selected_staff' && (
                <div>
                  <Label>Select Staff Members</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {staffList.map(staff => (
                      <Badge
                        key={staff.user_id}
                        variant={selectedStaffIds.includes(staff.user_id) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleStaff(staff.user_id)}
                      >
                        {staff.full_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Expires At (optional)</Label>
                  <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                <Megaphone className="w-4 h-4 mr-2" /> Publish Banner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner list */}
      <div className="space-y-3">
        {(!banners || banners.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No banners yet. Create one to announce something to your team.
            </CardContent>
          </Card>
        ) : (
          banners.map((banner: any) => (
            <Card key={banner.id} className={`${!banner.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {getTypeIcon(banner.banner_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">{banner.title}</h4>
                      {getTypeBadge(banner.banner_type)}
                      <Badge variant="outline" className="text-xs">
                        {banner.target_audience === 'all' ? 'All' : banner.target_audience === 'department' ? 'Dept' : 'Staff'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{banner.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(banner.created_at).toLocaleDateString()}
                      {banner.expires_at && ` · Expires ${new Date(banner.expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(banner.id, banner.is_active)}>
                      {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBanner(banner.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
