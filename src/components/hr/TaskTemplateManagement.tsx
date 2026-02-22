import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  LayoutTemplate, Plus, Edit, Trash2, Package, ListChecks, GripVertical,
  Flag, Coins, Clock, Loader2, ChevronRight, Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubtaskTemplate {
  id?: string;
  title: string;
  description: string;
  points: number;
  sort_order: number;
  isNew?: boolean;
}

interface TaskTemplate {
  id: string;
  package_id: string;
  title: string;
  description: string;
  priority: string;
  points: number;
  trial_period: boolean;
  estimated_days: number | null;
  sort_order: number;
  is_active: boolean;
  subtasks?: SubtaskTemplate[];
}

interface PricingPackage {
  id: string;
  name: string;
  discount_price: number;
  original_price: number;
  icon: string;
  features: string[];
}

const TaskTemplateManagement = () => {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    points: 10,
    trial_period: false,
    estimated_days: "",
    subtasks: [] as SubtaskTemplate[]
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (selectedPackageId) {
      fetchTemplates(selectedPackageId);
    }
  }, [selectedPackageId]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_packages')
        .select('id, name, discount_price, original_price, icon, features')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPackages((data as any) || []);
      if (data && data.length > 0 && !selectedPackageId) {
        setSelectedPackageId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (packageId: string) => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('package_id', packageId)
        .order('sort_order');

      if (taskError) throw taskError;

      if (!taskData || taskData.length === 0) {
        setTemplates([]);
        return;
      }

      const taskIds = taskData.map(t => t.id);
      const { data: subtaskData } = await supabase
        .from('subtask_templates')
        .select('*')
        .in('task_template_id', taskIds)
        .order('sort_order');

      const subtaskMap: Record<string, SubtaskTemplate[]> = {};
      (subtaskData || []).forEach((s: any) => {
        if (!subtaskMap[s.task_template_id]) subtaskMap[s.task_template_id] = [];
        subtaskMap[s.task_template_id].push(s);
      });

      setTemplates(taskData.map((t: any) => ({
        ...t,
        subtasks: subtaskMap[t.id] || []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      points: 10,
      trial_period: false,
      estimated_days: "",
      subtasks: []
    });
    setIsTaskDialogOpen(true);
  };

  const openEditDialog = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setTaskForm({
      title: template.title,
      description: template.description || "",
      priority: template.priority,
      points: template.points,
      trial_period: template.trial_period,
      estimated_days: template.estimated_days?.toString() || "",
      subtasks: (template.subtasks || []).map(s => ({ ...s }))
    });
    setIsTaskDialogOpen(true);
  };

  const addSubtask = () => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, {
        title: "",
        description: "",
        points: 5,
        sort_order: prev.subtasks.length,
        isNew: true
      }]
    }));
  };

  const updateSubtask = (index: number, field: string, value: any) => {
    setTaskForm(prev => {
      const updated = [...prev.subtasks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subtasks: updated };
    });
  };

  const removeSubtask = (index: number) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleSaveTemplate = async () => {
    if (!taskForm.title.trim()) {
      toast({ title: "Validation Error", description: "Task title is required.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('task_templates')
          .update({
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
            points: taskForm.points,
            trial_period: taskForm.trial_period,
            estimated_days: taskForm.estimated_days ? parseInt(taskForm.estimated_days) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;

        // Delete old subtasks and re-insert
        await supabase
          .from('subtask_templates')
          .delete()
          .eq('task_template_id', editingTemplate.id);

        if (taskForm.subtasks.length > 0) {
          const subtasksToInsert = taskForm.subtasks.map((s, i) => ({
            task_template_id: editingTemplate.id,
            title: s.title,
            description: s.description,
            points: s.points,
            sort_order: i
          }));

          const { error: subError } = await supabase
            .from('subtask_templates')
            .insert(subtasksToInsert);

          if (subError) throw subError;
        }

        toast({ title: "Success", description: "Task template updated." });
      } else {
        // Create new template
        const { data: newTemplate, error } = await supabase
          .from('task_templates')
          .insert({
            package_id: selectedPackageId,
            title: taskForm.title,
            description: taskForm.description,
            priority: taskForm.priority,
            points: taskForm.points,
            trial_period: taskForm.trial_period,
            estimated_days: taskForm.estimated_days ? parseInt(taskForm.estimated_days) : null,
            sort_order: templates.length,
            created_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        if (taskForm.subtasks.length > 0) {
          const subtasksToInsert = taskForm.subtasks.map((s, i) => ({
            task_template_id: newTemplate.id,
            title: s.title,
            description: s.description,
            points: s.points,
            sort_order: i
          }));

          const { error: subError } = await supabase
            .from('subtask_templates')
            .insert(subtasksToInsert);

          if (subError) throw subError;
        }

        toast({ title: "Success", description: "Task template created." });
      }

      setIsTaskDialogOpen(false);
      fetchTemplates(selectedPackageId);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({ title: "Error", description: error.message || "Failed to save template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateToDelete);

      if (error) throw error;

      toast({ title: "Deleted", description: "Task template deleted." });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchTemplates(selectedPackageId);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: "Error", description: "Failed to delete template.", variant: "destructive" });
    }
  };

  const toggleTemplateActive = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('task_templates')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', templateId);

      if (error) throw error;
      fetchTemplates(selectedPackageId);
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const duplicateTemplate = async (template: TaskTemplate) => {
    try {
      const { data: newTemplate, error } = await supabase
        .from('task_templates')
        .insert({
          package_id: template.package_id,
          title: `${template.title} (Copy)`,
          description: template.description,
          priority: template.priority,
          points: template.points,
          trial_period: template.trial_period,
          estimated_days: template.estimated_days,
          sort_order: templates.length
        })
        .select()
        .single();

      if (error) throw error;

      if (template.subtasks && template.subtasks.length > 0) {
        await supabase.from('subtask_templates').insert(
          template.subtasks.map((s, i) => ({
            task_template_id: newTemplate.id,
            title: s.title,
            description: s.description,
            points: s.points,
            sort_order: i
          }))
        );
      }

      toast({ title: "Duplicated", description: "Template duplicated successfully." });
      fetchTemplates(selectedPackageId);
    } catch (error) {
      console.error('Error duplicating:', error);
    }
  };

  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const totalPoints = templates.reduce((sum, t) => {
    const subtaskPoints = (t.subtasks || []).reduce((s, st) => s + st.points, 0);
    return sum + t.points + subtaskPoints;
  }, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Task Templates</h2>
            <p className="text-sm text-muted-foreground">Setup preset task workflows for each pricing package</p>
          </div>
        </div>
      </div>

      {/* Package Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedPackageId === pkg.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="font-medium text-sm truncate">{pkg.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ₹{pkg.discount_price?.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates for Selected Package */}
      {selectedPackage && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <CardTitle className="text-lg">{selectedPackage.name} — Task Templates</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {templates.length} task{templates.length !== 1 ? 's' : ''} • Total points: {totalPoints}
                </p>
              </div>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No task templates yet</p>
                <p className="text-sm">Create your first task template for this package</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {templates.map((template, idx) => (
                  <AccordionItem key={template.id} value={template.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <span className="text-muted-foreground text-sm font-mono w-6">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${!template.is_active ? 'line-through opacity-50' : ''}`}>
                              {template.title}
                            </span>
                            <Badge className={getPriorityColor(template.priority)} variant="secondary">
                              {template.priority}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Coins className="h-3 w-3" />
                              {template.points} pts
                            </Badge>
                            {template.estimated_days && (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {template.estimated_days}d
                              </Badge>
                            )}
                            {(template.subtasks?.length || 0) > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <ListChecks className="h-3 w-3" />
                                {template.subtasks?.length} subtask{template.subtasks!.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {!template.is_active && (
                              <Badge variant="destructive" className="text-xs">Disabled</Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pl-9">
                        {/* Subtasks */}
                        {template.subtasks && template.subtasks.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <ListChecks className="h-4 w-4" />
                              Subtasks
                            </h4>
                            <div className="space-y-2">
                              {template.subtasks.map((subtask, sIdx) => (
                                <div key={subtask.id || sIdx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                                  <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{subtask.title}</div>
                                    {subtask.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{subtask.description}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="gap-1 flex-shrink-0">
                                    <Coins className="h-3 w-3" />
                                    {subtask.points} pts
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(template)} className="gap-1">
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => duplicateTemplate(template)} className="gap-1">
                            <Copy className="h-3 w-3" /> Duplicate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleTemplateActive(template.id, template.is_active)}
                          >
                            {template.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                            onClick={() => {
                              setTemplateToDelete(template.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Task Template Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Task Template' : 'Create Task Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Title *</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Design Homepage Layout"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe what this task involves..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={taskForm.points}
                    onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    disabled={taskForm.trial_period}
                  />
                </div>
              </div>
              <div>
                <Label>Est. Days</Label>
                <Input
                  type="number"
                  value={taskForm.estimated_days}
                  onChange={(e) => setTaskForm({ ...taskForm, estimated_days: e.target.value })}
                  placeholder="e.g. 3"
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="trial"
                checked={taskForm.trial_period}
                onCheckedChange={(c) => setTaskForm({ ...taskForm, trial_period: c, points: c ? 0 : 10 })}
              />
              <Label htmlFor="trial" className="text-sm text-muted-foreground">Trial Period (no points)</Label>
            </div>

            {/* Subtasks Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Subtasks ({taskForm.subtasks.length})
                </h3>
                <Button type="button" size="sm" variant="outline" onClick={addSubtask} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Subtask
                </Button>
              </div>

              {taskForm.subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subtasks yet. Add subtasks to break down this task.
                </p>
              ) : (
                <div className="space-y-3">
                  {taskForm.subtasks.map((subtask, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Subtask {idx + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeSubtask(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_80px] gap-3">
                        <div>
                          <Input
                            placeholder="Subtask title"
                            value={subtask.title}
                            onChange={(e) => updateSubtask(idx, 'title', e.target.value)}
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Points"
                            value={subtask.points}
                            onChange={(e) => updateSubtask(idx, 'points', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                      <Textarea
                        placeholder="Subtask description (optional)"
                        value={subtask.description}
                        onChange={(e) => updateSubtask(idx, 'description', e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {taskForm.subtasks.length > 0 && (
                <div className="text-sm text-muted-foreground text-right">
                  Subtask points total: <strong>{taskForm.subtasks.reduce((s, st) => s + st.points, 0)}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  editingTemplate ? "Update Template" : "Create Template"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task template and all its subtasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskTemplateManagement;
