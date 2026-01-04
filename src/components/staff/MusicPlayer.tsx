import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  Youtube,
  Radio,
  ListMusic
} from "lucide-react";

interface MusicPlayerProps {
  userId?: string;
  variant?: 'full' | 'sidebar';
}

const QUICK_PLAYS = [
  { title: "Lofi Girl Radio", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", type: "youtube" },
  { title: "Chillhop Raccoon", url: "https://www.youtube.com/watch?v=5yx6BWlEVcY", type: "youtube" },
  { title: "Synthwave Radio", url: "https://www.youtube.com/watch?v=4xDzrJKXOOY", type: "youtube" },
  { title: "Deep Focus", url: "https://www.youtube.com/watch?v=84Yi13Q_G5I", type: "youtube" }
];

const MusicPlayer = ({ userId, variant = 'full' }: MusicPlayerProps) => {
  const [url, setUrl] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState([0.8]); // 0 to 1
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [title, setTitle] = useState("No Media Loaded");
  const playerRef = useRef<ReactPlayer>(null);

  const handlePlayPause = () => {
    if (!url && QUICK_PLAYS.length > 0) {
      loadPreset(QUICK_PLAYS[0]);
      return;
    }
    setPlaying(!playing);
  };

  const handleStop = () => {
    setPlaying(false);
    setPlayed(0);
    playerRef.current?.seekTo(0);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    setMuted(value[0] === 0);
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0] / 100);
    playerRef.current?.seekTo(value[0] / 100);
  };

  const handleProgress = (state: { played: number; loaded: number; playedSeconds: number; loadedSeconds: number }) => {
    setPlayed(state.played);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const loadMedia = () => {
    if (url) {
      setPlaying(true);
      setIsReady(false);
      // Try to parse title from URL for display
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Keep generic or preset title if set
        if (title === "No Media Loaded" || title === "Web Stream") setTitle("YouTube Video");
      } else if (url.includes("soundcloud.com")) {
        setTitle("SoundCloud Track");
      } else {
        setTitle("Web Stream");
      }
      // toast.success("Loading media..."); // Assuming toast is defined elsewhere
    }
  };

  const loadPreset = (preset: { title: string; url: string }) => {
    setUrl(preset.url);
    setTitle(preset.title);
    setPlaying(true);
    setShowPresets(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceIcon = () => {
    if (url.includes("youtube") || url.includes("youtu.be")) return <Youtube className="w-4 h-4 text-red-500" />;
    return <Radio className="w-4 h-4 text-blue-400" />;
  };

  // Sidebar / Compact Mode
  if (variant === 'sidebar') {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col">
        {/* Media Display Area */}
        <div className="relative bg-zinc-900 border-b border-white/5 min-h-[60px] flex items-center justify-center overflow-hidden">
          {showVideo && url ? (
            <div className="absolute inset-0 z-0">
              <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                volume={muted ? 0 : volume[0]}
                muted={muted}
                onReady={() => setIsReady(true)}
                onProgress={handleProgress}
                onDuration={handleDuration}
                width="100%"
                height="100%"
                controls={false}
                config={{
                  youtube: { playerVars: { showinfo: 0, controls: 0 } }
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 z-10 w-full">
              {playing && url ? (
                // Hidden player for audio-only mode
                <div className="hidden">
                  <ReactPlayer
                    ref={playerRef}
                    url={url}
                    playing={playing}
                    volume={muted ? 0 : volume[0]}
                    muted={muted}
                    onReady={() => setIsReady(true)}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    width="0"
                    height="0"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-1 w-full justify-center">
                {getSourceIcon()}
                <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{title}</h4>
              </div>
              {playing && (
                <div className="flex gap-0.5 h-3 items-end">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-1 bg-green-500 animate-pulse rounded-t-sm"
                      style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle Video Button */}
          {url && (url.includes("youtube") || url.includes("youtu.be")) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 z-20 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setShowVideo(!showVideo)}
            >
              {showVideo ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
          )}
        </div>

        {/* Input Area / Quick Select */}
        <div className="p-2 border-b border-white/5">
          {!showPresets ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => setShowPresets(true)}
              >
                <ListMusic className="w-4 h-4" />
              </Button>
              <div className="relative flex-1">
                <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                <Input
                  placeholder="Paste Link..."
                  className="h-7 pl-7 text-[10px] bg-black/20 border-white/10 text-white placeholder:text-zinc-600"
                  value={url}
                  onChange={handleUrlChange}
                  onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-zinc-400">QUICK PLAYS</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowPresets(false)}>
                  <Minimize2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {QUICK_PLAYS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <Youtube className="w-3 h-3 text-red-500" />
                    <span className="text-[11px] text-zinc-300 truncate">{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-3 space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <Slider
              value={[played * 100]}
              onValueChange={handleSeekChange}
              max={100}
              className="cursor-pointer media-slider"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>{formatTime(played * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Play/Pause & Volume */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleToggleMute} className="h-6 w-6 text-zinc-400 hover:text-white">
                {muted || volume[0] === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-16 media-slider"
              />
            </div>

            <Button
              size="icon"
              onClick={handlePlayPause}
              className={`h-8 w-8 rounded-full shadow-lg ${playing ? 'bg-white text-black' : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </Button>
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

  // Full Mode (can be expanded later if needed)
  return (
    <Card className="bg-zinc-900 border-white/5">
      <CardContent className="p-6">
        <div className="text-center text-white mb-4">
          <h3 className="text-xl font-bold">Universal Media Player</h3>
          <p className="text-sm text-zinc-400">Play any stream directly in your dashboard</p>
        </div>
        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 relative">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={playing}
            volume={muted ? 0 : volume[0]}
            muted={muted}
            controls={true}
            width="100%"
            height="100%"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Paste Video or Stream URL..."
            value={url}
            onChange={handleUrlChange}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Button onClick={loadMedia}>Load Media</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;
