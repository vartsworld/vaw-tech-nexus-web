
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Phone, Mail, Globe, Calendar, Package } from "lucide-react";

interface PricingInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  preferredDomain: string;
  websiteType: string;
  requirements: string;
  timeline?: string;
  budget: string;
  package: string;
  status: string;
  createdAt: string;
}

const PricingInquiryList = () => {
  const [inquiries, setInquiries] = useState<PricingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from Supabase first (look for pricing-related inquiries)
      try {
        let query = supabase.from("inquiries").select("*");
        
        if (filter !== "all") {
          query = query.eq("status", filter);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        
        // Filter for pricing inquiries and transform data
        const pricingInquiries = data?.filter(item => 
          item.service && (item.service.includes("₹") || item.service.includes("Package"))
        ).map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone || "",
          company: extractFromMessage(item.message, "Company:"),
          preferredDomain: extractFromMessage(item.message, "Preferred Domain:"),
          websiteType: extractFromMessage(item.message, "Website Type:"),
          requirements: extractFromMessage(item.message, "Requirements:"),
          timeline: extractFromMessage(item.message, "Timeline:"),
          budget: item.service,
          package: item.service?.split(" - ")[0] || "",
          status: item.status,
          createdAt: item.created_at
        })) || [];

        if (pricingInquiries.length > 0) {
          setInquiries(pricingInquiries);
          setLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
      }
      
      // Fallback to localStorage
      const localInquiries = JSON.parse(localStorage.getItem("pricingInquiries") || "[]");
      const filteredInquiries = filter === "all" 
        ? localInquiries 
        : localInquiries.filter((inq: any) => inq.status === filter);
      
      const inquiriesWithIds = filteredInquiries.map((inq: any, index: number) => ({
        ...inq,
        id: inq.id || `local-${index}`,
      }));
      
      setInquiries(inquiriesWithIds);
    } catch (error) {
      console.error("Error fetching pricing inquiries:", error);
      toast({
        title: "Failed to load pricing inquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractFromMessage = (message: string, label: string): string => {
    if (!message) return "";
    const lines = message.split('\n');
    const line = lines.find(l => l.startsWith(label));
    return line ? line.replace(label, "").trim() : "";
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (id.startsWith('local-')) {
        const localInquiries = JSON.parse(localStorage.getItem("pricingInquiries") || "[]");
        const index = parseInt(id.replace('local-', ''));
        
        if (localInquiries[index]) {
          localInquiries[index].status = status;
          localStorage.setItem("pricingInquiries", JSON.stringify(localInquiries));
          
          setInquiries((prev) =>
            prev.map((inquiry) =>
              inquiry.id === id ? { ...inquiry, status } : inquiry
            )
          );
          
          toast({
            title: "Status updated",
            description: `Inquiry has been marked as ${status}`,
          });
        }
      } else {
        const { error } = await supabase
          .from("inquiries")
          .update({ status })
          .eq("id", id);

        if (error) throw error;

        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry.id === id ? { ...inquiry, status } : inquiry
          )
        );

        toast({
          title: "Status updated",
          description: `Inquiry has been marked as ${status}`,
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "in-progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading pricing inquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pricing Inquiries</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inquiries</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-8 bg-card border border-muted/20 rounded-lg">
          <p className="text-muted-foreground">No pricing inquiries found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {inquiry.name}
                    <Badge className={getStatusColor(inquiry.status)}>
                      {inquiry.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex gap-4 items-center mt-2">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {inquiry.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {inquiry.phone}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {inquiry.package}
                  </div>
                  <div className="font-medium text-lg">{inquiry.budget}</div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inquiry.company && (
                    <div>
                      <span className="font-medium text-sm">Company:</span>
                      <p className="text-sm">{inquiry.company}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-sm flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Preferred Domain:
                    </span>
                    <p className="text-sm">{inquiry.preferredDomain}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Website Type:</span>
                    <p className="text-sm">{inquiry.websiteType}</p>
                  </div>
                  
                  {inquiry.timeline && (
                    <div>
                      <span className="font-medium text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Timeline:
                      </span>
                      <p className="text-sm">{inquiry.timeline}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="font-medium text-sm">Requirements:</span>
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded mt-1">
                    {inquiry.requirements}
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Received on {format(new Date(inquiry.createdAt), "PPP 'at' p")}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <Select
                  value={inquiry.status}
                  onValueChange={(value) => updateStatus(inquiry.id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${inquiry.email}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${inquiry.phone}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PricingInquiryList;
