import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  ExternalLink,
  Headphones
} from "lucide-react";

interface SpotifyWidgetProps {
  userId: string;
}

const SpotifyWidget = ({ userId }: SpotifyWidgetProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasOpenedSpotify, setHasOpenedSpotify] = useState(false);

  const openSpotify = () => {
    window.open('https://open.spotify.com', '_blank');
    setHasOpenedSpotify(true);
  };

  if (!hasOpenedSpotify) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-green-400" />
            Spotify
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Headphones className="w-14 h-14 text-green-400/50 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Listen While You Work</h3>
            <p className="text-white/60 text-sm mb-4">
              Open Spotify to play your favorite music
            </p>
            
            <Button
              onClick={openSpotify}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Spotify
            </Button>
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
            <Music className="w-5 h-5 text-green-400" />
            Spotify
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
            onClick={openSpotify}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Now Playing Display */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
              <Music className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                {isPlaying ? "Now Playing" : "Paused"}
              </p>
              <h4 className="text-white font-medium">
                Playing on Spotify
              </h4>
              <p className="text-white/60 text-sm">
                Control from Spotify app
              </p>
            </div>
          </div>
        </div>

        {/* Simple Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={openSpotify}
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={openSpotify}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-xs text-white/40 text-center">
          Use Spotify to control playback
        </p>
      </CardContent>
    </Card>
  );
};

export default SpotifyWidget;