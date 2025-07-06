import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2,
  Headphones,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpotifyWidgetProps {
  userId: string;
}

const SpotifyWidget = ({ userId }: SpotifyWidgetProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const { toast } = useToast();

  // Mock current track for demo
  const mockTrack = {
    name: "Coding Vibes",
    artist: "Lo-Fi Hip Hop",
    album: "Focus Beats 2024",
    duration: "3:42",
    progress: "1:23"
  };

  const connectSpotify = () => {
    // For demo purposes, we'll simulate connection
    toast({
      title: "Spotify Integration",
      description: "Spotify integration coming soon! Connect your account to control music.",
    });
    
    // Simulate connection after delay
    setTimeout(() => {
      setIsConnected(true);
      setCurrentTrack(mockTrack);
      toast({
        title: "Demo Mode",
        description: "Showing mock Spotify controls. Real integration coming soon!",
      });
    }, 1500);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Paused" : "Playing",
      description: `${currentTrack?.name} by ${currentTrack?.artist}`,
    });
  };

  const skipTrack = (direction: 'forward' | 'back') => {
    toast({
      title: "Track Skipped",
      description: `Skipped ${direction === 'forward' ? 'to next' : 'to previous'} track`,
    });
  };

  if (!isConnected) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5" />
            Spotify
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Headphones className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Connect Your Music</h3>
            <p className="text-white/60 text-sm mb-4">
              Connect Spotify to control your music without leaving the dashboard
            </p>
            
            <Button
              onClick={connectSpotify}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Music className="w-4 h-4 mr-2" />
              Connect Spotify
            </Button>
          </div>

          <div className="text-xs text-white/50 text-center">
            Listen to your favorite music while working<br/>
            Full integration coming soon!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Spotify
          </div>
          <Badge className="bg-green-500 text-white">
            Connected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Track */}
        {currentTrack && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">
                  {currentTrack.name}
                </h4>
                <p className="text-white/70 text-sm truncate">
                  {currentTrack.artist}
                </p>
                <p className="text-white/50 text-xs truncate">
                  {currentTrack.album}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => window.open('https://open.spotify.com', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
              <span>{currentTrack.progress}</span>
              <div className="flex-1 bg-white/20 rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full w-1/3"></div>
              </div>
              <span>{currentTrack.duration}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => skipTrack('back')}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-12 h-12"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => skipTrack('forward')}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            My Playlists
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Discover
          </Button>
        </div>

        <div className="text-xs text-white/50 text-center">
          Enjoy your music while staying productive!
        </div>
      </CardContent>
    </Card>
  );
};

export default SpotifyWidget;