import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Share2, Target, PenTool, Mail, ArrowRight, Sparkles } from "lucide-react";
import digitalMarketingPoster from "@/assets/digital-marketing-internship-poster.png";

// Define the form schema with Zod
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email").max(255),
  phone: z.string().min(10, "Please enter a valid phone number").max(15),
  collegeName: z.string().min(2, "College name is required").max(200),
  course: z.string().min(2, "Course is required").max(100),
  graduationYear: z.string().min(4, "Graduation year is required").max(4),
  specialization: z.array(z.string()).min(1, "Please select at least one specialization"),
  currentKnowledge: z.string().min(20, "Please describe what you currently know (min. 20 characters)").max(500),
  learningGoals: z.string().min(20, "Please describe what you want to learn (min. 20 characters)").max(500),
  portfolio: z.string().optional(),
  resume: z.instanceof(FileList).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions")
});
const specializations = [{
  id: "content",
  label: "Content Marketing",
  icon: PenTool,
  description: "Blog posts, copywriting, content strategy"
}, {
  id: "social",
  label: "Social Media",
  icon: Share2,
  description: "Platform management, community building"
}, {
  id: "ads",
  label: "Paid Advertising",
  icon: Target,
  description: "Google Ads, Meta Ads, PPC campaigns"
}, {
  id: "analytics",
  label: "Analytics & SEO",
  icon: BarChart3,
  description: "Data analysis, search optimization"
}];
const DigitalMarketingInternship = () => {
  const {
    hasCompletedIntro
  } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      collegeName: "",
      course: "",
      graduationYear: "",
      specialization: [],
      currentKnowledge: "",
      learningGoals: "",
      portfolio: "",
      agreeToTerms: false
    }
  });
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let resumeUrl = null;
      if (values.resume && values.resume.length > 0) {
        const file = values.resume[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `dm_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('resumes').upload(fileName, file);
        if (uploadError) {
          console.error("Error uploading resume:", uploadError);
          toast.error("Failed to upload resume. Please try again.");
          setIsSubmitting(false);
          return;
        }
        resumeUrl = uploadData.path;
      }
      const {
        error: insertError
      } = await supabase.from('internship_applications').insert({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        college_name: values.collegeName,
        course: values.course,
        graduation_year: values.graduationYear,
        domains: values.specialization,
        cover_letter: `Current Knowledge: ${values.currentKnowledge}\n\nLearning Goals: ${values.learningGoals}\n\nPortfolio: ${values.portfolio || 'Not provided'}`,
        resume_url: resumeUrl
      });
      if (insertError) {
        console.error("Error submitting application:", insertError);
        toast.error("There was an error submitting your application. Please try again.");
        setIsSubmitting(false);
        return;
      }
      toast.success("Your Digital Marketing internship application has been submitted!");
      form.reset();
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("There was an error submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!hasCompletedIntro) {
    return null;
  }
  return <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO title="Digital Marketing Internship | VAW Technologies" description="Boost your Digital Marketing I.Q. with our internship program. Learn Content Marketing, Social Media, Ads, and Analytics at VAW Technologies." keywords="digital marketing internship, social media internship, content marketing, SEO internship, Kerala, India, VAW Technologies" />
      <ParticleBackground />
      <Navbar />

      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Poster */}
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6
          }}>
              <img alt="Digital Marketing Internship" className="rounded-xl shadow-lg w-full max-w-md mx-auto lg:mx-0" src="/lovable-uploads/1b9cb470-6753-4c27-b8e4-f4fc89278d87.png" />
            </motion.div>

            {/* Right: Application Form */}
            <motion.div initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} className="bg-card border border-border rounded-xl p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Apply for Digital Marketing Internship</h1>
                <p className="text-muted-foreground text-sm">Fill in your details to start your journey</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="fullName" render={({
                  field
                }) => <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                    <FormField control={form.control} name="phone" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 XXXXX XXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="collegeName" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>College/University*</FormLabel>
                        <FormControl>
                          <Input placeholder="Your institution" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                    <FormField control={form.control} name="course" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>Course/Degree*</FormLabel>
                        <FormControl>
                          <Input placeholder="BBA, MBA, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  </div>

                  <FormField control={form.control} name="graduationYear" render={({
                  field
                }) => <FormItem>
                      <FormLabel>Expected Graduation Year*</FormLabel>
                      <FormControl>
                        <Input placeholder="2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                  {/* Specializations */}
                  <FormField control={form.control} name="specialization" render={() => <FormItem>
                      <FormLabel>Choose Your Focus Areas*</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {specializations.map(spec => <FormField key={spec.id} control={form.control} name="specialization" render={({
                      field
                    }) => <FormItem className={`flex items-center space-x-3 space-y-0 rounded-lg border p-3 cursor-pointer transition-colors ${field.value?.includes(spec.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                              <FormControl>
                                <Checkbox checked={field.value?.includes(spec.id)} onCheckedChange={checked => checked ? field.onChange([...field.value, spec.id]) : field.onChange(field.value?.filter(v => v !== spec.id))} />
                              </FormControl>
                              <div className="flex items-center gap-2">
                                <spec.icon className="w-4 h-4 text-muted-foreground" />
                                <FormLabel className="font-normal cursor-pointer text-sm">{spec.label}</FormLabel>
                              </div>
                            </FormItem>} />)}
                      </div>
                      <FormMessage />
                    </FormItem>} />

                  {/* Knowledge Assessment */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4" />
                      <span>Your Marketing Knowledge</span>
                    </div>

                    <FormField control={form.control} name="currentKnowledge" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>What You Know*</FormLabel>
                        <FormControl>
                          <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe your current knowledge in digital marketing..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                    <FormField control={form.control} name="learningGoals" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>What You'll Learn*</FormLabel>
                        <FormControl>
                          <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="What skills do you want to develop?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  </div>

                  <FormField control={form.control} name="portfolio" render={({
                  field
                }) => <FormItem>
                      <FormLabel>Portfolio/LinkedIn URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="resume" render={({
                  field: {
                    onChange,
                    value,
                    ...rest
                  }
                }) => <FormItem>
                      <FormLabel>Upload Resume (Optional)</FormLabel>
                      <FormControl>
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={e => onChange(e.target.files)} {...rest} className="cursor-pointer" />
                      </FormControl>
                      <FormDescription>PDF or DOC format</FormDescription>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="agreeToTerms" render={({
                  field
                }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal cursor-pointer text-sm">
                          I agree to the terms and conditions.
                        </FormLabel>
                      </div>
                    </FormItem>} />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Submitting...
                      </span> : <span className="flex items-center gap-2">
                        Submit Application
                        <ArrowRight className="w-4 h-4" />
                      </span>}
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default DigitalMarketingInternship;