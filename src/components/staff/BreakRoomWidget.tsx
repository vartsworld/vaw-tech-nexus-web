import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, MessageCircle, Maximize2 } from "lucide-react";

interface BreakRoomWidgetProps {
  onMaximize: () => void;
  isBreakActive: boolean;
  breakTimeRemaining: number;
  unreadChatCount?: number;
}

const BreakRoomWidget = ({ 
  onMaximize, 
  isBreakActive, 
  breakTimeRemaining,
  unreadChatCount = 0 
}: BreakRoomWidgetProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="fixed bottom-6 right-6 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-lg cursor-pointer hover:scale-105 transition-transform z-50"
      onClick={onMaximize}
    >
      <CardContent className="p-3 h-full flex flex-col items-center justify-center space-y-2">
        <div className="relative">
          <Coffee className={`w-8 h-8 text-orange-400 ${isBreakActive ? 'animate-pulse' : ''}`} />
          {isBreakActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        
        {isBreakActive && (
          <div className="text-orange-300 font-bold text-sm">
            {formatTime(breakTimeRemaining)}
          </div>
        )}
        
        {!isBreakActive && (
          <div className="text-orange-300 text-xs font-medium">
            Break Room
          </div>
        )}
        
        {unreadChatCount > 0 && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{unreadChatCount}</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 w-6 h-6 text-white/70 hover:text-white hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onMaximize();
          }}
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default BreakRoomWidget;
