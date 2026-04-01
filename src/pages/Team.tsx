import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Users } from "lucide-react";

const boardOfDirectors = [
  { name: "Kevin Anjo", role: "CEO & Chairman · Co-Founder" },
  { name: "Abin B N", role: "CTO · Co-Founder" },
  { name: "Amal A Kumar", role: "HR Head · Co-Founder" },
];

const teamData = [
  {
    department: "Leadership & Executive",
    members: [
      { name: "Kevin Anjo", role: "CEO & Chairman · Co-Founder" },
      { name: "Sumesh", role: "COO" },
      { name: "Abin B N", role: "CTO · Co-Founder" },
      { name: "Milton Manual", role: "CFO" },
      { name: "Sherin", role: "Personal Secretary to CEO" },
    ],
  },
  {
    department: "Division Heads",
    members: [
      { name: "Jasmin", role: "Head of Art & Tech" },
      { name: "Stharth Novel", role: "Business Development Head" },
      { name: "Johona", role: "Anchors Head & Production" },
      { name: "Ajay Chanthully Suresh", role: "Sales Team Head" },
      { name: "Amal A Kumar", role: "HR Head · Co-Founder" },
      { name: "Ganesh", role: "Operations Manager" },
      { name: "Sitharth", role: "Tech Division Head (Team 3)" },
      { name: "Sitharth", role: "Relationship Manager" },
      { name: "Arjun Nair", role: "Backend Development Head" },
      { name: "Arjun", role: "Motion Graphics Team Lead (Tech Division)" },
    ],
  },
  {
    department: "Engineering & Technology",
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
    members: [
      { name: "Athul Krishna", role: "R&D Lead" },
      { name: "Gokul S", role: "AI/ML Engineer" },
      { name: "Adarsh Babu", role: "Innovation Engineer" },
      { name: "Nithin Das", role: "Product Research Analyst" },
    ],
  },
  {
    department: "Marketing & Content",
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

const totalMembers = teamData.reduce((sum, d) => sum + d.members.length, 0);

const Team = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Our Team | VAWtech"
        description="Meet the talented team behind VAWtech — engineers, designers, marketers, and innovators driving digital excellence."
      />
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>{totalMembers} members</span>
              <span className="mx-1">·</span>
              <span>Last updated: March 31, 2026</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Our Team
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              This page is intended for internal reference only.
            </p>
          </div>

          {/* Board of Directors */}
          <div className="mb-10 p-5 rounded-xl border border-primary/20 bg-primary/5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Board of Directors
            </h2>
            <ul className="divide-y divide-primary/10">
              {boardOfDirectors.map((member, i) => (
                <li
                  key={`board-${i}`}
                  className="flex items-center justify-between py-2.5 px-1"
                >
                  <span className="text-sm font-bold text-foreground">{member.name}</span>
                  <span className="text-xs text-muted-foreground text-right ml-4">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Department Sections */}
          <div className="space-y-10">
            {teamData.map((dept) => (
              <div key={dept.department}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
                  {dept.department}
                </h2>
                <ul className="divide-y divide-border/50">
                  {dept.members.map((member, i) => (
                    <li
                      key={`${member.name}-${member.role}-${i}`}
                      className="flex items-center justify-between py-2.5 px-1"
                    >
                      <span className="text-sm font-semibold text-foreground">{member.name}</span>
                      <span className="text-xs text-muted-foreground text-right ml-4">{member.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Team;
