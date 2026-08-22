import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  User,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Upload,
  Clock,
  Award,
  Copy,
  Check,
  ShieldCheck,
  Code,
  Smartphone,
  Palette,
  TrendingUp,
  Bot,
  Database,
  Terminal,
  PenTool,
  BookOpen,
  Layers,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DOMAIN_DETAILS } from "./Internship";

const DRAFT_STORAGE_KEY = "vaw_internship_application_draft";

const getInitialFormData = () => {
  const defaultData = {
    fullName: "",
    email: "",
    phone: "",
    collegeName: "",
    course: "",
    graduationYear: "",
    domains: [] as string[],
    coverLetter: "",
    portfolioLink: "",
    resumeUrl: "",
    resumeFileName: "",
    referrerName: "",
    agreeToTerms: false
  };

  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          ...defaultData,
          ...parsed,
          domains: Array.isArray(parsed.domains) ? parsed.domains : []
        };
      }
    }
  } catch (e) {
    console.error("Error reading internship draft:", e);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
  return defaultData;
};

const InternshipRegistration = () => {
  const { hasCompletedIntro } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const hasInitializedFromUrl = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState("");

  // Check URL query parameters ONCE on mount for pre-selected domains
  useEffect(() => {
    if (!hasInitializedFromUrl.current) {
      hasInitializedFromUrl.current = true;
      const queryDomains = searchParams.get("domains");
      if (queryDomains) {
        const splitDomains = queryDomains.split(",").map((d) => d.trim()).filter(Boolean);
        if (splitDomains.length > 0) {
          setFormData((prev) => {
            const currentList = Array.isArray(prev.domains) ? prev.domains : [];
            const merged = Array.from(new Set([...currentList, ...splitDomains]));
            return { ...prev, domains: merged };
          });
        }
      }
    }
  }, []);

  // Save continuous draft safely
  useEffect(() => {
    if (!submitted) {
      try {
        const payload = { ...formData };
        if (payload.resumeUrl && payload.resumeUrl.length > 100000) {
          payload.resumeUrl = "";
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Draft auto-save warning:", e);
      }
    }
  }, [formData, submitted]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a resume smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingResume(true);
    try {
      const base64Url = await fileToBase64(file);
      setFormData((prev) => ({
        ...prev,
        resumeUrl: base64Url,
        resumeFileName: file.name
      }));
      toast({
        title: "Resume Attached",
        description: `${file.name} successfully loaded.`
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Upload Error",
        description: "Failed to process resume file.",
        variant: "destructive"
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const toggleDomain = (domainId: string) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.domains) ? prev.domains : [];
      const isSelected = current.includes(domainId);
      const updated = isSelected
        ? current.filter((id) => id !== domainId)
        : [...current, domainId];
      return { ...prev, domains: updated };
    });
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        toast({ title: "Name Required", description: "Please enter your full legal name.", variant: "destructive" });
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        toast({ title: "Valid Email Required", description: "Please enter a valid email address.", variant: "destructive" });
        return false;
      }
      if (!formData.phone.trim() || formData.phone.trim().length < 10) {
        toast({ title: "Phone Number Required", description: "Please enter a 10-digit phone number.", variant: "destructive" });
        return false;
      }
      if (!formData.collegeName.trim()) {
        toast({ title: "College Name Required", description: "Please enter your college/university name.", variant: "destructive" });
        return false;
      }
      if (!formData.course.trim()) {
        toast({ title: "Course Required", description: "Please enter your degree/course (e.g. B.Tech CS, BCA, B.Sc).", variant: "destructive" });
        return false;
      }
      if (!formData.graduationYear.trim()) {
        toast({ title: "Graduation Year Required", description: "Please enter your expected graduation year.", variant: "destructive" });
        return false;
      }
    }

    if (step === 2) {
      if (!formData.domains || formData.domains.length === 0) {
        toast({ title: "Course Selection Required", description: "Please select at least one course or domain of interest.", variant: "destructive" });
        return false;
      }
    }

    if (step === 3) {
      if (!formData.coverLetter.trim() || formData.coverLetter.trim().length < 30) {
        toast({ title: "Motivation Required", description: "Please tell us why you wish to join (minimum 30 characters).", variant: "destructive" });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please check the box agreeing to the program guidelines.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const enrichedCoverLetter = `
${formData.coverLetter.trim()}

--- APPLICANT EXTRA DETAILS ---
Portfolio / Link: ${formData.portfolioLink || "N/A"}
Referred By: ${formData.referrerName || "Self"}
Resume Attached: ${formData.resumeFileName ? `Yes (${formData.resumeFileName})` : "No"}
Terms Agreed: Yes
      `.trim();

      const insertPayload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        college_name: formData.collegeName,
        course: formData.course,
        graduation_year: formData.graduationYear,
        domains: formData.domains,
        cover_letter: enrichedCoverLetter,
        resume_url: formData.resumeUrl || null
      };

      const { data, error } = await supabase
        .from("internship_applications")
        .insert(insertPayload)
        .select("id")
        .single();

      if (error) throw error;

      const newId = data?.id ? `INT-${data.id.slice(0, 8).toUpperCase()}` : `INT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setSubmittedAppId(newId);
      clearDraft();
      setSubmitted(true);

      toast({
        title: "Application Submitted Successfully!",
        description: "Your internship application has been recorded."
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast({
        title: "Submission Failed",
        description: err.message || "Unable to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasCompletedIntro) {
    return null;
  }

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between pt-20 md:pt-28">
        <MobileHeader />
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center flex-1">
          <Card className="w-full max-w-xl bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-2xl p-6 sm:p-8">
            <CardContent className="pt-4 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Application Submitted!</h2>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  Thank you for applying to the VAW Technologies Internship Program. Our domain mentors will review your application carefully.
                </p>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-5 space-y-2">
                <div className="text-[11px] text-blue-300 font-bold uppercase tracking-wider">Your Unique Application ID</div>
                <div className="text-2xl font-mono font-bold text-white tracking-wider flex items-center justify-center gap-3">
                  <span className="text-blue-400">{submittedAppId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(submittedAppId);
                      toast({ title: "Copied!", description: "Application ID copied to clipboard." });
                    }}
                    className="h-8 px-2 text-zinc-300 hover:text-white hover:bg-blue-500/20"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400">Save this ID to check your selection status on the Track Application portal.</p>
              </div>

              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-left text-xs space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Applicant:</span>
                  <span className="font-semibold text-white">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">College:</span>
                  <span className="font-semibold text-white">{formData.collegeName} ({formData.course})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Selected Courses:</span>
                  <span className="font-semibold text-blue-400">
                    {formData.domains.map((d) => DOMAIN_DETAILS.find((item) => item.id === d)?.label).filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => navigate("/track-application")}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-lg transition-all"
                >
                  Track Application Status
                </Button>
                <Button
                  onClick={() => navigate("/internship")}
                  variant="outline"
                  className="flex-1 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl py-3"
                >
                  Back to Internship Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden flex flex-col justify-between pt-20 md:pt-28 pb-12 selection:bg-blue-500/30">
      <SEO
        title="Internship Registration Form | VAW Technologies"
        description="Complete your official application for the 2-Month Online Certificate Internship Program in Tech & Design at VAW Technologies."
        keywords="internship application, tech internship registration, VAW internship, student program application"
      />
      
      {/* Mobile Header for mobile view */}
      <MobileHeader />
      {/* Navbar for desktop view */}
      <Navbar />

      <main className="container mx-auto px-4 py-6 md:py-10 flex-1 max-w-4xl">
        {/* Top Navigation Back Link */}
        <div className="mb-6">
          <Link
            to="/internship"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 text-blue-400" />
            Back to Internship Program Details
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            Internship Application <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Registration</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Fill out the form below to apply. You can select multiple courses and domains of interest.
          </p>
        </div>

        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto px-4 mb-4">
            {[
              { num: 1, label: "Student Info", icon: User },
              { num: 2, label: "Course Choice", icon: Layers },
              { num: 3, label: "Motivation & CV", icon: FileText },
              { num: 4, label: "Review & Submit", icon: CheckCircle2 }
            ].map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <div key={step.num} className="flex flex-col items-center gap-1.5 relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted || step.num < currentStep) {
                        setCurrentStep(step.num);
                      }
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30 scale-110"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                  </button>
                  <span className={`text-[11px] font-medium hidden sm:inline ${isActive ? "text-blue-400 font-semibold" : "text-zinc-400"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden max-w-xl mx-auto">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmitFinal}>
              {/* STEP 1: STUDENT & ACADEMIC INFO */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>Step 1 of 4</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Student & Academic Information</h2>
                    <p className="text-xs text-zinc-400 mt-1">Please provide your contact details and current academic affiliation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-300">Full Legal Name *</Label>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Email Address *</Label>
                      <Input
                        type="email"
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Phone Number (WhatsApp) *</Label>
                      <Input
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-semibold text-zinc-300">College / University Name *</Label>
                      <Input
                        placeholder="e.g. APJ Abdul Kalam Technological University / Model Engineering College"
                        value={formData.collegeName}
                        onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Course / Degree *</Label>
                      <Input
                        placeholder="e.g. B.Tech Computer Science / BCA / B.Sc"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Expected Year of Graduation *</Label>
                      <Input
                        placeholder="e.g. 2026 or 2027"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DOMAIN / COURSE SELECTION */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                      <Layers className="h-4 w-4" />
                      <span>Step 2 of 4</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Select Preferred Courses</h2>
                    <p className="text-xs text-zinc-400 mt-1">Select one or multiple courses of your interest to apply for.</p>
                  </div>

                  <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between text-xs text-blue-300">
                    <span>Chosen Tracks: <strong className="text-white font-bold">{formData.domains.length} Course(s) Selected</strong></span>
                    {formData.domains.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, domains: [] }))}
                        className="text-xs text-blue-400 underline hover:text-white"
                      >
                        Clear Selections
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DOMAIN_DETAILS.map((domain) => {
                      const isChecked = formData.domains.includes(domain.id);
                      const IconComponent = domain.icon;

                      return (
                        <div
                          key={domain.id}
                          onClick={() => toggleDomain(domain.id)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3 ${
                            isChecked
                              ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10"
                              : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="pt-0.5">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked
                                  ? "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/50"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                <IconComponent className="h-4 w-4 text-blue-400" />
                                {domain.label}
                              </span>
                              <Badge className={`text-[9px] px-1.5 py-0 border ${domain.badgeColor}`}>
                                {domain.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{domain.shortDesc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: MOTIVATION & ATTACHMENTS */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                      <FileText className="h-4 w-4" />
                      <span>Step 3 of 4</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Motivation & Background</h2>
                    <p className="text-xs text-zinc-400 mt-1">Tell us about your goals and attach your resume or portfolio.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">
                        Why do you want to join this internship program? * (Min. 30 characters)
                      </Label>
                      <Textarea
                        rows={4}
                        placeholder="Describe your learning goals, interest in your chosen courses, and what you hope to achieve..."
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-300">
                          Portfolio / GitHub / LinkedIn Link (Optional)
                        </Label>
                        <Input
                          placeholder="https://github.com/username or LinkedIn URL"
                          value={formData.portfolioLink}
                          onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-300">
                          Referred By / Campus Ambassador (Optional)
                        </Label>
                        <Input
                          placeholder="Name or referral code if any"
                          value={formData.referrerName}
                          onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Resume File Attachment */}
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-semibold text-zinc-300">
                        Upload Resume / CV (Optional - PDF or DOC up to 10MB)
                      </Label>
                      <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950 rounded-xl p-5 text-center transition-all">
                        {formData.resumeFileName ? (
                          <div className="flex items-center justify-between bg-blue-950/40 border border-blue-500/30 p-3 rounded-lg text-xs text-zinc-200">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-400" />
                              <span className="font-semibold">{formData.resumeFileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, resumeUrl: "", resumeFileName: "" })}
                              className="text-zinc-400 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block space-y-2">
                            <Upload className="h-8 w-8 text-blue-400 mx-auto" />
                            <div className="text-xs text-zinc-300 font-medium">
                              {uploadingResume ? "Processing file..." : "Click to select or drag & drop your resume"}
                            </div>
                            <div className="text-[11px] text-zinc-500">Supports PDF, DOC, DOCX</div>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRMATION */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Step 4 of 4</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Review & Confirm Application</h2>
                    <p className="text-xs text-zinc-400 mt-1">Please check your details before final submission.</p>
                  </div>

                  <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Full Name:</span>
                        <span className="font-bold text-white">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Contact Email:</span>
                        <span className="font-bold text-white">{formData.email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Phone Number:</span>
                        <span className="font-bold text-white">{formData.phone}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Academic Details:</span>
                        <span className="font-bold text-white">{formData.collegeName} ({formData.course} - {formData.graduationYear})</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-3">
                      <span className="text-zinc-400 block mb-1">Selected Courses:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.domains.map((d) => {
                          const domainObj = DOMAIN_DETAILS.find((item) => item.id === d);
                          return (
                            <Badge key={d} className={`text-xs ${domainObj?.badgeColor || ""}`}>
                              {domainObj?.label || d}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {formData.coverLetter && (
                      <div className="border-t border-zinc-800 pt-3">
                        <span className="text-zinc-400 block mb-1">Motivation Summary:</span>
                        <p className="text-zinc-300 italic bg-zinc-900/80 p-3 rounded-lg leading-relaxed">
                          "{formData.coverLetter}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2">
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, agreeToTerms: !prev.agreeToTerms }))}
                      className="flex items-start gap-3 cursor-pointer select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                          formData.agreeToTerms
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/50"
                            : "border-zinc-700 bg-zinc-900"
                        }`}
                      >
                        {formData.agreeToTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="text-xs leading-relaxed text-zinc-300">
                        <span className="font-semibold text-white cursor-pointer">
                          I confirm that the information provided above is accurate.
                        </span>
                        <p className="text-zinc-400 mt-1">
                          I agree to abide by the program rules and participate in the scheduled internship activities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buttons Navigation */}
              <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrev}
                    className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 font-semibold shadow-lg shadow-blue-500/20"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.agreeToTerms}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl px-8 py-2.5 font-bold shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? "Submitting Application..." : "Complete & Submit Application"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default InternshipRegistration;
