
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  featured: boolean;
  display_order: number;
}

const Portfolio = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Type assertion to tell TypeScript that the data matches our Project interface
        const projectsData = data as unknown as Project[];
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(projectsData.map((project) => project.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = (category: string) => {
    setActiveFilter(category);

    if (category === "all") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((project) => project.category === category));
    }
  };

  // Don't show the section if there are no projects
  if (projects.length === 0 && !loading) {
    return null;
  }

  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Our <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-['Outfit']">
            Check out some of our recent projects
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p>Loading portfolio...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => filterProjects("all")}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeFilter === category ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => filterProjects(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group"
                >
                  <div className="bg-card overflow-hidden rounded-xl shadow-lg border border-muted/20">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-6 text-white">
                          <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                          <p className="text-sm line-clamp-2">{project.description}</p>
                        </div>
                      </div>
                      {project.featured && (
                        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                          Featured
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-medium">
                        {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
