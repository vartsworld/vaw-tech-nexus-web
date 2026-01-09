import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TeamApplication = () => {
  const [departments, setDepartments] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
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
    preferred_department_id: "",
    preferred_role: "staff"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  const handleFileUpload = async (file: File, type: 'cv' | 'photo') => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const bucket = type === 'cv' ? 'staff-documents' : 'staff-photos';
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type === 'cv' ? 'cv_url' : 'profile_photo_url']: data.publicUrl
      }));

      toast({
        title: "Success",
        description: `${type === 'cv' ? 'CV' : 'Photo'} uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: `Failed to upload ${type === 'cv' ? 'CV' : 'photo'}.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleWorkConfidenceChange = (value: string) => {
    setFormData(prev => ({ ...prev, work_confidence_level: value }));
    setShowReference(value !== 'great');
    if (value === 'great') {
      setFormData(prev => ({
        ...prev,
        work_confidence_level: value,
        reference_person_name: "",
        reference_person_number: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('team_applications_staff')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          cv_url: formData.cv_url,
          about_me: formData.about_me,
          profile_photo_url: formData.profile_photo_url,
          father_name: formData.father_name,
          mother_name: formData.mother_name,
          siblings: formData.siblings,
          relationship_status: formData.relationship_status,
          marriage_preference: formData.marriage_preference,
          work_confidence_level: formData.work_confidence_level,
          reference_person_name: formData.reference_person_name,
          reference_person_number: formData.reference_person_number,
          preferred_department_id: formData.preferred_department_id || null,
          preferred_role: formData.preferred_role as 'staff' | 'hr' | 'department_head'
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your team application has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for your interest in joining our team. We'll review your application and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO
        title="Join Our Core Team"
        description="Apply to join the core team at VAW Technologies. We're looking for passionate individuals in tech, design, and management. Start your career with us today."
        keywords="careers, job application, join team, tech jobs, design jobs, VAW, Varts, Kerala tech careers"
      />
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Join Our Team</CardTitle>
            </div>
            <p className="text-muted-foreground">
              Fill out this application to join our amazing team
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Preferred Username *</Label>
                    <Input
                      id="username"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_role">Preferred Role</Label>
                    <Select value={formData.preferred_role} onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="lead">Team Lead</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferred_department">Preferred Department</Label>
                    <Select value={formData.preferred_department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_department_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="work_confidence">How confident are you in your work field?</Label>
                    <Select value={formData.work_confidence_level} onValueChange={handleWorkConfidenceChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your confidence level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="great">Great at it</SelectItem>
                        <SelectItem value="best">Best at it</SelectItem>
                        <SelectItem value="good">Good at it</SelectItem>
                        <SelectItem value="not_sure">I'm not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {showReference && (
                    <>
                      <div>
                        <Label htmlFor="reference_name">Reference Person Name</Label>
                        <Input
                          id="reference_name"
                          value={formData.reference_person_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, reference_person_name: e.target.value }))}
                          placeholder="Name of someone who is great at this field"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reference_number">Reference Person Number</Label>
                        <Input
                          id="reference_number"
                          value={formData.reference_person_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, reference_person_number: e.target.value }))}
                          placeholder="Their contact number"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Family Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Family Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="father_name">Father's Name</Label>
                    <Input
                      id="father_name"
                      value={formData.father_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                      placeholder="Enter father's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_name">Mother's Name</Label>
                    <Input
                      id="mother_name"
                      value={formData.mother_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                      placeholder="Enter mother's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siblings">Siblings</Label>
                    <Input
                      id="siblings"
                      value={formData.siblings}
                      onChange={(e) => setFormData(prev => ({ ...prev, siblings: e.target.value }))}
                      placeholder="e.g., 2 brothers, 1 sister"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationship_status">Relationship Status</Label>
                    <Select value={formData.relationship_status} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="non_married">Non-married</SelectItem>
                        <SelectItem value="in_love">In love</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="marriage_preference">Marriage Preference</Label>
                    <Select value={formData.marriage_preference} onValueChange={(value) => setFormData(prev => ({ ...prev, marriage_preference: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Your preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefer_married">Prefer being married</SelectItem>
                        <SelectItem value="prefer_single">Prefer being single forever</SelectItem>
                        <SelectItem value="no_preference">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* About Me */}
              <div>
                <Label htmlFor="about_me">Tell About Yourself</Label>
                <Textarea
                  id="about_me"
                  value={formData.about_me}
                  onChange={(e) => setFormData(prev => ({ ...prev, about_me: e.target.value }))}
                  placeholder="Tell us about yourself, your interests, goals, experience, etc."
                  rows={4}
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Documents & Photo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cv_upload">Upload CV</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cv_upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'cv');
                        }}
                        disabled={uploading}
                      />
                      {formData.cv_url && <span className="text-green-600 text-sm">✓ Uploaded</span>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="photo_upload">Profile Photo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="photo_upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'photo');
                        }}
                        disabled={uploading}
                      />
                      {formData.profile_photo_url && <span className="text-green-600 text-sm">✓ Uploaded</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button type="submit" className="w-full" disabled={uploading}>
                  <Send className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default TeamApplication;