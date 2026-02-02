import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Eye, Mail, Phone, MapPin } from "lucide-react";

interface InternExperience {
  id: string;
  intern_name: string;
  email: string;
  phone?: string;
  address?: string;
  internship_domain: string;
  experience_rating: number;
  overall_experience: string;
  skills_learned?: string;
  project_highlights?: string;
  mentor_feedback?: string;
  suggestions_for_improvement?: string;
  would_recommend: boolean;
  certificate_requested: boolean;
  status: string;
  created_at: string;
}

const InternExperiencesList = () => {
  const [experiences, setExperiences] = useState<InternExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<InternExperience | null>(null);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('intern_experiences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching experiences:', error);
        toast.error('Failed to fetch intern experiences');
        return;
      }

      setExperiences(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch intern experiences');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('intern_experiences')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        return;
      }

      toast.success('Status updated successfully');
      fetchExperiences();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-500';
      case 'reviewed':
        return 'bg-yellow-500';
      case 'certificate_issued':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intern Experiences</CardTitle>
          <CardDescription>Loading experiences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intern Experiences ({experiences.length})</CardTitle>
        <CardDescription>
          Feedback and experiences shared by interns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiences.map((experience) => (
                <TableRow key={experience.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{experience.intern_name}</div>
                      <div className="text-sm text-muted-foreground">{experience.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{experience.internship_domain}</TableCell>
                  <TableCell>{renderStars(experience.experience_rating)}</TableCell>
                  <TableCell>
                    <Badge variant={experience.certificate_requested ? "default" : "secondary"}>
                      {experience.certificate_requested ? "Requested" : "Not Requested"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={experience.status}
                      onValueChange={(value) => updateStatus(experience.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="certificate_issued">Certificate Issued</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(experience.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExperience(experience)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Intern Experience Details</DialogTitle>
                          <DialogDescription>
                            Full feedback from {experience.intern_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedExperience && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  Contact Information
                                </h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Name:</strong> {selectedExperience.intern_name}</p>
                                  <p><strong>Email:</strong> {selectedExperience.email}</p>
                                  {selectedExperience.phone && (
                                    <p className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {selectedExperience.phone}
                                    </p>
                                  )}
                                  {selectedExperience.address && (
                                    <p className="flex items-start gap-1">
                                      <MapPin className="w-3 h-3 mt-1" />
                                      <span className="text-xs">{selectedExperience.address}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-semibold">Internship Details</h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Domain:</strong> {selectedExperience.internship_domain}</p>
                                  <div className="flex items-center gap-2">
                                    <strong>Rating:</strong>
                                    {renderStars(selectedExperience.experience_rating)}
                                    <span>({selectedExperience.experience_rating}/5)</span>
                                  </div>
                                  <p><strong>Would Recommend:</strong> {selectedExperience.would_recommend ? "Yes" : "No"}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Overall Experience</h4>
                                <p className="text-sm bg-muted p-3 rounded">{selectedExperience.overall_experience}</p>
                              </div>

                              {selectedExperience.skills_learned && (
                                <div>
                                  <h4 className="font-semibold mb-2">Skills Learned</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedExperience.skills_learned}</p>
                                </div>
                              )}

                              {selectedExperience.project_highlights && (
                                <div>
                                  <h4 className="font-semibold mb-2">Project Highlights</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedExperience.project_highlights}</p>
                                </div>
                              )}

                              {selectedExperience.mentor_feedback && (
                                <div>
                                  <h4 className="font-semibold mb-2">Mentor Feedback</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedExperience.mentor_feedback}</p>
                                </div>
                              )}

                              {selectedExperience.suggestions_for_improvement && (
                                <div>
                                  <h4 className="font-semibold mb-2">Suggestions for Improvement</h4>
                                  <p className="text-sm bg-muted p-3 rounded">{selectedExperience.suggestions_for_improvement}</p>
                                </div>
                              )}
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

        {experiences.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No intern experiences found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InternExperiencesList;