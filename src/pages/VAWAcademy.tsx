import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Brain, Palette, Code2, Smartphone, Megaphone, Video, PenTool,
  Database, MessageSquare, CheckCircle2, GraduationCap, Briefcase, Users,
  Award, Rocket, Clock, IndianRupee, ArrowRight, Star, Zap, Target
} from "lucide-react";
import heroImg from "@/assets/vaw-academy-hero.jpg";
import toolsImg from "@/assets/vaw-academy-tools.jpg";
import SEO from "@/components/SEO";

const aiTools = [
  { name: "ChatGPT", logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg", color: "from-emerald-500/20 to-teal-500/20" },
  { name: "Gemini", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg", color: "from-blue-500/20 to-indigo-500/20" },
  { name: "Claude", logo: "https://upload.wikimedia.org/wikipedia/commons/1/14/Claude_AI_symbol.svg", color: "from-orange-500/20 to-amber-500/20" },
  { name: "Midjourney", logo: "https://seeklogo.com/images/M/midjourney-logo-031A0A1864-seeklogo.com.png", color: "from-purple-500/20 to-pink-500/20" },
  { name: "DALL·E", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/DALL-E_Logo.png", color: "from-rose-500/20 to-red-500/20" },
  { name: "Figma", logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg", color: "from-pink-500/20 to-purple-500/20" },
  { name: "Canva", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg", color: "from-cyan-500/20 to-blue-500/20" },
  { name: "Photoshop", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg", color: "from-blue-600/20 to-indigo-700/20" },
  { name: "Illustrator", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Adobe_Illustrator_CC_icon.svg", color: "from-orange-500/20 to-yellow-500/20" },
  { name: "Premiere Pro", logo: "https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg", color: "from-purple-600/20 to-violet-700/20" },
  { name: "CapCut", logo: "https://upload.wikimedia.org/wikipedia/commons/d/df/CapCut_logo.svg", color: "from-slate-500/20 to-zinc-600/20" },
  { name: "GitHub", logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg", color: "from-zinc-700/30 to-zinc-900/30" },
];

const whyChoose = [
  "Industry-Oriented Training", "Live Practical Sessions", "Real Project Experience",
  "AI-Based Learning Methods", "Internship & Portfolio Guidance", "Career & Freelance Support",
  "Certificate After Completion", "Beginner Friendly Programs",
];

const masterCourse = {
  title: "AI Basics & Future Technology Program",
  fee: "₹3,500",
  duration: "2 Months",
  modules: [
    "Introduction to Artificial Intelligence", "Understanding Machine Learning", "AI Tools & Platforms",
    "AI for Business & Productivity", "ChatGPT & Generative AI", "AI Content Creation",
    "AI Image & Video Generation", "Automation Basics", "AI Ethics & Future Careers", "Real-world AI Applications",
  ],
  careers: ["AI Assistant Specialist", "AI Content Creator", "Automation Assistant", "AI Support Executive", "Freelance AI Consultant", "Digital Productivity Expert"],
};

const specializations = [
  { icon: Palette, title: "UI/UX Designing", fee: "₹30,000", desc: "Create beautiful, user-friendly digital experiences for web and mobile.",
    modules: ["Design Fundamentals","UI Design","UX Principles","Wireframing","Mobile UI","Web UI","Figma Mastery","Design Systems","Interactive Design","Portfolio"],
    tools: ["Figma","Canva","Adobe XD","AI Design Tools"], careers: ["UI Designer","UX Designer","Product Designer","Freelance UI Specialist"] },
  { icon: Brain, title: "AI Training", fee: "Contact", desc: "Master practical AI workflows, tools, and implementation.",
    modules: ["AI Fundamentals","Generative AI","AI Workflows","AI Automation","AI Research","AI Productivity","Business Applications","Content Creation","AI Agents","Future Trends"],
    tools: ["ChatGPT","Gemini","Claude","Midjourney","Automation Platforms"], careers: ["AI Trainer","AI Workflow Specialist","AI Consultant","AI Operations Assistant"] },
  { icon: Database, title: "Data Labeling", fee: "Contact", desc: "Prepare and organize data for AI and Machine Learning systems.",
    modules: ["Data Annotation","Image Labeling","Text Labeling","Video Annotation","Audio Annotation","Quality Checking","Dataset Prep","Standards","Real-Time Projects"],
    tools: ["Label Studio","CVAT","AI Annotation Platforms"], careers: ["Data Labeler","AI Dataset Specialist","Annotation Analyst","Remote AI Contributor"] },
  { icon: MessageSquare, title: "Prompt Engineering", fee: "₹15,000", desc: "Communicate effectively with AI to generate powerful results.",
    modules: ["Prompt Basics","Prompt Structures","Role Prompting","Output Optimization","Image Prompts","Writing Prompts","Automation Prompts","Business Prompting","Frameworks","Advanced AI"],
    tools: ["ChatGPT","Claude","Gemini","Midjourney","DALL·E"], careers: ["Prompt Engineer","AI Content Strategist","Workflow Creator","AI Assistant Specialist"] },
  { icon: Code2, title: "Web Development", fee: "₹8,000", desc: "Build modern responsive websites and web applications.",
    modules: ["HTML5 & CSS3","JavaScript","Responsive Design","Frontend Dev","Backend Basics","Deployment","UI Integration","Portfolio Site","CMS & Hosting","AI-Assisted Dev"],
    tools: ["VS Code","GitHub","WordPress","AI Coding Tools"], careers: ["Web Developer","Frontend Developer","Website Designer","Freelance Web Dev"] },
  { icon: Smartphone, title: "App Development", fee: "₹30,000", desc: "Design and develop mobile apps for Android and modern platforms.",
    modules: ["App Basics","Mobile UI","Android Dev","API Integration","Publishing","Cross Platform","AI in Apps","Real Projects","Firebase","Optimization"],
    tools: ["Flutter","Android Studio","Firebase","AI App Tools"], careers: ["App Developer","Mobile UI Developer","Android Developer","Freelance App Creator"] },
  { icon: PenTool, title: "Graphic Design", fee: "₹25,000", desc: "Master creative visual communication and modern design.",
    modules: ["Design Principles","Typography","Social Media","Branding","Posters","Advertisement","AI Graphics","Print Design","Portfolio","Creative Editing"],
    tools: ["Photoshop","Illustrator","Canva","AI Design Tools"], careers: ["Graphic Designer","Brand Designer","Social Media Designer","Visual Artist"] },
  { icon: Megaphone, title: "Digital Marketing", fee: "₹25,000", desc: "Learn how businesses grow online with modern strategies.",
    modules: ["Social Media Marketing","SEO","Content Marketing","Google Ads","Meta Ads","Branding","Analytics","AI Marketing","Lead Generation","Growth Campaigns"],
    tools: ["Meta Ads","Google Analytics","Canva","AI Marketing"], careers: ["Digital Marketer","Social Media Manager","SEO Executive","Performance Marketer"] },
  { icon: Video, title: "Content Creation", fee: "Contact", desc: "Create engaging content for social media, YouTube, and brands.",
    modules: ["Content Strategy","Video Creation","Reels & Shorts","Script Writing","AI Production","YouTube Planning","Branding","Mobile Editing","Storytelling","Creator Growth"],
    tools: ["CapCut","Canva","Premiere Pro","AI Content Tools"], careers: ["Content Creator","Video Editor","Social Media Creator","Creative Strategist"] },
];

const highlights = [
  { icon: Zap, t: "Live Practical Sessions" }, { icon: Users, t: "Industry Expert Mentors" },
  { icon: Brain, t: "AI-Based Learning" }, { icon: Briefcase, t: "Real Client Projects" },
  { icon: GraduationCap, t: "Internship Guidance" }, { icon: Rocket, t: "Freelancing Support" },
  { icon: Award, t: "Portfolio Development" }, { icon: Target, t: "Placement Assistance" },
  { icon: Sparkles, t: "Startup Guidance" },
];

const audience = ["Students","College Graduates","Entrepreneurs","Freelancers","Working Professionals","Beginners in Tech"];

export default function VAWAcademy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="VAW Online Internship & AI Digital Skills Master Program"
        description="Future-Ready AI & Digital Skills Courses by VArts World Academy. Learn AI, UI/UX, Web Dev, Prompt Engineering, Marketing & more with live sessions, real projects, and certification."
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="AI & Digital Skills Master Program" className="w-full h-full object-cover opacity-40" width={1920} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36 text-center">
          <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 backdrop-blur-md px-4 py-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> VArts World Academy
          </Badge>
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
            AI & Digital Skills <br /> Master Program
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground mb-3 font-light">Future-Ready Courses by VArts World Academy</p>
          <p className="text-base md:text-lg text-primary font-medium mb-8 tracking-wider">Learn. Build. Create. Lead.</p>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-10">
            Transform your future with industry-focused AI & digital skill programs designed for students,
            job seekers, entrepreneurs, and professionals.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Enroll Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/internship">View All Internships</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">About The Program</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Our AI & Digital Skills Programs help learners gain practical, real-world experience
            in trending technology and creative industries — from Artificial Intelligence to UI/UX,
            Prompt Engineering, Web Development, and Digital Marketing.
          </p>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {whyChoose.map((w) => (
            <Card key={w} className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{w}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* AI TOOLS SHOWCASE */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">AI TOOLS YOU WILL MASTER</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Industry-Leading Tools & Platforms</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Hands-on training with the same tools used by top creators, agencies and AI teams worldwide.</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {aiTools.map((tool) => (
            <div key={tool.name} className={`group relative rounded-2xl bg-gradient-to-br ${tool.color} backdrop-blur-md border border-white/10 p-5 hover:scale-105 hover:border-primary/50 transition-all duration-300`}>
              <div className="aspect-square flex items-center justify-center mb-3 rounded-xl bg-background/40 p-3">
                <img src={tool.logo} alt={tool.name} className="max-h-12 max-w-full object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-center text-sm font-semibold">{tool.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MASTER COURSE */}
      <section className="container mx-auto px-4 py-20">
        <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">MASTER COURSE</Badge>
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/15"><Brain className="w-6 h-6 text-primary" /></div>
                <h3 className="text-2xl md:text-3xl font-bold">{masterCourse.title}</h3>
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="secondary" className="text-sm py-1.5 px-3"><IndianRupee className="w-3.5 h-3.5 mr-1" />{masterCourse.fee.replace('₹','')}</Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3"><Clock className="w-3.5 h-3.5 mr-1" />{masterCourse.duration}</Badge>
                <Badge variant="secondary" className="text-sm py-1.5 px-3">Online / Offline</Badge>
              </div>
              <p className="text-muted-foreground mb-6">A complete beginner-to-intermediate program introducing learners to AI, modern AI tools, automation, and future technologies.</p>
              <h4 className="font-semibold mb-3">What You Will Learn</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {masterCourse.modules.map(m => (
                  <div key={m} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />{m}</div>
                ))}
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Enroll in Master Course <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </div>
            <div className="bg-muted/30 p-8 md:p-12 border-l border-border/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Career Opportunities</h4>
              <div className="space-y-2 mb-8">
                {masterCourse.careers.map(c => (
                  <div key={c} className="flex items-center gap-2 p-3 rounded-lg bg-background/60 border border-border/50">
                    <Star className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{c}</span>
                  </div>
                ))}
              </div>
              <img src={toolsImg} alt="AI Tools" loading="lazy" width={1536} height={1024} className="rounded-xl border border-border/50 w-full" />
            </div>
          </div>
        </Card>
      </section>

      {/* SPECIALIZATIONS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/30">DOMAIN SPECIALIZATION COURSES</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Specialization</h2>
          <p className="text-muted-foreground">Duration: <span className="text-primary font-semibold">3 Months</span> · Practical learning, live projects, portfolio & industry training.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specializations.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="group bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-xl bg-primary/15 group-hover:scale-110 transition-transform"><Icon className="w-6 h-6 text-primary" /></div>
                    <Badge variant="outline" className="border-primary/40 text-primary font-semibold">{s.fee}</Badge>
                  </div>
                  <CardTitle className="text-xl">{s.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Modules</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {s.modules.slice(0,6).map(m => <Badge key={m} variant="secondary" className="text-[10px] font-normal">{m}</Badge>)}
                      {s.modules.length > 6 && <Badge variant="secondary" className="text-[10px]">+{s.modules.length - 6} more</Badge>}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tools</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {s.tools.map(t => <Badge key={t} className="text-[10px] bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">{t}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Career Paths</h5>
                    <ul className="space-y-1">
                      {s.careers.map(c => <li key={c} className="text-xs flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-primary" />{c}</li>)}
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">Enroll Now</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Program Highlights</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {highlights.map(h => {
            const Icon = h.icon;
            return (
              <div key={h.t} className="group flex items-center gap-4 p-5 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:border-primary/50 transition-colors">
                <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors"><Icon className="w-5 h-5 text-primary" /></div>
                <span className="font-medium text-sm">{h.t}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* AUDIENCE + CERT */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-card/50 backdrop-blur border-border/50 p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="w-6 h-6 text-primary" />Who Can Join?</h3>
            <div className="space-y-3">
              {audience.map(a => (
                <div key={a} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /><span>{a}</span></div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground italic">No prior technical experience required for beginner-level programs.</p>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-background border-primary/30 p-8">
            <Award className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-3">Certification</h3>
            <p className="text-muted-foreground mb-6">All participants receive an industry-oriented course completion certificate after successful completion of the program.</p>
            <div className="rounded-xl bg-background/50 border border-primary/30 p-6 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-lg font-bold">Admission Open Now</p>
              <p className="text-sm text-muted-foreground">Limited Seats Available</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/30 p-12 md:p-16 text-center">
          <div className="absolute inset-0 opacity-20">
            <img src={heroImg} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Start Your Future Today</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              With AI, creativity, and digital innovation — your next opportunity starts at VAW Technologies Academy & ESCHOOLBOOKS.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">Apply for Admission <ArrowRight className="ml-2 w-4 h-4" /></Button>
              <Button size="lg" variant="outline" asChild><Link to="/">Contact Us</Link></Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">VAW Technologies Academy · ESCHOOLBOOKS</p>
          </div>
        </div>
      </section>
    </div>
  );
}
