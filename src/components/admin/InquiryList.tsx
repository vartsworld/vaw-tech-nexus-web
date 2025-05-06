
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
import { Inquiry } from "@/types/database";

const InquiryList = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchInquiries();
  }, [filter]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from Supabase first
      try {
        let query = supabase.from("inquiries").select("*");

        if (filter !== "all") {
          query = query.eq("status", filter);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setInquiries(data);
          setLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.error("Supabase error:", supabaseError);
        // Continue to localStorage fallback
      }
      
      // Fallback to localStorage if Supabase fails or returns no data
      const localInquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
      
      // Apply filtering if needed
      const filteredInquiries = filter === "all" 
        ? localInquiries 
        : localInquiries.filter((inq: any) => inq.status === filter);
      
      // Add IDs if they don't have them
      const inquiriesWithIds = filteredInquiries.map((inq: any, index: number) => ({
        ...inq,
        id: inq.id || `local-${index}`,
      }));
      
      setInquiries(inquiriesWithIds);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast({
        title: "Failed to load inquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (id.startsWith('local-')) {
        // Update in localStorage
        const localInquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
        const index = parseInt(id.replace('local-', ''));
        
        if (localInquiries[index]) {
          localInquiries[index].status = status;
          localInquiries[index].updated_at = new Date().toISOString();
          localStorage.setItem("inquiries", JSON.stringify(localInquiries));
          
          setInquiries((prev) =>
            prev.map((inquiry) =>
              inquiry.id === id ? { ...inquiry, status, updated_at: new Date().toISOString() } : inquiry
            )
          );
          
          toast({
            title: "Status updated",
            description: `Inquiry has been marked as ${status}`,
          });
        }
      } else {
        // Update in Supabase
        const { error } = await supabase
          .from("inquiries")
          .update({ status, updated_at: new Date().toISOString() })
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

  const deleteInquiry = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        if (id.startsWith('local-')) {
          // Delete from localStorage
          const localInquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
          const index = parseInt(id.replace('local-', ''));
          
          if (index >= 0) {
            localInquiries.splice(index, 1);
            localStorage.setItem("inquiries", JSON.stringify(localInquiries));
            
            setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== id));
            
            toast({
              title: "Inquiry deleted",
            });
          }
        } else {
          // Delete from Supabase
          const { error } = await supabase.from("inquiries").delete().eq("id", id);

          if (error) throw error;

          setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== id));

          toast({
            title: "Inquiry deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting inquiry:", error);
        toast({
          title: "Failed to delete inquiry",
          variant: "destructive",
        });
      }
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
        <p>Loading inquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Customer Inquiries</h2>
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
          <p className="text-muted-foreground">No inquiries found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="overflow-hidden">
              <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div>
                  <CardTitle>{inquiry.name}</CardTitle>
                  <CardDescription className="flex gap-2 items-center mt-1">
                    <span>{inquiry.email}</span>
                    {inquiry.phone && <span>• {inquiry.phone}</span>}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(inquiry.status)}>
                  {inquiry.status}
                </Badge>
              </CardHeader>
              <CardContent className="pb-2">
                {inquiry.service && (
                  <div className="mb-2">
                    <span className="font-medium">Service:</span> {inquiry.service}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{inquiry.message}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  Received on{" "}
                  {format(new Date(inquiry.created_at), "PPP 'at' p")}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex gap-2">
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
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteInquiry(inquiry.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InquiryList;
