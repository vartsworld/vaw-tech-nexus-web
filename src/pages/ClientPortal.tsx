import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Package, FileText, Clock, CheckCircle, XCircle, Mail, Phone, MapPin } from "lucide-react";

const ClientPortal = () => {
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("services");

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Fetch service requests
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_requests")
        .select("*")
        .eq("email", searchEmail.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from("inquiries")
        .select("*")
        .eq("email", searchEmail.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (inquiriesError) throw inquiriesError;

      setServiceRequests(servicesData || []);
      setInquiries(inquiriesData || []);

      if ((servicesData?.length || 0) === 0 && (inquiriesData?.length || 0) === 0) {
        toast.info("No records found for this email");
      } else {
        toast.success("Records loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "New", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      completed: { label: "Completed", variant: "outline" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Client Portal</h1>
          <p className="text-muted-foreground">Track your service requests and inquiries</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Your Records</CardTitle>
            <CardDescription>Enter your email to view all your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(serviceRequests.length > 0 || inquiries.length > 0) && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">
                <Package className="h-4 w-4 mr-2" />
                Service Requests ({serviceRequests.length})
              </TabsTrigger>
              <TabsTrigger value="inquiries">
                <FileText className="h-4 w-4 mr-2" />
                Inquiries ({inquiries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4 mt-6">
              {serviceRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No service requests found
                  </CardContent>
                </Card>
              ) : (
                serviceRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            {request.full_name}
                            {request.company_name && (
                              <span className="text-muted-foreground text-sm font-normal">
                                ({request.company_name})
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Submitted on {new Date(request.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{request.phone_number}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span>
                              {request.address_line1}, {request.city}, {request.state} {request.pin_code}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Requested Services:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.services?.map((service: string, idx: number) => (
                              <Badge key={idx} variant="outline">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="inquiries" className="space-y-4 mt-6">
              {inquiries.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No inquiries found
                  </CardContent>
                </Card>
              ) : (
                inquiries.map((inquiry) => (
                  <Card key={inquiry.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(inquiry.status)}
                            {inquiry.name}
                          </CardTitle>
                          <CardDescription>
                            Submitted on {new Date(inquiry.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{inquiry.email}</span>
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{inquiry.phone}</span>
                          </div>
                        )}
                        {inquiry.service && (
                          <div className="mt-2">
                            <Badge variant="outline">{inquiry.service}</Badge>
                          </div>
                        )}
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-1">Message:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {inquiry.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
