import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Users, Crown, Briefcase, Code, Palette, Megaphone, HeadphonesIcon, GraduationCap } from "lucide-react";

const teamData = [
  {
    department: "Leadership & Executive",
    icon: Crown,
    members: [
      { name: "Kevin Anjo", role: "CEO & Chairman" },
      { name: "Sumesh", role: "COO" },
      { name: "Abin B N", role: "CTO" },
      { name: "Milton Manual", role: "CFO" },
      { name: "Sherin", role: "Personal Secretary to CEO" },
    ],
  },
  {
    department: "Division Heads",
    icon: Briefcase,
    members: [
      { name: "Jasmin", role: "Head of Art & Tech" },
      { name: "Stharth Novel", role: "Business Development Head" },
      { name: "Johona", role: "Anchors Head & Production" },
      { name: "Ajay Chanthully Suresh", role: "Sales Team Head" },
      { name: "Amal A Kumar", role: "HR Head" },
      { name: "Ganesh", role: "Operations Manager" },
      { name: "Sitharth", role: "Tech Division Head (Team 3)" },
      { name: "Sitharth", role: "Relationship Manager" },
      { name: "Arjun Nair", role: "Backend Development Head" },
      { name: "Arjun", role: "Motion Graphics Team Lead (Tech Division)" },
    ],
  },
  {
    department: "Engineering & Technology",
    icon: Code,
    members: [
      { name: "Li Wei", role: "Software Engineer" },
      { name: "Zhang Min", role: "AI Engineer" },
      { name: "Chen Hao", role: "Backend Developer" },
      { name: "Kim Min-Jun", role: "Frontend Developer" },
      { name: "Park Ji-Hoon", role: "Mobile App Developer" },
      { name: "Lee Seo-Yeon", role: "UI/UX Designer" },
      { name: "Ivan Petrov", role: "DevOps Engineer" },
      { name: "Dmitry Ivanov", role: "Cybersecurity Specialist" },
      { name: "Alexei Smirnov", role: "System Architect" },
      { name: "Rahul Dev", role: "Senior Full Stack Developer" },
      { name: "Vivek Raj", role: "Frontend Developer" },
      { name: "Nikki Mary", role: "UI/UX Developer" },
      { name: "Alan Joseph", role: "Mobile App Developer" },
      { name: "Neeraj Kumar", role: "DevOps Engineer" },
      { name: "Febin Mathew", role: "QA Engineer" },
    ],
  },
  {
    department: "Research & Innovation",
    icon: Palette,
    members: [
      { name: "Athul Krishna", role: "R&D Lead" },
      { name: "Gokul S", role: "AI/ML Engineer" },
      { name: "Adarsh Babu", role: "Innovation Engineer" },
      { name: "Nithin Das", role: "Product Research Analyst" },
    ],
  },
  {
    department: "Marketing & Content",
    icon: Megaphone,
    members: [
      { name: "Siva", role: "Social Media Manager" },
      { name: "Hari", role: "Ads Manager" },
      { name: "Parvathy", role: "Social Media Executive" },
      { name: "Niya", role: "Social Media Executive" },
      { name: "Meera Thomas", role: "Content Strategist" },
      { name: "Alen Paul", role: "Video Editor" },
    ],
  },
  {
    department: "Operations & Support",
    icon: HeadphonesIcon,
    members: [
      { name: "Anoop Raj", role: "Executive Assistant" },
      { name: "Deepak Mohan", role: "Team Assistant" },
      { name: "Riya Das", role: "HR Assistant" },
      { name: "Vishal Krishnan", role: "Operations Assistant" },
      { name: "Anjali Nair", role: "Marketing Assistant" },
    ],
  },
  {
    department: "Interns",
    icon: GraduationCap,
    members: [
      { name: "Vighnesh Vishnu Ram", role: "Web Development Intern" },
      { name: "Shiva Hari A", role: "Software Development Intern" },
      { name: "Kailas NN", role: "QA / Testing Intern" },
      { name: "Jaiden Germani", role: "Digital Marketing Intern" },
      { name: "Annchrista F", role: "Social Media Intern" },
      { name: "Ashleen S", role: "Content Creation Intern" },
      { name: "Anantha Krishnan V", role: "Business Development Intern" },
    ],
  },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const departmentColors: Record<string, string> = {
  "Leadership & Executive": "from-amber-500/20 to-yellow-600/10 border-amber-500/30",
  "Division Heads": "from-primary/20 to-primary/5 border-primary/30",
  "Engineering & Technology": "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
  "Research & Innovation": "from-purple-500/20 to-violet-500/10 border-purple-500/30",
  "Marketing & Content": "from-rose-500/20 to-pink-500/10 border-rose-500/30",
  "Operations & Support": "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
  "Interns": "from-sky-500/20 to-indigo-500/10 border-sky-500/30",
};

const avatarColors: Record<string, string> = {
  "Leadership & Executive": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Division Heads": "bg-primary/20 text-primary border-primary/30",
  "Engineering & Technology": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Research & Innovation": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Marketing & Content": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Operations & Support": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Interns": "bg-sky-500/20 text-sky-400 border-sky-500/30",
};

const Team = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Team | VAWtech"
        description="Meet the talented team behind VAWtech — engineers, designers, marketers, and innovators driving digital excellence."
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">50+ Professionals</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tight">
              Meet Our <span className="text-primary">Team</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A global collective of engineers, designers, strategists, and innovators united by one mission — building exceptional digital experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Departments */}
      <section className="pb-24 px-4">
        <div className="container mx-auto max-w-6xl space-y-16">
          {teamData.map((dept, deptIndex) => (
            <motion.div
              key={dept.department}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: deptIndex * 0.05 }}
            >
              {/* Department Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${departmentColors[dept.department]} border`}>
                  <dept.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">{dept.department}</h2>
                  <p className="text-xs text-muted-foreground font-medium">{dept.members.length} members</p>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {dept.members.map((member, memberIndex) => (
                  <motion.div
                    key={`${member.name}-${member.role}-${memberIndex}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: memberIndex * 0.03 }}
                    className="group relative bg-card border border-border/50 rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className={`w-14 h-14 mx-auto rounded-xl border ${avatarColors[dept.department]} flex items-center justify-center text-sm font-black mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      {getInitials(member.name)}
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-tight mb-1">{member.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium leading-snug">{member.role}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Team;
