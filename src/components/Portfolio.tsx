
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  title: string;
  category: string;
  image: string;
  description: string;
}

const Portfolio = () => {
  const [projects] = useState<Project[]>([
    {
      title: "Crypto Dashboard",
      category: "webapp",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
      description: "Real-time cryptocurrency tracking platform with advanced analytics"
    },
    {
      title: "AI Fashion Assistant",
      category: "ai",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
      description: "Style recommendation system powered by artificial intelligence"
    },
    {
      title: "VR Property Tour",
      category: "vr",
      image: "https://images.unsplash.com/photo-1501854140801-50d01698950b",
      description: "Immersive virtual reality experience for real estate listings"
    },
    {
      title: "E-Commerce Platform",
      category: "website",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      description: "Fully-featured online store with integrated payment processing"
    },
    {
      title: "Brand Identity Package",
      category: "design",
      image: "https://images.unsplash.com/photo-1493397212122-2b85dda8106b",
      description: "Comprehensive brand identity development for a tech startup"
    },
    {
      title: "Social Marketing Campaign",
      category: "marketing",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      description: "Cross-platform digital marketing strategy with measurable results"
    },
  ]);

  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Our <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            Explore our recent projects that showcase our expertise and innovation across various industries.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-muted/20">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="website">Websites</TabsTrigger>
              <TabsTrigger value="webapp">Web Apps</TabsTrigger>
              <TabsTrigger value="ai">AI Solutions</TabsTrigger>
              <TabsTrigger value="vr">VR/AR</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))}
            </div>
          </TabsContent>

          {["website", "webapp", "ai", "vr", "design", "marketing"].map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects
                  .filter((project) => project.category === category)
                  .map((project, index) => (
                    <ProjectCard key={index} project={project} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-12 text-center">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
};

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Card className="overflow-hidden group bg-transparent border-0">
      <div className="relative overflow-hidden rounded-lg aspect-[16/10]">
        <img 
          src={project.image} 
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="text-sm text-foreground/80">{project.description}</p>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
            {project.category.toUpperCase()}
          </span>
        </div>
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="sm" className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background">
            View Project
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Portfolio;
