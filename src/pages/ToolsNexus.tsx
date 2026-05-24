import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Compass, 
  Sparkles, 
  Code, 
  Plus, 
  Search, 
  ArrowLeft, 
  ThumbsUp, 
  ExternalLink,
  Laptop,
  CheckCircle2,
  Cpu,
  Bookmark,
  Volume2,
  Maximize2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStaffData } from "@/hooks/useStaffData";

interface ToolItem {
  id: string;
  title: string;
  description: string;
  url: string;
  developer_name: string;
  developer_id?: string;
  category: string; // 'ai' | 'utility' | 'devtools' | 'productivity' | 'fun'
  icon: string;
  upvotes: number;
  upvoted_by: string[]; // List of user_ids who upvoted
}

const DEFAULT_TOOLS: ToolItem[] = [
  {
    id: "1",
    title: "AI Glassmorphism Generator",
    description: "Generate beautiful, frosted-glass CSS styling tokens with modern blur and light-source angles dynamically.",
    url: "https://glassmorphism.com/",
    developer_name: "VAW Labs",
    category: "devtools",
    icon: "🎨",
    upvotes: 42,
    upvoted_by: []
  },
  {
    id: "2",
    title: "Lofi Focus Room",
    description: "Serene stream of calming productivity beats, environmental mist hums, and focus checklists in a single space.",
    url: "https://www.youtube.com/embed/jfKfPfyJRdk",
    developer_name: "Staff Zen Team",
    category: "fun",
    icon: "🍵",
    upvotes: 38,
    upvoted_by: []
  },
  {
    id: "3",
    title: "AI Prompt Engineering Helper",
    description: "Write flawless copywriting & image prompts for Midjourney, Stable Diffusion, and GPT agents using structured parameters.",
    url: "https://prompthero.com/",
    developer_name: "Kevin (Lead)",
    category: "ai",
    icon: "⚡",
    upvotes: 56,
    upvoted_by: []
  },
  {
    id: "4",
    title: "JSON Formatter & Schema Validator",
    description: "Quick clean-up, structure analysis, and validation of nested JSON outputs for database configurations.",
    url: "https://jsonlint.com/",
    developer_name: "Community Contributor",
    category: "utility",
    icon: "🔧",
    upvotes: 19,
    upvoted_by: []
  },
  {
    id: "5",
    title: "Markdown Documentation Suite",
    description: "Create elegant, high-fidelity developer specs and README structures using clean visual drag-and-drop components.",
    url: "https://dillinger.io/",
    developer_name: "Alex Dev",
    category: "productivity",
    icon: "📝",
    upvotes: 27,
    upvoted_by: []
  }
];

const CATEGORIES = [
  { value: "all", label: "All Hubs" },
  { value: "ai", label: "AI Solutions" },
  { value: "devtools", label: "Developer Specs" },
  { value: "productivity", label: "Productivity Kits" },
  { value: "utility", label: "Inside Utilities" },
  { value: "fun", label: "Break Garden" }
];

const ICONS = ["🔧", "⚡", "🎨", "🍵", "📝", "💻", "🤖", "🔥", "🚀", "🌸", "🧘", "✨"];

