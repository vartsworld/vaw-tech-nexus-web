
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Project } from '@/types/database';

const ProjectsManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    title: '',
    category: '',
    description: '',
    image_url: '',
    featured: false,
    display_order: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editProject, setEditProject] = useState({
    id: '',
    title: '',
    category: '',
    description: '',
    image_url: '',
    featured: false,
    display_order: 0
  });

  // Predefined categories
  const predefinedCategories = [
    "Website Development",
    "WebApp Development",
    "AI Solutions",
    "VR/AR Development",
    "Digital Marketing",
    "Digital Design"
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setProjects(data as Project[]);
        
        // Combine predefined categories with existing ones from projects
        const projectCategories = [...new Set(data.map((project: Project) => project.category))];
        const allCategories = [...new Set([...predefinedCategories, ...projectCategories])];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setNewProject(prev => ({
      ...prev,
      [name]: name === 'featured' ? checked : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setEditProject(prev => ({
      ...prev,
      [name]: name === 'featured' ? checked : value
    }));
  };

  const toggleFeatured = (id: string) => {
    const project = projects.find(project => project.id === id);
    if (project) {
      updateProject(id);
    }
  };

  const validateProjectForm = (isUpdate = false) => {
    const projectToValidate = isUpdate ? editProject : newProject;
    if (!projectToValidate.title || !projectToValidate.description || !projectToValidate.image_url || !projectToValidate.category) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const addProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateProjectForm()) return;

    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .insert({
          title: newProject.title,
          category: newProject.category,
          description: newProject.description,
          image_url: newProject.image_url,
          featured: newProject.featured,
          display_order: newProject.display_order || 0
        })
        .select();

      if (error) throw error;

      setProjects([...projects, data[0] as Project]);
      resetForm();
      toast({
        title: 'Success',
        description: 'Project added successfully',
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add project',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setNewProject({
      title: '',
      category: '',
      description: '',
      image_url: '',
      featured: false,
      display_order: 0
    });
  };

  const handleEdit = (project: Project) => {
    setIsEditing(true);
    setEditProject({ ...project });
  };

  const updateProject = async (id: string) => {
    if (!validateProjectForm(true)) return;

    try {
      const { error } = await (supabase as any)
        .from('projects')
        .update({
          title: editProject.title,
          category: editProject.category,
          description: editProject.description,
          image_url: editProject.image_url,
          featured: editProject.featured,
          display_order: editProject.display_order
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(project =>
        project.id === id ? { ...project, ...editProject } : project
      ));
      
      setIsEditing(false);
      setEditProject({ id: '', title: '', category: '', description: '', image_url: '', featured: false, display_order: 0 });
      
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const { error } = await (supabase as any)
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setProjects(projects.filter(project => project.id !== id));
        toast({
          title: 'Success',
          description: 'Project deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting project:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete project',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return <p>Loading projects...</p>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Projects Management</h1>

      {/* Add Project Form */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Add New Project</h2>
        <form onSubmit={addProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input type="text" id="title" name="title" value={newProject.title} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select name="category" onValueChange={(value) => setNewProject(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {predefinedCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
                {categories
                  .filter(category => !predefinedCategories.includes(category))
                  .map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input type="text" id="image_url" name="image_url" value={newProject.image_url} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input type="number" id="display_order" name="display_order" value={newProject.display_order} onChange={handleInputChange} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={newProject.description} onChange={handleInputChange} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="featured" name="featured" checked={newProject.featured} onCheckedChange={(checked) => setNewProject(prev => ({ ...prev, featured: !!checked }))} />
            <Label htmlFor="featured">Featured</Label>
          </div>
          <Button type="submit">Add Project</Button>
        </form>
      </div>

      {/* Edit Project Form */}
      {isEditing && (
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Edit Project</h2>
          <form onSubmit={(e) => { e.preventDefault(); updateProject(editProject.id); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input type="text" id="title" name="title" value={editProject.title} onChange={handleEditInputChange} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select name="category" onValueChange={(value) => setEditProject(prev => ({ ...prev, category: value }))} defaultValue={editProject.category}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                  {categories
                    .filter(category => !predefinedCategories.includes(category))
                    .map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input type="text" id="image_url" name="image_url" value={editProject.image_url} onChange={handleEditInputChange} />
            </div>
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input type="number" id="display_order" name="display_order" value={editProject.display_order} onChange={handleEditInputChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={editProject.description} onChange={handleEditInputChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="featured" name="featured" checked={editProject.featured} onCheckedChange={(checked) => setEditProject(prev => ({ ...prev, featured: !!checked }))} />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="flex justify-between md:col-span-2">
              <Button type="submit">Update Project</Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>A list of your projects.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.title}</TableCell>
                <TableCell>{project.category}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={project.featured}
                    onCheckedChange={() => toggleFeatured(project.id)}
                    id={`featured-${project.id}`}
                  />
                </TableCell>
                <TableCell>{project.display_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(project)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteProject(project.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectsManagement;
