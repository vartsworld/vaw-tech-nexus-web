import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const getApplicationDisplayId = (id: string) => {
  if (!id) return "";
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `APP-${cleanId.slice(0, 8)}`;
};

interface TrackedApplication {
  id: string;
  displayId: string;
  applicantName: string;
  email: string;
  phone?: string;
  type: "staff" | "internship" | "team_general";
  roleOrDomain: string;
  status: string;
  createdAt: string;
  kycStatus?: "verified" | "pending" | "re_kyc_requested";
  reKycRequested?: boolean;
  cvUrl?: string;
  details?: any;
}

const TrackApplication = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("id") || searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [application, setApplication] = useState<TrackedApplication | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (queryToUse?: string) => {
    const term = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (!term) {
      toast({
        title: "Search Term Required",
        description: "Please enter your Application ID, Email address, or Phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setApplication(null);

    try {
      // Extract raw code if user typed APP-XXXXXX
      const rawTerm = term.replace(/^APP-/i, "").trim().toLowerCase();

      // 1. Search in team_applications_staff (Staff & Team Applications)
      const { data: staffApps, error: staffErr } = await supabase
        .from("team_applications_staff")
        .select("*");

      if (staffErr) console.warn("Staff apps fetch error:", staffErr);

      let matchedStaff = staffApps?.find((app: any) => {
        const appDisplay = getApplicationDisplayId(app.id).toLowerCase();
        return (
          app.id?.toLowerCase() === rawTerm ||
          appDisplay === term.toLowerCase() ||
          appDisplay.replace("app-", "").toLowerCase() === rawTerm ||
          app.email?.toLowerCase() === term.toLowerCase() ||
          (app.phone && app.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "")))
        );
      });

      if (matchedStaff) {
        const reKycRequested =
          matchedStaff.status === "re_kyc_requested" ||
          matchedStaff.kyc_status === "re_kyc_requested" ||
          (matchedStaff.about_me && matchedStaff.about_me.includes("Re-KYC Requested"));

        setApplication({
          id: matchedStaff.id,
          displayId: getApplicationDisplayId(matchedStaff.id),
          applicantName: matchedStaff.full_name,
          email: matchedStaff.email,
          phone: matchedStaff.phone || undefined,
          type: "staff",
          roleOrDomain: matchedStaff.preferred_role || "Staff / Team",
          status: matchedStaff.status || "pending",
          createdAt: matchedStaff.created_at,
          kycStatus: reKycRequested
            ? "re_kyc_requested"
            : matchedStaff.kyc_selfie_url
            ? "verified"
            : "pending",
          reKycRequested,
          cvUrl: matchedStaff.cv_url || undefined,
          details: matchedStaff,
        });
        setIsSearching(false);
        return;
      }

      // 2. Search in staff_profiles (Approved & Onboarded Staff)
      const { data: staffProfiles } = await supabase
        .from("staff_profiles")
        .select("*");

      let matchedProfile = staffProfiles?.find((prof: any) => {
        const profDisplay = getApplicationDisplayId(prof.id).toLowerCase();
        return (
          prof.id?.toLowerCase() === rawTerm ||
          profDisplay === term.toLowerCase() ||
          prof.email?.toLowerCase() === term.toLowerCase() ||
          (prof.phone && prof.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "")))
        );
      });

      if (matchedProfile) {
        const reKycRequested =
          matchedProfile.application_status === "re_kyc_requested" ||
          matchedProfile.re_kyc_requested === true ||
          (matchedProfile.about_me && matchedProfile.about_me.includes("Re-KYC Requested"));

        setApplication({
          id: matchedProfile.id,
          displayId: getApplicationDisplayId(matchedProfile.id),
          applicantName: matchedProfile.full_name,
          email: matchedProfile.email,
          phone: matchedProfile.phone || undefined,
          type: "staff",
          roleOrDomain: matchedProfile.role || "Staff Member",
          status: "approved",
          createdAt: matchedProfile.created_at || new Date().toISOString(),
          kycStatus: reKycRequested
            ? "re_kyc_requested"
            : matchedProfile.kyc_selfie_url || matchedProfile.kyc_document_url
            ? "verified"
            : "pending",
          reKycRequested,
          cvUrl: matchedProfile.cv_url || undefined,
          details: matchedProfile,
        });
        setIsSearching(false);
        return;
      }

      // 3. Search in internship_applications
      const { data: internApps } = await supabase
        .from("internship_applications")
        .select("*");

      let matchedIntern = internApps?.find((app: any) => {
        const appDisplay = getApplicationDisplayId(app.id).toLowerCase();
        return (
          app.id?.toLowerCase() === rawTerm ||
          appDisplay === term.toLowerCase() ||
          app.email?.toLowerCase() === term.toLowerCase() ||
          (app.phone && app.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "")))
        );
      });

      if (matchedIntern) {
        const domainsList = Array.isArray(matchedIntern.domains)
          ? matchedIntern.domains.join(", ")
          : matchedIntern.domains || "Internship";

        setApplication({
          id: matchedIntern.id,
          displayId: getApplicationDisplayId(matchedIntern.id),
          applicantName: matchedIntern.full_name,
          email: matchedIntern.email,
          phone: matchedIntern.phone,
          type: "internship",
          roleOrDomain: `Intern - ${domainsList}`,
          status: "pending",
          createdAt: matchedIntern.created_at,
          kycStatus: "pending",
          cvUrl: matchedIntern.resume_url || undefined,
          details: matchedIntern,
        });
        setIsSearching(false);
        return;
      }

      // 4. Search in team_applications
      const { data: teamApps } = await supabase
        .from("team_applications")
        .select("*");

      let matchedTeamGen = teamApps?.find((app: any) => {
        const appDisplay = getApplicationDisplayId(app.id).toLowerCase();
        return (
          app.id?.toLowerCase() === rawTerm ||
          appDisplay === term.toLowerCase() ||
          app.email?.toLowerCase() === term.toLowerCase() ||
          (app.phone && app.phone.replace(/\D/g, "").includes(term.replace(/\D/g, "")))
        );
      });

      if (matchedTeamGen) {
        setApplication({
          id: matchedTeamGen.id,
          displayId: getApplicationDisplayId(matchedTeamGen.id),
          applicantName: matchedTeamGen.full_name,
          email: matchedTeamGen.email,
          phone: matchedTeamGen.phone,
          type: "team_general",
          roleOrDomain: matchedTeamGen.preferred_role || "Team Member",
          status: matchedTeamGen.status || "pending",
          createdAt: matchedTeamGen.created_at,
          kycStatus: "pending",
          cvUrl: matchedTeamGen.resume_url || undefined,
          details: matchedTeamGen,
        });
        setIsSearching(false);
        return;
      }

      setNotFound(true);
    } catch (error) {
      console.error("Error tracking application:", error);
      toast({
        title: "Search Error",
        description: "Failed to fetch application tracking data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyDisplayId = () => {
    if (application) {
      navigator.clipboard.writeText(application.displayId);
      setCopiedId(true);
      toast({
        title: "Application ID Copied!",
        description: `${application.displayId} copied to clipboard.`,
      });
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getStatusStepIndex = (status: string, reKycRequested?: boolean) => {
    if (reKycRequested) return 1; // Step 2 requires action
    switch (status.toLowerCase()) {
      case "pending":
      case "under_review":
        return 1;
      case "approved":
      case "onboarded":
        return 3;
      case "rejected":
      case "declined":
        return 3;
      default:
        return 1;
    }
  };

  const currentStep = application ? getStatusStepIndex(application.status, application.reKycRequested) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800">
      <SEO
        title="Track Application Status | VAW Technologies"
        description="Check the real-time status of your staff or internship application using your unique Application ID or email."
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Applicant Tracking Nexus
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Track Your Application
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            Enter your <strong>Application ID</strong> (e.g. <code className="text-blue-400 font-mono">APP-XXXXXX</code>), Email address, or Phone number to view your application progress.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-2xl mb-10 overflow-hidden">
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Enter Application ID, Email, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-blue-500 text-sm md:text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Track Status
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Not Found State */}
        {notFound && (
          <Card className="bg-zinc-900 border-red-500/30 text-center p-8 rounded-2xl animate-fade-in">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">No Application Found</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                We couldn't find any application matching <strong>"{searchQuery}"</strong>. Please check your Application ID or Email address and try again.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Found Application Details */}
        {application && (
          <div className="space-y-8 animate-fade-in">
            {/* Re-KYC Alert Banner */}
            {application.reKycRequested && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-amber-300">Action Required: Re-KYC Verification Needed</h4>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      HR has requested updated KYC verification documents for your application. Please complete the quick KYC verification process.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shrink-0 shadow-lg shadow-amber-500/20"
                >
                  <Link to={`/re-kyc/${application.id}`}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Complete Re-KYC Now
                  </Link>
                </Button>
              </div>
            )}

            {/* Application Overview Card */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300">
                      {application.type === "staff" ? "Staff Application" : "Internship Application"}
                    </Badge>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Submitted {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mt-1">
                    {application.applicantName}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-sm">
                    Position: <span className="text-blue-400 font-semibold">{application.roleOrDomain}</span>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-right">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Application ID</div>
                    <div className="font-mono text-sm font-bold text-blue-400 flex items-center gap-2">
                      {application.displayId}
                      <button
                        onClick={copyDisplayId}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Copy Application ID"
                      >
                        {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-8">
                {/* Progress Stepper */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Application Lifecycle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                    {/* Step 1: Received */}
                    <div className={`p-4 rounded-xl border ${currentStep >= 0 ? "bg-blue-500/10 border-blue-500/30 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStep >= 0 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                          1
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Application Received</div>
                          <div className="text-xs text-zinc-400">Successfully recorded in system</div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Under Review / Re-KYC */}
                    <div className={`p-4 rounded-xl border ${application.reKycRequested ? "bg-amber-500/10 border-amber-500/40 text-amber-300" : currentStep >= 1 ? "bg-blue-500/10 border-blue-500/30 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${application.reKycRequested ? "bg-amber-500 text-zinc-950" : currentStep >= 1 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                          2
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {application.reKycRequested ? "Re-KYC Verification" : "HR & Team Review"}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {application.reKycRequested ? "Re-KYC Link generated by HR" : "Screening & document review"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Final Decision */}
                    <div className={`p-4 rounded-xl border ${application.status === "approved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : application.status === "rejected" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-zinc-950 border-zinc-800 text-zinc-500"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${application.status === "approved" ? "bg-emerald-600 text-white" : application.status === "rejected" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                          3
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {application.status === "approved" ? "Approved & Onboarded" : application.status === "rejected" ? "Application Declined" : "Final Decision"}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {application.status === "approved" ? "Welcome to VAW Technologies" : application.status === "rejected" ? "Thank you for applying" : "Pending final evaluation"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                    <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Contact Details</div>
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      {application.email}
                    </div>
                    {application.phone && (
                      <div className="flex items-center gap-2 text-zinc-200">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        {application.phone}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                    <div className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">KYC Status</div>
                    <div className="flex items-center gap-2">
                      {application.kycStatus === "verified" ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Live KYC Selfie Verified
                        </span>
                      ) : application.reKycRequested ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" /> Re-KYC Verification Pending
                        </span>
                      ) : (
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> Standard Documents Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Link for Re-KYC */}
                {application.reKycRequested && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      asChild
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                    >
                      <Link to={`/re-kyc/${application.id}`}>
                        Proceed to Re-KYC Form <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default TrackApplication;
