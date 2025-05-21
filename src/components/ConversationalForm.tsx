import { useState, useRef } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon, FileUp, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "Mexico",
  "South Africa",
  "Italy",
  "Spain",
  "Netherlands",
  "Singapore",
  "United Arab Emirates",
];

const services = [
  "Website Development",
  "WebApp Development",
  "AI Solutions",
  "VR/AR Development",
  "Digital Marketing",
  "Digital Design",
  "Digital Album",
  "NFC/Digital Business Card",
  "Digital Poster/Ads Design",
  "E-book/Catalogs",
  "Custom Software",
  "App/Platform",
  "AI Platform/AI Character Chatbots",
  "Custom VR/AR Projects",
];

// Create schema for the form with services as an array
const formSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name" }),
  companyName: z.string().optional(),
  phoneNumber: z.string().min(5, { message: "Please enter a valid phone number" }),
  selectedServices: z.array(z.string()).min(1, { message: "Please select at least one service" }),
  dateOfBirth: z.date({ required_error: "Please select a date of birth" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  addressLine1: z.string().min(1, { message: "Please enter your address" }),
  city: z.string().min(1, { message: "Please enter your city" }),
  state: z.string().min(1, { message: "Please enter your state" }),
  pinCode: z.string().min(1, { message: "Please enter your pin/postal code" }),
  country: z.string().min(1, { message: "Please select your country" }),
  logo: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ConversationalForm = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      phoneNumber: "",
      selectedServices: [],
      email: "",
      addressLine1: "",
      city: "",
      state: "",
      pinCode: "",
      country: "",
    },
  });

  // Reordered steps based on the user's request
  const steps = [
    { title: "Personal Info", fields: ["fullName", "companyName", "phoneNumber"] },
    { title: "Service Selection", fields: ["selectedServices"] },
    { title: "Contact Info", fields: ["email"] },
    { title: "Date of Birth", fields: ["dateOfBirth"] },
    { title: "Address", fields: ["addressLine1", "city", "state", "pinCode", "country"] },
    { title: "Brand", fields: ["logo"] },
    { title: "Summary", fields: [] },
  ];

  const nextStep = async () => {
    const currentStepFields = steps[step].fields;
    
    // If current step has fields, validate them before moving to the next step
    if (currentStepFields.length > 0) {
      const isValid = await form.trigger(currentStepFields as any);
      if (!isValid) return;
    }
    
    // If we're at the last step, submit the form
    if (step === steps.length - 1) {
      handleSubmit();
      return;
    }
    
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setLogoFile(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formValues = form.getValues();
      
      // Store submission in local storage as fallback
      const submissions = JSON.parse(localStorage.getItem("serviceSubmissions") || "[]");
      
      const newSubmission = {
        ...formValues,
        dateOfBirth: format(formValues.dateOfBirth, "yyyy-MM-dd"),
        logoFileName: fileName,
        createdAt: new Date().toISOString(),
        status: "new",
      };
      
      submissions.push(newSubmission);
      localStorage.setItem("serviceSubmissions", JSON.stringify(submissions));

      // Try to upload to Supabase if it exists
      try {
        // First, submit form data
        const { error: submissionError } = await supabase.from("service_requests").insert({
          full_name: formValues.fullName,
          date_of_birth: format(formValues.dateOfBirth, "yyyy-MM-dd"),
          company_name: formValues.companyName,
          phone_number: formValues.phoneNumber,
          email: formValues.email,
          address_line1: formValues.addressLine1,
          city: formValues.city,
          state: formValues.state,
          pin_code: formValues.pinCode,
          country: formValues.country,
          services: formValues.selectedServices,
          status: "new",
        });

        // If logo exists and submission succeeded, upload the logo
        if (logoFile && !submissionError) {
          const logoPath = `logos/${formValues.fullName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
          
          try {
            const { error: storageError } = await supabase.storage
              .from("services")
              .upload(logoPath, logoFile);
              
            if (storageError) {
              console.error("Logo upload error:", storageError);
            } else {
              // Update the record with the logo path
              await supabase.from("service_requests")
                .update({ logo_path: logoPath })
                .eq("email", formValues.email)
                .eq("created_at", newSubmission.createdAt);
            }
          } catch (uploadError) {
            console.error("Storage upload error:", uploadError);
          }
        }
      } catch (supabaseError) {
        console.log("Using local storage only due to Supabase error:", supabaseError);
      }

      // Show success message
      toast({
        title: "Thank you for your submission!",
        description: "We'll be in touch with you shortly.",
      });

      // Reset form after successful submission
      form.reset();
      setStep(0);
      setFileName(null);
      setLogoFile(null);
      
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "There was a problem submitting your form.",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-card border border-muted/30 rounded-xl shadow-lg p-6 md:p-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {steps[step].title}
        </h2>
        <div className="flex justify-center mt-4">
          <div className="flex items-center">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    index <= step
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`w-10 h-1 ${
                      index < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Form {...form}>
        {step === 0 && (
          <div className="space-y-6 animate-slide-in">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">What's your full name?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      className="text-lg py-6"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">What's your company name? (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Inc."
                      className="text-lg py-6"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">What's your phone number?</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="text-lg py-6"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-slide-in">
            <FormField
              control={form.control}
              name="selectedServices"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-lg">Which services are you interested in?</FormLabel>
                    <FormMessage />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <FormField
                        key={service}
                        control={form.control}
                        name="selectedServices"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, service]);
                                    } else {
                                      field.onChange(
                                        field.value?.filter(
                                          (value) => value !== service
                                        )
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {service}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-in">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">What's your email address?</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className="text-lg py-6"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slide-in">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-lg">When were you born?</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal text-lg py-6",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-slide-in">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Address Line 1</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St"
                      className="resize-none text-lg py-3"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pinCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pin/Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-slide-in">
            <FormItem>
              <FormLabel className="text-lg">Do you have a logo to upload? (optional)</FormLabel>
              <div className="mt-2">
                <div className="flex items-center justify-center w-full">
                  <Label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 border-muted hover:bg-muted/20"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or SVG (MAX. 5MB)
                      </p>
                      {fileName && (
                        <p className="mt-2 text-sm text-primary font-medium">
                          Selected: {fileName}
                        </p>
                      )}
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                    />
                  </Label>
                </div>
              </div>
            </FormItem>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-slide-in">
            <div className="bg-muted/10 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Your Information Summary</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{form.getValues().fullName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">
                      {form.getValues().companyName || "Not provided"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{form.getValues().phoneNumber}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-medium">{form.getValues().email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {form.getValues().dateOfBirth 
                        ? format(form.getValues().dateOfBirth, "yyyy-MM-dd") 
                        : "Not provided"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Selected Services</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.getValues().selectedServices?.map((service, index) => (
                      <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{form.getValues().addressLine1}</p>
                  <p className="font-medium">
                    {form.getValues().city}, {form.getValues().state} {form.getValues().pinCode}
                  </p>
                  <p className="font-medium">{form.getValues().country}</p>
                </div>
                
                {fileName && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">Logo</p>
                    <p className="font-medium">{fileName}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-center text-muted-foreground">
              Please review your information before submitting. You can go back to edit if needed.
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
            className={step === 0 ? "invisible" : ""}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
          >
            {step === steps.length - 1 ? (
              isSubmitting ? "Submitting..." : "Submit"
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ConversationalForm;
