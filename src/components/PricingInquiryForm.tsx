import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail } from "lucide-react";
interface PricingInquiryFormProps {
  packageName: string;
  packagePrice: number;
  children: React.ReactNode;
}
const PricingInquiryForm = ({
  packageName,
  packagePrice,
  children
}: PricingInquiryFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    preferredDomain: "",
    websiteType: "",
    requirements: "",
    timeline: "",
    budget: packagePrice.toString(),
    package: packageName
  });
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Store in localStorage as fallback
      const inquiries = JSON.parse(localStorage.getItem("pricingInquiries") || "[]");
      const newInquiry = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: "new"
      };
      inquiries.push(newInquiry);
      localStorage.setItem("pricingInquiries", JSON.stringify(inquiries));

      // Try to submit to Supabase
      try {
        const {
          error
        } = await supabase.from("inquiries").insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: `${formData.package} - ₹${formData.budget}`,
          message: `Company: ${formData.company}\nPreferred Domain: ${formData.preferredDomain}\nWebsite Type: ${formData.websiteType}\nRequirements: ${formData.requirements}\nTimeline: ${formData.timeline}`,
          status: "new"
        });
        if (error) {
          console.error("Supabase error:", error);
        }
      } catch (supabaseError) {
        console.log("Using localStorage fallback");
      }
      toast({
        title: "Inquiry Submitted Successfully!",
        description: "We'll contact you shortly to discuss your project."
      });
      setShowContact(true);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Submission Error",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      preferredDomain: "",
      websiteType: "",
      requirements: "",
      timeline: "",
      budget: packagePrice.toString(),
      package: packageName
    });
    setShowContact(false);
    setOpen(false);
  };
  if (showContact) {
    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Thank You!</DialogTitle>
            <DialogDescription className="text-center">
              Your inquiry has been submitted successfully. Contact us now for immediate assistance:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">+91 9876543210</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">info.virtualarts@gmail.com
              </span>
              </div>
            </div>
          </div>
          
          <Button onClick={resetForm} className="w-full">
            Submit Another Inquiry
          </Button>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Started with {packageName}</DialogTitle>
          <DialogDescription>
            Tell us about your website requirements and we'll get back to you with a detailed proposal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" placeholder="+91 9876543210" value={formData.phone} onChange={e => handleInputChange("phone", e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company/Business Name</Label>
              <Input id="company" placeholder="Your Company Name" value={formData.company} onChange={e => handleInputChange("company", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Preferred Domain Name *</Label>
            <Input id="domain" placeholder="www.yourwebsite.com" value={formData.preferredDomain} onChange={e => handleInputChange("preferredDomain", e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteType">Website Type *</Label>
            <Select onValueChange={value => handleInputChange("websiteType", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select website type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business Website</SelectItem>
                <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
                <SelectItem value="blog">Blog/News</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="custom">Custom Application</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Website Requirements *</Label>
            <Textarea id="requirements" placeholder="Describe your website needs, features, design preferences, target audience, etc." value={formData.requirements} onChange={e => handleInputChange("requirements", e.target.value)} rows={4} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Project Timeline</Label>
            <Select onValueChange={value => handleInputChange("timeline", value)}>
              <SelectTrigger>
                <SelectValue placeholder="When do you need this completed?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP (Rush Order)</SelectItem>
                <SelectItem value="1week">Within 1 Week</SelectItem>
                <SelectItem value="2weeks">Within 2 Weeks</SelectItem>
                <SelectItem value="1month">Within 1 Month</SelectItem>
                <SelectItem value="2months">Within 2 Months</SelectItem>
                <SelectItem value="flexible">Flexible Timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Selected Package & Budget</Label>
            <Input id="budget" value={`${formData.package} - ₹${formData.budget}`} readOnly className="bg-muted" />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};
export default PricingInquiryForm;