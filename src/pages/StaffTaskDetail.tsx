import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Target, Play, Coffee, CheckCircle, AlertCircle, FileText, Download, Award, MessageSquare, Upload, Send, X, Loader2, Eye, LayoutGrid, List, Coins } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'handover' | 'overdue' | 'pending_approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  points: number;
  assigned_by: string;
  created_at: string;
  trial_period?: boolean;
  comments?: any[];
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
  }>;
  assignedBy?: {
    full_name: string;
  };
  client_project_id?: string;
  current_stage?: number;
}

const StaffTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [viewingSubtask, setViewingSubtask] = useState<any>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  
  const [subtaskNotes, setSubtaskNotes] = useState("");
  const [subtaskFileURLs, setSubtaskFileURLs] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtaskFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, [taskId]);

  const fetchInitialData = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/staff/login");
        return;
      }

      const { data: profileData } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      const { data: taskData, error } = await supabase
        .from('staff_tasks')
        .select('*, due_time, trial_period, attachments, comments')
        .eq('id', taskId)
        .single();

      if (error || !taskData) {
        toast({ title: "Error", description: "Task not found", variant: "destructive" });
        navigate("/staff/dashboard");
        return;
      }

      // Fetch assigner info
      const { data: assignerData } = await supabase
        .from('staff_profiles')
        .select('full_name')
        .eq('user_id', taskData.assigned_by)
        .single();

      const formattedTask = {
        ...taskData,
        assignedBy: assignerData,
        attachments: taskData.attachments as any[] || [],
        comments: taskData.comments as any[] || []
      } as unknown as Task;

      setTask(formattedTask);
      setComments(formattedTask.comments || []);
      
      // Fetch subtasks
      fetchSubtasks(taskId, user.id);
      
      // Fetch project info if available
      if (taskData.client_project_id) {
        const { data: project } = await supabase
          .from('client_projects')
          .select('title, status')
          .eq('id', taskData.client_project_id)
          .single();
        setProjectInfo(project);
      }

    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubtasks = async (tId: string, uId: string) => {
    const { data } = await supabase
      .from('staff_subtasks')
      .select('*')
      .eq('task_id', tId)
      .eq('assigned_to', uId)
      .order('stage', { ascending: true });
    setSubtasks(data || []);
  };

  const handleSubtaskStart = async (subtaskId: string) => {
    if (!task) return;
    try {
      const { error } = await supabase
        .from('staff_subtasks')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() } as any)
        .eq('id', subtaskId);
      
      if (error) throw error;

      // Update parent task if needed
      if (task.status === 'pending') {
        await supabase
          .from('staff_tasks')
          .update({ 
            status: 'in_progress', 
            timer_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          } as any)
          .eq('id', task.id);
        
        setTask({ ...task, status: 'in_progress' });
      }

      toast({ title: "Started", description: "Subtask is now in progress" });
      fetchSubtasks(task.id, profile?.user_id);
      
      // Close dialog or update current viewing subtask
      if (viewingSubtask && viewingSubtask.id === subtaskId) {
        setViewingSubtask({ ...viewingSubtask, status: 'in_progress' });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to start subtask", variant: "destructive" });
    }
  };

  const handleSubtaskSubmit = async (subtaskId: string) => {
    if (!task || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const existingSubtask = subtasks.find(s => s.id === subtaskId);
      const existingComments = Array.isArray(existingSubtask?.comments) ? existingSubtask.comments : [];
      const existingAttachments = Array.isArray(existingSubtask?.attachments) ? existingSubtask.attachments : [];

      const newComment = subtaskNotes.trim() ? {
        user_id: profile?.user_id,
        user_name: profile?.full_name || 'Staff',
        message: subtaskNotes.trim(),
        timestamp: new Date().toISOString(),
        type: 'submission_note'
      } : null;

      const updatedComments = newComment ? [...existingComments, newComment] : existingComments;
      const updatedAttachments = [...existingAttachments, ...subtaskFileURLs];

      const { error } = await supabase
        .from('staff_subtasks')
        .update({
          status: 'pending_approval',
          comments: updatedComments as any,
          attachments: updatedAttachments as any,
          completed_at: new Date().toISOString()
        } as any)
        .eq('id', subtaskId);

      if (error) throw error;

      toast({ title: "Submitted", description: "Subtask sent for review" });
      setSubtaskNotes("");
      setSubtaskFileURLs([]);
      fetchSubtasks(task.id, profile?.user_id);
      setViewingSubtask(null);
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit subtask", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubtaskFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !task) return;
    
    setIsUploading(true);
    const newSubtaskFiles = [...subtaskFileURLs];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${task.id}/subtask_${Math.random()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) continue;
      newSubtaskFiles.push({ name: file.name, url: filePath, size: file.size, type: file.type });
    }

    setSubtaskFileURLs(newSubtaskFiles);
    setIsUploading(false);
  };

  const handleStatusUpdate = async (newStatus: Task['status']) => {
    if (!task) return;
    try {
      await supabase
        .from('staff_tasks')
        .update({ status: newStatus as any, updated_at: new Date().toISOString() })
        .eq('id', task.id);
      
      setTask({ ...task, status: newStatus });
      toast({ title: "Status Updated", description: `Task is now ${newStatus.replace('_', ' ')}` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newUploadedFiles = [...uploadedFiles];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${task?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: file.name, variant: "destructive" });
        continue;
      }

      newUploadedFiles.push({ name: file.name, url: filePath, size: file.size, type: file.type });
    }

    setUploadedFiles(newUploadedFiles);
    setIsUploading(false);
  };

  const handleSubmitForReview = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      const finalAttachments = [...(task.attachments || []), ...uploadedFiles];
      const { error } = await supabase
        .from('staff_tasks')
        .update({ 
          status: 'pending_approval', 
          attachments: finalAttachments as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: "Success", description: "Task submitted for review!" });
      handleStatusUpdate('pending_approval');
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit task", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !comment.trim()) return;
    const newComment = {
      user_id: profile?.user_id,
      user_name: profile?.full_name || 'Staff',
      text: comment,
      created_at: new Date().toISOString()
    };
    
    const updatedComments = [...comments, newComment];
    try {
      await supabase
        .from('staff_tasks')
        .update({ comments: updatedComments as any })
        .eq('id', task.id);
      
      setComments(updatedComments);
      setComment("");
    } catch (err) {
      toast({ title: "Error", description: "Failed to add comment" });
    }
  };

  const handleDownloadAttachment = async (att: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(att.url);
      if (error) throw error;
      
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', att.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Loading task details...</p>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-10">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate tracking-tight">{task.title}</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Task Details</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md", 
             task.priority === 'urgent' ? "bg-red-500/20 text-red-400 border-red-500/20" :
             task.priority === 'high' ? "bg-orange-500/20 text-orange-400 border-orange-500/20" :
             "bg-blue-500/20 text-blue-400 border-blue-500/20"
           )}>
             {task.priority}
           </Badge>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          
          {/* Status & Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex flex-col items-center justify-center text-center">
              <Badge variant="outline" className={cn("mb-2 uppercase text-[9px] font-black px-3", 
                task.status === 'completed' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                task.status === 'overdue' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-blue-500/10 text-blue-400 border-blue-500/20"
              )}>
                {task.status.replace('_', ' ')}
              </Badge>
              <p className="text-[10px] text-white/40 uppercase tracking-tighter">Current Status</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-black text-emerald-400">{task.points}</span>
              </div>
              <p className="text-[10px] text-emerald-400/60 uppercase tracking-tighter">Task Rewards</p>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <section className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-blue-400" /> Description
              </h3>
              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-medium">
                {task.description}
              </div>
            </section>
          )}

          {/* Subtasks Workflow */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                <List className="w-3.5 h-3.5 text-purple-400" /> Workflow
              </h3>
              <span className="text-[10px] font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-full">
                {subtasks.filter(s => s.status === 'completed').length}/{subtasks.length} Done
              </span>
            </div>
            
            <div className="space-y-3">
              {subtasks.map((st, idx) => {
                const isAssignedToMe = st.assigned_to === profile?.user_id;
                const stage = st.stage || 1;
                const isLocked = subtasks.some(other => (other.stage || 1) < stage && other.status !== 'completed');
                
                return (
                  <div 
                    key={st.id} 
                    className={cn(
                      "bg-white/[0.03] border rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300",
                      isLocked ? "opacity-40 grayscale border-white/5" : "border-white/10 hover:bg-white/[0.05]",
                      st.status === 'completed' ? "border-green-500/20 bg-green-500/[0.02]" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border flex-shrink-0", 
                        st.status === 'completed' ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                        st.status === 'in_progress' ? "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse" :
                        "bg-white/5 text-white/40 border-white/10"
                      )}>
                        {st.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={cn("text-sm font-bold truncate", st.status === 'completed' ? "text-white/40 line-through" : "text-white/90")}>
                            {st.title}
                          </h4>
                          {isLocked && <AlertCircle className="w-3 h-3 text-white/20" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0 border-purple-500/30 text-purple-400">
                            Stage {stage}
                          </Badge>
                          <span className="text-[9px] font-bold text-white/20">•</span>
                          <span className={cn("text-[9px] font-black uppercase tracking-tighter", isAssignedToMe ? "text-emerald-400" : "text-white/20")}>
                            {isAssignedToMe ? "Assigned to You" : "Assigned to Others"}
                          </span>
                        </div>
                      </div>

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 flex-shrink-0" onClick={() => setViewingSubtask(st)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Bottom Action / Info Bar */}
                    {!isLocked && (st.status === 'pending' || st.status === 'in_progress' || st.due_date) && (
                      <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/[0.03]">
                        <div className="flex flex-col gap-1">
                          {st.due_date && (
                            <div className="flex items-center gap-1.5 text-orange-400/60">
                              <Calendar className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {format(new Date(st.due_date), 'MMM dd')} {st.due_time || ''}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {st.status === 'pending' && isAssignedToMe && (
                            <Button 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); handleSubtaskStart(st.id); }} 
                              className="h-8 bg-blue-500 hover:bg-blue-600 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl"
                            >
                              <Play className="w-3 h-3 mr-1.5" /> Start
                            </Button>
                          )}
                          {st.status === 'in_progress' && isAssignedToMe && (
                            <Button 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); setViewingSubtask(st); }} 
                              className="h-8 bg-purple-500 hover:bg-purple-600 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl"
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Attachments Section */}
          {(task.attachments?.length || 0) > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Attachments
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {task.attachments?.map((att, i) => {
                  const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
                  return (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
                      <div className="aspect-square rounded-xl bg-black/40 flex items-center justify-center overflow-hidden border border-white/5">
                        {isImg ? (
                          <img 
                            src={att.url.startsWith('http') ? att.url : supabase.storage.from('task-attachments').getPublicUrl(att.url).data.publicUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onClick={() => setPreviewAttachment(att)}
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-white/20" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] font-bold text-white/60 truncate flex-1">{att.name}</p>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-400" onClick={() => handleDownloadAttachment(att)}>
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Comments Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" /> Comments
            </h3>
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase">{c.user_name}</span>
                    <span className="text-[8px] text-white/20">{format(new Date(c.created_at || c.timestamp), 'MMM dd, HH:mm')}</span>
                  </div>
                  <p className="text-sm text-white/70 font-medium leading-snug">{c.text || c.message}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Add a note..." 
                  className="bg-white/5 border-white/10 rounded-xl text-sm h-10"
                />
                <Button onClick={handleAddComment} size="icon" className="h-10 w-10 bg-blue-500 rounded-xl" disabled={!comment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* Submit Action - ONLY FOR TEAM HEADS */}
          {task.status === 'in_progress' && profile?.role === 'team_head' && (
            <section className="pt-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 rounded-[2rem] p-6 text-center">
                <h3 className="text-lg font-black text-blue-400 mb-1">Submit Your Work</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">Ready for review?</p>
                
                <div className="space-y-4">
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-dashed border-white/20 h-12 rounded-2xl text-white/60" disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Final Deliverables
                  </Button>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {uploadedFiles.map((f, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/5 text-[10px] py-1 px-3">{f.name}</Badge>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleSubmitForReview} className="w-full bg-blue-500 hover:bg-blue-600 text-white h-14 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 uppercase tracking-widest" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    Send to Team Head
                  </Button>
                </div>
              </div>
            </section>
          )}

        </div>
      </ScrollArea>

      {/* Subtask Details Modal */}
      <Dialog open={!!viewingSubtask} onOpenChange={open => !open && setViewingSubtask(null)}>
        <DialogContent className="max-w-[90vw] rounded-3xl bg-slate-900 border-white/10 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              {viewingSubtask?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
             <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 uppercase font-black">
                  Stage {viewingSubtask?.stage || 1}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 uppercase font-black">
                  {viewingSubtask?.points || 0} COINS
                </Badge>
             </div>
             {viewingSubtask?.description && (
               <div className="bg-white/5 rounded-2xl p-4">
                 <p className="text-sm text-white/70 leading-relaxed">{viewingSubtask.description}</p>
               </div>
             )}

             <Separator className="bg-white/5" />

             {/* Subtask Action Section */}
             <div className="space-y-4">
               {viewingSubtask?.status === 'pending' && (
                 <Button 
                   onClick={() => handleSubtaskStart(viewingSubtask.id)} 
                   className="w-full bg-blue-500 hover:bg-blue-600 h-12 rounded-2xl font-black uppercase tracking-widest text-xs"
                 >
                   <Play className="w-4 h-4 mr-2" /> Start Subtask
                 </Button>
               )}

               {viewingSubtask?.status === 'in_progress' && (
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Submission Notes</Label>
                     <Textarea 
                       value={subtaskNotes}
                       onChange={e => setSubtaskNotes(e.target.value)}
                       placeholder="What have you completed? Any notes for review..."
                       className="bg-white/5 border-white/10 rounded-2xl text-sm min-h-[100px] focus:ring-blue-500/20"
                     />
                   </div>

                   <div className="space-y-3">
                      <input ref={subtaskFileInputRef} type="file" multiple onChange={handleSubtaskFileUpload} className="hidden" />
                      <Button 
                        variant="outline" 
                        onClick={() => subtaskFileInputRef.current?.click()} 
                        className="w-full border-dashed border-white/10 h-12 rounded-2xl text-white/40 hover:text-white"
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Add Deliverables
                      </Button>

                      {subtaskFileURLs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {subtaskFileURLs.map((f, i) => (
                            <Badge key={i} variant="secondary" className="bg-white/5 text-[9px] py-1">{f.name}</Badge>
                          ))}
                        </div>
                      )}

                      <Button 
                        onClick={() => handleSubtaskSubmit(viewingSubtask.id)} 
                        className="w-full bg-purple-500 hover:bg-purple-600 h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/10"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                        Submit for Review
                      </Button>
                   </div>
                 </div>
               )}

               {viewingSubtask?.status === 'pending_approval' && (
                 <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
                   <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                   <p className="text-sm font-bold text-orange-400">Waiting for Review</p>
                   <p className="text-[10px] text-orange-400/60 uppercase tracking-widest mt-1">Team head is checking your work</p>
                 </div>
               )}

               {viewingSubtask?.status === 'completed' && (
                 <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                   <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                   <p className="text-sm font-bold text-green-400">Subtask Completed</p>
                   <p className="text-[10px] text-green-400/60 uppercase tracking-widest mt-1">Points rewarded to your balance</p>
                 </div>
               )}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-screen h-screen bg-black/95 border-none p-0 flex items-center justify-center z-[100]">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white/60 z-[110]" onClick={() => setPreviewAttachment(null)}>
            <X className="w-6 h-6" />
          </Button>
          {previewAttachment && (
            <img 
              src={previewAttachment.url.startsWith('http') ? previewAttachment.url : supabase.storage.from('task-attachments').getPublicUrl(previewAttachment.url).data.publicUrl} 
              alt="" 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTaskDetail;
