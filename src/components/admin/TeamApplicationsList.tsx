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
  phone: string;
  current_position?: string;
  experience_years?: number;
  skills: string;
  why_join_team: string;
  preferred_role?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  status: string;
  created_at: string;
}

const TeamApplicationsList = () => {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TeamApplication | null>(null);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('team_applications')
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
        .from('team_applications')
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
                <TableHead>Current Position</TableHead>
                <TableHead>Experience</TableHead>
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
                  <TableCell>{application.current_position || "Not specified"}</TableCell>
                  <TableCell>
                    {application.experience_years ? `${application.experience_years} years` : "Not specified"}
                  </TableCell>
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
                                  <p className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {selectedApplication.email}
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {selectedApplication.phone}
                                  </p>
                                  <p><strong>Current Position:</strong> {selectedApplication.current_position || "Not specified"}</p>
                                  <p><strong>Experience:</strong> {selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : "Not specified"}</p>
                                  <p><strong>Preferred Role:</strong> {selectedApplication.preferred_role || "Not specified"}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold">Links</h4>
                                <div className="text-sm space-y-1">
                                  {selectedApplication.portfolio_url && (
                                    <p>
                                      <a 
                                        href={selectedApplication.portfolio_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-500 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Portfolio
                                      </a>
                                    </p>
                                  )}
                                  {selectedApplication.linkedin_url && (
                                    <p>
                                      <a 
                                        href={selectedApplication.linkedin_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-500 hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        LinkedIn
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Skills</h4>
                                <p className="text-sm bg-muted p-3 rounded">{selectedApplication.skills}</p>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Why Join Our Team</h4>
                                <p className="text-sm bg-muted p-3 rounded">{selectedApplication.why_join_team}</p>
                              </div>
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