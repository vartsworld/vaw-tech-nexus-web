import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Search,
  ArrowRight,
  Layers,
  User,
  Settings,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  Loader2,
  LogOut,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import ParticleBackground from "@/components/ParticleBackground";

interface PortalLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  password?: string;
  page_id?: string;
}

const Portal = () => {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [links, setLinks] = useState<PortalLink[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing login session
    const savedIdentifier = localStorage.getItem("vaw_portal_identifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      handleSearchInternal(savedIdentifier);
    }
  }, []);

  const handleSearchInternal = async (id: string) => {
    if (!id.trim()) return;

    setIsSearching(true);
    setIsLoading(true);

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .or(`email.eq.${id},phone.eq.${id}`)
        .maybeSingle();

      if (clientError || !clientData) {
        if (!localStorage.getItem("vaw_portal_identifier")) {
          toast({
            title: "Access Denied",
            description: "No account found with these details.",
            variant: "destructive",
          });
        }
        localStorage.removeItem("vaw_portal_identifier");
        setIsLoading(false);
        setIsSearching(false);
        return;
      }

      const { data: portalData, error: portalError } = await (supabase as any)
        .from('client_portals')
        .select('is_active')
        .eq('client_id', clientData.id)
        .eq('is_active', true)
        .maybeSingle();

      if (portalError || !portalData) {
        toast({
          title: "Inactive",
          description: "Your portal is not active.",
          variant: "destructive",
        });
        localStorage.removeItem("vaw_portal_identifier");
        setIsLoading(false);
        setIsSearching(false);
        return;
      }

      // Save valid login
      localStorage.setItem("vaw_portal_identifier", id);
      setClient(clientData);

      const { data: linksData, error: linksError } = await (supabase as any)
        .from('portal_links')
        .select('*')
        .eq('client_id', clientData.id)
        .eq('is_active', true);

      if (linksError) throw linksError;
      setLinks((linksData as PortalLink[]) || []);
    } catch (error: any) {
      console.error("Portal error:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchInternal(identifier);
  };

  const handleLogout = () => {
    localStorage.removeItem("vaw_portal_identifier");
    setClient(null);
    setLinks([]);
    setIdentifier("");
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Credential copied to clipboard",
    });
  };

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'user': return <User className="h-6 w-6" />;
      case 'settings': return <Settings className="h-6 w-6" />;
      case 'card': return <CreditCard className="h-6 w-6" />;
      case 'shield': return <ShieldCheck className="h-6 w-6" />;
      case 'layers': return <Layers className="h-6 w-6" />;
      default: return <ExternalLink className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8">
      <SEO 
        title={client ? `Welcome, ${client.contact_person}` : "Access Your Portal"} 
        description={client ? `Access personalized resources and tools for ${client.company_name} in your VAW Portal.` : "Secure login for your VAW Technology Client Portal."}
        ogImage="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png"
      />
      <ParticleBackground />

      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

      <AnimatePresence mode="wait">
        {!client ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-sm z-10"
          >
            <div className="text-center mb-10">
              <div className="inline-block p-4 bg-primary/5 rounded-3xl mb-6 border border-primary/10">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2 uppercase opacity-80">
                Client Portal
              </h1>
              <p className="text-muted-foreground font-medium text-sm">
                Enter your details to open your portal
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Email or Phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-white/5 focus:bg-muted/50 transition-all font-medium backdrop-blur-md"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !identifier}
                className="w-full h-14 rounded-2xl text-base font-bold transition-all relative overflow-hidden border-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Access Pages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl z-10 space-y-12 py-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
                    Welcome, <span className="text-primary">{client.contact_person}</span>
                  </h2>
                  <p className="text-muted-foreground text-base font-bold opacity-60 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                    {client.company_name}
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 bg-muted/40 p-1 rounded-full border border-white/5"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full px-6 font-bold hover:bg-background/50 transition-all text-xs"
                >
                  Log out
                </Button>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User className="h-4 w-4" />
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="group relative h-full overflow-hidden border-white/5 bg-background/20 backdrop-blur-3xl hover:bg-background/25 transition-all cursor-pointer rounded-[2rem] border-2 hover:border-primary/20"
                    onClick={() => window.open(link.url.startsWith('http') ? link.url : `https://${link.url}`, '_blank')}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4" />
                    </div>

                    <CardContent className="p-8 flex flex-col h-full relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 text-primary border border-primary/10 group-hover:bg-primary/10 transition-colors">
                        {getIcon(link.icon)}
                      </div>

                      <h3 className="text-xl font-black mb-2 tracking-tight">
                        {link.title}
                      </h3>
                      <p className="text-muted-foreground text-sm font-semibold mb-6 flex-grow opacity-60">
                        {link.description}
                      </p>

                      {(link.page_id || link.password) && (
                        <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 backdrop-blur-md space-y-3">
                          {link.page_id && (
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black tracking-widest opacity-30 italic">Login ID</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{link.page_id}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-primary/20 text-primary/60"
                                  onClick={(e) => handleCopy(link.page_id || "", e)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          {link.password && (
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-black tracking-widest opacity-30 italic">Password</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{link.password}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-primary/20 text-primary/60"
                                  onClick={(e) => handleCopy(link.password || "", e)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-2 flex items-center gap-2 text-xs font-black text-primary opacity-40 group-hover:opacity-100 transition-all uppercase tracking-widest">
                        Open Page
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {links.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                  <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-bold text-muted-foreground opacity-40 uppercase tracking-widest">No pages found</h3>
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="text-[10px] font-black tracking-widest text-muted-foreground/20 uppercase order-2 md:order-1">
                VAW TECH NEXUS
              </div>
              <div className="flex items-center gap-6 opacity-40 order-1 md:order-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs font-bold">vawoffices@gmail.com</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs font-bold">+91 8281543610</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portal;
