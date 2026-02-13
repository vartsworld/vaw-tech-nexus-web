import { useState, useEffect, useRef } from "react";
import { Megaphone, AlertTriangle, CheckCircle, Info, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Banner {
  id: string;
  title: string;
  content: string;
  banner_type: string;
  target_audience: string;
  target_department_ids: string[];
  target_staff_ids: string[];
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

interface AnnouncementBannerProps {
  userId: string;
  departmentId?: string;
}

const AnnouncementBanner = ({ userId, departmentId }: AnnouncementBannerProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBanners();

    const channel = supabase
      .channel('banner-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_banners' }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, departmentId]);

  const fetchBanners = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcement_banners')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const filtered = data.filter((b: Banner) => {
      if (b.expires_at && new Date(b.expires_at) < new Date()) return false;
      if (b.target_audience === 'all') return true;
      if (b.target_audience === 'department' && departmentId) {
        return b.target_department_ids?.includes(departmentId);
      }
      if (b.target_audience === 'selected_staff') {
        return b.target_staff_ids?.includes(userId);
      }
      return false;
    });

    setBanners(filtered);
  };

  // Auto-scroll
  useEffect(() => {
    const activeBanners = banners.filter(b => !dismissed.has(b.id));
    if (activeBanners.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [banners, dismissed]);

  const activeBanners = banners.filter(b => !dismissed.has(b.id));
  if (activeBanners.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
      case 'success': return <CheckCircle className="w-4 h-4 flex-shrink-0" />;
      case 'event': return <Calendar className="w-4 h-4 flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
      default: return <Megaphone className="w-4 h-4 flex-shrink-0" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'urgent': return 'from-red-600/40 to-red-500/20 border-red-500/40 text-red-100';
      case 'warning': return 'from-yellow-600/40 to-yellow-500/20 border-yellow-500/40 text-yellow-100';
      case 'success': return 'from-green-600/40 to-green-500/20 border-green-500/40 text-green-100';
      case 'event': return 'from-purple-600/40 to-purple-500/20 border-purple-500/40 text-purple-100';
      default: return 'from-blue-600/40 to-blue-500/20 border-blue-500/40 text-blue-100';
    }
  };

  const current = activeBanners[currentIndex % activeBanners.length];
  if (!current) return null;

  return (
    <div className="relative z-20 w-full">
      <div className={`bg-gradient-to-r ${getColors(current.banner_type)} border-b backdrop-blur-md`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Nav left */}
            {activeBanners.length > 1 && (
              <button
                onClick={() => setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length)}
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Icon */}
            {getIcon(current.banner_type)}

            {/* Content */}
            <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
              {current.banner_type === 'urgent' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">URGENT</Badge>
              )}
              <span className="font-semibold text-sm flex-shrink-0">{current.title}</span>
              <span className="hidden sm:inline text-sm opacity-80 truncate">— {current.content}</span>
              {current.link_url && (
                <a href={current.link_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0 ml-1">
                  Learn more
                </a>
              )}
            </div>

            {/* Dots indicator */}
            {activeBanners.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                {activeBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex % activeBanners.length ? 'bg-white w-3' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}

            {/* Nav right */}
            {activeBanners.length > 1 && (
              <button
                onClick={() => setCurrentIndex(prev => (prev + 1) % activeBanners.length)}
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(prev => new Set([...prev, current.id]))}
              className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
