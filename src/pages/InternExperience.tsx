import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Star, Award, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/ParticleBackground";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

// Form schema for experience sharing
const experienceSchema = z.object({
  internName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  internshipDomain: z.string().min(1, "Please select your internship domain"),
  experienceRating: z.number().min(1).max(5),
  overallExperience: z.string().min(50, "Please share at least 50 characters about your experience"),
  skillsLearned: z.string().optional(),
  projectHighlights: z.string().optional(),
  mentorFeedback: z.string().optional(),
  suggestionsForImprovement: z.string().optional(),
  wouldRecommend: z.boolean(),
  certificateRequested: z.boolean(),
});

// Form schema for team application
const teamApplicationSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  currentPosition: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  skills: z.string().min(10, "Please describe your skills"),
  whyJoinTeam: z.string().min(50, "Please explain why you want to join our team"),
  preferredRole: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

const domains = [
  "UI/UX Designing",
  "AI Training", 
  "Data Labeling",
  "Prompt Engineering",
  "Web Development",
  "App Development",
  "Graphic Design",
  "Digital Marketing",
  "Content Creation"
];

const InternExperience = () => {
  const { hasCompletedIntro } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTeamSubmitting, setIsTeamSubmitting] = useState(false);
  const [experienceSubmitted, setExperienceSubmitted] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  // Experience form
  const experienceForm = useForm<z.infer<typeof experienceSchema>>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      internName: "",
      email: "",
      phone: "",
      address: "",
      internshipDomain: "",
      experienceRating: 5,
      overallExperience: "",
      skillsLearned: "",
      projectHighlights: "",
      mentorFeedback: "",
      suggestionsForImprovement: "",
      wouldRecommend: true,
      certificateRequested: true,
    }
  });

  // Team application form
  const teamForm = useForm<z.infer<typeof teamApplicationSchema>>({
    resolver: zodResolver(teamApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      currentPosition: "",
      experienceYears: 0,
      skills: "",
      whyJoinTeam: "",
      preferredRole: "",
      portfolioUrl: "",
      linkedinUrl: "",
    }
  });

  const onExperienceSubmit = async (values: z.infer<typeof experienceSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('intern_experiences')
        .insert({
          intern_name: values.internName,
          email: values.email,
          phone: values.phone,
          address: values.address,
          internship_domain: values.internshipDomain,
          experience_rating: values.experienceRating,
          overall_experience: values.overallExperience,
          skills_learned: values.skillsLearned,
          project_highlights: values.projectHighlights,
          mentor_feedback: values.mentorFeedback,
          suggestions_for_improvement: values.suggestionsForImprovement,
          would_recommend: values.wouldRecommend,
          certificate_requested: values.certificateRequested,
        });

      if (error) {
        console.error("Error submitting experience:", error);
        toast.error("Failed to submit your experience. Please try again.");
        return;
      }

      toast.success("Experience submitted successfully!");
      setExperienceSubmitted(true);
      experienceForm.reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTeamSubmit = async (values: z.infer<typeof teamApplicationSchema>) => {
    setIsTeamSubmitting(true);
    try {
      const { error } = await supabase
        .from('team_applications')
        .insert({
          full_name: values.fullName,
          email: values.email,
          phone: values.phone,
          current_position: values.currentPosition,
          experience_years: values.experienceYears,
          skills: values.skills,
          why_join_team: values.whyJoinTeam,
          preferred_role: values.preferredRole,
          portfolio_url: values.portfolioUrl,
          linkedin_url: values.linkedinUrl,
        });

      if (error) {
        console.error("Error submitting team application:", error);
        toast.error("Failed to submit your application. Please try again.");
        return;
      }

      toast.success("Team application submitted successfully! We'll contact you soon.");
      setTeamDialogOpen(false);
      teamForm.reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsTeamSubmitting(false);
    }
  };

  if (!hasCompletedIntro) {
    return null;
  }

  if (experienceSubmitted) {
    return (
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <ParticleBackground />
        <Navbar />
        
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-8">
              <Award className="w-24 h-24 mx-auto text-primary animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
                Thank You for Sharing Your Experience!
              </h1>
              <div className="tech-card space-y-6">
                <p className="text-lg text-muted-foreground">
                  Your feedback is invaluable to us and will help improve our internship program.
                </p>
                
                <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-primary">📜 Certificate Information</h3>
                  <p className="text-muted-foreground mb-4">
                    Your internship completion certificate will be issued within <strong>7 days</strong>.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>✅ You will receive your certificate online via email</p>
                    <p>✅ A physical certificate will be sent to your provided address</p>
                    <p>✅ Both certificates are officially recognized and can be used for academic/professional purposes</p>
                  </div>
                </div>

                <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      <Users className="w-5 h-5 mr-2" />
                      Join the VAW Team with Training
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Join Our Team at Virtual Arts World</DialogTitle>
                      <DialogDescription>
                        Ready to take the next step? Apply to join our growing team with professional training opportunities.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...teamForm}>
                      <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={teamForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={teamForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={teamForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={teamForm.control}
                            name="experienceYears"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience (Years)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    {...field}
                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={teamForm.control}
                          name="currentPosition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Position</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Student, Junior Developer, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={teamForm.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skills*</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your technical and soft skills..."
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={teamForm.control}
                          name="whyJoinTeam"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Why do you want to join our team?*</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us what motivates you to join Virtual Arts World..."
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={teamForm.control}
                            name="portfolioUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Portfolio URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://your-portfolio.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={teamForm.control}
                            name="linkedinUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn Profile</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={isTeamSubmitting}
                            className="w-full"
                          >
                            {isTeamSubmitting ? "Submitting..." : "Submit Application"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="mt-4"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleBackground />
      <Navbar />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
              Share Your <span className="text-gradient">Internship Experience</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-['Outfit']">
              Help us improve our program and get your completion certificate by sharing your valuable feedback.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="tech-card mb-8">
              <Form {...experienceForm}>
                <form onSubmit={experienceForm.handleSubmit(onExperienceSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={experienceForm.control}
                      name="internName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={experienceForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={experienceForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={experienceForm.control}
                      name="internshipDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Internship Domain*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your internship domain" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {domains.map((domain) => (
                                <SelectItem key={domain} value={domain}>
                                  {domain}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={experienceForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (for certificate delivery)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your complete address where you want the physical certificate to be delivered"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="experienceRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Experience Rating*</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => field.onChange(rating)}
                                className={`p-2 ${field.value >= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              >
                                <Star className="w-8 h-8 fill-current" />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({field.value}/5 stars)
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="overallExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Share Your Overall Experience*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your internship journey, what you liked, challenges faced, etc. (minimum 50 characters)"
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="skillsLearned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills You Learned</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What new skills or technologies did you learn during the internship?"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="projectHighlights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Highlights</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about the projects you worked on and your key contributions"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="mentorFeedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mentor Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How was the mentoring experience? Any specific feedback about your mentors?"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={experienceForm.control}
                    name="suggestionsForImprovement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suggestions for Improvement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="How can we improve our internship program? Any suggestions or recommendations?"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={experienceForm.control}
                      name="wouldRecommend"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I would recommend this internship program to others
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={experienceForm.control}
                      name="certificateRequested"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I want to receive my internship completion certificate
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Experience & Get Certificate"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default InternExperience;