
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  date: string;
  status: "new" | "in-progress" | "completed";
}

const InquiryList = () => {
  // Mock data for demo purposes
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: "INQ-001",
      name: "John Smith",
      email: "john@example.com",
      phone: "+1 (555) 123-4567",
      service: "Website Development",
      message: "I need a new e-commerce website for my small business.",
      date: "2023-05-01T10:30:00",
      status: "new",
    },
    {
      id: "INQ-002",
      name: "Emily Johnson",
      email: "emily@example.com",
      phone: "+1 (555) 987-6543",
      service: "Digital Marketing",
      message: "Looking for help with social media marketing campaign.",
      date: "2023-05-02T14:15:00",
      status: "in-progress",
    },
    {
      id: "INQ-003",
      name: "Michael Brown",
      email: "michael@example.com",
      phone: "+1 (555) 456-7890",
      service: "VR/AR Projects",
      message: "Interested in developing a VR experience for our product showcase.",
      date: "2023-05-03T09:45:00",
      status: "new",
    },
    {
      id: "INQ-004",
      name: "Sarah Williams",
      email: "sarah@example.com",
      phone: "+1 (555) 789-0123",
      service: "AI Solutions",
      message: "We need an AI chatbot for our customer service portal.",
      date: "2023-05-04T16:20:00",
      status: "completed",
    },
  ]);

  const handleStatusChange = (id: string, newStatus: "new" | "in-progress" | "completed") => {
    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-primary/20 text-primary border-primary/30";
      case "in-progress":
        return "bg-accent/20 text-accent border-accent/30";
      case "completed":
        return "bg-muted/20 text-muted-foreground border-muted/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <div className="bg-card border border-muted/20 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Recent Inquiries</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell className="font-medium">{inquiry.id}</TableCell>
                <TableCell>{inquiry.name}</TableCell>
                <TableCell>{inquiry.email}</TableCell>
                <TableCell>{inquiry.service}</TableCell>
                <TableCell>{formatDate(inquiry.date)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(inquiry.status)} variant="outline">
                    {inquiry.status === "new" && "New"}
                    {inquiry.status === "in-progress" && "In Progress"}
                    {inquiry.status === "completed" && "Completed"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={inquiry.status}
                      onValueChange={(value: any) =>
                        handleStatusChange(inquiry.id, value)
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InquiryList;
