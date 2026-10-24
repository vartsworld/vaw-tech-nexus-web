import { useState } from "react";
import { Bell, Megaphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationCenter from "@/components/hr/NotificationCenter";
import BannerManagement from "@/components/hr/BannerManagement";

interface AnnouncementsHubProps {
  initialTab?: "notifications" | "banners";
}

/** One place for everything HR broadcasts: push notifications to people, and banners shown across the apps. */
const AnnouncementsHub = ({ initialTab = "notifications" }: AnnouncementsHubProps) => {
  const [tab, setTab] = useState<string>(initialTab);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">Send a notification to specific people, or pin a banner that everyone sees when they open the app.</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start gap-1 bg-white/5 p-1 sm:w-auto">
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="banners" className="gap-2"><Megaphone className="h-4 w-4" /> Banners</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="mt-5"><NotificationCenter /></TabsContent>
        <TabsContent value="banners" className="mt-5"><BannerManagement /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AnnouncementsHub;
