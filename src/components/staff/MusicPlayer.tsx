import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Shuffle, 
  Repeat,
  Music
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  album: string;
}

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>({
    id: "1",
    title: "Lofi Hip Hop Beat",
    artist: "ChillVibes",
    duration: "3:42",
    album: "Focus Sessions"
  });
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState([30]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const playlist = [
    { id: "1", title: "Lofi Hip Hop Beat", artist: "ChillVibes", duration: "3:42", album: "Focus Sessions" },
    { id: "2", title: "Ambient Workspace", artist: "FocusFlow", duration: "4:15", album: "Productivity Sounds" },
    { id: "3", title: "Coffee Shop Jazz", artist: "Jazz Collective", duration: "2:58", album: "Work Cafe" },
    { id: "4", title: "Rain & Piano", artist: "Nature Sounds", duration: "5:20", album: "Calm Focus" },
  ];

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextTrack = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentTrack(playlist[nextIndex]);
  };
  
  const prevTrack = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrack(playlist[prevIndex]);
  };

  return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1:15</span>
            <span>{currentTrack.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsShuffled(!isShuffled)}
            className={`text-gray-400 hover:text-white ${isShuffled ? 'text-green-400' : ''}`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={prevTrack} className="text-gray-400 hover:text-white">
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black hover:bg-gray-200"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={nextTrack} className="text-gray-400 hover:text-white">
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRepeating(!isRepeating)}
            className={`text-gray-400 hover:text-white ${isRepeating ? 'text-green-400' : ''}`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-8">{volume[0]}</span>
        </div>

        {/* Now Playing Indicator */}
        {isPlaying && (
          <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-green-400 rounded animate-pulse"></div>
              <div className="w-1 h-2 bg-green-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-2 bg-green-400 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>
            <span>Now Playing</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MusicPlayer;