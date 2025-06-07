
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Mail, Phone, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InternshipApplication } from "@/types/database";

const domains = {
  uiux: "UI/UX Designing",
  ai: "AI Training",
  data: "Data Labeling",
  prompt: "Prompt Engineering",
  webdev: "Web Development",
  appdev: "App Development",
  graphics: "Graphic Design",
  marketing: "Digital Marketing",
  content: "Content Creation",
};

const InternshipApplicationsList = () => {
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<InternshipApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading applications:", error);
        toast.error("Failed to load applications");
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleContactEmail = (email: string, name: string) => {
    const subject = encodeURIComponent(`Regarding Your Internship Application - Virtual Arts`);
    const body = encodeURIComponent(`Dear ${name},\n\nThank you for your interest in our internship program.\n\nBest regards,\nVirtual Arts Team`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleContactPhone = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleDownloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(resumeUrl);

      if (error) {
        console.error("Error downloading resume:", error);
        toast.error("Failed to download resume");
        return;
      }

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicantName}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Internship Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internship Applications</CardTitle>
        <CardDescription>
          Manage and review internship applications ({applications.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No internship applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.full_name}</TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>{application.college_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.domains.slice(0, 2).map((domain) => (
                          <Badge key={domain} variant="secondary" className="text-xs">
                            {domains[domain as keyof typeof domains]}
                          </Badge>
                        ))}
                        {application.domains.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{application.domains.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.resume_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadResume(application.resume_url!, application.full_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No resume</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(application.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                    <p className="font-medium">{selectedApplication.full_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <p>{selectedApplication.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                    <p>{selectedApplication.phone}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Graduation Year</label>
                                    <p>{selectedApplication.graduation_year}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">College/University</label>
                                    <p>{selectedApplication.college_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Course/Degree</label>
                                    <p>{selectedApplication.course}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Preferred Domains</label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedApplication.domains.map((domain) => (
                                      <Badge key={domain} variant="secondary">
                                        {domains[domain as keyof typeof domains]}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Cover Letter</label>
                                  <p className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {selectedApplication.cover_letter}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Resume</label>
                                  {selectedApplication.resume_url ? (
                                    <div className="mt-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => handleDownloadResume(selectedApplication.resume_url!, selectedApplication.full_name)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Resume
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-sm text-muted-foreground">No resume uploaded</p>
                                  )}
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Submitted At</label>
                                  <p>{formatDate(selectedApplication.created_at)}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactEmail(application.email, application.full_name)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleContactPhone(application.phone)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternshipApplicationsList;
