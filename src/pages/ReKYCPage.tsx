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
  Upload,
  CheckCircle2,
  AlertCircle,
  MapPin,
  FileCheck,
  User,
  CreditCard,
  Phone,
  ArrowLeft,
  Sparkles,
  Loader2,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getApplicationDisplayId } from "./TrackApplication";

const ReKYCPage = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const appId = routeId || searchParams.get("id") || searchParams.get("appId") || "";

  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recordSource, setRecordSource] = useState<"team_applications_staff" | "staff_profiles" | null>(null);
  const [rawRecord, setRawRecord] = useState<any>(null);

  // KYC Form State
  const [kycData, setKycData] = useState({
    full_name: "",
    email: "",
    phone: "",
    govt_id_type: "aadhaar",
    govt_id_number: "",
    kyc_selfie_url: "",
    physical_address: "",
    addr_house: "",
    addr_street: "",
    addr_city: "",
    addr_state: "",
    addr_pincode: "",
    geo_coordinates: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    declaration_accepted: false
  });

  // Camera handling state
  const [isCameraActive, setIsCameraActive] = useState(false);
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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchApplicantRecord = async (targetId: string) => {
    setLoading(true);
    const rawTerm = targetId.replace(/^APP-/i, "").trim();

    try {
      // Check team_applications_staff first
      const { data: staffApps } = await supabase.from("team_applications_staff").select("*");
      let matchedStaff = staffApps?.find(
        (app: any) => app.id === rawTerm || getApplicationDisplayId(app.id) === targetId || app.email === targetId
      );

      if (matchedStaff) {
        setRecordSource("team_applications_staff");
        setRawRecord(matchedStaff);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedStaff.full_name || "",
          email: matchedStaff.email || "",
          phone: matchedStaff.phone || "",
          govt_id_number: matchedStaff.govt_id_number || "",
          kyc_selfie_url: matchedStaff.kyc_selfie_url || matchedStaff.profile_photo_url || "",
          physical_address: matchedStaff.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      // Check staff_profiles
      const { data: profiles } = await supabase.from("staff_profiles").select("*");
      let matchedProfile = profiles?.find(
        (p: any) => p.id === rawTerm || getApplicationDisplayId(p.id) === targetId || p.email === targetId
      );

      if (matchedProfile) {
        setRecordSource("staff_profiles");
        setRawRecord(matchedProfile);
        setKycData((prev) => ({
          ...prev,
          full_name: matchedProfile.full_name || "",
          email: matchedProfile.email || "",
          phone: matchedProfile.phone || "",
          govt_id_number: matchedProfile.govt_id_number || "",
          kyc_selfie_url: matchedProfile.profile_photo_url || "",
          physical_address: matchedProfile.physical_address || "",
        }));
        setLoading(false);
        return;
      }

      toast({
        title: "Application Not Found",
        description: "Could not find a valid record for the provided Application ID.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Error loading application record for Re-KYC:", err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
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
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. Please upload a photo manually.");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Photo file size should be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setKycData((prev) => ({ ...prev, kyc_selfie_url: result }));
        toast({
          title: "Photo Uploaded",
          description: "KYC photo attached successfully.",
        });
      };
      reader.readAsDataURL(file);
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
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        setKycData((prev) => ({ ...prev, geo_coordinates: coords }));
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
          description: "Unable to retrieve GPS coordinates. You may enter your address manually.",
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
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
        title: "Selfie / Photo Required",
        description: "Please capture or upload a live KYC selfie photo.",
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
      const fullAddress = kycData.physical_address ||
        [kycData.addr_house, kycData.addr_street, kycData.addr_city, kycData.addr_state, kycData.addr_pincode]
          .filter(Boolean)
          .join(", ");

      if (recordSource === "team_applications_staff") {
        const { error } = await supabase
          .from("team_applications_staff")
          .update({
            govt_id_number: kycData.govt_id_number,
            kyc_selfie_url: kycData.kyc_selfie_url,
            profile_photo_url: kycData.kyc_selfie_url,
            physical_address: fullAddress || rawRecord.physical_address,
            phone: kycData.phone || rawRecord.phone,
            status: "pending",
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", rawRecord.id);

        if (error) throw error;
      } else if (recordSource === "staff_profiles") {
        const { error } = await supabase
          .from("staff_profiles")
          .update({
            govt_id_number: kycData.govt_id_number,
            profile_photo_url: kycData.kyc_selfie_url,
            physical_address: fullAddress || rawRecord.physical_address,
            application_status: "approved",
            updated_at: new Date().toISOString(),
          } as any)
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
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-6">
          <Link
            to={appId ? `/track-application?id=${appId}` : "/track-application"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application Tracking
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Official HR Re-KYC Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Re-KYC Identity Verification
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Please complete <strong>JUST the KYC section</strong> below to update your verified identification details for HR review.
          </p>
        </div>

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
                  Your updated Government ID, live photo, and verified details have been submitted to HR.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left text-xs space-y-1.5 font-mono max-w-sm mx-auto">
                <div className="flex justify-between text-zinc-400">
                  <span>Applicant Name:</span>
                  <span className="text-zinc-200 font-semibold">{kycData.full_name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Application ID:</span>
                  <span className="text-blue-400 font-semibold">{getApplicationDisplayId(rawRecord?.id || appId)}</span>
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
          <form onSubmit={handleSubmitReKyc} className="space-y-8">
            {/* Applicant Summary */}
            {rawRecord && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Applicant Profile</div>
                  <div className="text-lg font-bold text-white">{kycData.full_name}</div>
                  <div className="text-xs text-zinc-400 flex items-center gap-3 mt-1">
                    <span>{kycData.email}</span>
                    {kycData.phone && <span>• {kycData.phone}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-xs py-1.5 px-3">
                  {getApplicationDisplayId(rawRecord.id)}
                </Badge>
              </div>
            )}

            {/* Step 1: Government Identification */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                  1. Government Identification
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Provide your government issued photo identity proof document.
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

            {/* Step 2: Live KYC Selfie / Photo Capture */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-400" />
                  2. Live KYC Selfie & Photo Proof *
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Capture a live selfie or upload a clear recent face photo for identity verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Photo Preview or Camera View */}
                <div className="flex flex-col items-center justify-center">
                  {isCameraActive ? (
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-blue-500 bg-black aspect-video flex items-center justify-center">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute bottom-4 flex gap-3">
                        <Button
                          type="button"
                          onClick={captureSnapshot}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 shadow-lg"
                        >
                          <Camera className="h-4 w-4 mr-2" /> Capture Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={stopCamera}
                          className="border-zinc-700 bg-zinc-900 text-zinc-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : kycData.kyc_selfie_url ? (
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
                          onClick={startCamera}
                          className="bg-blue-600 text-white text-xs"
                        >
                          Retake Camera
                        </Button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-emerald-500 text-zinc-950 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm h-48 rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <User className="h-10 w-10 text-zinc-600" />
                      <p className="text-xs text-zinc-400">No live selfie attached yet</p>
                    </div>
                  )}

                  {cameraError && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {cameraError}
                    </p>
                  )}
                </div>

                {/* Actions: Start Camera or Upload File */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    disabled={isCameraActive}
                    className="w-full sm:w-auto border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  >
                    <Camera className="h-4 w-4 mr-2" /> Open Camera Selfie
                  </Button>
                  <span className="text-xs text-zinc-500">or</span>
                  <label className="w-full sm:w-auto cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-zinc-400" /> Upload Face Image
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Address & Location Verification */}
            <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800 p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  3. Address & Coordinates
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Verify your current residential physical address.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-xs font-semibold">Physical Address *</Label>
                  <Input
                    type="text"
                    placeholder="House/Street, City, State, Pincode..."
                    value={kycData.physical_address}
                    onChange={(e) => setKycData((prev) => ({ ...prev, physical_address: e.target.value }))}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-sm h-11"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-zinc-400">
                    {kycData.geo_coordinates ? (
                      <span className="text-emerald-400 font-mono">GPS: {kycData.geo_coordinates}</span>
                    ) : (
                      "Attach live GPS location (optional)"
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchGeoLocation}
                    disabled={geoLoading}
                    className="border-zinc-800 bg-zinc-950 text-zinc-300 text-xs"
                  >
                    {geoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <MapPin className="h-3.5 w-3.5 mr-1 text-blue-400" />}
                    Capture Location
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Declaration & Submission */}
            <div className="space-y-4">
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
                  I hereby declare that all identity documents and selfie photos provided are true, authentic, and belong to me. I authorize VAW Technologies HR to verify my KYC details.
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
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ReKYCPage;
