import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Info,
  Clock,
  Award,
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
  Zap,
  Check,
  Cpu,
  ArrowRight
} from "lucide-react";

export interface DomainInfo {
  id: string;
  label: string;
  category: "Development" | "Design" | "AI & Engineering" | "Growth";
  icon: React.ElementType;
  shortDesc: string;
  overview: string;
  skills: string[];
  tools: string[];
  projects: string[];
  careerRoles: string[];
  badgeColor: string;
}

export const DOMAIN_DETAILS: DomainInfo[] = [
  {
    id: "appdev",
    label: "App Development",
    category: "Development",
    icon: Smartphone,
    shortDesc: "Develop smart mobile & cross-platform apps integrated with OpenAI APIs, local LLMs, and intelligent features.",
    overview: "Build modern mobile applications powered by Artificial Intelligence! Master React Native/Flutter while integrating vision recognition APIs, speech-to-text, real-time LLM chat capabilities, and smart local storage.",
    skills: ["Mobile UI/UX", "LLM API Integration", "Cross-Platform Mobile Apps", "Voice & Vision AI APIs", "Smart Device Storage"],
    tools: ["React Native / Expo", "Flutter", "OpenAI / Claude API", "Supabase", "Firebase AI"],
    projects: ["AI Personal Executive Assistant App", "Smart Camera Vision & Recognition App", "AI-Powered Fitness & Habit Planner"],
    careerRoles: ["AI App Developer", "Mobile AI Engineer", "React Native / Flutter Developer"],
    badgeColor: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
  },
  {
    id: "graphics",
    label: "Graphic Design & Branding",
    category: "Design",
    icon: PenTool,
    shortDesc: "Create visual assets, brand identity, and graphics leveraging Midjourney, Adobe Firefly, and Generative AI.",
    overview: "Revolutionize your design workflow with Generative AI! Learn how to combine traditional graphic design principles with AI tools to rapidly produce high-end branding kits, vector assets, visual storyboards, and social campaigns.",
    skills: ["Generative Image Prompting", "Brand Identity Design", "AI Vector & Asset Creation", "Visual Storyboarding", "Typography & Color Theory"],
    tools: ["Midjourney", "Adobe Firefly & Photoshop", "Canva AI", "Stable Diffusion", "Figma"],
    projects: ["AI-Generated Brand Identity & Logo Kit", "Generative Social Media Campaign Assets", "AI Concept Art & Product Renderings"],
    careerRoles: ["AI Graphic Designer", "GenAI Visual Artist", "Brand & Creative Strategist"],
    badgeColor: "border-amber-500/30 text-amber-400 bg-amber-500/10"
  },
  {
    id: "webdev",
    label: "Web Development",
    category: "Development",
    icon: Code,
    shortDesc: "Build full-stack web applications featuring embedded AI chatbots, vector search, and dynamic GenAI interfaces.",
    overview: "Combine modern frontend engineering with modern AI backends. Work with React, TypeScript, Tailwind CSS, Vercel AI SDK, Supabase Vector DBs, and LLM streaming to build intelligent web apps.",
    skills: ["React & TypeScript", "LLM Streaming & Vercel AI SDK", "Vector Databases & RAG", "Tailwind CSS UI", "Supabase & REST APIs"],
    tools: ["React", "TypeScript", "Vercel AI SDK", "Supabase Vector DB", "Tailwind CSS", "Vite"],
    projects: ["Smart AI Knowledge-Base Portal", "Conversational AI E-Commerce Assistant", "Automated AI Web Scraper Dashboard"],
    careerRoles: ["AI Web Engineer", "Fullstack React Developer", "Frontend AI Specialist"],
    badgeColor: "border-blue-500/30 text-blue-400 bg-blue-500/10"
  },
  {
    id: "uiux",
    label: "UI/UX Design",
    category: "Design",
    icon: Palette,
    shortDesc: "Design intuitive interfaces, human-in-the-loop workflows, and conversational UX for modern AI platforms.",
    overview: "Designing for AI requires a new paradigm! Learn to design conversational UI, Copilot sidebars, multi-modal prompt interfaces, and human-in-the-loop validation dashboards using Figma and modern design systems.",
    skills: ["Conversational UX Design", "Copilot & Assistant UI Patterns", "Wireframing & Prototyping", "Design Systems", "Usability Testing"],
    tools: ["Figma", "FigJam", "Balsamiq", "Prototyping Suites"],
    projects: ["Copilot SaaS Assistant Interface", "Multi-modal AI Creative Studio UX", "Human-in-the-Loop AI Review Dashboard"],
    careerRoles: ["AI Product Designer", "UI/UX Specialist", "Conversational UX Designer"],
    badgeColor: "border-pink-500/30 text-pink-400 bg-pink-500/10"
  },
  {
    id: "ai",
    label: "AI Training & Model Fine-Tuning",
    category: "AI & Engineering",
    icon: Bot,
    shortDesc: "Train, fine-tune, and benchmark LLMs & machine learning models on custom domain datasets.",
    overview: "Get under the hood of artificial intelligence! Learn model architecture basics, custom dataset preparation, LoRA fine-tuning on open-source models, local LLM execution with Ollama, and automated accuracy benchmarks.",
    skills: ["Open-Source LLM Fine-Tuning", "Dataset Curation & Cleansing", "Local LLM Inference", "Model Evaluation & Benchmarking", "Python AI Stacks"],
    tools: ["Python", "PyTorch", "Ollama", "Hugging Face", "Google Colab", "Unsloth / LoRA"],
    projects: ["Custom Enterprise LLM Fine-Tuning", "AI Accuracy Evaluation Framework", "Domain-Specific Assistant Model"],
    careerRoles: ["AI Trainer", "ML Research Intern", "Data Engineer", "GenAI Engineer"],
    badgeColor: "border-purple-500/30 text-purple-400 bg-purple-500/10"
  },
  {
    id: "prompt",
    label: "Prompt Engineering & GenAI Workflows",
    category: "AI & Engineering",
    icon: Terminal,
    shortDesc: "Master advanced prompt architectures, chain-of-thought logic, and automated GenAI business scripts.",
    overview: "Discover how to harness Generative AI engines efficiently for automated productivity. Master system prompt engineering, chain-of-thought prompting, RAG architectures, and AI tool chaining.",
    skills: ["System Prompting", "Chain-of-Thought (CoT)", "Few-Shot Prompting", "AI Workflow Automation", "LangChain & RAG Basics"],
    tools: ["ChatGPT / Claude API", "Midjourney", "LangChain", "Notion AI", "Make / Zapier AI"],
    projects: ["Enterprise Support Bot Prompt Architecture", "Automated Code Review Assistant", "Synthetic Dataset Generator Script"],
    careerRoles: ["Prompt Engineer", "AI Automation Specialist", "GenAI Consultant"],
    badgeColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
  },
  {
    id: "marketing",
    label: "Digital Marketing & Growth",
    category: "Growth",
    icon: TrendingUp,
    shortDesc: "Leverage AI analytics, automated content engines, and intelligent SEO tools for growth marketing.",
    overview: "Combine modern growth strategies with AI speed! Learn how to use AI tools for automated keyword research, content clustering, social media campaign generation, Meta ad optimizations, and performance analytics.",
    skills: ["AI SEO & Keyword Clustering", "Automated Ad Copy Generation", "Content Marketing Funnels", "Social Media AI Scheduling", "Growth Analytics"],
    tools: ["Google Analytics", "SEMrush", "ChatGPT for Marketing", "SurferSEO", "Meta Business Suite"],
    projects: ["AI-Automated Content & SEO Funnel", "Predictive Ad Campaign Analysis", "Automated Social Campaign Strategy"],
    careerRoles: ["AI Digital Marketer", "Growth Marketing Specialist", "SEO Strategist"],
    badgeColor: "border-orange-500/30 text-orange-400 bg-orange-500/10"
  },
  {
    id: "data",
    label: "Data Labeling & Annotation",
    category: "AI & Engineering",
    icon: Database,
    shortDesc: "Prepare, tag, and quality-check datasets for Machine Learning, Computer Vision, and NLP models.",
    overview: "High-quality data drives great AI. Learn computer vision bounding-box annotation, text sentiment tagging, audio transcription labeling, and dataset quality-control pipelines used by AI labs.",
    skills: ["Data Tagging", "Bounding Box & Polygon Annotation", "NLP Classification", "Dataset QA Protocols", "Data Structuring"],
    tools: ["Label Studio", "CVAT", "Roboflow", "JSON & Python Cleaners"],
    projects: ["Autonomous Vision Dataset Annotation", "NLP Sentiment & Classification Dataset", "Medical Imaging Annotation QA"],
    careerRoles: ["AI Data Specialist", "Annotation Engineer", "Data Quality Analyst"],
    badgeColor: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
  },
  {
    id: "content",
    label: "Content Creation & Copywriting",
    category: "Growth",
    icon: BookOpen,
    shortDesc: "Produce high-impact tech blogs, video scripts, and documentation powered by AI writing assistants.",
    overview: "Master the art of AI-assisted content creation! Learn technical writing, SEO copywriting, tech news synthesis, video scriptwriting, and editing workflows using top GenAI writing tools.",
    skills: ["AI Copywriting & Editing", "Technical Content Synthesis", "SEO Article Writing", "Scriptwriting for Tech", "Content Distribution"],
    tools: ["Grammarly", "Notion AI", "ChatGPT / Claude", "Dev.to", "Medium"],
    projects: ["AI Tech Industry Blog Series", "Developer Documentation Kit", "Viral Scriptwriting for AI Products"],
    careerRoles: ["AI Content Creator", "Technical Copywriter", "Content Strategist"],
    badgeColor: "border-teal-500/30 text-teal-400 bg-teal-500/10"
  }
];

