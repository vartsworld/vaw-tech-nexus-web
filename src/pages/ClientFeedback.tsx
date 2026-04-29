import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, Star, Send, ArrowRight, ArrowLeft, Heart, MessageSquare, Briefcase, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const ClientFeedback = () => {
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState(-1); // -1: Welcome, 0+: Questions, N: Consent
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (token) fetchForm();
  }, [token]);

  const fetchForm = async () => {
    try {
      const { data, error } = await supabase
        .from('task_feedback_forms' as any)
        .select('*, staff_tasks(title, description, client_id, clients(company_name, full_name))')
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

  // Group questions into phases (distribute them into 3 logical groups)
  const getGroupedQuestions = () => {
    if (!form?.questions) return [];
    const qs = form.questions;
    const chunkSize = Math.ceil(qs.length / 3) || 1;
    return [
      qs.slice(0, chunkSize),
      qs.slice(chunkSize, chunkSize * 2),
      qs.slice(chunkSize * 2)
    ].filter(g => g.length > 0);
  };

  const questionGroups = getGroupedQuestions();
  const totalSteps = questionGroups.length + 1; // +1 for Consent page

  const handleNext = () => {
    // Validate current step questions
    if (currentStep >= 0 && currentStep < questionGroups.length) {
      const currentQs = questionGroups[currentStep];
      const missing = currentQs.filter((q: any) => q.required && !responses[q.id]);
      if (missing.length > 0) {
        toast.error(`Please answer required questions: ${missing.map((m: any) => m.label).join(', ')}`);
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('task_feedback_responses' as any)
        .insert({
          form_id: form.id,
          responses: { ...responses, testimonial_consent: consent },
          client_info: {
             company: (form as any).staff_tasks?.clients?.company_name || 'Unknown Client',
             client_name: (form as any).staff_tasks?.clients?.full_name || 'Valued Client',
             task_title: (form as any).staff_tasks?.title
          }
        });

      if (error) throw error;
      setSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#2dd4bf', '#ffffff']
      });
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

  const clientName = (form as any).staff_tasks?.clients?.full_name || 'Valued Client';
  const taskTitle = (form as any).staff_tasks?.title;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 py-12 relative z-10"
        >
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-white">Thank You, {clientName}!</h2>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">
              Your feedback is our greatest asset. We've received your thoughts on <span className="text-white font-bold">{taskTitle}</span>.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground opacity-50 pt-8">
            VAW Technologies · Service Quality Assurance
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 relative overflow-hidden selection:bg-primary/30">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />

      <SEO title={`Feedback: ${taskTitle}`} description="Share your experience with VAW Technologies." />
      
      <div className="max-w-xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP -1: WELCOME PAGE */}
          {currentStep === -1 && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Heart className="h-10 w-10 text-primary fill-primary/20" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Hello, {clientName}!</h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                  We recently completed <span className="text-primary font-bold">"{taskTitle}"</span> for you. We'd love to hear how we did!
                </p>
              </div>

              <Card className="bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden border-t-primary/20">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 3 quick phases to help us improve
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Helps us deliver better quality
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Takes less than 2 minutes
                    </p>
                  </div>
                  <Button size="lg" className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg group rounded-2xl" onClick={() => setCurrentStep(0)}>
                    Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* QUESTION STEPS */}
          {currentStep >= 0 && currentStep < questionGroups.length && (
            <motion.div 
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Phase {currentStep + 1} of {totalSteps}</p>
                  <p className="text-xs text-muted-foreground font-medium">Progress: {Math.round(((currentStep + 1) / totalSteps) * 100)}%</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    initial={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              <Card className="bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl border-t-primary/20">
                <CardContent className="p-8 space-y-10">
                  {questionGroups[currentStep].map((q: any) => (
                    <div key={q.id} className="space-y-5">
                      <Label className="text-xl font-bold text-white leading-tight flex gap-2">
                        {q.label}
                        {q.required && <span className="text-primary text-sm">*</span>}
                      </Label>

                      {q.type === 'star' && (
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onMouseEnter={() => setHoverRating({ ...hoverRating, [q.id]: star })}
                              onMouseLeave={() => setHoverRating({ ...hoverRating, [q.id]: 0 })}
                              onClick={() => setResponses({ ...responses, [q.id]: star })}
                              className="transition-all duration-300 hover:scale-125 focus:outline-none p-1"
                            >
                              <Star
                                className={cn(
                                  "h-10 w-10 transition-all",
                                  (hoverRating[q.id] || responses[q.id] || 0) >= star
                                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                                    : "text-white/5"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'short' && (
                        <Input
                          placeholder="Type your answer here..."
                          className="bg-white/5 border-white/10 h-14 focus:border-primary/50 transition-all text-white placeholder:text-white/20 text-lg px-6 rounded-2xl"
                          value={responses[q.id] || ""}
                          onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                        />
                      )}

                      {q.type === 'long' && (
                        <Textarea
                          placeholder="Tell us more about your experience..."
                          className="bg-white/5 border-white/10 min-h-[160px] focus:border-primary/50 transition-all text-white placeholder:text-white/20 resize-none text-lg p-6 rounded-2xl"
                          value={responses[q.id] || ""}
                          onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="h-14 w-20 border-white/10 hover:bg-white/5 rounded-2xl" onClick={handleBack}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button size="lg" className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg group rounded-2xl" onClick={handleNext}>
                      Continue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* FINAL STEP: CONSENT & SUBMISSION */}
          {currentStep === questionGroups.length && (
            <motion.div 
              key="consent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white">Almost there!</h2>
                <p className="text-muted-foreground">Final confirmation before submitting.</p>
              </div>

              <Card className="bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl border-t-primary/20">
                <CardContent className="p-8 space-y-8">
                  <div className="p-8 rounded-2xl bg-primary/5 border border-primary/10 space-y-6">
                    <div className="flex items-start space-x-4">
                      <Checkbox 
                        id="consent" 
                        checked={consent} 
                        onCheckedChange={(checked) => setConsent(checked as boolean)}
                        className="mt-1.5 border-primary/50 h-6 w-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <div className="grid gap-2 leading-relaxed">
                        <label htmlFor="consent" className="text-lg font-bold text-white cursor-pointer select-none">
                          Testimonial Consent
                        </label>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          I grant VAW Technologies the right to use my feedback and name as a testimonial on their website, marketing materials, or social media. I acknowledge that I am providing this information voluntarily.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="h-14 w-20 border-white/10 hover:bg-white/5 rounded-2xl" onClick={handleBack}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg group shadow-[0_0_30px_rgba(59,130,246,0.3)] rounded-2xl" 
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      )}
                      {submitting ? "Sending..." : "Submit My Feedback"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-30 mt-12 font-medium">
          VAW Technologies · Powered by Excellence
        </p>
      </div>
    </div>
  );
};

export default ClientFeedback;
