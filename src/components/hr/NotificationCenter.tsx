import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Bell,
  Plus,
  Send,
  Users,
  Building2,
  AlertCircle,
  Info,
  CheckCircle,
  Calendar,
  Eye,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    content: "",
    type: "announcement",
    target_type: "all",
    department_id: "",
    target_users: [],
    is_urgent: false,
    expires_at: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchDepartments();
    fetchStaff();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_notifications')
        .select(`
          *,
          created_by_profile:staff_profiles!staff_notifications_created_by_fkey(full_name, username),
          departments(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, full_name, username')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const notificationData: any = {
        title: newNotification.title,
        content: newNotification.content,
        type: newNotification.type as 'announcement' | 'task_assigned' | 'mood_alert' | 'achievement',
        is_urgent: newNotification.is_urgent,
        created_by: user?.id || crypto.randomUUID(),
        expires_at: newNotification.expires_at || null
      };

      // Set target based on selection
      if (newNotification.target_type === "department" && newNotification.department_id) {
        notificationData.department_id = newNotification.department_id;
      } else if (newNotification.target_type === "specific" && newNotification.target_users.length > 0) {
        notificationData.target_users = newNotification.target_users;
      }

      const { data, error } = await supabase
        .from('staff_notifications')
        .insert(notificationData)
        .select(`
          *,
          created_by_profile:staff_profiles!staff_notifications_created_by_fkey(full_name, username),
          departments(name)
        `)
        .single();

      if (error) throw error;

      setNotifications([data, ...notifications]);
      setIsCreateDialogOpen(false);
      setNewNotification({
        title: "",
        content: "",
        type: "announcement",
        target_type: "all",
        department_id: "",
        target_users: [],
        is_urgent: false,
        expires_at: ""
      });

      toast({
        title: "Success",
        description: "Notification sent successfully.",
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const { error } = await supabase
        .from('staff_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.filter(notif => notif.id !== notificationId));

      toast({
        title: "Success",
        description: "Notification deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement': return Info;
      case 'alert': return AlertCircle;
      case 'reminder': return Calendar;
      case 'celebration': return CheckCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type, isUrgent) => {
    if (isUrgent) return 'border-red-200 bg-red-50';
    
    switch (type) {
      case 'announcement': return 'border-blue-200 bg-blue-50';
      case 'alert': return 'border-orange-200 bg-orange-50';
      case 'reminder': return 'border-yellow-200 bg-yellow-50';
      case 'celebration': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTargetDisplay = (notification) => {
    if (notification.target_users && notification.target_users.length > 0) {
      return `${notification.target_users.length} specific users`;
    } else if (notification.department_id) {
      return notification.departments?.name || 'Department';
    } else {
      return 'All Staff';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Notification Center</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="Enter notification title"
                />
              </div>
              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={newNotification.content}
                  onChange={(e) => setNewNotification({...newNotification, content: e.target.value})}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Notification Type</Label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="urgent"
                    checked={newNotification.is_urgent}
                    onCheckedChange={(checked) => setNewNotification({...newNotification, is_urgent: checked})}
                  />
                  <Label htmlFor="urgent">Mark as Urgent</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="target_type">Send To</Label>
                <Select value={newNotification.target_type} onValueChange={(value) => setNewNotification({...newNotification, target_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="department">Specific Department</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newNotification.target_type === "department" && (
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newNotification.department_id} onValueChange={(value) => setNewNotification({...newNotification, department_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={newNotification.expires_at}
                  onChange={(e) => setNewNotification({...newNotification, expires_at: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNotification} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.is_urgent).length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(n.created_at) > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const isExpired = notification.expires_at && new Date(notification.expires_at) < new Date();
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-2 ${getNotificationColor(notification.type, notification.is_urgent)} ${
                    isExpired ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Icon className={`h-5 w-5 ${
                          notification.is_urgent ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {notification.is_urgent && (
                            <Badge variant="destructive" className="text-xs">URGENT</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {notification.type.toUpperCase()}
                          </Badge>
                          {isExpired && (
                            <Badge variant="outline" className="text-xs text-gray-500">EXPIRED</Badge>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{notification.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {getTargetDisplay(notification)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                          <div>
                            By {notification.created_by_profile?.full_name}
                          </div>
                          {notification.expires_at && (
                            <div>
                              Expires: {format(new Date(notification.expires_at), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {notifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No notifications sent yet. Create your first notification to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;