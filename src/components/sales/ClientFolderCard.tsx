import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, MoreVertical, User, Calendar, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientFolderCardProps {
  client: {
    id: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone?: string | null;
    status: string | null;
    created_at: string | null;
  };
  onClick?: () => void;
}

const ClientFolderCard = ({ client, onClick }: ClientFolderCardProps) => {
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "onboarding":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="group relative" onClick={onClick}>
      {/* Folder Tab Effect */}
      <div className="absolute -top-3 left-4 w-24 h-6 bg-zinc-800 rounded-t-lg border-t border-x border-white/10 z-0 transition-colors group-hover:bg-zinc-700"></div>
      
      <Card className="relative z-10 bg-zinc-900/80 backdrop-blur-md border-white/10 hover:border-white/20 transition-all overflow-hidden p-0 h-full flex flex-col cursor-pointer">
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>View Folder</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">Edit Client</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-red-400">Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="text-white font-bold text-lg mb-1 truncate">{client.company_name}</h3>
          <div className="flex items-center gap-2 text-white/50 text-xs mb-4">
            <User className="w-3 h-3" />
            <span>{client.contact_person}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Mail className="w-3 h-3" />
              <span className="truncate">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Phone className="w-3 h-3" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center mt-auto">
          <Badge className={`text-[10px] uppercase font-bold px-2 py-0 border ${getStatusColor(client.status)}`}>
            {client.status || "Lead"}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Calendar className="w-3 h-3" />
            <span>{client.created_at ? new Date(client.created_at).toLocaleDateString() : "No Date"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClientFolderCard;
