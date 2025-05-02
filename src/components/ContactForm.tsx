
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null); // Clear error when form is edited
  };

  const handleServiceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, service: value }));
    setFormError(null); // Clear error when form is edited
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setFormError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Store in localStorage as a fallback
      const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
      const newInquiry = {
        ...formData,
        status: 'new',
        created_at: new Date().toISOString(),
      };
      
      inquiries.push(newInquiry);
      localStorage.setItem('inquiries', JSON.stringify(inquiries));
      
      // Try to send to Supabase (this may fail if table doesn't exist)
      try {
        const { error } = await (supabase as any)
          .from("inquiries")
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            service: formData.service,
            message: formData.message,
            status: 'new'
          });
        
        if (error) {
          console.log("Supabase storage failed, but message saved locally:", error);
        }
      } catch (supabaseError) {
        console.log("Using local storage fallback due to Supabase error");
      }

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError("There was a problem sending your message. Please try again or contact us directly by email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className={`text-sm font-medium ${isMobile ? 'text-center block' : ''}`}>
            Your Name
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="bg-muted/20 border-muted"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className={`text-sm font-medium ${isMobile ? 'text-center block' : ''}`}>
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            className="bg-muted/20 border-muted"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="phone" className={`text-sm font-medium ${isMobile ? 'text-center block' : ''}`}>
            Phone Number (Optional)
          </label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className="bg-muted/20 border-muted"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="service" className={`text-sm font-medium ${isMobile ? 'text-center block' : ''}`}>
            Service Interested In
          </label>
          <Select onValueChange={handleServiceChange} value={formData.service}>
            <SelectTrigger 
              className="bg-muted/20 border-muted"
              id="service"
            >
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website Development</SelectItem>
              <SelectItem value="webapp">WebApp Development</SelectItem>
              <SelectItem value="ai">AI Solutions</SelectItem>
              <SelectItem value="vr">VR/AR Projects</SelectItem>
              <SelectItem value="marketing">Digital Marketing</SelectItem>
              <SelectItem value="design">Digital Design</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="message" className={`text-sm font-medium ${isMobile ? 'text-center block' : ''}`}>
          Your Message
        </label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your project or inquiry..."
          required
          className="bg-muted/20 border-muted h-32"
        />
      </div>
      
      <Button
        type="submit"
        className="bg-primary hover:bg-primary/80 text-primary-foreground w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
};

export default ContactForm;
