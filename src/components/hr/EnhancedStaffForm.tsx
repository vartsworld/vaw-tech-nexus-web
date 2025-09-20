import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedStaffFormProps {
  departments: any[];
  newStaff: any;
  setNewStaff: (staff: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const EnhancedStaffForm = ({ 
  departments, 
  newStaff, 
  setNewStaff, 
  onSubmit, 
  onCancel,
  isEdit = false 
}: EnhancedStaffFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [showReference, setShowReference] = useState(newStaff.work_confidence_level && newStaff.work_confidence_level !== 'great');
  const { toast } = useToast();

  const handleFileUpload = async (file: File, type: 'cv' | 'photo') => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const bucket = type === 'cv' ? 'staff-documents' : 'staff-photos';
      const filePath = `${newStaff.username || 'temp'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (type === 'cv') {
        setNewStaff({ ...newStaff, cv_url: data.publicUrl });
      } else {
        setNewStaff({ ...newStaff, profile_photo_url: data.publicUrl });
      }

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

  const copyTeamApplicationLink = () => {
    const link = `${window.location.origin}/team-application`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Team application link copied to clipboard.",
    });
  };

  const handleWorkConfidenceChange = (value: string) => {
    setNewStaff({ ...newStaff, work_confidence_level: value });
    setShowReference(value !== 'great');
    if (value === 'great') {
      setNewStaff({ 
        ...newStaff, 
        work_confidence_level: value,
        reference_person_name: "",
        reference_person_number: ""
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {!isEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Team Application Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Share this link with candidates to apply directly
            </p>
            <Button onClick={copyTeamApplicationLink} variant="outline" className="w-full">
              Copy Team Application Link
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={newStaff.username}
              onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
              placeholder="Enter username"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={newStaff.gender} onValueChange={(value) => setNewStaff({...newStaff, gender: value})}>
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
              value={newStaff.date_of_birth}
              onChange={(e) => setNewStaff({...newStaff, date_of_birth: e.target.value})}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Professional Information</h3>
          
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="lead">Team Lead</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={newStaff.department_id} onValueChange={(value) => setNewStaff({...newStaff, department_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input
              id="hire_date"
              type="date"
              value={newStaff.hire_date}
              onChange={(e) => setNewStaff({...newStaff, hire_date: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="work_confidence">Work Field Confidence</Label>
            <Select value={newStaff.work_confidence_level} onValueChange={handleWorkConfidenceChange}>
              <SelectTrigger>
                <SelectValue placeholder="How confident are you?" />
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
                  value={newStaff.reference_person_name}
                  onChange={(e) => setNewStaff({...newStaff, reference_person_name: e.target.value})}
                  placeholder="Name of someone who is great at this field"
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Reference Person Number</Label>
                <Input
                  id="reference_number"
                  value={newStaff.reference_person_number}
                  onChange={(e) => setNewStaff({...newStaff, reference_person_number: e.target.value})}
                  placeholder="Their contact number"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Family Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Family Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="father_name">Father's Name</Label>
            <Input
              id="father_name"
              value={newStaff.father_name}
              onChange={(e) => setNewStaff({...newStaff, father_name: e.target.value})}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <Label htmlFor="mother_name">Mother's Name</Label>
            <Input
              id="mother_name"
              value={newStaff.mother_name}
              onChange={(e) => setNewStaff({...newStaff, mother_name: e.target.value})}
              placeholder="Enter mother's name"
            />
          </div>
          <div>
            <Label htmlFor="siblings">Siblings</Label>
            <Input
              id="siblings"
              value={newStaff.siblings}
              onChange={(e) => setNewStaff({...newStaff, siblings: e.target.value})}
              placeholder="e.g., 2 brothers, 1 sister"
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="relationship_status">Relationship Status</Label>
            <Select value={newStaff.relationship_status} onValueChange={(value) => setNewStaff({...newStaff, relationship_status: value})}>
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
            <Select value={newStaff.marriage_preference} onValueChange={(value) => setNewStaff({...newStaff, marriage_preference: value})}>
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
          value={newStaff.about_me}
          onChange={(e) => setNewStaff({...newStaff, about_me: e.target.value})}
          placeholder="Tell us about yourself, your interests, goals, etc."
          rows={4}
        />
      </div>

      {/* File Uploads */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Documents & Photo</h3>
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
              {newStaff.cv_url && <span className="text-green-600 text-sm">✓ Uploaded</span>}
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
              {newStaff.profile_photo_url && <span className="text-green-600 text-sm">✓ Uploaded</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={uploading}>
          {uploading ? "Uploading..." : isEdit ? "Update Staff" : "Add Staff"}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedStaffForm;