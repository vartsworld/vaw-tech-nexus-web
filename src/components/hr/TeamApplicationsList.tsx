import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Phone,
  Mail,
  Calendar,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TeamApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
    fetchDepartments();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('team_applications_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load team applications.",
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

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const { error } = await supabase
        .from('team_applications_staff')
        .update({ 
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));

      toast({
        title: "Success",
        description: `Application ${status}.`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const approveAndCreateStaff = async (application) => {
    try {
      // First update application status
      await updateApplicationStatus(application.id, 'approved');

      // Create staff profile
      const { error: staffError } = await supabase
        .from('staff_profiles')
        .insert({
          user_id: crypto.randomUUID(),
          full_name: application.full_name,
          email: application.email,
          username: application.username,
          role: application.preferred_role,
          department_id: application.preferred_department_id,
          gender: application.gender,
          date_of_birth: application.date_of_birth,
          cv_url: application.cv_url,
          about_me: application.about_me,
          profile_photo_url: application.profile_photo_url,
          father_name: application.father_name,
          mother_name: application.mother_name,
          siblings: application.siblings,
          relationship_status: application.relationship_status,
          marriage_preference: application.marriage_preference,
          work_confidence_level: application.work_confidence_level,
          reference_person_name: application.reference_person_name,
          reference_person_number: application.reference_person_number,
          applied_via_link: true,
          application_status: 'approved'
        });

      if (staffError) throw staffError;

      toast({
        title: "Success",
        description: "Application approved and staff member created.",
      });
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve application and create staff member.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Team Applications</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Role & Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={application.profile_photo_url} />
                        <AvatarFallback>
                          {application.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{application.full_name}</div>
                        <div className="text-sm text-gray-500">@{application.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium capitalize">{application.preferred_role}</div>
                      <div className="text-sm text-gray-500">
                        {getDepartmentName(application.preferred_department_id)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {application.email}
                      </div>
                      {application.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {application.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {new Date(application.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {application.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approveAndCreateStaff(application)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phone || 'Not provided'}</p>
                    <p><strong>Username:</strong> {selectedApplication.username}</p>
                    <p><strong>Gender:</strong> {selectedApplication.gender || 'Not specified'}</p>
                    <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Professional Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Preferred Role:</strong> {selectedApplication.preferred_role}</p>
                    <p><strong>Department:</strong> {getDepartmentName(selectedApplication.preferred_department_id)}</p>
                    <p><strong>Work Confidence:</strong> {selectedApplication.work_confidence_level || 'Not specified'}</p>
                    {selectedApplication.reference_person_name && (
                      <>
                        <p><strong>Reference:</strong> {selectedApplication.reference_person_name}</p>
                        <p><strong>Reference Contact:</strong> {selectedApplication.reference_person_number}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Family & Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-3">Family Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Father's Name:</strong> {selectedApplication.father_name || 'Not provided'}</p>
                    <p><strong>Mother's Name:</strong> {selectedApplication.mother_name || 'Not provided'}</p>
                    <p><strong>Siblings:</strong> {selectedApplication.siblings || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Relationship Status:</strong> {selectedApplication.relationship_status || 'Not specified'}</p>
                    <p><strong>Marriage Preference:</strong> {selectedApplication.marriage_preference || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* About Me */}
              {selectedApplication.about_me && (
                <div>
                  <h3 className="font-semibold mb-3">About</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedApplication.about_me}</p>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Documents</h3>
                <div className="flex gap-4">
                  {selectedApplication.cv_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApplication.cv_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download CV
                      </a>
                    </Button>
                  )}
                  {selectedApplication.profile_photo_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApplication.profile_photo_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        View Photo
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      approveAndCreateStaff(selectedApplication);
                      setIsViewDialogOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Create Staff
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'rejected');
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamApplicationsList;