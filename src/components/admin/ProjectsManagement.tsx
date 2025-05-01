
import { useState, useEffect, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Upload, PenSquare, Check } from "lucide-react";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  featured: boolean;
  display_order: number;
}

const ProjectsManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
    title: "",
    category: "",
    description: "",
    image_url: "",
    featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "website",
    "webapp",
    "ai",
    "vr",
    "design",
    "marketing",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (!currentProject.title || !currentProject.category || !currentProject.description) {
        toast({
          title: "All fields are required",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      let imageUrl = currentProject.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        toast({
          title: "Project image is required",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const projectData = {
        ...currentProject,
        image_url: imageUrl,
      };

      let response;

      if (isEditing && currentProject.id) {
        // Update existing project
        response = await supabase
          .from("projects")
          .update({
            title: projectData.title,
            category: projectData.category,
            description: projectData.description,
            image_url: projectData.image_url,
            featured: projectData.featured || false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProject.id);
      } else {
        // Create new project
        response = await supabase
          .from("projects")
          .insert({
            title: projectData.title!,
            category: projectData.category!,
            description: projectData.description!,
            image_url: projectData.image_url!,
            featured: projectData.featured || false,
            display_order: projects.length,
          });
      }

      if (response.error) throw response.error;

      toast({
        title: isEditing ? "Project updated" : "Project created",
        description: isEditing
          ? "The project has been updated successfully."
          : "A new project has been added to your portfolio.",
      });

      // Reset form and fetch updated data
      setDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} project.`,
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
    setImagePreview(project.image_url);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentProject({
      title: "",
      category: "",
      description: "",
      image_url: "",
      featured: false,
    });
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
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

  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
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
        <h2 className="text-2xl font-semibold">Portfolio Projects</h2>
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
              <Label htmlFor="title">Project Title*</Label>
              <Input
                id="title"
                value={currentProject.title || ""}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    title: e.target.value,
                  })
                }
                placeholder="Project Title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category*</Label>
              <Select
                value={currentProject.category || ""}
                onValueChange={(value) =>
                  setCurrentProject({
                    ...currentProject,
                    category: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description*</Label>
              <Textarea
                id="description"
                value={currentProject.description || ""}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the project, technologies used, and outcomes..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectImage">Project Image*</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("project-image")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <input
                  id="project-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {(imagePreview || currentProject.image_url) && (
                <div className="mt-4 border rounded-lg p-4 flex justify-center">
                  <img
                    src={imagePreview || currentProject.image_url!}
                    alt="Project Preview"
                    className="max-h-64 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="featured">Featured Project</Label>
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
              <span className="text-sm text-muted-foreground ml-2">
                Featured projects will be highlighted in the portfolio
              </span>
            </div>

            <div className="flex justify-end gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden relative">
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                {project.featured && (
                  <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                    Featured
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-medium">
                  {formatCategoryName(project.category)}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(project)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(project)}
                      disabled={index === projects.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id={`featured-${project.id}`}
                      checked={project.featured}
                      onCheckedChange={() =>
                        toggleFeatured(project.id, project.featured)
                      }
                    />
                    <Label htmlFor={`featured-${project.id}`} className="ml-2">
                      Featured
                    </Label>
                  </div>
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
