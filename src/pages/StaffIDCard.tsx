import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Share2, 
  ArrowLeft, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Droplets,
  Building2,
  Briefcase,
  ExternalLink,
  Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "./NotFound";

const StaffIDCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
      
      const { data, error } = await supabase
        .from('staff_profiles')
        .select(`
          *,
          departments:departments!fk_staff_profiles_department(name)
        `)
        .filter(isUUID ? 'id' : 'staff_id_number', 'eq', id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Could not load staff profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role: string) => {
    if (!role) return "";
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleDownload = () => window.print();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "ID card link copied to clipboard." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm relative rounded-3xl bg-gradient-to-b from-[#12121A] to-[#0A0A0F] border border-cyan-500/30 p-8 space-y-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl overflow-hidden">
          {/* Laser Scanner Line */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px] animate-[pulse_1.5s_ease-in-out_infinite] top-1/3" />

          {/* Corner Brackets */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60" />

          {/* Card Lanyard Clip & Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-cyan-500/20 rounded-full animate-pulse" />
          </div>

          {/* Avatar Area */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Cpu className="w-8 h-8 text-cyan-400/50" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500/30 border-2 border-[#12121A] animate-ping" />
            </div>
            <div className="space-y-1.5 w-full">
              <div className="h-5 w-40 bg-white/15 rounded-lg mx-auto animate-pulse" />
              <div className="h-3 w-28 bg-white/5 rounded mx-auto animate-pulse" />
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="space-y-2.5 pt-2 border-t border-white/5">
            <div className="h-3.5 w-full bg-white/5 rounded animate-pulse" />
            <div className="h-3.5 w-5/6 bg-white/5 rounded animate-pulse" />
            <div className="h-3.5 w-3/4 bg-white/5 rounded animate-pulse" />
          </div>

          {/* Telemetry Status Readout */}
          <div className="pt-2 text-center">
            <span className="text-[10px] font-mono tracking-wider text-cyan-400/70 animate-pulse">
              VERIFYING CLEARANCE CREDENTIALS...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 selection:bg-indigo-500/30 font-sans">
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Header Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex justify-between items-center mb-8 relative z-20"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="bg-white/5 border-white/10 hover:border-white/20 text-white rounded-full">
            <Share2 className="w-4 h-4 mr-2 text-indigo-400" /> Share
          </Button>
          <Button size="sm" onClick={handleDownload} className="bg-white text-black hover:bg-gray-200 rounded-full font-bold">
            <Download className="w-4 h-4 mr-2" /> Save
          </Button>
        </div>
      </motion.div>

      {/* Main ID Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="w-full max-w-[380px] perspective-1000 relative z-10"
      >
        <Card ref={cardRef} className="relative overflow-hidden bg-[#0a0a0a] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[3rem] id-card-print">
          {/* Holographic Top Section */}
          <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-transparent blur-3xl opacity-30" />
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShieldCheck className="w-40 h-40 -mr-20 -mt-10" />
            </div>
          </div>
          
          <CardContent className="p-8 relative z-10 flex flex-col items-center">
            {/* Logo & Chip Section */}
            <div className="w-full flex justify-between items-start mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">VAW TECH</h1>
                  <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Nexus Network</p>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-amber-400/30 to-amber-600/60 border border-amber-400/50 flex items-center justify-center overflow-hidden">
                  <Cpu className="w-8 h-8 text-amber-500/50 absolute scale-150 rotate-12" />
                  <div className="w-4 h-4 border border-amber-400/20 rounded-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full blur-[2px] animate-pulse" />
              </div>
            </div>

            {/* Profile Photo Display */}
            <div className="relative mb-8 group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-600 rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-48 h-48 rounded-[2rem] overflow-hidden border-[6px] border-[#0a0a0a] ring-1 ring-white/10 shadow-2xl">
                {(profile.profile_photo_url || profile.avatar_url) ? (
                <img 
                  src={profile.profile_photo_url || profile.avatar_url} 
                  alt={profile.full_name}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5 text-6xl font-bold text-white/40">{(profile.full_name || '?').slice(0,1).toUpperCase()}</div>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Badge className="bg-white text-black hover:bg-white px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl ring-4 ring-[#0a0a0a]">
                  {formatRole(profile.role)}
                </Badge>
              </div>
            </div>

            {/* Identity Info */}
            <div className="text-center w-full mt-4 space-y-1 mb-8">
              <h2 className="text-3xl font-black tracking-tight text-white">{profile.full_name}</h2>
              <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">Employee Identity</p>
            </div>

            {/* Specs Grid */}
            <div className="w-full grid grid-cols-2 gap-3 mb-10">
              <div className="p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-tighter mb-1">
                  <Briefcase className="w-3 h-3" />
                  Unit
                </div>
                <p className="text-xs font-bold text-white truncate">{profile.departments?.name || 'Operations'}</p>
              </div>
              <div className="p-4 rounded-[1.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-purple-400 text-[9px] font-black uppercase tracking-tighter mb-1">
                   <Cpu className="w-3 h-3" />
                  Access ID
                </div>
                <p className="text-xs font-bold text-white font-mono">{profile.staff_id_number || 'PENDING'}</p>
              </div>
            </div>

            {/* Contact Strip */}
            <div className="w-full space-y-4 mb-10">
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-xs text-gray-400 font-medium truncate max-w-[180px]">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium line-clamp-1">{profile.physical_address || 'VAW Global HQ'}</span>
                </div>
            </div>

            {/* Footer QR & Credentials */}
            <div className="w-full pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Blood Type</p>
                    <p className="text-lg font-black text-white leading-none">{profile.blood_group || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-gray-600 bg-white/5 px-3 py-1.5 rounded-full inline-block border border-white/5 uppercase tracking-widest">
                  Verified Vault: {profile.govt_id_number ? `****${profile.govt_id_number.slice(-4)}` : 'AUTHORIZED'}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-white p-2 rounded-2xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.href}`} 
                    alt="QR Integration"
                    className="w-16 h-16 grayscale"
                  />
                </div>
                <div className="mt-2 text-[8px] text-center font-black text-gray-500 uppercase tracking-widest">Secure scan</div>
              </div>
            </div>

            {/* Holographic Slogan */}
            <div className="mt-10 flex items-center justify-center w-full">
               <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.5em] text-center w-full italic opacity-50">
                 Efficiency • Passion • Innovation
               </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Print Helper CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .id-card-print, .id-card-print * { visibility: visible; }
          .id-card-print { 
            position: fixed; 
            left: 50%; 
            top: 50%; 
            transform: translate(-50%, -50%) scale(1.3);
            box-shadow: none;
            border: 1px solid #222;
          }
          @page { margin: 0; size: auto; }
        }
      `}} />
    </div>
  );
};

export default StaffIDCard;
