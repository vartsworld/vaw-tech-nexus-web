import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Mail, Phone, Download, Trash2,
  LayoutGrid, List, AlertTriangle, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [deleteTarget, setDeleteTarget] = useState<InternshipApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Filter out deleted items in JS so rows with null/undefined status are preserved
      const validRows = (data || []).filter(item => item.status !== 'deleted');

      // Transform the data to match our InternshipApplication interface
      const transformedData: InternshipApplication[] = validRows.map(item => ({
        ...item,
        domains: Array.isArray(item.domains) ? item.domains as string[] : 
                typeof item.domains === 'string' ? [item.domains] : []
      }));

      setApplications(transformedData);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  
  const deleteApplication = async (application: InternshipApplication) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('internship_applications')
        .delete()
        .eq('id', application.id);

      if (error) throw error;

      setApplications(prev => prev.filter(a => a.id !== application.id));
      setDeleteTarget(null);
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setIsDeleting(false);
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Internship Applications</CardTitle>
            <CardDescription className="text-sm">Loading applications...</CardDescription>
          </div>
          <div className="flex items-center bg-muted/50 p-1 rounded-lg">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-8 px-2">
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-2">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Domains</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 rounded-md" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg sm:text-xl">Internship Applications</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage and review internship applications ({applications.length} total)
          </CardDescription>
        </div>
        <div className="flex items-center bg-muted/50 p-1 rounded-lg">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-2"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-2"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {applications.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                No internship applications found
              </div>
            ) : (
              applications.map((app) => (
                <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow relative">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{app.full_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{app.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">{app.college_name}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {app.domains.map((domain, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {domains[domain as keyof typeof domains] || domain}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{app.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-end mt-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedApplication(app)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteTarget(app)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[150px] hidden sm:table-cell">College</TableHead>
                    <TableHead className="min-w-[120px]">Domains</TableHead>
                    <TableHead className="min-w-[80px]">Resume</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Submitted</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
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
                        <TableCell className="max-w-[200px] truncate">{application.email}</TableCell>
                        <TableCell className="hidden sm:table-cell max-w-[150px] truncate">
                          {application.college_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {application.domains.slice(0, 1).map((domain) => (
                              <Badge key={domain} variant="secondary" className="text-xs">
                                {domains[domain as keyof typeof domains] || domain}
                              </Badge>
                            ))}
                            {application.domains.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.domains.length - 1}
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
                        <TableCell className="hidden lg:table-cell">{formatDate(application.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteTarget(application)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="break-all">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedApplication.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Graduation Year</label>
                  <p>{selectedApplication.graduation_year}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">College/University</label>
                  <p>{selectedApplication.college_name}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Course/Degree</label>
                  <p>{selectedApplication.course}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Preferred Domains</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedApplication.domains.map((domain) => (
                    <Badge key={domain} variant="secondary">
                      {domains[domain as keyof typeof domains] || domain}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Cover Letter</label>
                <p className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {selectedApplication.cover_letter || "No cover letter provided."}
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

      {/* Delete Application Confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the internship application from{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.full_name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteApplication(deleteTarget)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default InternshipApplicationsList;



