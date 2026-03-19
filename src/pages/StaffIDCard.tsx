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
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

  const handleDownload = () => {
    toast({
      title: "Preparation",
      description: "Generating your ID card for download...",
    });
    // In a real app, we'd use html2canvas or a PDF library here.
    // For now, we'll suggest printing or saving the page.
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "ID card link copied to clipboard for sharing.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#111] border-white/5 p-8 space-y-6">
          <Skeleton className="h-48 w-48 rounded-2xl mx-auto bg-white/5" />
          <Skeleton className="h-8 w-3/4 mx-auto bg-white/5" />
          <Skeleton className="h-4 w-1/2 mx-auto bg-white/5" />
          <div className="space-y-3 pt-6">
            <Skeleton className="h-10 w-full bg-white/5" />
            <Skeleton className="h-10 w-full bg-white/5" />
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8 selection:bg-indigo-500/30">
      {/* Header Actions */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            size="sm" 
            onClick={handleDownload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* ID Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md perspective-1000"
      >
        <Card ref={cardRef} className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-white/10 shadow-2xl rounded-[2.5rem] id-card-print">
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 blur-2xl" />
          
          <CardContent className="p-8 relative z-10 flex flex-col items-center">
            {/* Logo & Company Name */}
            <div className="flex items-center gap-2 mb-8 self-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">VAW TECHNOLOGIES</h1>
                <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Digital Excellence</p>
              </div>
            </div>

            {/* Profile Image */}
            <div className="relative mb-6">
              <div className="absolute -inset-1.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.2rem] blur opacity-40 animate-pulse" />
              <div className="relative w-44 h-44 rounded-[2rem] overflow-hidden border-4 border-[#111]">
                <img 
                  src={profile.profile_photo_url || profile.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} 
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <Badge className="absolute -bottom-2 right-4 bg-indigo-600 text-white border-2 border-[#111] px-3 py-1">
                {profile.role?.toUpperCase()}
              </Badge>
            </div>

            {/* Name & ID */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">{profile.full_name}</h2>
              <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-sm">
                ID: {profile.staff_id_number || 'VAW-N/A'}
              </div>
            </div>

            {/* Details Grid */}
            <div className="w-full grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <Briefcase className="w-3 h-3" />
                  Designation
                </div>
                <p className="text-sm font-semibold text-white truncate">{profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <Building2 className="w-3 h-3" />
                  Department
                </div>
                <p className="text-sm font-semibold text-white truncate">{profile.departments?.name || 'Operations'}</p>
              </div>
            </div>

            {/* Contact Info Footer */}
            <div className="w-full border-t border-white/10 pt-6 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center transition-colors group-hover:bg-indigo-500/20">
                  <Phone className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{profile.email}</span>
              </div>
              
              {profile.physical_address && (
                <div className="flex items-center gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center transition-colors group-hover:bg-purple-500/20">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors line-clamp-1">{profile.physical_address}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Blood Group</p>
                    <p className="text-sm font-bold text-white leading-none">{profile.blood_group || 'O+'}</p>
                  </div>
                </div>
                {profile.govt_id_number && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verfied ID</p>
                    <p className="text-[10px] font-mono text-gray-400">{profile.govt_id_number.slice(0, 4)} **** **** {profile.govt_id_number.slice(-4)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="mt-8 pt-8 border-t border-white/10 w-full flex justify-center">
               <img 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://vaw-tech-nexus.web.app/hr/staff/id-card/" 
                 alt="QR Code"
                 className="opacity-50 grayscale contrast-125"
               />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .id-card-print, .id-card-print * { visibility: visible; }
          .id-card-print { 
            position: absolute; 
            left: 50%; 
            top: 50%; 
            transform: translate(-50%, -50%) scale(1.2);
            box-shadow: none;
            border: 1px solid #333;
          }
          @page { margin: 0; size: auto; }
        }
      `}} />
    </div>
  );
};

export default StaffIDCard;
