import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  User,
  Briefcase,
  Users,
  FileCheck,
  Camera,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  HeartPulse,
  FileText,
  Check,
  Info,
  Calendar as CalendarIcon,
  MapPin,
  Navigation,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import vawLogoDark from "@/assets/vaw-logo-dark.png";

const DRAFT_STORAGE_KEY = "vaw_team_application_draft";

const HEALTH_ISSUE_OPTIONS = [
  { id: "diabetes", label: "Diabetes" },
  { id: "cancer", label: "Any type of Cancer" },
  { id: "visibility_hearing", label: "Issue with Visibility or Hearing" },
  { id: "heart_condition", label: "Heart Condition / Cardiac Issue" },
  { id: "hypertension", label: "Hypertension / High Blood Pressure" },
  { id: "asthma", label: "Asthma / Respiratory Issues" },
  { id: "neurological", label: "Neurological Condition" },
  { id: "other", label: "Other Chronic Illness" },
];

const GOVT_ID_OPTIONS = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pancard", label: "PAN Card" },
  { value: "passport", label: "Passport" },
  { value: "voter_id", label: "Voter ID" },
  { value: "driving_license", label: "Driving License" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Helper to open/download Data URLs and Blob files safely without Supabase Bucket 404 errors
export const viewOrDownloadFile = (url: string, filename = 'document.pdf') => {
  if (!url) return;
  if (url.startsWith('data:')) {
    try {
      const arr = url.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.click();
      }
    } catch (e) {
      console.error('Error opening data URL:', e);
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};

// Helper to calculate exact age from DOB string YYYY-MM-DD
const calculateAge = (dobString: string): number | null => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

// Helper to format address fields into single comma-separated string with GPS coordinates
export const formatAddressWithCommas = (data: {
  addr_house?: string;
  addr_street?: string;
  addr_city?: string;
  addr_district?: string;
  addr_state?: string;
  addr_country?: string;
  addr_pincode?: string;
  geo_coordinates?: string;
  physical_address?: string;
}) => {
  const parts = [
    data.addr_house?.trim(),
    data.addr_street?.trim(),
    data.addr_city?.trim(),
    data.addr_district?.trim(),
    data.addr_state?.trim(),
    data.addr_country?.trim()
      ? (data.addr_pincode?.trim() ? `${data.addr_country.trim()} - ${data.addr_pincode.trim()}` : data.addr_country.trim())
      : data.addr_pincode?.trim(),
  ].filter(Boolean);

  let formatted = parts.join(", ");
  if (!formatted && data.physical_address) {
    formatted = data.physical_address;
  }
  if (data.geo_coordinates?.trim()) {
    formatted = formatted ? `${formatted}, (Geo: ${data.geo_coordinates.trim()})` : `(Geo: ${data.geo_coordinates.trim()})`;
  }
  return formatted;
};

// Helper to load initial form data from draft safely
const getInitialFormData = () => {
  const defaultData = {
    // Section 1: Basic / Personal Information
    full_name: "",
    email: "",
    phone: "",
    username: "",
    gender: "",
    date_of_birth: "",
    physical_address: "",
    // Breakdown address fields
    addr_house: "",
    addr_street: "",
    addr_city: "",
    addr_district: "",
    addr_state: "",
    addr_country: "India",
    addr_pincode: "",
    geo_coordinates: "",
    blood_group: "",
    has_health_issues: false,
    health_issues: [] as string[],

    // Section 2: Professional Information
    preferred_role: "staff",
    preferred_department_id: "",
    work_confidence_level: "",
    reference_person_name: "",
    reference_person_number: "",
    about_me: "",
    cv_url: "",
    cv_filename: "",

    // Section 3: Family Information
    father_name: "",
    mother_name: "",
    siblings_count: 0,
    sibling_names: [] as string[],
    relationship_status: "",
    marriage_preference: "",

    // Section 4: Documents, ID & KYC Verification
    profile_photo_url: "",
    govt_id_type: "aadhaar",
    govt_id_number: "",
    kyc_selfie_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    submitted_at: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  try {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultData,
          ...parsed,
          submitted_at: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        };
      }
    }
  } catch (e) {
    console.error("Error loading saved draft:", e);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
  return defaultData;
};

const TeamApplication = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingCV, setIsDraggingCV] = useState(false);

  // Geolocation State
  const [geoLoading, setGeoLoading] = useState(false);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Form State - Loaded synchronously from draft
  const [formData, setFormData] = useState(getInitialFormData);

  // Helper to handle address breakdown fields change and auto-format physical_address
  const handleAddressFieldChange = (field: string, val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      return {
        ...updated,
        physical_address: formatAddressWithCommas(updated),
      };
    });
  };

  // Helper to fetch live GPS coordinates via browser geolocation API
  const fetchGeoLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Your device/browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const coordsStr = `Lat: ${lat}, Long: ${lng}`;
        setFormData((prev) => {
          const updated = { ...prev, geo_coordinates: coordsStr };
          return {
            ...updated,
            physical_address: formatAddressWithCommas(updated),
          };
        });
        setGeoLoading(false);
        toast({
          title: "Location Coordinates Captured!",
          description: `Captured GPS: ${coordsStr}`,
        });
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setGeoLoading(false);
        toast({
          title: "Location Permission Denied",
          description: "Unable to retrieve GPS coordinates. Please allow location access or proceed manually.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Derived applicant age
  const applicantAge = calculateAge(formData.date_of_birth);

  // Current formatted date for header
  const headerDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Fetch Departments & Notify Draft Restoration
  useEffect(() => {
    fetchDepartments();
    // Notify user if draft was restored with content
    if (formData.full_name || formData.email || formData.phone || formData.physical_address) {
      toast({
        title: "Draft Restored",
        description: "Your previously entered details have been automatically restored.",
      });
    }
  }, []);

  // Safe Continuous LocalStorage Auto-Save (Stripped of heavy base64 strings to prevent QuotaExceededError)
  useEffect(() => {
    if (!submitted) {
      try {
        const draftPayload = { ...formData };
        // Omit huge Base64 file contents from localStorage to keep payload under 10KB
        if (draftPayload.cv_url && draftPayload.cv_url.length > 100000) {
          draftPayload.cv_url = "";
        }
        if (draftPayload.profile_photo_url && draftPayload.profile_photo_url.length > 100000) {
          draftPayload.profile_photo_url = "";
        }
        if (draftPayload.kyc_selfie_url && draftPayload.kyc_selfie_url.length > 100000) {
          draftPayload.kyc_selfie_url = "";
        }

        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      } catch (e) {
        console.warn("Could not write to localStorage draft:", e);
      }
    }
  }, [formData, submitted]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing draft:", e);
    }
  };

  // Handle Sibling Count Change
  const handleSiblingsCountChange = (countStr: string) => {
    const count = parseInt(countStr) || 0;
    const validCount = Math.max(0, Math.min(count, 10));
    const updatedNames = [...formData.sibling_names];

    if (validCount > updatedNames.length) {
      while (updatedNames.length < validCount) {
        updatedNames.push("");
      }
    } else {
      updatedNames.splice(validCount);
    }

    setFormData((prev) => ({
      ...prev,
      siblings_count: validCount,
      sibling_names: updatedNames,
    }));
  };

  const handleSiblingNameChange = (index: number, name: string) => {
    const updatedNames = [...formData.sibling_names];
    updatedNames[index] = name;
    setFormData((prev) => ({ ...prev, sibling_names: updatedNames }));
  };

  const handleHealthIssueToggle = (issueId: string) => {
    setFormData((prev) => {
      const current = [...prev.health_issues];
      const index = current.indexOf(issueId);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(issueId);
      }
      return { ...prev, health_issues: current };
    });
  };

  // Helper file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Process and save uploaded CV file
  const processCVFile = async (file: File) => {
    if (!file) return;
    setUploadingCV(true);
    try {
      // Encode file directly as Base64 Data URL to guarantee reliable offline & DB saving without Bucket 404 error
      const base64Url = await fileToBase64(file);
      setFormData((prev) => ({
        ...prev,
        cv_url: base64Url,
        cv_filename: file.name,
      }));
      toast({
        title: "CV Uploaded & Saved",
        description: `${file.name} has been successfully attached.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
        description: "Could not read CV file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingCV(false);
    }
  };

  // Drag & drop handlers for CV
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCV(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCVFile(file);
    }
  };

  // Handle Profile Photo Upload
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const base64Url = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, profile_photo_url: base64Url }));
      toast({
        title: "Profile Photo Saved",
        description: "Your profile photo has been successfully attached.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload Error",
        description: "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Camera KYC Selfie Handlers
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera permission denied or camera unavailable. You can upload a selfie image as fallback.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      setFormData((prev) => ({ ...prev, kyc_selfie_url: dataUrl }));
      stopCamera();
      toast({
        title: "KYC Selfie Verified",
        description: "Live selfie captured and verified.",
      });
    }
  };

  const handleSelfieFileUpload = async (file: File) => {
    if (!file) return;
    try {
      const dataUrl = await fileToBase64(file);
      setFormData((prev) => ({ ...prev, kyc_selfie_url: dataUrl }));
      toast({
        title: "KYC Selfie Uploaded",
        description: "Selfie photo saved for verification.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Section Validation
  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.full_name.trim()) {
        toast({ title: "Required Field", description: "Please enter your full name.", variant: "destructive" });
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        toast({ title: "Required Field", description: "Please enter a valid email address.", variant: "destructive" });
        return false;
      }
      if (!formData.phone.trim()) {
        toast({ title: "Required Field", description: "Please enter your contact phone number.", variant: "destructive" });
        return false;
      }
      if (!formData.username.trim()) {
        toast({ title: "Required Field", description: "Please choose a username.", variant: "destructive" });
        return false;
      }
      if (!formData.date_of_birth) {
        toast({ title: "Required Field", description: "Please enter your date of birth.", variant: "destructive" });
        return false;
      }
      const age = calculateAge(formData.date_of_birth);
      if (age === null || age < 18) {
        const ageDisplay = age !== null ? `${age} years old` : "underage";
        toast({
          title: "Age Restriction (Under 18)",
          description: `You are currently ${ageDisplay}. Applicants must be at least 18 years of age to apply.`,
          variant: "destructive"
        });
        return false;
      }
    }

    if (step === 2) {
      if (!formData.cv_url) {
        toast({ title: "CV Required", description: "Please upload your CV / Resume before proceeding.", variant: "destructive" });
        return false;
      }
    }

    if (step === 4) {
      if (!formData.profile_photo_url) {
        toast({ title: "Profile Photo Required", description: "Please upload your profile photo.", variant: "destructive" });
        return false;
      }
      if (!formData.govt_id_number.trim()) {
        toast({ title: "Government ID Required", description: "Please enter your Govt ID number.", variant: "destructive" });
        return false;
      }
      if (!formData.kyc_selfie_url) {
        toast({ title: "KYC Verification Required", description: "Please take a live selfie using your camera.", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (isCameraActive) stopCamera();
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    if (isCameraActive) stopCamera();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Trigger Policy Modal
  const handleOpenPolicyModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;
    setShowPolicyModal(true);
  };

  // Submit Final Form
  const handleSubmitFinal = async () => {
    if (!policyAccepted) {
      toast({ title: "Policy Agreement Required", description: "You must accept the terms & policies to submit.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const siblingsSummary = formData.siblings_count > 0
        ? `${formData.siblings_count} (${formData.sibling_names.filter(Boolean).join(", ")})`
        : "None";

      const insertPayload: any = {
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
        siblings: siblingsSummary,
        relationship_status: formData.relationship_status,
        marriage_preference: formData.marriage_preference,
        work_confidence_level: formData.work_confidence_level,
        reference_person_name: formData.reference_person_name,
        reference_person_number: formData.reference_person_number,
        preferred_department_id: formData.preferred_department_id || null,
        preferred_role: formData.preferred_role as any,
        physical_address: formData.physical_address,
        govt_id_type: formData.govt_id_type,
        govt_id_number: formData.govt_id_number,
        blood_group: formData.blood_group,
        has_health_issues: formData.has_health_issues,
        health_issues: formData.health_issues,
        sibling_names: formData.sibling_names.filter(Boolean),
        kyc_selfie_url: formData.kyc_selfie_url,
        legal_accepted: true,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
      };

      const { error } = await supabase
        .from("team_applications_staff")
        .insert(insertPayload);

      if (error) {
        console.warn("Full payload insert failed, falling back to core payload:", error);
        const fallbackAboutMe = `
${formData.about_me}

--- ADDITIONAL VERIFIED DATA ---
Physical Address: ${formData.physical_address || 'N/A'}
Blood Group: ${formData.blood_group || 'N/A'}
Health Issues: ${formData.has_health_issues ? formData.health_issues.join(", ") : "None"}
Govt ID: ${formData.govt_id_type.toUpperCase()} (${formData.govt_id_number})
KYC Selfie Verified: Yes
Emergency Contact: ${formData.emergency_contact_name} (${formData.emergency_contact_phone})
Legal Terms Accepted: Yes (${formData.submitted_at})
        `.trim();

        const corePayload = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          cv_url: formData.cv_url,
          about_me: fallbackAboutMe,
          profile_photo_url: formData.profile_photo_url,
          father_name: formData.father_name,
          mother_name: formData.mother_name,
          siblings: siblingsSummary,
          relationship_status: formData.relationship_status,
          marriage_preference: formData.marriage_preference,
          work_confidence_level: formData.work_confidence_level,
          reference_person_name: formData.reference_person_name,
          reference_person_number: formData.reference_person_number,
          preferred_department_id: formData.preferred_department_id || null,
          preferred_role: formData.preferred_role as any,
        };

        const { error: coreError } = await supabase
          .from("team_applications_staff")
          .insert(corePayload);

        if (coreError) throw coreError;
      }

      clearDraft();
      setSubmitted(true);
      setShowPolicyModal(false);

      toast({
        title: "Application Submitted Successfully!",
        description: "Your official team application has been recorded.",
      });
    } catch (error: any) {
      console.error("Error submitting team application:", error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">Application Submitted!</h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Thank you for applying to join VAW Technologies. Your application and verification documents have been recorded.
              </p>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-left text-xs space-y-2 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Applicant Name:</span>
                <span className="font-semibold">{formData.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Submission Date:</span>
                <span className="font-semibold">{formData.submitted_at}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">KYC Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Live Selfie Verified
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Resume / CV:</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[200px]">
                  {formData.cv_filename || "Attached Resume"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium">
                <Link to="/">Return to Home Page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      <SEO
        title="Team Application & Staff Registration | VAW Technologies"
        description="Official team application portal for joining VAW Technologies."
        keywords="vaw staff application, career application, team registration, official kyc"
      />

      {/* HEADER WITH LOGO & DATE */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={vawLogoDark}
            alt="VAW Technologies Logo"
            className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* DATE DISPLAYED IN HEADER (RIGHT SIDE) */}
        <div className="flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 rounded-full border border-zinc-800 text-xs text-zinc-300 shadow-inner">
          <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
          <span>{headerDateStr}</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TOP HERO BANNER - REDESIGNED & PERFECTLY CENTERED */}
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-zinc-400" /> Recruitment Portal
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Team Application Form
            </h1>
            
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
              Fill in your details across the 4 sections. Progress auto-saves continuously.
            </p>

            {/* PERFECTLY CENTERED STEP & STAGE BANNER */}
            <div className="pt-2 w-full max-w-md mx-auto">
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col items-center justify-center space-y-1 shadow-inner">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Step {currentStep} of 4</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-wide text-center">
                  {currentStep === 1 && "Basic & Personal Information"}
                  {currentStep === 2 && "Professional Details & CV"}
                  {currentStep === 3 && "Family Information"}
                  {currentStep === 4 && "Documents & KYC Verification"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP PROGRESS WIZARD */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { step: 1, label: "Personal", icon: User },
            { step: 2, label: "Professional", icon: Briefcase },
            { step: 3, label: "Family", icon: Users },
            { step: 4, label: "Documents & KYC", icon: FileCheck },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep || validateStep(currentStep)) {
                    setCurrentStep(item.step);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 p-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-zinc-800 border-zinc-600 text-white shadow-md"
                    : isCompleted
                    ? "bg-zinc-900 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-400"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : isCompleted
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : item.step}
                </div>
                <span className="text-xs font-medium truncate hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN FORM CARD */}
        <Card className="bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-md">
          <CardContent className="p-6 sm:p-8 space-y-8">
            <form onSubmit={handleOpenPolicyModal} className="space-y-8">

              {/* STEP 1: BASIC / PERSONAL INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-zinc-400" /> Basic or Personal Information
                    </h3>
                    <p className="text-xs text-zinc-400">Enter your personal information and health background.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-zinc-200">Full Name <span className="text-rose-400">*</span></Label>
                      <Input
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Doe"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-200">Email Address <span className="text-rose-400">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-zinc-200">Phone Number <span className="text-rose-400">*</span></Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>

                    {/* PREFERRED USERNAME WITH INFO POPOVER */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="username" className="text-zinc-200">Preferred Username <span className="text-rose-400">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="text-zinc-400 hover:text-white transition-colors" title="Username info">
                              <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-200" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs max-w-xs p-3 shadow-xl">
                            The username should be rememberable to later login to the staff dashboard.
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        id="username"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="johndoe"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-zinc-200">Gender</Label>
                      <Select value={formData.gender} onValueChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DOB FIELD WITH AGE DISPLAY & 18+ ELIGIBILITY CHECK */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="date_of_birth" className="text-zinc-200">
                          Date of Birth <span className="text-rose-400">*</span>
                        </Label>
                        {applicantAge !== null && (
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            applicantAge >= 18 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}>
                            Age: {applicantAge} years
                          </span>
                        )}
                      </div>
                      <Input
                        id="date_of_birth"
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                        className={`bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white [color-scheme:dark] ${
                          applicantAge !== null && applicantAge < 18 ? "border-rose-500/60 focus:border-rose-500" : ""
                        }`}
                        style={{ colorScheme: "dark" }}
                      />
                      {applicantAge !== null && (
                        <p className={`text-xs font-medium flex items-center gap-1 pt-0.5 ${
                          applicantAge >= 18 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {applicantAge >= 18 
                            ? `✓ Age: ${applicantAge} years old (Eligible for application)`
                            : `✕ Age: ${applicantAge} years old (Must be at least 18 years old to apply)`
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Physical Address Breakdown & Auto Geolocation Fetcher */}
                  <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div>
                        <Label className="text-white font-semibold text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-400" /> Physical Address (Permanent & Present) <span className="text-rose-400">*</span>
                        </Label>
                        <p className="text-xs text-zinc-400">Fill in your address breakdown below. It will be stored formatted with commas.</p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={fetchGeoLocation}
                        disabled={geoLoading}
                        className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1.5 shrink-0"
                      >
                        {geoLoading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        {geoLoading ? "Detecting GPS..." : "Auto-Detect My Location"}
                      </Button>
                    </div>

                    {formData.geo_coordinates && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>GPS Coordinates Attached: {formData.geo_coordinates}</span>
                      </div>
                    )}

                    {/* Address Breakdown Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="addr_house" className="text-xs text-zinc-300">House Name / House No. / Building / Flat <span className="text-rose-400">*</span></Label>
                        <Input
                          id="addr_house"
                          value={formData.addr_house}
                          onChange={(e) => handleAddressFieldChange("addr_house", e.target.value)}
                          placeholder="e.g. Door No. 4B, Harmony Heights"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="addr_street" className="text-xs text-zinc-300">Street / Road / Area / Landmark</Label>
                        <Input
                          id="addr_street"
                          value={formData.addr_street}
                          onChange={(e) => handleAddressFieldChange("addr_street", e.target.value)}
                          placeholder="e.g. Marine Drive Road, Near Park Plaza"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr_city" className="text-xs text-zinc-300">City / Town <span className="text-rose-400">*</span></Label>
                        <Input
                          id="addr_city"
                          value={formData.addr_city}
                          onChange={(e) => handleAddressFieldChange("addr_city", e.target.value)}
                          placeholder="e.g. Kochi / Trivandrum"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr_district" className="text-xs text-zinc-300">District</Label>
                        <Input
                          id="addr_district"
                          value={formData.addr_district}
                          onChange={(e) => handleAddressFieldChange("addr_district", e.target.value)}
                          placeholder="e.g. Ernakulam"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr_state" className="text-xs text-zinc-300">State / Province <span className="text-rose-400">*</span></Label>
                        <Input
                          id="addr_state"
                          value={formData.addr_state}
                          onChange={(e) => handleAddressFieldChange("addr_state", e.target.value)}
                          placeholder="e.g. Kerala"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="addr_pincode" className="text-xs text-zinc-300">Pin Code / Postal Code <span className="text-rose-400">*</span></Label>
                        <Input
                          id="addr_pincode"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.addr_pincode}
                          onChange={(e) => handleAddressFieldChange("addr_pincode", e.target.value)}
                          placeholder="e.g. 682011"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs font-mono focus:border-zinc-500"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="addr_country" className="text-xs text-zinc-300">Country</Label>
                        <Input
                          id="addr_country"
                          value={formData.addr_country}
                          onChange={(e) => handleAddressFieldChange("addr_country", e.target.value)}
                          placeholder="India"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs focus:border-zinc-500"
                        />
                      </div>
                    </div>

                    {/* Combined Formatted Address Preview */}
                    {formData.physical_address && (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold block tracking-wider">Full Address Preview (Saved with Commas):</span>
                        <p className="text-zinc-200 font-mono leading-relaxed">{formData.physical_address}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    {/* Blood Group */}
                    <div className="space-y-2">
                      <Label htmlFor="blood_group" className="text-zinc-200">Blood Group</Label>
                      <Select value={formData.blood_group} onValueChange={(val) => setFormData((prev) => ({ ...prev, blood_group: val }))}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Health Issues Toggle */}
                    <div className="space-y-2">
                      <Label className="text-zinc-200 flex items-center gap-1.5">
                        <HeartPulse className="h-4 w-4 text-rose-400" /> Are you subjected to any health issues?
                      </Label>
                      <div className="flex gap-4 pt-1">
                        <Button
                          type="button"
                          variant={formData.has_health_issues ? "default" : "outline"}
                          className={formData.has_health_issues ? "bg-rose-700 hover:bg-rose-800 text-white flex-1" : "bg-zinc-950 border-zinc-800 flex-1"}
                          onClick={() => setFormData((prev) => ({ ...prev, has_health_issues: true }))}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={!formData.has_health_issues ? "default" : "outline"}
                          className={!formData.has_health_issues ? "bg-zinc-800 text-white flex-1" : "bg-zinc-950 border-zinc-800 flex-1"}
                          onClick={() => setFormData((prev) => ({ ...prev, has_health_issues: false, health_issues: [] }))}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Health Issues Checklist - Only shown if YES */}
                  {formData.has_health_issues && (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3 animate-in fade-in duration-200">
                      <Label className="text-rose-300 font-semibold text-xs uppercase tracking-wider block">
                        Select applicable health conditions:
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {HEALTH_ISSUE_OPTIONS.map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.health_issues.includes(item.id)
                                ? "bg-rose-900/40 border-rose-500 text-white"
                                : "bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-950"
                            }`}
                          >
                            <Checkbox
                              checked={formData.health_issues.includes(item.id)}
                              onCheckedChange={() => handleHealthIssueToggle(item.id)}
                            />
                            <span className="text-xs font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: PROFESSIONAL INFORMATION & DRAG & DROP CV */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-zinc-400" /> Professional Information
                    </h3>
                    <p className="text-xs text-zinc-400">Specify your role preferences and upload your resume.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_role" className="text-zinc-200">Preferred Role</Label>
                      <Select value={formData.preferred_role} onValueChange={(val) => setFormData((prev) => ({ ...prev, preferred_role: val }))}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="staff">Staff Member</SelectItem>
                          <SelectItem value="lead">Team Lead</SelectItem>
                          <SelectItem value="department_head">Department Head</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_department" className="text-zinc-200">Preferred Department</Label>
                      <Select value={formData.preferred_department_id} onValueChange={(val) => setFormData((prev) => ({ ...prev, preferred_department_id: val }))}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="work_confidence_level" className="text-zinc-200">How confident are you in your work field?</Label>
                    <Select
                      value={formData.work_confidence_level}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, work_confidence_level: val }))}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectValue placeholder="Select your confidence level" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="great">Great at it (Expert level)</SelectItem>
                        <SelectItem value="best">Best at it (Proficient)</SelectItem>
                        <SelectItem value="good">Good at it (Intermediate)</SelectItem>
                        <SelectItem value="not_sure">I'm not sure (Beginner)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.work_confidence_level && formData.work_confidence_level !== "great" && (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label htmlFor="ref_name" className="text-zinc-200 text-xs">Reference Person Name</Label>
                        <Input
                          id="ref_name"
                          value={formData.reference_person_name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, reference_person_name: e.target.value }))}
                          placeholder="Mentor / expert name"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref_num" className="text-zinc-200 text-xs">Reference Person Number</Label>
                        <Input
                          id="ref_num"
                          value={formData.reference_person_number}
                          onChange={(e) => setFormData((prev) => ({ ...prev, reference_person_number: e.target.value }))}
                          placeholder="Contact phone number"
                          className="bg-zinc-900 border-zinc-800 text-white text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="about_me" className="text-zinc-200">Tell Us About Yourself</Label>
                    <Textarea
                      id="about_me"
                      rows={3}
                      maxLength={1000}
                      value={formData.about_me}
                      onChange={(e) => setFormData((prev) => ({ ...prev, about_me: e.target.value }))}
                      placeholder="Briefly describe your experience, goals, and key strengths..."
                      className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white resize-none"
                    />
                    <div className="flex justify-end text-xs text-zinc-500 mt-1">
                      <span className={formData.about_me.length >= 800 ? "text-amber-500 font-bold" : ""}>
                        {formData.about_me.length}/1000 characters
                      </span>
                    </div>
                  </div>

                  {/* DRAG & DROP CV UPLOAD AREA */}
                  <div className="space-y-3">
                    <Label className="text-zinc-200 font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-400" /> Upload Resume / CV (PDF, DOC) <span className="text-rose-400">*</span>
                    </Label>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDraggingCV
                          ? "border-zinc-400 bg-zinc-800/80 scale-[1.01]"
                          : formData.cv_url
                          ? "border-emerald-500/40 bg-zinc-950"
                          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                      }`}
                    >
                      <input
                        id="cv_drag_input"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processCVFile(file);
                        }}
                        className="hidden"
                      />

                      <label htmlFor="cv_drag_input" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                          {uploadingCV ? (
                            <RefreshCw className="h-5 w-5 animate-spin text-zinc-300" />
                          ) : formData.cv_url ? (
                            <FileText className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          {uploadingCV ? (
                            <span className="text-xs text-zinc-300 animate-pulse">Processing & Saving CV...</span>
                          ) : formData.cv_url ? (
                            <span className="text-sm font-semibold text-white block">
                              📄 {formData.cv_filename || "Attached Resume File"}
                            </span>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-white block">
                                Drag & drop your CV file here, or <span className="underline text-zinc-300">browse</span>
                              </span>
                              <span className="text-xs text-zinc-500">Supports PDF, DOC, DOCX files</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* STATUS SHOWN BELOW DOCUMENT DISPLAYED */}
                    {formData.cv_url && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>CV Attached & Saved</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => viewOrDownloadFile(formData.cv_url, formData.cv_filename)}
                          className="text-xs text-zinc-300 hover:text-white underline font-semibold"
                        >
                          View Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: FAMILY INFORMATION */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-zinc-400" /> Family Information
                    </h3>
                    <p className="text-xs text-zinc-400">Provide details regarding your family background.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="father_name" className="text-zinc-200">Father's Name</Label>
                      <Input
                        id="father_name"
                        value={formData.father_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, father_name: e.target.value }))}
                        placeholder="Father's full name"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mother_name" className="text-zinc-200">Mother's Name</Label>
                      <Input
                        id="mother_name"
                        value={formData.mother_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, mother_name: e.target.value }))}
                        placeholder="Mother's full name"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>
                  </div>

                  {/* SIBLINGS COUNT & DYNAMIC SIBLING NAME INPUTS */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="siblings_count" className="text-zinc-200">
                        Number of Siblings
                      </Label>
                      <Input
                        id="siblings_count"
                        type="number"
                        min="0"
                        max="10"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.siblings_count || ""}
                        onChange={(e) => handleSiblingsCountChange(e.target.value)}
                        placeholder="0"
                        className="bg-zinc-900 border-zinc-800 focus:border-zinc-500 text-white w-full sm:w-48 font-mono text-base"
                      />
                    </div>

                    {/* DYNAMIC SIBLING NAME INPUT FIELDS */}
                    {formData.siblings_count > 0 && (
                      <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                        <Label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">
                          Sibling Names (Optional):
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Array.from({ length: formData.siblings_count }).map((_, index) => (
                            <div key={index} className="space-y-1">
                              <Label htmlFor={`sibling_${index}`} className="text-zinc-400 text-xs">
                                Sibling #{index + 1} Name
                              </Label>
                              <Input
                                id={`sibling_${index}`}
                                value={formData.sibling_names[index] || ""}
                                onChange={(e) => handleSiblingNameChange(index, e.target.value)}
                                placeholder={`Sibling ${index + 1} name`}
                                className="bg-zinc-900 border-zinc-800 text-white text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="relationship_status" className="text-zinc-200">Relationship Status</Label>
                      <Select
                        value={formData.relationship_status}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, relationship_status: val }))}
                      >
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="in_love">In Love</SelectItem>
                          <SelectItem value="non_married">Non-Married</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marriage_preference" className="text-zinc-200">Marriage Preference</Label>
                      <Select
                        value={formData.marriage_preference}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, marriage_preference: val }))}
                      >
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue placeholder="Your preference" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="prefer_married">Prefer being married</SelectItem>
                          <SelectItem value="prefer_single">Prefer being single</SelectItem>
                          <SelectItem value="no_preference">No preference</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENTS, GOVT ID & LIVE FRONT CAMERA KYC */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-zinc-400" /> Documents, Govt ID & Live KYC Verification
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Upload profile photo, Govt ID details, and complete your live KYC selfie capture.
                    </p>
                  </div>

                  {/* PROFILE PHOTO UPLOAD */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <Label className="text-white font-semibold block">
                      Profile Photo <span className="text-rose-400">*</span>
                    </Label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {formData.profile_photo_url ? (
                        <img
                          src={formData.profile_photo_url}
                          alt="Profile Preview"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-zinc-700 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-zinc-900 border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500">
                          <Upload className="h-6 w-6" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <Input
                          id="profile_photo_upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                          disabled={uploadingPhoto}
                          className="bg-zinc-900 border-zinc-800 text-white cursor-pointer file:bg-zinc-800 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold hover:file:bg-zinc-700"
                        />
                        <p className="text-xs text-zinc-500">Clear headshot photograph.</p>
                      </div>
                    </div>
                  </div>

                  {/* GOVT ID SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="govt_id_type" className="text-zinc-200">Government ID Type <span className="text-rose-400">*</span></Label>
                      <Select
                        value={formData.govt_id_type}
                        onValueChange={(val) => setFormData((prev) => ({ ...prev, govt_id_type: val }))}
                      >
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {GOVT_ID_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="govt_id_number" className="text-zinc-200">Govt ID Number <span className="text-rose-400">*</span></Label>
                      <Input
                        id="govt_id_number"
                        required
                        value={formData.govt_id_number}
                        onChange={(e) => setFormData((prev) => ({ ...prev, govt_id_number: e.target.value }))}
                        placeholder="Enter corresponding ID number"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* LIVE CAMERA KYC SELFIE SECTION */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <Label className="text-white font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4 text-zinc-400" /> Mandatory Live KYC Selfie Capture <span className="text-rose-400">*</span>
                    </Label>

                    <p className="text-xs text-zinc-400">
                      Use your device's front camera to take a live selfie verifying your identity.
                    </p>

                    {/* Camera view / preview */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 min-h-[200px] space-y-4">
                      {isCameraActive ? (
                        <div className="relative w-full max-w-sm rounded-xl overflow-hidden border-2 border-zinc-700 shadow-xl">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                            <Button
                              type="button"
                              onClick={captureSelfie}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1 text-xs"
                            >
                              <Camera className="h-4 w-4" /> Snap Selfie
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={stopCamera}
                              className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : formData.kyc_selfie_url ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={formData.kyc_selfie_url}
                            alt="KYC Live Selfie"
                            className="w-36 h-36 rounded-xl object-cover border-2 border-emerald-500/50 shadow-xl"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={startCamera}
                            className="bg-zinc-950 border-zinc-800 text-xs flex items-center gap-1 text-zinc-300"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Retake Selfie
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                            <Camera className="h-7 w-7" />
                          </div>
                          <Button
                            type="button"
                            onClick={startCamera}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs px-5"
                          >
                            Open Front Camera
                          </Button>
                          {cameraError && (
                            <div className="space-y-2">
                              <p className="text-xs text-rose-400">{cameraError}</p>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSelfieFileUpload(file);
                                }}
                                className="text-xs bg-zinc-950 border-zinc-800"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* STATUS SHOWN BELOW SELFIE DISPLAYED */}
                    {formData.kyc_selfie_url && (
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Live Selfie Verified</span>
                      </div>
                    )}
                  </div>

                  {/* EMERGENCY CONTACT DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="em_name" className="text-zinc-200">Emergency Contact Name</Label>
                      <Input
                        id="em_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                        placeholder="Relative / Guardian Name"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="em_phone" className="text-zinc-200">Emergency Contact Number</Label>
                      <Input
                        id="em_phone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        placeholder="+91 Emergency Phone"
                        className="bg-zinc-950 border-zinc-800 focus:border-zinc-500 text-white"
                      />
                    </div>
                  </div>

                  {/* DATE OF SUBMISSION AT THE END OF THE FORM (SECTION 4) */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span>Date of Application Submission:</span>
                    <span className="font-mono text-white font-semibold bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                      {formData.submitted_at}
                    </span>
                  </div>
                </div>
              )}

              {/* BOTTOM NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-6"
                  >
                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 shadow-lg shadow-emerald-600/10"
                  >
                    Submit Application <FileCheck className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* MANDATORY POLICY & TERMS POPUP MODAL */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[85vh] flex flex-col p-6 shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" /> Staff & Company Policy Agreement
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Read the complete official agreement terms below before submitting.
            </DialogDescription>
          </DialogHeader>

          {/* SCROLLABLE AGREEMENT CONTAINER */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 my-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-mono">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">1. General Terms of Staff Recruitment</h4>
            <p>
              By submitting this application, you attest that all information provided—including physical address, government identification numbers, blood group, medical history, and emergency contact details—is truthful, accurate, and verifiable.
            </p>

            <h4 className="text-sm font-bold text-white uppercase tracking-wider">2. Data Confidentiality & KYC Consent</h4>
            <p>
              VAW Technologies reserves the right to verify government identities (Aadhaar, PAN, Passport) and live camera selfie captures for anti-fraud and security purposes. Your identity documentation will remain strictly confidential within our HR system.
            </p>

            <h4 className="text-sm font-bold text-white uppercase tracking-wider">3. Code of Conduct & IP Protection</h4>
            <p>
              All proprietary source code, intellectual property, client information, and internal operations managed by VAW Technologies remain sole property of the organization. Misuse or unauthorized distribution will result in legal termination.
            </p>

            <h4 className="text-sm font-bold text-white uppercase tracking-wider">4. Health Declaration & Medical Transparency</h4>
            <p>
              Candidates must disclose any active health conditions to enable proper workplace accommodations and emergency procedures.
            </p>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-sans">
              ⚠️ <span className="font-bold">Acknowledgement:</span> You must check the confirmation box below to complete submission.
            </div>
          </div>

          {/* CHECKBOX AND SUBMIT FOOTER */}
          <div className="border-t border-zinc-800 pt-4 space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer hover:bg-zinc-950/80">
              <Checkbox
                checked={policyAccepted}
                onCheckedChange={(checked) => setPolicyAccepted(!!checked)}
                className="mt-0.5"
              />
              <span className="text-xs text-zinc-200 font-medium">
                Yes, i read and understand the terms
              </span>
            </label>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPolicyModal(false)}
                className="bg-zinc-950 border-zinc-800 text-zinc-300"
              >
                Go Back
              </Button>
              <Button
                type="button"
                disabled={!policyAccepted || isSubmitting}
                onClick={handleSubmitFinal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamApplication;