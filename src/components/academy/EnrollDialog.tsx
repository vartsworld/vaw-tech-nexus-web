import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  courseFee?: string;
}

export default function EnrollDialog({ open, onOpenChange, courseTitle, courseFee }: EnrollDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const newEnquiry = {
      id: "enq_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      course_title: courseTitle,
      course_fee: courseFee || null,
      message: form.message || null,
      status: "new",
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await (supabase as any).from("academy_enquiries").insert(newEnquiry);
      if (error) {
        console.warn("Saving enquiry to local backup storage:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase enquiry insert failed, storing locally:", err?.message);
    } finally {
      // Always persist in local storage backup so admissions team has it
      try {
        const stored = JSON.parse(localStorage.getItem("vaw_academy_enquiries_local") || "[]");
        localStorage.setItem("vaw_academy_enquiries_local", JSON.stringify([newEnquiry, ...stored]));
      } catch (e) {
        console.warn("LocalStorage save error:", e);
      }

      toast({
        title: "Enrollment received!",
        description: "Our team will contact you shortly.",
      });
      setForm({ full_name: "", email: "", phone: "", message: "" });
      onOpenChange(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/15">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">VAW Academy</Badge>
          </div>
          <DialogTitle className="text-xl">Enroll in {courseTitle}</DialogTitle>
          <DialogDescription>
            {courseFee ? `Fee: ${courseFee}. ` : ""}Fill the form and our admissions team will get in touch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name <span className="text-red-500">*</span></Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea id="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Anything you'd like us to know?" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Enrollment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
