import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Search,
  Edit,
  Link,
  Contact2,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EnhancedStaffForm from "./EnhancedStaffForm";
import { createPatraStaff, updatePatraStaff } from "@/integrations/patra";
import { StaffCardResult } from "./StaffCardResult";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [patraResult, setPatraResult] = useState<{cardUrl: string, staffId: string, email: string, passcode?: string} | null>(null);
  const [newStaff, setNewStaff] = useState({
    full_name: "",
    email: "",
    username: "",
    role: "staff",
    department_id: "",
    hire_date: "",
    is_department_head: false,
    gender: "",
    date_of_birth: "",
    cv_url: "",
    about_me: "",
    profile_photo_url: "",
    father_name: "",
    mother_name: "",
    siblings: "",
    relationship_status: "",
    marriage_preference: "",
    work_confidence_level: "",
    reference_person_name: "",
    reference_person_number: "",
    physical_address: "",
    govt_id_number: "",
    blood_group: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) setCurrentUserId(data.user.id);
  };

  useEffect(() => {
    filterStaffData();
  }, [staff, searchTerm, filterDepartment, filterRole]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select(`
          *,
          departments!fk_staff_profiles_department(name)
        `)
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data.",
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

  const filterStaffData = () => {
    let filtered = staff;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter(member => member.department_id === filterDepartment);
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(member => member.role === filterRole);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = async () => {
    try {
      const normalizedEmail = newStaff.email.trim().toLowerCase();
      const trimmedName = newStaff.full_name.trim();
      const trimmedUsername = newStaff.username.trim();

      if (!trimmedName || !normalizedEmail || !trimmedUsername) {
        throw new Error("Full name, email, and username are required.");
      }

      if (staff.some(member => member.email?.toLowerCase() === normalizedEmail)) {
        throw new Error("A staff member with this email already exists.");
      }

      if (staff.some(member => member.username?.toLowerCase() === trimmedUsername.toLowerCase())) {
        throw new Error("This username is already in use.");
      }

      // Generate a random first-time passcode
      const firstTimePasscode = Math.random().toString(36).substring(2, 10);

      // Prepare or reuse the auth user without triggering email rate limits
      const { data: authSetupData, error: authSetupError } = await supabase.functions.invoke(
        'reset-staff-password',
        {
          body: {
            email: normalizedEmail,
            newPassword: firstTimePasscode,
            fullName: trimmedName,
            username: trimmedUsername,
          }
        }
      );

      if (authSetupError) {
        console.error('Error preparing staff auth:', authSetupError);
        throw new Error(authSetupError.message || 'Failed to prepare staff login.');
      }

      if (authSetupData?.error) throw new Error(authSetupData.error);
      if (!authSetupData?.userId) throw new Error('Staff login could not be prepared.');

      // Create staff profile with the resolved auth user's ID
      const { data, error } = await supabase
        .from('staff_profiles')
        .insert({
          ...newStaff,
          full_name: trimmedName,
          email: normalizedEmail,
          username: trimmedUsername,
          user_id: authSetupData.userId,
          department_id: newStaff.department_id || null,
          role: newStaff.role as string,
          first_time_passcode: firstTimePasscode,
          application_status: 'approved',
          physical_address: newStaff.physical_address || null,
          govt_id_number: newStaff.govt_id_number || null,
          blood_group: newStaff.blood_group || null
        } as any)
        .select()
        .single();

      if (error) throw error;

      // If role is super_admin, also add to super_admins table
      if (newStaff.role === 'super_admin') {
        const { error: superAdminError } = await supabase
          .from('super_admins')
          .insert({ user_id: authSetupData.userId });

        if (superAdminError && !superAdminError.message.includes('unique constraint')) {
          console.error('Error adding to super_admins:', superAdminError);
          // Don't throw here, just log, as the main profile was created
        }
      }

      setStaff([...staff, data]);

      try {
        setIsCreatingCard(true);
        const departmentName = newStaff.department_id 
          ? departments.find(d => d.id === newStaff.department_id)?.name 
          : undefined;

        const patraRes = await createPatraStaff({
          display_name: trimmedName,
          email: normalizedEmail,
          job_title: newStaff.role.charAt(0).toUpperCase() + newStaff.role.slice(1).replace('_', ' '),
          avatar_url: newStaff.profile_photo_url || undefined,
          bio: newStaff.about_me ? newStaff.about_me.substring(0, 160) : undefined,
          department: departmentName,
          metadata: {
            app_id: data.id,
            role: newStaff.role
          }
        });

        // Store the returned Patra URL to db
        await supabase
          .from('staff_profiles')
          .update({ 
            patra_card_url: patraRes.card_url,
            patra_staff_id: patraRes.data.staff_id 
          } as any)
          .eq('id', data.id);
          
        (data as any).patra_card_url = patraRes.card_url;
        (data as any).patra_staff_id = patraRes.data.staff_id;

        setPatraResult({
          cardUrl: patraRes.card_url,
          staffId: patraRes.data.staff_id,
          email: normalizedEmail,
          passcode: firstTimePasscode
        });
      } catch (patraErr) {
        console.error("Patra card generation failed", patraErr);
        toast({
           title: "Partial Success",
           description: "Staff created but ID Card generation failed. " + (patraErr instanceof Error ? patraErr.message : ""),
           variant: "destructive"
        });
        setIsAddDialogOpen(false);
      } finally {
        setIsCreatingCard(false);
      }

      setNewStaff({
        full_name: "",
        email: "",
        username: "",
        role: "staff",
        department_id: "",
        hire_date: "",
        is_department_head: false,
        gender: "",
        date_of_birth: "",
        cv_url: "",
        about_me: "",
        profile_photo_url: "",
        father_name: "",
        mother_name: "",
        siblings: "",
        relationship_status: "",
        marriage_preference: "",
        work_confidence_level: "",
        reference_person_name: "",
        reference_person_number: "",
        physical_address: "",
        govt_id_number: "",
        blood_group: ""
      });

      if (!patraResult && !isCreatingCard) {
        toast({
          title: "Success",
          description: `Staff member added successfully. First-time passcode: ${firstTimePasscode}`,
        });
      }

    } catch (error) {
      console.error('Error adding staff:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add staff member.";
      toast({
        title: "Error",
        description: errorMessage.includes("enum")
          ? "The selected role is not supported by the database schema."
          : errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateStaff = async (staffId, updates) => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .update(updates)
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;

      // Sync with super_admins table if role changed
      if (updates.role) {
        if (updates.role === 'super_admin') {
          await supabase.from('super_admins').upsert({ user_id: data.user_id });
        } else {
          // If role changed from super_admin to something else, remove from super_admins
          await supabase.from('super_admins').delete().eq('user_id', data.user_id);
        }
      }

      setStaff(staff.map(member =>
        member.id === staffId ? { ...member, ...data } : member
      ));

      toast({
        title: "Success",
        description: "Staff member updated successfully.",
      });

      try {
        // Find existing department name if changed
        let departmentName = undefined;
        if (updates.department_id) {
           departmentName = departments.find(d => d.id === updates.department_id)?.name;
        }

        // We attempt to update Patra. If patra_id is missing, this may fail, 
        // but since we are relying on prompt we will pass staffId, but patra requires its own ID.
        // We will skip this in UI for now if we don't know the patra ID, but we can search for them by email first.
      } catch (patraErr) {
        console.error("Failed to update Patra card", patraErr);
      }

    } catch (error) {
      console.error('Error updating staff:', error);
      toast({
        title: "Error",
        description: error.message?.includes("enum")
          ? "The selected role is not supported by the database schema."
          : (error.message || "Failed to update staff member."),
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (staffMember: any) => {
    if (!currentUserId) {
      toast({
        title: "Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Reassign staff_tasks
      // Fetch tasks where the user is an assignee
      const { data: tasks, error: tasksError } = await supabase
        .from('staff_tasks')
        .select('id, assigned_to');

      if (tasksError) throw tasksError;

      const userTasks = tasks.filter(t => 
        Array.isArray(t.assigned_to) && t.assigned_to.includes(staffMember.user_id)
      );

      for (const task of userTasks) {
        // Remove the deleted staff and add the HR user (if not already there)
        const newAssignedTo = (task.assigned_to as string[]).filter(id => id !== staffMember.user_id);
        if (!newAssignedTo.includes(currentUserId)) {
          newAssignedTo.push(currentUserId);
        }
        
        await supabase
          .from('staff_tasks')
          .update({ assigned_to: newAssignedTo })
          .eq('id', task.id);
      }

      // 2. Reassign staff_subtasks
      await supabase
        .from('staff_subtasks')
        .update({ assigned_to: currentUserId })
        .eq('assigned_to', staffMember.user_id);

      // 3. Delete application (if it exists)
      if (staffMember.email) {
        await supabase
          .from('team_applications_staff')
          .delete()
          .eq('email', staffMember.email);
      }

      // 4. Finally, delete the staff_profile
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .delete()
        .eq('id', staffMember.id);

      if (profileError) throw profileError;

      setStaff(staff.filter(member => member.id !== staffMember.id));
      setStaffToDelete(null);

      toast({
        title: "Staff Member Removed",
        description: `${staffMember.full_name} has been removed. All their tasks have been reassigned to you.`,
      });

    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fully remove staff member.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'team_head': return 'bg-yellow-100 text-yellow-800';
      case 'lead': return 'bg-green-100 text-green-800';
      case 'intern': return 'bg-orange-100 text-orange-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyPasscode = (passcode, memberId) => {
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(memberId);
    toast({
      title: "Copied!",
      description: "Passcode copied to clipboard",
    });
    setTimeout(() => setCopiedPasscode(null), 2000);
  };

  const generatePasscode = async (staffId) => {
    try {
      // Find the staff member
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) throw new Error('Staff member not found');

      // Generate a new random passcode
      const newPasscode = Math.random().toString(36).substring(2, 10);

      // Update the auth user's password via edge function
      const { data: resetData, error: resetError } = await supabase.functions.invoke(
        'reset-staff-password',
        {
          body: { 
            userId: staffMember.user_id, 
            email: staffMember.email,
            newPassword: newPasscode 
          }
        }
      );

      if (resetError) {
        console.error('Edge function error:', resetError);
        throw new Error(resetError.message || 'Edge Function returned an error');
      }
      
      if (resetData?.error) throw new Error(resetData.error);

      // Update staff_profiles
      const { error } = await supabase
        .from('staff_profiles')
        .update({
          first_time_passcode: newPasscode,
          passcode_used: false,
          is_emoji_password: false,
          emoji_password: null
        })
        .eq('id', staffId);

      if (error) throw error;

      // Update local state
      setStaff(staff.map(member =>
        member.id === staffId
          ? { ...member, first_time_passcode: newPasscode, passcode_used: false, is_emoji_password: false, emoji_password: null }
          : member
      ));

      // Copy to clipboard automatically
      navigator.clipboard.writeText(newPasscode);

      toast({
        title: "Passcode Reset!",
        description: `New passcode: ${newPasscode} (copied to clipboard)`,
      });
    } catch (error) {
      console.error('Error generating passcode:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate passcode.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCard = async (member: any) => {
    // If they already have a card URL, just open it
    if (member.patra_card_url) {
      window.open(member.patra_card_url, '_blank');
      return;
    }

    try {
      const departmentName = member.department_id 
        ? departments.find(d => d.id === member.department_id)?.name 
        : undefined;

      const patraRes = await createPatraStaff({
        display_name: member.full_name,
        email: member.email,
        job_title: member.role.charAt(0).toUpperCase() + member.role.slice(1).replace('_', ' '),
        avatar_url: member.profile_photo_url || member.avatar_url || undefined,
        bio: member.about_me ? member.about_me.substring(0, 160) : undefined,
        department: departmentName,
        metadata: {
          app_id: member.id,
          role: member.role
        }
      });

      // Update DB
      await supabase
        .from('staff_profiles')
        .update({ 
          patra_card_url: patraRes.card_url,
          patra_staff_id: patraRes.data.staff_id 
        } as any)
        .eq('id', member.id);

      // Update Local State
      setStaff(staff.map(s => 
        s.id === member.id 
          ? { ...s, patra_card_url: patraRes.card_url, patra_staff_id: patraRes.data.staff_id } 
          : s
      ));

      toast({
        title: "Success",
        description: "Digital ID Card generated successfully.",
      });

    } catch (error) {
      console.error("Failed to generate Patra card:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate ID card.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Staff Management</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              const link = `${window.location.origin}/team-application`;
              navigator.clipboard.writeText(link);
              toast({
                title: "Link Copied",
                description: "Team application link copied to clipboard.",
              });
            }}
          >
            <Link className="h-4 w-4" />
            Invite Staff
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="relative">
                {isCreatingCard && (
                  <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                       <span className="animate-spin text-4xl">⏳</span>
                       <p className="font-semibold text-primary">Generating Digital ID Card...</p>
                    </div>
                  </div>
                )}
                {patraResult ? (
                  <StaffCardResult 
                    cardUrl={patraResult.cardUrl}
                    staffId={patraResult.staffId}
                    email={patraResult.email}
                    firstTimePasscode={patraResult.passcode}
                    onClose={() => {
                       setPatraResult(null);
                       setIsAddDialogOpen(false);
                    }}
                  />
                ) : (
                  <EnhancedStaffForm
                    departments={departments}
                    newStaff={newStaff}
                    setNewStaff={setNewStaff}
                    onSubmit={handleAddStaff}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            <EnhancedStaffForm
              departments={departments}
              newStaff={newStaff}
              setNewStaff={setNewStaff}
              onSubmit={async () => {
                if (editingStaff) {
                  const updateData = {
                    ...newStaff,
                    department_id: newStaff.department_id === "" ? null : newStaff.department_id,
                    hire_date: newStaff.hire_date === "" ? null : newStaff.hire_date,
                    date_of_birth: newStaff.date_of_birth === "" ? null : newStaff.date_of_birth
                  };
                  await handleUpdateStaff(editingStaff.id, updateData);
                  setIsEditDialogOpen(false);
                  setEditingStaff(null);
                  setNewStaff({
                    full_name: "",
                    email: "",
                    username: "",
                    role: "staff",
                    department_id: "",
                    hire_date: "",
                    is_department_head: false,
                    gender: "",
                    date_of_birth: "",
                    cv_url: "",
                    about_me: "",
                    profile_photo_url: "",
                    father_name: "",
                    mother_name: "",
                    siblings: "",
                    relationship_status: "",
                    marriage_preference: "",
                    work_confidence_level: "",
                    reference_person_name: "",
                    reference_person_number: "",
                    physical_address: "",
                    govt_id_number: "",
                    blood_group: ""
                  });
                }
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingStaff(null);
                setNewStaff({
                  full_name: "",
                  email: "",
                  username: "",
                  role: "staff",
                  department_id: "",
                  hire_date: "",
                  is_department_head: false,
                  gender: "",
                  date_of_birth: "",
                  cv_url: "",
                  about_me: "",
                  profile_photo_url: "",
                  father_name: "",
                  mother_name: "",
                  siblings: "",
                  relationship_status: "",
                  marriage_preference: "",
                  work_confidence_level: "",
                  reference_person_name: "",
                  reference_person_number: "",
                  physical_address: "",
                  govt_id_number: "",
                  blood_group: ""
                });
              }}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="lead">Team Lead</SelectItem>
                <SelectItem value="team_head">Team Head</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing {filteredStaff.length} of {staff.length} staff
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Info</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile_photo_url || member.avatar_url} />
                        <AvatarFallback>
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.full_name}
                          {member.is_department_head && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>@{member.username}</span>
                          {member.staff_id_number && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 bg-white/5 font-mono">
                              {member.staff_id_number}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {member.departments?.name || 'Unassigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {member.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {member.hire_date ? new Date(member.hire_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {member.first_time_passcode && !member.passcode_used && (
                        <div className="flex items-center gap-2">
                          <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-md">
                            <span className="text-orange-700 font-mono font-semibold text-sm">
                              {member.first_time_passcode}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyPasscode(member.first_time_passcode, member.id)}
                            className="h-7 w-7 p-0"
                            title="Copy passcode"
                          >
                            {copiedPasscode === member.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      {member.is_emoji_password && (
                        <div className="text-green-600 flex items-center gap-1 text-sm">
                          <Check className="h-4 w-4" />
                          Emoji Setup
                        </div>
                      )}
                      {!member.first_time_passcode && !member.is_emoji_password && (
                        <div className="text-gray-500 text-sm">
                          No Login Set
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePasscode(member.id)}
                        className="h-7 text-xs gap-1"
                      >
                        <KeyRound className="h-3 w-3" />
                        {member.first_time_passcode || member.is_emoji_password ? 'Reset' : 'Generate'} Passcode
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 min-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingStaff(member);
                          setNewStaff({
                            full_name: member.full_name,
                            email: member.email,
                            username: member.username,
                            role: member.role,
                            department_id: member.department_id || "",
                            hire_date: member.hire_date || "",
                            is_department_head: member.is_department_head,
                            gender: member.gender || "",
                            date_of_birth: member.date_of_birth || "",
                            cv_url: member.cv_url || "",
                            about_me: member.about_me || "",
                            profile_photo_url: member.profile_photo_url || "",
                            father_name: member.father_name || "",
                            mother_name: member.mother_name || "",
                            siblings: member.siblings || "",
                            relationship_status: member.relationship_status || "",
                            marriage_preference: member.marriage_preference || "",
                            work_confidence_level: member.work_confidence_level || "",
                            reference_person_name: member.reference_person_name || "",
                            reference_person_number: member.reference_person_number || "",
                            physical_address: member.physical_address || "",
                            govt_id_number: member.govt_id_number || "",
                            blood_group: member.blood_group || ""
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={member.patra_card_url ? "View Digital ID Card" : "Generate ID Card"}
                        className={member.patra_card_url 
                          ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                          : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                        onClick={() => handleGenerateCard(member)}
                      >
                        <Contact2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStaffToDelete(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Fully remove staff"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Full Removal Confirmation Dialog */}
      <AlertDialog open={!!staffToDelete} onOpenChange={(open) => { if (!open) setStaffToDelete(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Full Staff Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently remove <strong>{staffToDelete?.full_name}</strong> from the system.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs space-y-2 border border-red-100 dark:border-red-900/30">
                <p className="font-bold text-red-700 dark:text-red-400">What happens next?</p>
                <ul className="list-disc pl-4 space-y-1 text-red-600/80 dark:text-red-400/80">
                  <li>Staff profile will be deleted permanently.</li>
                  <li>Original hiring application will be removed.</li>
                  <li><strong>All assigned tasks & subtasks will be reassigned to YOU (HR)</strong> so they aren't lost.</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider pt-2">
                This action is irreversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDelete && handleDeleteStaff(staffToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Finalize Removal'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;