import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  CreditCard,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Navigation,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import vawLogoDark from "@/assets/vaw-logo-dark.png";
import { getApplicationDisplayId } from "./TrackApplication";
import { KYCCameraDrawer } from "@/components/kyc/KYCCameraDrawer";
import { ProfileImageCropModal } from "@/components/kyc/ProfileImageCropModal";

const ReKYCPage = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const appId = routeId || searchParams.get("id") || searchParams.get("appId") || "";

  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState(appId);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recordSource, setRecordSource] = useState<"team_applications_staff" | "staff_profiles" | "team_applications" | "internship_applications" | null>(null);
  const [rawRecord, setRawRecord] = useState<any>(null);
  const [isCameraDrawerOpen, setIsCameraDrawerOpen] = useState(false);

  // KYC Form State
  const [kycData, setKycData] = useState({
    full_name: "",
    email: "",
    phone: "",
    govt_id_type: "aadhaar",
    govt_id_number: "",
    kyc_selfie_url: "",
    profile_photo_url: "",
    physical_address: "",
    geo_coordinates: "",
    kyc_gps_location: "",
    declaration_accepted: false
  });

  // Crop Modal state
  const [cropFile, setCropFile] = useState<File | string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handleProfilePhotoSelect = (file: File) => {
    setCropFile(file);
    setIsCropModalOpen(true);
  };
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (appId) {
      fetchApplicantRecord(appId);
    } else {
      setLoading(false);
    }
  }, [appId]);

  // Handle camera stream initialization & switching
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isCameraActive) {
      const initCamera = async () => {
        setCameraError(null);
        try {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          }
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          mediaStreamRef.current = stream;
          activeStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch((e) => console.error("Video play error:", e));
          }
        } catch (err: any) {
          console.error("Camera access error:", err);
          setCameraError("Camera access denied or device unavailable. Please allow camera permissions.");
        }
      };
      initCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, cameraFacingMode]);

  const fetchApplicantRecord = async (targetId: string) => {
    if (!targetId || !targetId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const cleanTarget = targetId.trim();
    // Extract pure UUID if present anywhere in cleanTarget (e.g. APP-12345678-abcd... -> 12345678-abcd...)
    const uuidMatch = cleanTarget.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const pureUuid = uuidMatch ? uuidMatch[0].toLowerCase() : null;

    // Extract clean term without APP- prefix
    const rawTerm = cleanTarget.replace(/^APP-/i, "").trim().toLowerCase();

    // Extract 8-char hex prefix if applicable (for APP-01234567 or 01234567)
    const cleanHex = rawTerm.replace(/[^0-9a-f]/gi, "");
    const hex8 = cleanHex.length >= 8 ? cleanHex.slice(0, 8).toLowerCase() : null;

    const isEmail = cleanTarget.includes("@");

    const matchRecord = (rec: any) => {
      if (!rec) return false;
      const recId = (rec.id || "").toLowerCase();
      const recIdNoHyphen = recId.replace(/-/g, "");
      const cleanTargetLower = cleanTarget.toLowerCase();
      const rawTermLower = rawTerm.toLowerCase();
      const displayIdLower = getApplicationDisplayId(rec.id).toLowerCase();
      const displayIdNoApp = displayIdLower.replace(/^app-/i, "");

      return (
        (pureUuid && recId === pureUuid) ||
        recId === cleanTargetLower ||
        recId === rawTermLower ||
        (hex8 && recIdNoHyphen.startsWith(hex8)) ||
        displayIdLower === cleanTargetLower ||
        displayIdNoApp === rawTermLower ||
        (rec.email && rec.email.toLowerCase() === cleanTargetLower) ||
        (rec.phone && rec.phone.replace(/\D/g, "").includes(cleanTarget.replace(/\D/g, "")))
      );
    };

    const queryTable = async (tableName: string) => {
      let records: any[] = [];
      try {
        if (pureUuid) {
          const { data } = await supabase.from(tableName as any).select("*").eq("id", pureUuid);
          if (data && data.length > 0) records.push(...data);
        }
        if (isEmail && records.length === 0) {
          const { data } = await supabase.from(tableName as any).select("*").eq("email", cleanTarget.toLowerCase());
          if (data && data.length > 0) records.push(...data);
        }
        if (hex8 && records.length === 0) {
          const uuidLower = `${hex8}-0000-0000-0000-000000000000`;
          const uuidUpper = `${hex8}-ffff-ffff-ffff-ffffffffffff`;
          const { data } = await supabase.from(tableName as any).select("*").gte("id", uuidLower).lte("id", uuidUpper);
          if (data && data.length > 0) records.push(...data);
        }
      } catch (e) {
        console.warn(`Targeted query error for ${tableName}:`, e);
      }

      // Fallback query if targeted query returned no matches
      if (records.length === 0) {
        try {
          const { data } = await supabase.from(tableName as any).select("*");
          if (data) records = data;
        } catch (e) {
          console.warn(`Fallback query error for ${tableName}:`, e);
        }
      }

      return records.find(matchRecord);
    };

    try {
      // 1. Query team_applications_staff (Staff applications)
      const matchedStaff = await queryTable("team_applications_staff");
      if (matchedStaff) {
        setRecordSource("team_applications_staff");
        setRawRecord(matchedStaff);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedStaff.full_name || "",
          email: matchedStaff.email || "",
          phone: matchedStaff.phone || "",
          govt_id_number: matchedStaff.govt_id_number || "",
          kyc_selfie_url: matchedStaff.kyc_selfie_url || "",
          profile_photo_url: matchedStaff.profile_photo_url || "",
          physical_address: matchedStaff.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      // 2. Query staff_profiles
      const matchedProfile = await queryTable("staff_profiles");
      if (matchedProfile) {
        setRecordSource("staff_profiles");
        setRawRecord(matchedProfile);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedProfile.full_name || "",
          email: matchedProfile.email || "",
          phone: matchedProfile.phone || "",
          govt_id_number: matchedProfile.govt_id_number || "",
          kyc_selfie_url: matchedProfile.kyc_selfie_url || "",
          profile_photo_url: matchedProfile.profile_photo_url || "",
          physical_address: matchedProfile.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      // 3. Query team_applications (General team applications)
      const matchedTeam = await queryTable("team_applications");
      if (matchedTeam) {
        setRecordSource("team_applications");
        setRawRecord(matchedTeam);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedTeam.full_name || "",
          email: matchedTeam.email || "",
          phone: matchedTeam.phone || "",
          govt_id_number: matchedTeam.govt_id_number || "",
          kyc_selfie_url: matchedTeam.kyc_selfie_url || "",
          profile_photo_url: matchedTeam.profile_photo_url || "",
          physical_address: matchedTeam.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      // 4. Query internship_applications
      const matchedIntern = await queryTable("internship_applications");
      if (matchedIntern) {
        setRecordSource("internship_applications");
        setRawRecord(matchedIntern);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedIntern.full_name || "",
          email: matchedIntern.email || "",
          phone: matchedIntern.phone || "",
          govt_id_number: matchedIntern.govt_id_number || "",
          kyc_selfie_url: matchedIntern.kyc_selfie_url || "",
          profile_photo_url: matchedIntern.profile_photo_url || "",
          physical_address: matchedIntern.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      toast({
        title: "Application Not Found",
        description: "Could not find a valid record for the provided Application ID or search term.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Error loading application record for Re-KYC:", err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = () => {
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setKycData((prev) => ({ ...prev, kyc_selfie_url: dataUrl }));
      stopCamera();
      toast({
        title: "Selfie Captured!",
        description: "Your KYC selfie photo has been captured successfully.",
      });
    }
  };

  const fetchGeoLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        let detectedAddr = `GPS Coordinates: ${coords}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            detectedAddr = `${data.display_name} (${coords})`;
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        }

        // Store GPS in a separate field — do NOT overwrite the user's entered physical_address
        setKycData((prev) => ({
          ...prev,
          geo_coordinates: coords,
          kyc_gps_location: detectedAddr,
        }));
        setGeoLoading(false);
        toast({
          title: "Location Verified",
          description: `Captured coordinates: ${coords}`,
        });
      },
      (error) => {
        console.error("Geo error:", error);
        setGeoLoading(false);
        toast({
          title: "Location Access Denied",
          description: "Please enable location permission in your browser to verify your location.",
          variant: "destructive",
        });
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  const handleSubmitReKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawRecord || !recordSource) {
      toast({
        title: "Error",
        description: "No target applicant record loaded.",
        variant: "destructive",
      });
      return;
    }

    if (!kycData.govt_id_number.trim()) {
      toast({
        title: "Government ID Required",
        description: "Please enter your Government ID number.",
        variant: "destructive",
      });
      return;
    }

    if (!kycData.kyc_selfie_url) {
      toast({
        title: "Selfie Required",
        description: "Please capture a live KYC selfie photo using your camera.",
        variant: "destructive",
      });
      return;
    }

    if (!kycData.geo_coordinates) {
      toast({
        title: "Location Verification Required",
        description: "Please click 'Capture & Verify Live Location' to verify your current location.",
        variant: "destructive",
      });
      return;
    }

    if (!kycData.declaration_accepted) {
      toast({
        title: "Declaration Required",
        description: "Please accept the verification declaration before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (recordSource === "team_applications_staff" || recordSource === "team_applications" || recordSource === "internship_applications") {
        const targetTable = recordSource;
        const updatePayload: any = {
          govt_id_number: kycData.govt_id_number,
          kyc_selfie_url: kycData.kyc_selfie_url,
          // physical_address is NOT overwritten — GPS is stored in kyc_gps_location only
          phone: kycData.phone || rawRecord.phone,
          status: "pending",
          updated_at: new Date().toISOString(),
        };
        // Only update physical_address if the user actually entered one
        if (kycData.physical_address && kycData.physical_address !== rawRecord.physical_address) {
          updatePayload.physical_address = kycData.physical_address;
        }
        // Always store GPS separately
        if (kycData.geo_coordinates) {
          updatePayload.kyc_gps_location = kycData.kyc_gps_location || kycData.geo_coordinates;
        }
        if (kycData.profile_photo_url) {
          updatePayload.profile_photo_url = kycData.profile_photo_url;
        }

        const { error } = await supabase
          .from(targetTable as any)
          .update(updatePayload)
          .eq("id", rawRecord.id);

        if (error) throw error;
      } else if (recordSource === "staff_profiles") {
        const updatePayload: any = {
          govt_id_number: kycData.govt_id_number,
          kyc_selfie_url: kycData.kyc_selfie_url,
          // physical_address is NOT overwritten — GPS stored separately
          application_status: "approved",
          updated_at: new Date().toISOString(),
        };
        if (kycData.physical_address && kycData.physical_address !== rawRecord.physical_address) {
          updatePayload.physical_address = kycData.physical_address;
        }
        if (kycData.geo_coordinates) {
          updatePayload.kyc_gps_location = kycData.kyc_gps_location || kycData.geo_coordinates;
        }
        if (kycData.profile_photo_url) {
          updatePayload.profile_photo_url = kycData.profile_photo_url;
        }

        const { error } = await supabase
          .from("staff_profiles")
          .update(updatePayload)
          .eq("id", rawRecord.id);

        if (error) throw error;
      }

      setSubmitted(true);
      toast({
        title: "Re-KYC Verification Submitted!",
        description: "Your updated KYC information has been recorded and sent to HR for review.",
      });
    } catch (err: any) {
      console.error("Error submitting Re-KYC:", err);
      toast({
        title: "Submission Error",
        description: err.message || "Failed to submit Re-KYC details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Loading Re-KYC Verification Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800">
      <SEO
        title="Re-KYC Verification Portal | VAW Technologies"
        description="Update and complete your KYC identity verification as requested by HR."
      />

      {/* Clean Minimal Logo-Only Header */}
      <header className="w-full py-5 px-6 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={vawLogoDark} alt="VAW Official Network" className="h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs px-3 py-1 font-semibold uppercase">
          Official HR Re-KYC Portal
        </Badge>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link
            to={appId ? `/track-application?id=${appId}` : "/track-application"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application Tracking
          </Link>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Identity Verification
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Re-KYC Verification
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Please complete <strong>JUST the KYC section</strong> below to update your verified identification details for HR review.
          </p>
        </div>

        {/* Application Search Bar Card */}
        {!rawRecord && !submitted && (
          <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-2xl mb-8 overflow-hidden">
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchInput) fetchApplicantRecord(searchInput);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    type="text"
                    placeholder="Enter Application ID (e.g. APP-XXXXXX), Email, or Phone..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-11 h-12 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-blue-500 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? "Searching..." : "Find Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Confirmation View */}
        {submitted ? (
          <Card className="bg-zinc-900 border-emerald-500/30 text-center p-8 rounded-2xl animate-fade-in shadow-2xl">
            <CardContent className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Re-KYC Submitted Successfully!</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto mt-2">
                  Your updated Government ID, live photo, and verified location details have been submitted to HR.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left text-xs space-y-2 font-mono max-w-sm mx-auto">
                <div className="flex justify-between text-zinc-400">
                  <span>Applicant Name:</span>
                  <span className="text-zinc-200 font-semibold">{kycData.full_name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Application ID:</span>
                  <span className="text-blue-400 font-semibold">{getApplicationDisplayId(rawRecord?.id || appId)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Location:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[180px]">{kycData.geo_coordinates}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>KYC Status:</span>
                  <span className="text-emerald-400 font-semibold">Updated & Pending HR Review</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  <Link to={`/track-application?id=${getApplicationDisplayId(rawRecord?.id || appId)}`}>
                    Track Application Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Re-KYC Form */
          <form onSubmit={handleSubmitReKyc} className="space-y-6">
            {/* Applicant Personal Details Summary Card */}
            {rawRecord && (
              <Card className="bg-zinc-900/90 border-blue-500/30 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-zinc-800/80 p-4 sm:p-5 bg-blue-500/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400 shrink-0" />
                      Applicant Personal Details
                    </CardTitle>
                    <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 font-mono text-xs py-1 px-3 whitespace-nowrap shrink-0">
                      ID: {getApplicationDisplayId(rawRecord.id)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex flex-col md:flex-row items-center gap-6">
                  {/* Profile Photo Display & Upload */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500/50 bg-zinc-950 shadow-md">
                      {kycData.profile_photo_url ? (
                        <img
                          src={kycData.profile_photo_url}
                          alt={kycData.full_name || "Profile Photo"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
                          <User className="h-8 w-8" />
                          <span className="text-[9px]">No Photo</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="h-5 w-5 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProfilePhotoSelect(file);
                          }}
                        />
                      </label>
                    </div>
                    <label className="text-[11px] font-semibold text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {kycData.profile_photo_url ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProfilePhotoSelect(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Personal details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <User className="h-3 w-3 text-blue-400" /> Full Name
                      </span>
                      <p className="font-bold text-white text-base">{kycData.full_name || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Mail className="h-3 w-3 text-blue-400" /> Email Address
                      </span>
                      <p className="font-medium text-zinc-200 text-sm truncate">{kycData.email || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Phone className="h-3 w-3 text-blue-400" /> Phone Number
                      </span>
                      <p className="font-medium text-zinc-200 text-sm">{kycData.phone || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Government Identification */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  1. Government Identification
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Select and enter your government issued photo identity document details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs font-semibold">Document Type *</Label>
                    <Select
                      value={kycData.govt_id_type}
                      onValueChange={(val) => setKycData((prev) => ({ ...prev, govt_id_type: val }))}
                    >
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100 text-sm h-11">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-xs font-semibold">Document Number *</Label>
                    <Input
                      type="text"
                      placeholder="e.g. XXXX-XXXX-XXXX"
                      value={kycData.govt_id_number}
                      onChange={(e) => setKycData((prev) => ({ ...prev, govt_id_number: e.target.value }))}
                      className="bg-zinc-950 border-zinc-800 text-zinc-100 text-sm h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Live Camera Selfie Capture */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-400" />
                  2. Live Camera Selfie Capture *
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Capture a live selfie photo using your front or back camera for verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Photo Preview or Trigger Drawer Button */}
                <div className="flex flex-col items-center justify-center">
                  {kycData.kyc_selfie_url ? (
                    <div className="relative group w-48 h-48 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-zinc-950">
                      <img
                        src={kycData.kyc_selfie_url}
                        alt="KYC Selfie Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setIsCameraDrawerOpen(true)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl"
                        >
                          <Camera className="h-3.5 w-3.5 mr-1" /> Retake Photo
                        </Button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-emerald-500 text-zinc-950 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md h-52 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Verification Selfie</p>
                        <p className="text-xs text-zinc-400 mt-1">This camera photo is exclusively for identity verification (not profile picture)</p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsCameraDrawerOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg shadow-blue-600/20"
                      >
                        <Camera className="h-4 w-4 mr-2" /> Open Camera Drawer
                      </Button>
                    </div>
                  )}
                </div>

                <KYCCameraDrawer
                  isOpen={isCameraDrawerOpen}
                  onClose={() => setIsCameraDrawerOpen(false)}
                  fullName={kycData.full_name || rawRecord?.full_name}
                  username={rawRecord?.username || kycData.full_name?.toLowerCase().replace(/\s+/g, "")}
                  onCapture={(photoUrl) => {
                    setKycData((prev) => ({ ...prev, kyc_selfie_url: photoUrl }));
                    toast({
                      title: "Selfie Verified!",
                      description: "KYC photo captured with timestamp and applicant details.",
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Step 3: Location Verification (GPS Capture) */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  3. Location Capture & Verification *
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Verify your present physical location using live GPS coordinates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Live GPS Coordinates</span>
                      {kycData.geo_coordinates ? (
                        <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> {kycData.geo_coordinates}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-0.5">Location not captured yet. Click button to verify.</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={fetchGeoLocation}
                      disabled={geoLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 px-4 rounded-xl shrink-0"
                    >
                      {geoLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Detecting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" /> Capture & Verify Live Location
                        </>
                      )}
                    </Button>
                  </div>

                  {kycData.kyc_gps_location && (
                    <div className="pt-2 border-t border-zinc-800/60 text-xs text-zinc-300">
                      <span className="text-zinc-500 font-semibold block mb-0.5">📍 GPS-Detected Address (KYC Only — does not change your primary address):</span>
                      <p className="font-mono bg-zinc-900 p-2.5 rounded-lg border border-emerald-800/40 text-emerald-200">{kycData.kyc_gps_location}</p>
                    </div>
                  )}
                </div>

                {/* Primary address remains editable and unaffected by GPS */}
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs font-semibold">Primary Residential Address <span className="text-zinc-500">(unchanged by GPS)</span></Label>
                  <textarea
                    rows={2}
                    placeholder="Your permanent home address..."
                    value={kycData.physical_address}
                    onChange={(e) => setKycData((prev) => ({ ...prev, physical_address: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Declaration & Submission */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <Checkbox
                  id="declaration"
                  checked={kycData.declaration_accepted}
                  onCheckedChange={(checked) =>
                    setKycData((prev) => ({ ...prev, declaration_accepted: !!checked }))
                  }
                  className="mt-0.5"
                />
                <label htmlFor="declaration" className="text-xs text-zinc-400 leading-relaxed cursor-pointer">
                  I hereby declare that all identity documents, live selfie photo, and location details provided are true, authentic, and belong to me. I authorize VAW Technologies HR to verify my KYC details.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl transition-all shadow-xl shadow-blue-600/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Submitting Re-KYC...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Submit Re-KYC Verification
                  </span>
                )}
              </Button>
            </div>

            <ProfileImageCropModal
              isOpen={isCropModalOpen}
              imageFile={cropFile}
              onClose={() => {
                setIsCropModalOpen(false);
                setCropFile(null);
              }}
              onCropSave={(croppedUrl) => {
                setKycData((prev) => ({ ...prev, profile_photo_url: croppedUrl }));
                toast({
                  title: "Profile Photo Saved (1:1)",
                  description: "Image cropped to 1:1 aspect ratio.",
                });
              }}
            />
          </form>
        )}
      </main>
    </div>
  );
};

export default ReKYCPage;
