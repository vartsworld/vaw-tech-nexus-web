import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Layout, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
}

interface WidgetManagerProps {
  widgets: WidgetConfig[];
  onToggleWidget: (widgetId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const WidgetManager = ({
  widgets,
  onToggleWidget,
  onShowAll,
  onHideAll,
}: WidgetManagerProps) => {
  const [open, setOpen] = useState(false);

  const visibleCount = widgets.filter((w) => w.isVisible).length;
  const totalCount = widgets.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Layout className="w-4 h-4 mr-2" />
          Widgets ({visibleCount}/{totalCount})
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900/95 backdrop-blur-lg border-white/10 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Widget Manager</SheetTitle>
          <SheetDescription className="text-gray-400">
            Show or hide dashboard components
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowAll}
              className="flex-1 bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onHideAll}
              className="flex-1 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Hide All
            </Button>
          </div>

          {/* Widget List */}
          <div className="space-y-3 mt-6">
            {widgets.map((widget) => (
              <Card
                key={widget.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label
                        htmlFor={widget.id}
                        className="text-white font-medium cursor-pointer"
                      >
                        {widget.name}
                      </Label>
                      <p className="text-gray-400 text-xs mt-1">
                        {widget.description}
                      </p>
                    </div>
                    <Switch
                      id={widget.id}
                      checked={widget.isVisible}
                      onCheckedChange={() => onToggleWidget(widget.id)}
                      className="ml-4"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WidgetManager;
