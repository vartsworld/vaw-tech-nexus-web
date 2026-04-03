import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { QrCode, Loader2, AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const QRRedirection = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirection = async () => {
      if (!id) {
        setError("Invalid QR code. No ID provided.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('qr_redirections')
          .select('target_url')
          .eq('qr_id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data && data.target_url) {
          let url = data.target_url;
          // Ensure URL has protocol
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          // Small delay for the "Wow" animation feel
          setTimeout(() => {
            window.location.href = url;
          }, 1500);
        } else {
          setError(`QR Code "${id}" is not configured yet.`);
          setLoading(false);
        }
      } catch (err) {
        console.error("Redirection error:", err);
        setError("Something went wrong while processing the QR code.");
        setLoading(false);
      }
    };

    handleRedirection();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Oops!</h1>
            <p className="text-muted-foreground text-lg">{error}</p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Button onClick={() => navigate("/")} variant="default" className="h-12 rounded-2xl text-lg font-semibold w-full">
              <Home className="mr-2 h-5 w-5" />
              Go to Homepage
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="h-12 rounded-2xl text-lg font-semibold w-full">
              Try Again
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-8 uppercase tracking-widest font-bold opacity-50">
            Powered by VAW Tech Nexus
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent/5 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-sm w-full space-y-8"
      >
        <div className="relative mx-auto w-24 h-24">
          <motion.div 
            animate={{ 
              rotate: 360,
              borderRadius: ["24%", "30%", "24%"]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-0 bg-primary/20 backdrop-blur-sm border border-primary/30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {loading ? "Initializing Secure Link" : "Redirecting..."}
            </h2>
            <p className="text-muted-foreground font-medium">
              We're taking you to your destination for QR #{id}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-30">
          VAW SECURITY NEXUS • ENCRYPTED REDIRECT
        </div>
      </motion.div>
    </div>
  );
};

export default QRRedirection;
