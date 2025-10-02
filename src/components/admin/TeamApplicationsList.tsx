import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Mail, Phone, ExternalLink, User } from "lucide-react";

interface TeamApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  username: string | null;
  gender: string | null;
  date_of_birth: string | null;
  cv_url: string | null;
  about_me: string | null;
  profile_photo_url: string | null;
  father_name: string | null;
  mother_name: string | null;
  siblings: string | null;
  relationship_status: string | null;
  marriage_preference: string | null;
  work_confidence_level: string | null;
  reference_person_name: string | null;
  reference_person_number: string | null;
  preferred_role: string | null;
  preferred_department_id: string | null;
  status: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

const TeamApplicationsList = () => {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('team_applications_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to fetch team applications');
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch team applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('team_applications_staff')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        return;
      }

      toast.success('Status updated successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'reviewing':
        return 'bg-blue-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Applications</CardTitle>
          <CardDescription>Loading applications...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Applications ({applications.length})</CardTitle>
        <CardDescription>
          Applications from people interested in joining the VAW team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Preferred Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{application.full_name}</div>
                      <div className="text-sm text-muted-foreground">{application.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{application.username || "Not specified"}</TableCell>
                  <TableCell>{application.preferred_role || "Not specified"}</TableCell>
                  <TableCell>
                    <Select
                      value={application.status}
                      onValueChange={(value) => updateStatus(application.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(application.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Team Application Details</DialogTitle>
                          <DialogDescription>
                            Full application from {application.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedApplication && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Personal Information
                                </h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Name:</strong> {selectedApplication.full_name}</p>
                                  <p><strong>Username:</strong> {selectedApplication.username || "Not specified"}</p>
                                  <p className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {selectedApplication.email}
                                  </p>
                                  {selectedApplication.phone && (
                                    <p className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {selectedApplication.phone}
                                    </p>
                                  )}
                                  <p><strong>Gender:</strong> {selectedApplication.gender || "Not specified"}</p>
                                  <p><strong>Date of Birth:</strong> {selectedApplication.date_of_birth ? new Date(selectedApplication.date_of_birth).toLocaleDateString() : "Not specified"}</p>
                                  <p><strong>Preferred Role:</strong> {selectedApplication.preferred_role || "Not specified"}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold">Family Information</h4>
                                <div className="text-sm space-y-1">
                                  {selectedApplication.father_name && (
                                    <p><strong>Father:</strong> {selectedApplication.father_name}</p>
                                  )}
                                  {selectedApplication.mother_name && (
                                    <p><strong>Mother:</strong> {selectedApplication.mother_name}</p>
                                  )}
                                  {selectedApplication.siblings && (
                                    <p><strong>Siblings:</strong> {selectedApplication.siblings}</p>
                                  )}
                                  {selectedApplication.relationship_status && (
                                    <p><strong>Relationship Status:</strong> {selectedApplication.relationship_status}</p>
                                  )}
                                  {selectedApplication.marriage_preference && (
                                    <p><strong>Marriage Preference:</strong> {selectedApplication.marriage_preference}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {selectedApplication.about_me && (
                                <div>
                                  <h4 className="font-semibold mb-2">About Me</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedApplication.about_me}</p>
                                </div>
                              )}

                              {selectedApplication.work_confidence_level && (
                                <div>
                                  <h4 className="font-semibold mb-2">Work Confidence Level</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedApplication.work_confidence_level}</p>
                                </div>
                              )}

                              {selectedApplication.reference_person_name && (
                                <div>
                                  <h4 className="font-semibold mb-2">Reference</h4>
                                  <p className="text-sm bg-muted p-3 rounded">
                                    {selectedApplication.reference_person_name}
                                    {selectedApplication.reference_person_number && ` - ${selectedApplication.reference_person_number}`}
                                  </p>
                                </div>
                              )}

                              {selectedApplication.cv_url && (
                                <div>
                                  <h4 className="font-semibold mb-2">CV</h4>
                                  <a 
                                    href={selectedApplication.cv_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-500 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View CV
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <Badge className={getStatusColor(selectedApplication.status)}>
                                {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {applications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No team applications found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamApplicationsList;