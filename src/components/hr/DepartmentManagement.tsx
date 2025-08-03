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
import { 
  Building2,
  Plus,
  Users,
  Crown,
  Edit,
  Trash2,
  TrendingUp,
  ClipboardList
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    head_id: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
    fetchStaff();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get staff count for each department
      const departmentsWithCounts = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('staff_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          
          return { ...dept, staff_count: count || 0 };
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments.",
        variant: "destructive",
      });
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, full_name, username, role')
        .in('role', ['hr', 'department_head'])
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAddDepartment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('departments')
        .insert([{
          ...newDepartment,
          created_by: user?.id || crypto.randomUUID(),
          head_id: newDepartment.head_id || null
        }])
        .select('*')
        .single();

      if (error) throw error;

      // Update staff member to be department head
      if (newDepartment.head_id) {
        await supabase
          .from('staff_profiles')
          .update({ 
            is_department_head: true,
            department_id: data.id 
          })
          .eq('id', newDepartment.head_id);
      }

      setDepartments([...departments, { ...data, staff_count: 0 }]);
      setIsAddDialogOpen(false);
      setNewDepartment({
        name: "",
        description: "",
        head_id: ""
      });

      toast({
        title: "Success",
        description: "Department created successfully.",
      });
    } catch (error) {
      console.error('Error adding department:', error);
      toast({
        title: "Error",
        description: "Failed to create department.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDepartment = async (deptId, updates) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', deptId)
        .select('*')
        .single();

      if (error) throw error;

      setDepartments(departments.map(dept => 
        dept.id === deptId ? { ...dept, ...data } : dept
      ));

      toast({
        title: "Success",
        description: "Department updated successfully.",
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: "Error",
        description: "Failed to update department.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!confirm("Are you sure you want to delete this department? This will remove all staff from the department.")) return;

    try {
      // First, remove staff from department
      await supabase
        .from('staff_profiles')
        .update({ 
          department_id: null,
          is_department_head: false 
        })
        .eq('department_id', deptId);

      // Then delete the department
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId);

      if (error) throw error;

      setDepartments(departments.filter(dept => dept.id !== deptId));

      toast({
        title: "Success",
        description: "Department deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "Failed to delete department.",
        variant: "destructive",
      });
    }
  };

  const assignStaffToDepartment = async (staffId, deptId) => {
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ department_id: deptId })
        .eq('id', staffId);

      if (error) throw error;

      // Refresh departments to update counts
      fetchDepartments();

      toast({
        title: "Success",
        description: "Staff member assigned to department.",
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Error",
        description: "Failed to assign staff member.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Department Management</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  placeholder="Enter department description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="head">Department Head</Label>
                <Select value={newDepartment.head_id} onValueChange={(value) => setNewDepartment({...newDepartment, head_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Head Assigned</SelectItem>
                    {staff.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDepartment}>
                  Create Department
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {dept.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingDepartment(dept)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Department Head */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Department Head:</span>
                  {dept.head_profile ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      {dept.head_profile.full_name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Not Assigned
                    </Badge>
                  )}
                </div>

                {/* Staff Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Staff Count:</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dept.staff_count}
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <ClipboardList className="h-3 w-3" />
                      Active Tasks
                    </div>
                    <div className="font-bold text-lg">12</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="h-3 w-3" />
                      Performance
                    </div>
                    <div className="font-bold text-lg text-green-600">85%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Staff Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Department Staff Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.head_profile ? (
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">{dept.head_profile.full_name}</div>
                          <div className="text-sm text-gray-500">@{dept.head_profile.username}</div>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Not Assigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Users className="h-3 w-3" />
                      {dept.staff_count} members
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-gray-600">
                      {dept.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(dept.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {departments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No departments found. Create your first department to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentManagement;