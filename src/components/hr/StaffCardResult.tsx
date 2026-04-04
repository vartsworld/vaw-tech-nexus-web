import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Mail, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from 'qrcode.react';
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface StaffCardResultProps {
  cardUrl: string;
  staffId: string;
  email: string;
  firstTimePasscode?: string;
  onClose: () => void;
}

export function StaffCardResult({ cardUrl, staffId, email, firstTimePasscode, onClose }: StaffCardResultProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopiedLink(true);
    toast({ title: "Copied!", description: "Digital ID Card link copied to clipboard" });
    setTimeout(() => setCopiedLink(false), 2000);
  };
  
  const handleCopyPasscode = () => {
    if (firstTimePasscode) {
      navigator.clipboard.writeText(firstTimePasscode);
      setCopiedPasscode(true);
      toast({ title: "Copied!", description: "Passcode copied to clipboard" });
      setTimeout(() => setCopiedPasscode(false), 2000);
    }
  };

  const mailtoLink = `mailto:${email}?subject=Welcome to the Team - Your Digital ID Card&body=Hello!%0D%0A%0D%0AWelcome to the team. Here is the link to your digital ID card:%0D%0A${cardUrl}%0D%0A%0D%0A${firstTimePasscode ? `Your first-time login passcode is: ${firstTimePasscode}%0D%0A%0D%0A` : ''}Best regards,%0D%0AHR Team`;

  return (
    <div className="space-y-6 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card to-muted rounded-xl shadow-inner border mt-4">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">Card Created Successfully!</h3>
        <p className="text-muted-foreground text-sm">The digital ID card has been generated.</p>
        <Badge variant="outline" className="text-lg py-1 px-3 bg-background">{staffId}</Badge>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border">
        <QRCodeSVG value={cardUrl} size={150} level={"H"} includeMargin={true} />
      </div>

      <div className="w-full space-y-3">
        <div className="flex gap-2">
           <Button className="flex-1 gap-2" variant="default" onClick={() => window.open(cardUrl, '_blank')}>
             <ExternalLink className="w-4 h-4" />
             View Live Card
           </Button>
           <Button className="flex-1 gap-2" variant="outline" onClick={handleCopyLink}>
             {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
             {copiedLink ? "Copied Link" : "Copy Link"}
           </Button>
        </div>
        
        {firstTimePasscode && (
           <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
             <div>
               <p className="text-xs text-orange-600 font-semibold uppercase mb-1">First Time Passcode</p>
               <p className="font-mono text-lg font-bold text-orange-800">{firstTimePasscode}</p>
             </div>
             <Button size="sm" variant="outline" className="bg-white hover:bg-orange-100" onClick={handleCopyPasscode}>
               {copiedPasscode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-orange-600" />}
             </Button>
           </div>
        )}

        <Button className="w-full gap-2 border-primary text-primary hover:bg-primary/5" variant="outline" onClick={() => window.open(mailtoLink)}>
          <Mail className="w-4 h-4" />
          Email to Staff
        </Button>
      </div>
      
      <Button className="w-full mt-4" variant="ghost" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
