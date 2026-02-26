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
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  LayoutTemplate, Plus, Edit, Trash2, Package, ListChecks, GripVertical,
  Flag, Coins, Clock, Loader2, ChevronRight, Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface SubtaskTemplate {
  id?: string;
  frontEndId?: string;
  title: string;
  description: string;
  points: number;
  sort_order: number;
  // Stage number (1-based). Subtasks in the same stage can run in parallel.
  stage?: number;
  stage_label?: string | null;
  stage_color?: string | null;
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

const STAGE_COLORS = ['#4f46e5', '#16a34a', '#f97316', '#06b6d4', '#ec4899'];

const getDefaultStageColor = (stage: number) =>
  STAGE_COLORS[(Math.max(stage, 1) - 1) % STAGE_COLORS.length];

const TaskTemplateManagement = () => {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<TaskTemplate | null>(null);
  const [duplicateTargetPackageId, setDuplicateTargetPackageId] = useState<string>("");
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

  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>([]);

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
      const { data: subtaskDataRaw, error: subErr } = await supabase
        .from('subtask_templates')
        .select('*')
        .in('task_template_id', taskIds);

      if (subErr) throw subErr;

      // Ensure deterministic ordering: stage ASC, then sort_order ASC
      const subtaskData = (subtaskDataRaw || []).sort((a: any, b: any) => {
        const sa = a.stage || 1;
        const sb = b.stage || 1;
        if (sa !== sb) return sa - sb;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });

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
      subtasks: (template.subtasks || []).map(s => {
        const stage = s.stage ?? 1;
        return {
          ...s,
          stage,
          stage_label: s.stage_label ?? `Stage ${stage}`,
          stage_color: s.stage_color ?? getDefaultStageColor(stage),
          frontEndId: s.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `${stage}-${Math.random()}`)
        };
      })
    });
    setIsTaskDialogOpen(true);
  };

  const addSubtask = () => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: (() => {
        const last = prev.subtasks[prev.subtasks.length - 1];
        const stage = last ? (last.stage || 1) : 1;
        const label = last?.stage_label ?? `Stage ${stage}`;
        const color = last?.stage_color ?? getDefaultStageColor(stage);
        return [
          ...prev.subtasks,
          {
            frontEndId: typeof crypto !== 'undefined' ? crypto.randomUUID() : `${stage}-${Math.random()}`,
            title: "",
            description: "",
            points: 5,
            sort_order: prev.subtasks.length,
            stage,
            stage_label: label,
            stage_color: color,
            isNew: true
          }
        ];
      })()
    }));
  };

  const addStage = () => {
    setTaskForm(prev => {
      const currentMaxStage = prev.subtasks.reduce(
        (max, s) => Math.max(max, s.stage || 1),
        0
      );
      const nextStage = currentMaxStage + 1 || 1;
      const color = getDefaultStageColor(nextStage);
      const label = `Stage ${nextStage}`;
      return {
        ...prev,
        subtasks: [
          ...prev.subtasks,
          {
            frontEndId:
              typeof crypto !== 'undefined'
                ? crypto.randomUUID()
                : `${nextStage}-${Math.random()}`,
            title: "",
            description: "",
            points: 5,
            sort_order: prev.subtasks.length,
            stage: nextStage,
            stage_label: label,
            stage_color: color,
            isNew: true
          }
        ]
      };
    });
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    // We only support reordering within the raw array since the user still sees
    // a single list but visually grouped by stages. A more complex DND could update the stage, 
    // but right now we just reorder the underlying array elements.
    setTaskForm(prev => {
      // Sort by stage + sort_order to get the visual list
      const sortedItems = [...prev.subtasks].sort((a, b) => {
        const sa = a.stage || 1;
        const sb = b.stage || 1;
        if (sa !== sb) return sa - sb;
        return a.sort_order - b.sort_order;
      });

      const [moved] = sortedItems.splice(startIndex, 1);
      sortedItems.splice(endIndex, 0, moved);

      // Determine new stage for the moved item based on its neighbors in the visual list
      let targetStage = moved.stage || 1;
      const neighborBefore = sortedItems[endIndex - 1];
      const neighborAfter = sortedItems[endIndex + 1];
      if (neighborBefore) {
        targetStage = neighborBefore.stage || 1;
      } else if (neighborAfter) {
        targetStage = neighborAfter.stage || 1;
      }

      const stageLabel = moved.stage_label ?? `Stage ${targetStage}`;
      const stageColor = moved.stage_color ?? getDefaultStageColor(targetStage);

      // Re-assign sort_order and apply new stage/stage meta to the moved item
      const updatedVisual = sortedItems.map((item, index) => {
        if (item.frontEndId === moved.frontEndId) {
          return {
            ...item,
            sort_order: index,
            stage: targetStage,
            stage_label: stageLabel,
            stage_color: stageColor,
          };
        }
        return { ...item, sort_order: index };
      });

      return { ...prev, subtasks: updatedVisual };
    });
  };

  // Group subtasks by stage for rendering
  const subtasksByStage = taskForm.subtasks.reduce((acc, subtask) => {
    const s = subtask.stage || 1;
    if (!acc[s]) acc[s] = [];
    acc[s].push(subtask);
    return acc;
  }, {} as Record<number, SubtaskTemplate[]>);

  const sortedStages = Object.keys(subtasksByStage)
    .map(Number)
    .sort((a, b) => a - b);

  // Visual list helper and raw index lookup
  const getSortedSubtasksArray = () =>
    [...taskForm.subtasks].sort((a, b) => {
      const sa = a.stage || 1;
      const sb = b.stage || 1;
      if (sa !== sb) return sa - sb;
      return a.sort_order - b.sort_order;
    });

  const getRawIndex = (subtask: SubtaskTemplate): number =>
    taskForm.subtasks.findIndex((s) => s.frontEndId === subtask.frontEndId);

  const handleBulkStageChange = (targetStage: number) => {
    if (!targetStage || selectedSubtaskIds.length === 0) return;
    const label = `Stage ${targetStage}`;
    const color = getDefaultStageColor(targetStage);
    setTaskForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.frontEndId && selectedSubtaskIds.includes(st.frontEndId)
          ? {
              ...st,
              stage: targetStage,
              stage_label: st.stage_label ?? label,
              stage_color: st.stage_color ?? color,
            }
          : st
      ),
    }));
    setSelectedSubtaskIds([]);
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
            sort_order: i,
            stage: s.stage ?? 1,
            stage_label: s.stage_label ?? null,
            stage_color: s.stage_color ?? null
          }));

          const { error: subError } = await supabase
            .from('subtask_templates')
            .insert(subtasksToInsert);

          if (subError) {
            console.warn("Insert with stage failed, retrying without stage", subError);
            const fallbackSubtasks = subtasksToInsert.map(({ stage, ...rest }) => rest);
            const { error: retryError } = await supabase.from('subtask_templates').insert(fallbackSubtasks);
            if (retryError) throw retryError;
          }
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
            sort_order: i,
            stage: s.stage ?? 1,
            stage_label: s.stage_label ?? null,
            stage_color: s.stage_color ?? null
          }));

          const { error: subError } = await supabase
            .from('subtask_templates')
            .insert(subtasksToInsert);

          if (subError) {
            console.warn("Insert with stage failed, retrying without stage", subError);
            const fallbackSubtasks = subtasksToInsert.map(({ stage, ...rest }) => rest);
            const { error: retryError } = await supabase.from('subtask_templates').insert(fallbackSubtasks);
            if (retryError) throw retryError;
          }
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

  const duplicateTemplate = async (template: TaskTemplate, targetPackageId: string) => {
    try {
      const { data: newTemplate, error } = await supabase
        .from('task_templates')
        .insert({
          package_id: targetPackageId || template.package_id,
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
        const subtasksToInsert = template.subtasks.map((s, i) => ({
          task_template_id: newTemplate.id,
          title: s.title,
          description: s.description,
          points: s.points,
          sort_order: i,
          stage: s.stage ?? 1
        }));

        const { error: subError } = await supabase.from('subtask_templates').insert(subtasksToInsert);

        if (subError) {
          console.warn("Duplicate with stage failed, retrying without stage", subError);
          const fallbackSubtasks = subtasksToInsert.map(({ stage, ...rest }) => rest);
          await supabase.from('subtask_templates').insert(fallbackSubtasks);
        }
      }

      toast({ title: "Duplicated", description: "Template duplicated successfully." });
      // After duplication, keep the current package filter unchanged
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
                className={`p-3 rounded-lg border-2 text-left transition-all ${selectedPackageId === pkg.id
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
                              Subtasks & Stages
                            </h4>
                            <div className="space-y-2">
                              {template.subtasks.map((subtask, sIdx) => {
                                const stage = (subtask as any).stage || 1;
                                const stageLabel =
                                  (subtask as any).stage_label || `Stage ${stage}`;
                                const stageColor =
                                  (subtask as any).stage_color ||
                                  getDefaultStageColor(stage);

                                return (
                                  <div
                                    key={subtask.id || sIdx}
                                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/40"
                                  >
                                    <div
                                      className="mt-0.5 w-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: stageColor }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <div>
                                          <div className="font-medium text-sm">
                                            {subtask.title}
                                          </div>
                                          {subtask.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {subtask.description}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                          <Badge
                                            variant="secondary"
                                            className="gap-1 text-[11px]"
                                            style={{
                                              backgroundColor: stageColor,
                                              color: "#0f172a",
                                            }}
                                          >
                                            {stageLabel}
                                          </Badge>
                                          <Badge variant="outline" className="gap-1 text-[11px]">
                                            <Coins className="h-3 w-3" />
                                            {subtask.points} pts
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(template)} className="gap-1">
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTemplateToDuplicate(template);
                              setDuplicateTargetPackageId(template.package_id || selectedPackageId);
                              setIsDuplicateDialogOpen(true);
                            }}
                            className="gap-1"
                          >
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
                <div className="flex items-center gap-3">
                  {selectedSubtaskIds.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedSubtaskIds.length} selected</span>
                      <Select
                        onValueChange={(value) => {
                          if (value === "new") {
                            const maxStage =
                              sortedStages.length > 0
                                ? sortedStages[sortedStages.length - 1]
                                : 0;
                            handleBulkStageChange(maxStage + 1);
                          } else {
                            handleBulkStageChange(parseInt(value, 10));
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue placeholder="Move to stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedStages.map((s) => (
                            <SelectItem key={s} value={String(s)} className="text-xs">
                              Stage {s}
                            </SelectItem>
                          ))}
                          <SelectItem value="new" className="text-xs">
                            New Stage
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={addStage} className="gap-1">
                      <Plus className="h-3 w-3" /> Add Stage
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={addSubtask} className="gap-1">
                      <Plus className="h-3 w-3" /> Add Subtask
                    </Button>
                  </div>
                </div>
              </div>

              {taskForm.subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No subtasks yet. Add subtasks to break down this task.
                </p>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="subtasks-list">
                    {(provided) => (
                      <div className="space-y-6" {...provided.droppableProps} ref={provided.innerRef}>

                        {sortedStages.map((stageNum, stageIndex) => {
                          const stageSubtasks = subtasksByStage[stageNum];
                          const sample = stageSubtasks[0];
                          const stageLabel = sample?.stage_label || `Stage ${stageNum}`;
                          const stageColor = sample?.stage_color || getDefaultStageColor(stageNum);

                          return (
                            <div
                              key={`stage-${stageNum}`}
                              className="space-y-3 p-4 rounded-xl border"
                              style={{
                                borderColor: stageColor,
                                background:
                                  'linear-gradient(to right, ' +
                                  stageColor +
                                  '22, transparent 40%)'
                              }}
                            >
                              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/10">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                                  style={{ backgroundColor: stageColor, color: '#0f172a' }}
                                >
                                  {stageNum}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <Input
                                    className="h-8 text-sm"
                                    value={stageLabel}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setTaskForm(prev => ({
                                        ...prev,
                                        subtasks: prev.subtasks.map(st =>
                                          (st.stage || 1) === stageNum
                                            ? { ...st, stage_label: value }
                                            : st
                                        )
                                      }));
                                    }}
                                  />
                                  <input
                                    type="color"
                                    className="w-10 h-8 rounded cursor-pointer border border-white/20 bg-transparent"
                                    value={stageColor}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setTaskForm(prev => ({
                                        ...prev,
                                        subtasks: prev.subtasks.map(st =>
                                          (st.stage || 1) === stageNum
                                            ? { ...st, stage_color: value }
                                            : st
                                        )
                                      }));
                                    }}
                                  />
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    {stageSubtasks.length} task{stageSubtasks.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>

                              {stageSubtasks.map((subtask) => {
                                const rawIdx = getRawIndex(subtask);
                                const visualIdx = getSortedSubtasksArray().findIndex(s => s.frontEndId === subtask.frontEndId);

                                return (
                                  <Draggable key={subtask.frontEndId} draggableId={subtask.frontEndId as string} index={visualIdx}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`border rounded-lg p-3 space-y-3 bg-card ${snapshot.isDragging ? 'shadow-lg opacity-90 border-primary' : 'hover:border-primary/40'}`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-3">
                                            <Checkbox
                                              className="h-4 w-4"
                                              checked={
                                                !!subtask.frontEndId &&
                                                selectedSubtaskIds.includes(subtask.frontEndId as string)
                                              }
                                              onCheckedChange={(checked) => {
                                                if (!subtask.frontEndId) return;
                                                setSelectedSubtaskIds((prev) =>
                                                  checked
                                                    ? [...prev, subtask.frontEndId as string]
                                                    : prev.filter((id) => id !== subtask.frontEndId)
                                                );
                                              }}
                                            />
                                            <div className="flex items-center gap-2">
                                              <div
                                                {...provided.dragHandleProps}
                                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                              >
                                                <GripVertical className="h-4 w-4" />
                                              </div>
                                              <span className="text-sm font-medium text-muted-foreground">Subtask</span>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                            onClick={() => removeSubtask(rawIdx)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_80px] gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Title</Label>
                                            <Input
                                              placeholder="Subtask title"
                                              value={subtask.title}
                                              onChange={(e) => updateSubtask(rawIdx, 'title', e.target.value)}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Points</Label>
                                            <Input
                                              type="number"
                                              placeholder="Points"
                                              value={subtask.points}
                                              onChange={(e) => updateSubtask(rawIdx, 'points', parseInt(e.target.value) || 0)}
                                              min="0"
                                            />
                                          </div>
                                        </div>
                                        <Textarea
                                          placeholder="Subtask description (optional)"
                                          value={subtask.description}
                                          onChange={(e) => updateSubtask(rawIdx, 'description', e.target.value)}
                                          rows={2}
                                          className="text-sm"
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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

      {/* Duplicate Template – choose target package */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Task Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which package you want to copy{" "}
              <span className="font-medium">
                {templateToDuplicate?.title}
              </span>{" "}
              into.
            </p>
            <div>
              <Label className="text-xs text-muted-foreground">Target Package</Label>
              <Select
                value={duplicateTargetPackageId}
                onValueChange={setDuplicateTargetPackageId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDuplicateDialogOpen(false);
                  setTemplateToDuplicate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!templateToDuplicate || !duplicateTargetPackageId) return;
                  await duplicateTemplate(templateToDuplicate, duplicateTargetPackageId);
                  setIsDuplicateDialogOpen(false);
                  setTemplateToDuplicate(null);
                }}
              >
                Duplicate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskTemplateManagement;
