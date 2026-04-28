import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Star, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

const ClientFeedback = () => {
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});

  useEffect(() => {
    if (token) fetchForm();
  }, [token]);

  const fetchForm = async () => {
    try {
      const { data, error } = await supabase
        .from('task_feedback_forms' as any)
        .select('*, staff_tasks(title, description, client_id, clients(company_name))')
        .eq('token', token)
        .single();

      if (error || !data) throw new Error("Invalid or expired feedback link.");
      setForm(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required questions
    const missing = form.questions.filter((q: any) => q.required && !responses[q.id]);
    if (missing.length > 0) {
      toast.error(`Please answer all required questions: ${missing.map((m: any) => m.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('task_feedback_responses' as any)
        .insert({
          form_id: form.id,
          responses: responses,
          client_info: {
             company: (form as any).staff_tasks?.clients?.company_name || 'Unknown Client',
             task_title: (form as any).staff_tasks?.title
          }
        });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Feedback submitted successfully!");
    } catch (e: any) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <Card className="max-w-md w-full bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive text-lg font-medium">Invalid Link</p>
            <p className="text-muted-foreground mt-2 text-sm">This feedback link is no longer valid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <Card className="max-w-md w-full bg-black/40 border-white/10 backdrop-blur-xl text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2 px-6">
            <h2 className="text-2xl font-bold text-white">Thank You!</h2>
            <p className="text-muted-foreground text-sm">
              Your feedback is invaluable to us. We appreciate you taking the time to help us improve our services.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <SEO title={`Feedback: ${form.staff_tasks?.title}`} description="Tell us about your experience." />
      
      <div className="max-w-xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-muted-foreground uppercase tracking-widest">
            Client Experience
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Share Your Thoughts</h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Regarding: <span className="text-primary font-medium">{form.staff_tasks?.title}</span>
          </p>
        </div>

        <Card className="bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden border-t-primary/20">
          <CardContent className="p-8 space-y-8">
            {form.questions.map((q: any, idx: number) => (
              <div key={q.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <Label className="text-base font-semibold text-white flex items-center gap-2">
                  {q.label}
                  {q.required && <span className="text-red-500 text-sm">*</span>}
                </Label>

                {q.type === 'star' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating({ ...hoverRating, [q.id]: star })}
                        onMouseLeave={() => setHoverRating({ ...hoverRating, [q.id]: 0 })}
                        onClick={() => setResponses({ ...responses, [q.id]: star })}
                        className="transition-all duration-200 hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8",
                            (hoverRating[q.id] || responses[q.id] || 0) >= star
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-white/10"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'short' && (
                  <Input
                    placeholder="Type your answer here..."
                    className="bg-white/5 border-white/10 h-12 focus:border-primary/50 transition-all text-white placeholder:text-white/20"
                    value={responses[q.id] || ""}
                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                  />
                )}

                {q.type === 'long' && (
                  <Textarea
                    placeholder="Tell us more about your experience..."
                    className="bg-white/5 border-white/10 min-h-[120px] focus:border-primary/50 transition-all text-white placeholder:text-white/20 resize-none"
                    value={responses[q.id] || ""}
                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <Button 
              size="lg" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg group transition-all"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              )}
              {submitting ? "Sending..." : "Submit Feedback"}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-tighter opacity-50">
              Powered by VAW Technologies Service Quality Assurance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientFeedback;
