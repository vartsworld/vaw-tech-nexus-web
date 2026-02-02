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

// Define the form schema with Zod - make resume optional
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  collegeName: z.string().min(2, "College name is required"),
  course: z.string().min(2, "Course is required"),
  graduationYear: z.string().min(4, "Graduation year is required"),
  domains: z.array(z.string()).min(1, "Please select at least one domain"),
  coverLetter: z.string().min(50, "Cover letter should be at least 50 characters"),
  resume: z.instanceof(FileList).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions")
});
const domains = [{
  id: "uiux",
  label: "UI/UX Designing"
}, {
  id: "ai",
  label: "AI Training"
}, {
  id: "data",
  label: "Data Labeling"
}, {
  id: "prompt",
  label: "Prompt Engineering"
}, {
  id: "webdev",
  label: "Web Development"
}, {
  id: "appdev",
  label: "App Development"
}, {
  id: "graphics",
  label: "Graphic Design"
}, {
  id: "marketing",
  label: "Digital Marketing"
}, {
  id: "content",
  label: "Content Creation"
}];
const Internship = () => {
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
      domains: [],
      coverLetter: "",
      agreeToTerms: false
    }
  });

  // Handle form submission with Supabase
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let resumeUrl = null;

      // Upload resume file if provided
      if (values.resume && values.resume.length > 0) {
        const file = values.resume[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error uploading resume:", uploadError);
          toast.error("Failed to upload resume. Please try again.");
          return;
        }

        resumeUrl = uploadData.path;
      }

      // Insert application data into Supabase
      const { error: insertError } = await supabase
        .from('internship_applications')
        .insert({
          full_name: values.fullName,
          email: values.email,
          phone: values.phone,
          college_name: values.collegeName,
          course: values.course,
          graduation_year: values.graduationYear,
          domains: values.domains,
          cover_letter: values.coverLetter,
          resume_url: resumeUrl
        });

      if (insertError) {
        console.error("Error submitting application:", insertError);
        toast.error("There was an error submitting your application. Please try again.");
        return;
      }

      toast.success("Your application has been submitted successfully!");
      form.reset();

      // Redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("There was an error submitting your application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render the page content until intro is completed
  if (!hasCompletedIntro) {
    return null;
  }
  return <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
    <SEO
      title="Tech & Design Internship Program"
      description="Join our online Certificate Internship Program in tech and design. Domains include UI/UX, AI training, web development, app development, and digital marketing. Apply now at VAW Technologies."
      keywords="internship, tech internship, design internship, web development internship, Kerala internship, india dev, VAW, Varts, student programs"
    />
    <ParticleBackground />
    <Navbar />

    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-['Space_Grotesk']">
            Apply for <span className="text-gradient">Internship</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-['Outfit']">
            Join our 2-Month Online Internship Program and shape your future in Tech & Design!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Internship Info Section */}
          <div className="tech-card h-fit sticky top-24">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">🚀 2-Month Online Internship Program</h2>
                <p className="text-muted-foreground">Shape Your Future in Tech & Design!</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">🔍 Domains Available:</h3>
                <ul className="list-inside space-y-1 text-muted-foreground">
                  {domains.map(domain => <li key={domain.id} className="flex items-center gap-2">
                    <span className="text-accent">•</span> {domain.label}
                  </li>)}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Program Details:</h3>
                <ul className="list-inside space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-accent">📅</span> Duration: Start in June
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">🕒</span> Working Hours: 6 Hours per Week
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">📍</span> Mode: Online
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">💼 What You'll Get:</h3>
                <ul className="list-inside space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Internship Completion Certificate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Personalized Mentoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Access to Company Networking Events & Programs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Real-World Project Experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Guidance from Industry Experts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0 mt-1">✅</span>
                    <span>Flexible Schedule to Fit Your Academics</span>
                  </li>
                </ul>
              </div>

              <div className="tech-divider"></div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">💰 Registration Fee:</h3>
                <p className="text-lg font-bold">₹1,500/- only</p>
                <p className="text-muted-foreground text-sm">
                  (Covers mentorship, access to tools, and program resources)
                </p>
              </div>

              <div className="tech-divider"></div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">📥 Apply Now</h3>
                <p className="text-red-500 font-semibold">Last Date: 10 Jun 2025</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Contact Information:</h3>
                <ul className="list-inside space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-accent">🌐</span> <a href="http://www.varts.org" target="_blank" rel="noopener noreferrer" className="hover:text-accent">www.varts.org</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">📧</span> <a href="mailto:info.virtualarts@gmail.com" className="hover:text-accent">info.virtualarts@gmail.com</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <a href="tel:+918281543610" className="hover:text-accent">+91 9946882478</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application Form Section */}
          <div className="tech-card mb-8">
            <h2 className="text-2xl font-bold mb-6">Application Form</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <Input placeholder="Enter your email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="phone" render={({
                    field
                  }) => <FormItem>
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
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
                        <Input placeholder="Enter your college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                  <FormField control={form.control} name="course" render={({
                    field
                  }) => <FormItem>
                      <FormLabel>Course/Degree*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your course/degree" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                </div>

                <FormField control={form.control} name="graduationYear" render={({
                  field
                }) => <FormItem>
                    <FormLabel>Expected Year of Graduation*</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

                <FormField control={form.control} name="domains" render={() => <FormItem>
                  <div className="mb-2">
                    <FormLabel>Select Preferred Domains* (Choose one or more)</FormLabel>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {domains.map(domain => <FormField key={domain.id} control={form.control} name="domains" render={({
                      field
                    }) => {
                      return <FormItem key={domain.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value?.includes(domain.id)} onCheckedChange={checked => {
                            return checked ? field.onChange([...field.value, domain.id]) : field.onChange(field.value?.filter(value => value !== domain.id));
                          }} />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {domain.label}
                        </FormLabel>
                      </FormItem>;
                    }} />)}
                  </div>
                  <FormMessage />
                </FormItem>} />

                <FormField control={form.control} name="coverLetter" render={({
                  field
                }) => <FormItem>
                    <FormLabel>Why do you want to join this internship?*</FormLabel>
                    <FormControl>
                      <textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Tell us about yourself and why you're interested in this internship (min. 50 characters)" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will help us understand your motivation and fit for the program.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />

                <FormField
                  control={form.control}
                  name="resume"
                  render={({
                    field: {
                      onChange,
                      value,
                      ...rest
                    }
                  }) => (
                    <FormItem>
                      <FormLabel>Upload Your Resume (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={e => onChange(e.target.files)}
                          {...rest}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormDescription>
                        You can upload your resume in PDF or DOC format, or submit without one.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="agreeToTerms" render={({
                  field
                }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal cursor-pointer">
                        I agree to the terms and conditions, including the registration fee of ₹1,500/- which will be payable after selection.
                      </FormLabel>
                      <FormDescription>
                        You will receive payment instructions after your application is reviewed and accepted.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>} />

                <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>;
};
export default Internship;