const Internship = () => {
  const { hasCompletedIntro } = useUser();
  const navigate = useNavigate();

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedDomainModal, setSelectedDomainModal] = useState<DomainInfo | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All");

  if (!hasCompletedIntro) {
    return null;
  }

  const toggleDomain = (id: string) => {
    setSelectedDomains((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((d) => d !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleProceedToRegistration = () => {
    if (selectedDomains.length > 0) {
      navigate(`/internship/registration?domains=${selectedDomains.join(",")}`);
    } else {
      navigate("/internship/registration");
    }
  };

  const categories = ["All", "Development", "Design", "AI & Engineering", "Growth"];
  const filteredDomains = activeCategoryFilter === "All"
    ? DOMAIN_DETAILS
    : DOMAIN_DETAILS.filter((d) => d.category === activeCategoryFilter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden flex flex-col justify-between pt-20 md:pt-28 selection:bg-blue-500/30">
      <SEO
        title="Tech & Design Internship Program | VAW Technologies"
        description="Join our 2-Month Online Internship Program. Courses include App Development, Graphic Design, Web Dev, UI/UX, AI Model Training, and GenAI Prompt Engineering."
        keywords="internship, tech internship, design internship, web development, AI training, prompt engineering, VAW technologies, varts, certificate internship"
        ogImage="/og/internship.png"
      />
      
      {/* Mobile Header for mobile view */}
      <MobileHeader />
      {/* Navbar for desktop view */}
      <Navbar />

      <main className="container mx-auto px-4 py-6 md:py-10 flex-1">
        {/* Header Hero Banner */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Cpu className="h-4 w-4" />
            <span>2-Month Online Certificate Internship Program</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-['Space_Grotesk'] leading-tight">
            Shape Your Career in <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Tech & Design</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-['Outfit']">
            Master real-world skills, 1-on-1 industry mentorship, build live portfolio projects, and earn an official verified certificate.
          </p>

          {/* Program Highlights Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-3xl mx-auto">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 text-center backdrop-blur-md">
              <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1.5" />
              <div className="text-xs text-zinc-400">Duration</div>
              <div className="text-sm font-semibold text-white">2 Months (6 hrs/wk)</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 text-center backdrop-blur-md">
              <Award className="h-5 w-5 text-emerald-400 mx-auto mb-1.5" />
              <div className="text-xs text-zinc-400">Program Perks</div>
              <div className="text-sm font-semibold text-white">Verified Certificate & Portfolio</div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 text-center backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-purple-400 mx-auto mb-1.5" />
              <div className="text-xs text-zinc-400">Program Mode</div>
              <div className="text-sm font-semibold text-white">100% Online & Remote</div>
            </div>
          </div>
        </div>

        {/* REGISTRATION CALLOUT BEAUTIFUL CARD */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="relative overflow-hidden bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-zinc-900 border-2 border-blue-500/30 shadow-2xl backdrop-blur-2xl rounded-3xl p-6 sm:p-8">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Admissions Open</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to Start Your Internship?
                </h2>
                <p className="text-sm text-zinc-300 max-w-xl">
                  {selectedDomains.length > 0
                    ? `You have selected ${selectedDomains.length} course(s). Click below to complete your registration!`
                    : "Select your preferred courses below or click to proceed directly to the registration form."}
                </p>

                {selectedDomains.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 justify-center md:justify-start">
                    {selectedDomains.map((id) => {
                      const d = DOMAIN_DETAILS.find((item) => item.id === id);
                      return (
                        <Badge key={id} className="bg-blue-600/30 text-blue-300 border-blue-500/40 text-xs px-2.5 py-0.5">
                          {d?.label || id}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="w-full md:w-auto">
                <Button
                  onClick={handleProceedToRegistration}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 text-base transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {selectedDomains.length > 0
                    ? `Register for ${selectedDomains.length} Course(s)`
                    : "Proceed to Registration Form"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* DOMAIN DISCOVERY & SPOTLIGHT EXPLORER */}
        <section className="mb-14 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <BookOpen className="h-4 w-4" />
                <span>Explore Courses & Domain Roadmaps</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Choose Your Internship Tracks</h2>
              <p className="text-sm text-zinc-400">Click any course to view detailed learning outcomes, tools, and projects. You can select multiple courses!</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeCategoryFilter === cat
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDomains.map((domain) => {
              const IconComp = domain.icon;
              const isSelected = selectedDomains.includes(domain.id);

              return (
                <div
                  key={domain.id}
                  className={`group relative bg-zinc-900/90 rounded-2xl border p-5 transition-all duration-300 hover:border-zinc-700 flex flex-col justify-between ${
                    isSelected ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-blue-950/20" : "border-zinc-800"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white group-hover:scale-105 transition-transform">
                        <IconComp className="h-5 w-5 text-blue-400" />
                      </div>
                      <Badge className={`text-[10px] font-semibold border ${domain.badgeColor}`}>
                        {domain.category}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors flex items-center justify-between">
                        <span>{domain.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {domain.shortDesc}
                      </p>
                    </div>

                    {/* Tools Preview Chips */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {domain.tools.slice(0, 3).map((tool) => (
                        <span key={tool} className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-md">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDomainModal(domain)}
                      className="flex-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 h-8 rounded-lg"
                    >
                      <Info className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                      View Details
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => toggleDomain(domain.id)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select Course"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Courses Counter Banner */}
          <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-zinc-300">
              Selected Courses: <strong className="text-white font-bold">{selectedDomains.length} Track(s) Chosen</strong>
            </div>

            <Button
              onClick={handleProceedToRegistration}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/20"
            >
              Fill Registration Form
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>
      </main>

      {/* DOMAIN SPOTLIGHT DIALOG MODAL */}
      {selectedDomainModal && (
        <Dialog open={!!selectedDomainModal} onOpenChange={() => setSelectedDomainModal(null)}>
          <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${selectedDomainModal.badgeColor}`}>
                  {selectedDomainModal.category} Track
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                {React.createElement(selectedDomainModal.icon, { className: "h-6 w-6 text-blue-400" })}
                {selectedDomainModal.label}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                {selectedDomainModal.shortDesc}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-xs text-zinc-300">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  Course Overview
                </h4>
                <p className="leading-relaxed text-zinc-300 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  {selectedDomainModal.overview}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Key Skills You Will Gain
                  </h4>
                  <ul className="space-y-1 list-disc list-inside text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {selectedDomainModal.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Code className="h-4 w-4 text-emerald-400" />
                    Tools & Technologies
                  </h4>
                  <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {selectedDomainModal.tools.map((tool) => (
                      <span key={tool} className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-md text-white font-mono text-[11px]">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  Real-World Projects & Deliverables
                </h4>
                <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {selectedDomainModal.projects.map((proj, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{proj}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-pink-400" />
                  Target Career Roles
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDomainModal.careerRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="bg-zinc-800 text-zinc-200 border-zinc-700 text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDomainModal(null)}
                className="border-zinc-800 text-zinc-300 hover:text-white"
              >
                Close Spotlight
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!selectedDomains.includes(selectedDomainModal.id)) {
                    toggleDomain(selectedDomainModal.id);
                  }
                  setSelectedDomainModal(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5"
              >
                {selectedDomains.includes(selectedDomainModal.id) ? "Course Selected" : "Select This Course"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
};

export default Internship;