export default function ToolsNexus() {
  const navigate = useNavigate();
  const { profile } = useStaffData();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
  const [sandboxTitle, setSandboxTitle] = useState("");
  
  // Submit Form States
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDevName, setFormDevName] = useState("");
  const [formCategory, setFormCategory] = useState("utility");
  const [formIcon, setFormIcon] = useState("🔧");

  // Load tools on mount (resilient dual-mode fetch)
  useEffect(() => {
    const loadTools = async () => {
      try {
        const { data, error } = await supabase
          .from("vaw_tools_nexus" as any)
          .select("*")
          .order("upvotes", { ascending: false });

        if (error || !data || data.length === 0) {
          // Fallback to local storage or defaults
          const localData = localStorage.getItem("vaw_nexus_tools_v1");
          if (localData) {
            setTools(JSON.parse(localData));
          } else {
            setTools(DEFAULT_TOOLS);
            localStorage.setItem("vaw_nexus_tools_v1", JSON.stringify(DEFAULT_TOOLS));
          }
        } else {
          setTools(data as any);
        }
      } catch (err) {
        // Safe fallback
        const localData = localStorage.getItem("vaw_nexus_tools_v1");
        setTools(localData ? JSON.parse(localData) : DEFAULT_TOOLS);
      }
    };

    loadTools();
  }, []);

  const saveToolsState = async (updatedTools: ToolItem[]) => {
    setTools(updatedTools);
    localStorage.setItem("vaw_nexus_tools_v1", JSON.stringify(updatedTools));

    // Try to sync with Supabase if table is valid
    try {
      // Just a background safe update, ignored if table is missing
      await supabase.from("vaw_tools_nexus" as any).upsert(updatedTools as any);
    } catch(e) {
      console.warn("Supabase tools sync deferred.");
    }
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc || !formUrl) {
      toast.error("Please fill out all required fields.");
      return;
    }

    // Format URL correctly
    let finalUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    const newTool: ToolItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: formTitle,
      description: formDesc,
      url: finalUrl,
      developer_name: formDevName || profile?.full_name || "Public Developer",
      developer_id: profile?.user_id || undefined,
      category: formCategory,
      icon: formIcon,
      upvotes: 0,
      upvoted_by: []
    };

    const updated = [newTool, ...tools];
    await saveToolsState(updated);
    
    toast.success("✨ Inside App Published!", {
      description: "Your tool is now live inside VAW Tools Nexus!"
    });

    // Reset Form
    setFormTitle("");
    setFormDesc("");
    setFormUrl("");
    setFormDevName("");
    setIsSubmitOpen(false);
  };

  const handleUpvote = async (toolId: string) => {
    const userId = profile?.user_id || "anonymous_dev";
    
    const updated = tools.map((t) => {
      if (t.id === toolId) {
        const upvotedList = t.upvoted_by || [];
        if (upvotedList.includes(userId)) {
          toast("Already upvoted", { description: "You already aligned your focus with this tool!" });
          return t;
        }

        toast.success("☯ Tool Upvoted!", {
          description: "+10 Coins awarded to the developer community pool!"
        });

        return {
          ...t,
          upvotes: t.upvotes + 1,
          upvoted_by: [...upvotedList, userId]
        };
      }
      return t;
    });

    await saveToolsState(updated);
  };

  const handleLaunchApp = (tool: ToolItem) => {
    setSandboxUrl(tool.url);
    setSandboxTitle(tool.title);
  };

  const filteredTools = tools.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.developer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-950 text-zinc-100 select-none pb-16">
      
      {/* Calm Ambient Video/Photo Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/80 z-10"></div>
        <img
          src="/lovable-uploads/472162b9-c883-43ff-b81c-428cd163ffd8.png"
          alt="Modern office background"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-8">
        
        {/* Navigation back and Branding Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 px-5 h-12 shadow-lg shadow-emerald-950/20">
                <Plus className="w-4 h-4" />
                Publish Inside App
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-3xl text-zinc-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-emerald-400" />
                  Publish inside App on Nexus
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Share utility apps, tools, or widgets you built or found with our community and staffs.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTool} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-zinc-300 text-xs">App Title *</Label>
                    <Input
                      id="title"
                      required
                      placeholder="e.g. SVG Compressor"
                      className="bg-black/40 border-white/10 rounded-xl"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dev" className="text-zinc-300 text-xs">Developer Name</Label>
                    <Input
                      id="dev"
                      placeholder="e.g. @ajith"
                      className="bg-black/40 border-white/10 rounded-xl"
                      value={formDevName}
                      onChange={(e) => setFormDevName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desc" className="text-zinc-300 text-xs">App Description *</Label>
                  <Textarea
                    id="desc"
                    required
                    placeholder="Describe exactly what this utility does..."
                    rows={2}
                    className="bg-black/40 border-white/10 rounded-xl"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-zinc-300 text-xs">Application Link / URL *</Label>
                  <Input
                    id="url"
                    required
                    placeholder="https://example.com/app"
                    className="bg-black/40 border-white/10 rounded-xl"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-zinc-300 text-xs">Hub Category</Label>
                    <select
                      id="category"
                      className="w-full h-10 bg-black/40 border border-white/10 rounded-xl text-xs px-2 text-zinc-100"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="ai">AI Solutions</option>
                      <option value="devtools">Developer Specs</option>
                      <option value="productivity">Productivity Kits</option>
                      <option value="utility">Inside Utilities</option>
                      <option value="fun">Break Garden</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300 text-xs">Choose App Icon</Label>
                    <div className="flex gap-1.5 max-w-[220px] overflow-x-auto p-1.5 border border-white/10 rounded-xl bg-black/40">
                      {ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setFormIcon(ic)}
                          className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-sm transition-all ${
                            formIcon === ic ? "bg-emerald-500/20 border border-emerald-500/40" : "hover:bg-white/5"
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 font-semibold mt-4">
                  Publish Inside App on Nexus
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* VAW Tools Nexus Hero Title Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/15 backdrop-blur-md"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">
              Community Hub
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            VAW Tools <span className="text-blue-500">Nexus</span>
          </h1>

          <p className="text-zinc-400 font-light text-sm md:text-base leading-relaxed">
            The community-driven inside app ecosystem. Staffs and public developers can share, test, upvote, and directly launch utilities within our sanctuary sandbox workspace.
          </p>
        </div>

        {/* Search and Category Filtering */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search community inside apps..."
              className="pl-10 bg-black/35 border-white/5 rounded-2xl h-11 text-sm focus:border-blue-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 max-w-full overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    isActive 
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-950/20" 
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <motion.div
              layout
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-zinc-900/20 border border-white/5 hover:border-white/15 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between h-[230px] transition-all relative overflow-hidden"
            >
              {/* Card Aura */}
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-2xl" />

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {tool.icon}
                  </div>

                  <Badge className="bg-white/5 hover:bg-white/5 border-white/10 text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg">
                    {tool.category}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-zinc-100 text-base font-semibold group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-zinc-500 text-xs font-light line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                <span className="text-[10px] text-zinc-500 font-medium">
                  By {tool.developer_name}
                </span>

                <div className="flex items-center gap-2">
                  {/* Upvote */}
                  <button
                    onClick={() => handleUpvote(tool.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-emerald-400 transition-colors bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{tool.upvotes}</span>
                  </button>

                  {/* Launch inside app sandbox */}
                  <Button
                    size="sm"
                    onClick={() => handleLaunchApp(tool)}
                    className="h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold px-3 flex items-center gap-1"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Launch
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredTools.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-500 text-sm font-light">
              No inside apps found under this hub. Click "Publish Inside App" to start the community catalog!
            </div>
          )}
        </div>
      </div>

      {/* Elegant Inside App Iframe Sandbox Overlay */}
      <AnimatePresence>
        {sandboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full h-full max-w-6xl bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
              
              {/* Sandbox Control Header */}
              <div className="h-16 px-6 bg-zinc-900 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">
                    ✨
                  </div>
                  <div>
                    <h2 className="text-zinc-100 text-sm font-bold">{sandboxTitle}</h2>
                    <p className="text-[10px] text-zinc-500">VAW Nexus App Sandbox Session</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-white/10 text-xs font-semibold"
                    onClick={() => window.open(sandboxUrl, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Open in Tab
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-zinc-500 hover:text-white"
                    onClick={() => { setSandboxUrl(null); setSandboxTitle(""); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Iframe View */}
              <div className="flex-1 w-full bg-white relative">
                <iframe
                  src={sandboxUrl}
                  className="w-full h-full border-none"
                  title={sandboxTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
