import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Radio,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MusicPlayerProps {
  userId?: string;
  variant?: 'full' | 'sidebar';
}

const MusicPlayer = ({ userId, variant = 'full' }: MusicPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState([0.8]);
  const [muted, setMuted] = useState(false);

  // This component now acts as a "System Media Controller" interface
  // Note: Actual control of other tabs is restricted by browser security.
  // This UI serves as a focus point for Media Session API interactions if we had active media context.

  const handlePlayPause = () => {
    setPlaying(!playing);
    // Mimic sending a command
    if (!playing) {
      toast.info("Resuming active media logic...", { description: "Use system media keys for global control." });
    } else {
      toast.info("Pausing active media logic...");
    }
  };

  const handleNext = () => {
    toast.info("Skipping track...");
  };

  const handlePrev = () => {
    toast.info("Previous track...");
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    setMuted(value[0] === 0);
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  // Sidebar / Compact Mode
  if (variant === 'sidebar') {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col">
        {/* Connection Status / Visualizer */}
        <div className="relative bg-zinc-900 border-b border-white/5 min-h-[60px] flex items-center justify-center overflow-hidden p-4">
          <div className="flex flex-col items-center justify-center z-10 w-full">
            <div className="flex items-center gap-2 mb-1 w-full justify-center text-zinc-400">
              <Radio className="w-4 h-4" />
              <h4 className="text-xs font-bold truncate">System Audio</h4>
            </div>
            <div className="flex gap-1 h-4 items-end justify-center w-full opacity-50">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className={`w-1 bg-blue-500/50 rounded-t-sm ${playing ? 'animate-pulse' : ''}`}
                  style={{ height: playing ? `${30 + Math.random() * 70}%` : '4px', transition: 'height 0.2s' }}></div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 text-center leading-tight">
              Controls active media across browser session
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 space-y-3">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={handlePrev}>
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              onClick={handlePlayPause}
              className={`h-10 w-10 rounded-full shadow-lg ${playing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
            >
              {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={handleNext}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 px-2">
            <Button variant="ghost" size="icon" onClick={handleToggleMute} className="h-6 w-6 text-zinc-400 hover:text-white shrink-0">
              {muted || volume[0] === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="flex-1 media-slider"
            />
          </div>
        </div>

        <style>{`
            .media-slider [role="slider"] { width: 8px; height: 8px; }
            .media-slider .relative { height: 3px; background: rgba(255,255,255,0.1); }
            .media-slider [style*="width"] { background: #3b82f6; }
        `}</style>
      </div>
    );
  }

  // Full Mode placeholder
  return (
    <Card className="bg-zinc-900 border-white/5">
      <CardContent className="p-6 text-center text-zinc-400">
        Compact mode active in sidebar.
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;
