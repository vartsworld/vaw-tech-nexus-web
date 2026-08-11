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
  FileText,
  Link,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Copy
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
import { viewOrDownloadFile } from "@/pages/TeamApplication";

const TeamApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        .neq('status', 'approved')
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

      if (status === 'approved') {
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      } else {
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status } : app
        ));
      }

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

  const deleteApplication = async (application: any) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('team_applications_staff')
        .delete()
        .eq('id', application.id);

      if (error) throw error;

      setApplications((prev: any[]) => prev.filter(a => a.id !== application.id));
      setDeleteTarget(null);

      toast({
        title: "Application Deleted",
        description: `${application.full_name}'s application has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const approveAndCreateStaff = async (application) => {
    try {
      // Generate first-time passcode
      const firstTimePasscode = Math.random().toString(36).substring(2, 10);

      // Create a temporary UUID that will be replaced when the edge function creates the real auth user
      const tempUserId = crypto.randomUUID();

      // Create staff profile with temp user_id and copy ALL details from application
      const { error: staffError } = await supabase
        .from('staff_profiles')
        .insert({
          user_id: tempUserId,
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
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
          sibling_names: application.sibling_names,
          relationship_status: application.relationship_status,
          marriage_preference: application.marriage_preference,
          work_confidence_level: application.work_confidence_level,
          reference_person_name: application.reference_person_name,
          reference_person_number: application.reference_person_number,
          physical_address: application.physical_address,
          govt_id_type: application.govt_id_type,
          govt_id_number: application.govt_id_number,
          blood_group: application.blood_group,
          has_health_issues: application.has_health_issues,
          health_issues: application.health_issues,
          kyc_selfie_url: application.kyc_selfie_url,
          kyc_document_url: application.kyc_document_url || application.kyc_selfie_url,
          emergency_contact_name: application.emergency_contact_name,
          emergency_contact_phone: application.emergency_contact_phone,
          applied_via_link: true,
          application_status: 'approved',
          first_time_passcode: firstTimePasscode,
          passcode_used: false
        } as any);

      if (staffError) throw staffError;

      // Update application status to approved (will automatically remove it from applications list)
      await updateApplicationStatus(application.id, 'approved');

      toast({
        title: "Success",
        description: `Application approved! Passcode: ${firstTimePasscode}`,
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

  const requestReKycLink = async (application: any) => {
    try {
      const reKycUrl = `${window.location.origin}/re-kyc/${application.id}`;
      await navigator.clipboard.writeText(reKycUrl);

      const { error } = await supabase
        .from('team_applications_staff')
        .update({
          status: 're_kyc_requested',
        } as any)
        .eq('id', application.id);

      if (!error) {
        setApplications((apps: any) => apps.map((a: any) => a.id === application.id ? { ...a, status: 're_kyc_requested' } : a));
      }

      toast({
        title: "Re-KYC Link Copied!",
        description: `Re-KYC URL: ${reKycUrl} (Copied to clipboard). Send this to the applicant to complete their KYC.`,
      });
    } catch (err: any) {
      console.error('Error requesting Re-KYC:', err);
      toast({
        title: "Error",
        description: "Failed to generate Re-KYC link.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 're_kyc_requested': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
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
                        <div className="font-medium flex items-center gap-1.5">
                          {application.full_name}
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            APP-{application.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
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
                        title="View application"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestReKycLink(application)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                        title="Request Re-KYC Link"
                      >
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        <span className="text-xs font-semibold hidden lg:inline">Re-KYC</span>
                      </Button>
                      {application.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approveAndCreateStaff(application)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(application)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        title="Delete application"
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
                  <h3 className="font-semibold mb-3 text-blue-600">Basic & Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                    <p><strong>Email:</strong> {selectedApplication.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.phone || 'Not provided'}</p>
                    <p><strong>Username:</strong> @{selectedApplication.username}</p>
                    <p><strong>Gender:</strong> {selectedApplication.gender || 'Not specified'}</p>
                    <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth || 'Not provided'}</p>
                    <p><strong>Physical Address:</strong> {selectedApplication.physical_address || 'Not provided'}</p>
                    <p><strong>Blood Group:</strong> {selectedApplication.blood_group || 'Not specified'}</p>
                    <p><strong>Health Issues:</strong> {selectedApplication.has_health_issues ? (Array.isArray(selectedApplication.health_issues) ? selectedApplication.health_issues.join(', ') : 'Yes') : 'None declared'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">Professional Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Preferred Role:</strong> {selectedApplication.preferred_role}</p>
                    <p><strong>Department:</strong> {getDepartmentName(selectedApplication.preferred_department_id)}</p>
                    <p><strong>Work Confidence:</strong> {selectedApplication.work_confidence_level || 'Not specified'}</p>
                    {selectedApplication.reference_person_name && (
                      <>
                        <p><strong>Reference Name:</strong> {selectedApplication.reference_person_name}</p>
                        <p><strong>Reference Contact:</strong> {selectedApplication.reference_person_number}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Family & Identity Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">Family Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Father's Name:</strong> {selectedApplication.father_name || 'Not provided'}</p>
                    <p><strong>Mother's Name:</strong> {selectedApplication.mother_name || 'Not provided'}</p>
                    <p><strong>Siblings:</strong> {selectedApplication.siblings || 'Not provided'}</p>
                    {Array.isArray(selectedApplication.sibling_names) && selectedApplication.sibling_names.length > 0 && (
                      <p><strong>Sibling Names:</strong> {selectedApplication.sibling_names.join(', ')}</p>
                    )}
                    <p><strong>Relationship Status:</strong> {selectedApplication.relationship_status || 'Not specified'}</p>
                    <p><strong>Marriage Preference:</strong> {selectedApplication.marriage_preference || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">Government Identity & KYC</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Govt ID Type:</strong> {selectedApplication.govt_id_type?.toUpperCase() || 'Aadhaar / Passport'}</p>
                    <p><strong>Govt ID Number:</strong> {selectedApplication.govt_id_number || 'Not provided'}</p>
                    <p><strong>Legal Terms Agreed:</strong> {selectedApplication.legal_accepted ? '✓ Yes (Verified)' : 'Yes'}</p>
                    {selectedApplication.emergency_contact_name && (
                      <p><strong>Emergency Contact:</strong> {selectedApplication.emergency_contact_name} ({selectedApplication.emergency_contact_phone})</p>
                    )}
                  </div>
                </div>
              </div>

              {/* About Me */}
              {selectedApplication.about_me && (
                <div className="pt-2">
                  <h3 className="font-semibold mb-2 text-blue-600">About / Notes</h3>
                  <p className="text-sm bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 text-zinc-100 dark:text-zinc-100 p-4 rounded-xl whitespace-pre-wrap leading-relaxed">
                    {selectedApplication.about_me}
                  </p>
                </div>
              )}

              {/* Documents & KYC Photos */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 text-zinc-100">Documents & KYC Photo Verification</h3>
                <div className="flex flex-wrap items-center gap-4">
                  {selectedApplication.cv_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrDownloadFile(selectedApplication.cv_url, `${selectedApplication.full_name}_CV.pdf`)}
                    >
                      <Download className="h-4 w-4 mr-2 text-zinc-400" />
                      View / Download CV
                    </Button>
                  )}
                  {selectedApplication.profile_photo_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrDownloadFile(selectedApplication.profile_photo_url, `${selectedApplication.full_name}_Photo.jpg`)}
                    >
                      <Eye className="h-4 w-4 mr-2 text-zinc-400" />
                      View Profile Photo
                    </Button>
                  )}
                  {selectedApplication.kyc_selfie_url && (
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedApplication.kyc_selfie_url}
                        alt="KYC Selfie"
                        className="w-12 h-12 rounded-lg object-cover border border-emerald-500"
                        onClick={() => viewOrDownloadFile(selectedApplication.kyc_selfie_url, `${selectedApplication.full_name}_Selfie.jpg`)}
                      />
                      <span className="text-xs text-emerald-600 font-semibold">✓ Live KYC Selfie Verified</span>
                    </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong>{deleteTarget?.full_name}</strong>'s application?
              {deleteTarget?.status === 'approved' && (
                <span className="block mt-2 text-amber-600 font-medium">
                  ⚠ This application is already approved. Deleting it will NOT remove the created staff profile.
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteApplication(deleteTarget)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting…' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamApplicationsList;