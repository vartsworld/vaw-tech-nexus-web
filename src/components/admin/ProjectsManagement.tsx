
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Check, Trash, PenSquare } from "lucide-react";
import { type Project } from "@/types/database";
import ImageUploadField from "./ImageUploadField";

const ProjectsManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    title: "",
    category: "",
    description: "",
    image_url: "",
    featured: false,
    display_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Predefined categories
  const predefinedCategories = [
    "Website Development",
    "WebApp Development",
    "Mobile App Development",
    "E-commerce Solutions",
    "UI/UX Design",
    "SEO Optimization",
    "Digital Marketing",
    "IT Consulting"
  ];

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

      if (error) throw error;
      setProjects(data || []);
      
      if (data) {
        // Combine predefined categories with existing ones from projects
        const projectCategories = [...new Set(data.map((project: Project) => project.category))];
        const allCategories = [...new Set([...predefinedCategories, ...projectCategories])] as string[];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!currentProject.title || !currentProject.category) {
        throw new Error("Title and category are required");
      }

      let response;

      if (isEditing && currentProject.id) {
        // Update existing project
        response = await supabase
          .from("projects")
          .update({
            title: currentProject.title!,
            category: currentProject.category!,
            description: currentProject.description || "",
            image_url: currentProject.image_url || null,
            featured: currentProject.featured || false,
            display_order: currentProject.display_order || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProject.id);
      } else {
        // Create new project
        response = await supabase
          .from("projects")
          .insert({
            title: currentProject.title!,
            category: currentProject.category!,
            description: currentProject.description || "",
            image_url: currentProject.image_url || null,
            featured: currentProject.featured || false,
            display_order: projects.length,
          });
      }

      if (response.error) throw response.error;

      toast({
        title: isEditing ? "Project updated" : "Project created",
        description: isEditing
          ? "The project has been updated successfully."
          : "A new project has been added.",
      });

      // Reset form and fetch updated data
      setDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Project deleted",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentProject({
      title: "",
      category: "",
      description: "",
      image_url: "",
      featured: false,
      display_order: projects.length,
    });
    setIsEditing(false);
  };

  const handleNewProject = () => {
    resetForm();
    setDialogOpen(true);
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ featured: !currentValue, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: !currentValue } : p))
      );
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      fetchProjects(); // Refetch to ensure correct order
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const moveUp = (project: Project) => {
    const index = projects.findIndex((p) => p.id === project.id);
    if (index > 0) {
      const prevItem = projects[index - 1];
      updateOrder(project.id, prevItem.display_order);
      updateOrder(prevItem.id, project.display_order);
    }
  };

  const moveDown = (project: Project) => {
    const index = projects.findIndex((p) => p.id === project.id);
    if (index < projects.length - 1) {
      const nextItem = projects[index + 1];
      updateOrder(project.id, nextItem.display_order);
      updateOrder(nextItem.id, project.display_order);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Projects Management</h2>
        <Button onClick={handleNewProject}>Add New Project</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Project Title*
              </label>
              <Input
                id="title"
                value={currentProject.title || ""}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    title: e.target.value,
                  })
                }
                placeholder="Project Name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium">
                Category*
              </label>
              <Select
                value={currentProject.category || ""}
                onValueChange={(value) =>
                  setCurrentProject({
                    ...currentProject,
                    category: value,
                  })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={currentProject.description || ""}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    description: e.target.value,
                  })
                }
                placeholder="Project description..."
                rows={4}
              />
            </div>

            <ImageUploadField
              initialImageUrl={currentProject.image_url || null}
              onImageChange={(url) => 
                setCurrentProject({
                  ...currentProject,
                  image_url: url
                })
              }
              folderPath="projects"
              label="Project Image"
            />

            <div className="flex items-center gap-2">
              <label htmlFor="featured" className="text-sm font-medium">
                Featured Project
              </label>
              <Switch
                id="featured"
                checked={currentProject.featured || false}
                onCheckedChange={(checked) =>
                  setCurrentProject({
                    ...currentProject,
                    featured: checked,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <div className="text-center py-8 bg-card border border-muted/20 rounded-lg">
          <p className="text-muted-foreground">No projects found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project, index) => (
            <Card key={project.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {project.title}
                    {project.featured && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                        Featured
                      </span>
                    )}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {project.category}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveUp(project)}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveDown(project)}
                    disabled={index === projects.length - 1}
                    title="Move Down"
                  >
                    ↓
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {project.image_url && (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="h-24 w-24 object-cover rounded"
                    />
                  )}
                  <div className="text-sm">
                    {project.description}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Switch
                    id={`featured-${project.id}`}
                    checked={project.featured}
                    onCheckedChange={() =>
                      toggleFeatured(project.id, project.featured)
                    }
                  />
                  <label htmlFor={`featured-${project.id}`} className="ml-2 text-sm">
                    Featured
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProject(project)}
                  >
                    <PenSquare className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsManagement;
