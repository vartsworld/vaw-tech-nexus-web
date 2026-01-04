import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music, Search } from "lucide-react";

interface SpotifyWidgetProps {
  userId: string;
}

const SpotifyWidget = ({ userId }: SpotifyWidgetProps) => {
  const [spotifyUrl, setSpotifyUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M");
  const [inputUrl, setInputUrl] = useState("");

  const handleLoadPlaylist = () => {
    if (!inputUrl.trim()) return;
    
    // Convert regular Spotify URL to embed URL
    let embedUrl = inputUrl;
    if (inputUrl.includes("open.spotify.com") && !inputUrl.includes("/embed/")) {
      embedUrl = inputUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
    }
    setSpotifyUrl(embedUrl);
    setInputUrl("");
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-green-400" />
          Spotify
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Embedded Spotify Player */}
        <div className="rounded-lg overflow-hidden">
          <iframe
            src={spotifyUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        </div>

        {/* Custom Playlist Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Paste Spotify playlist URL..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadPlaylist()}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-8"
          />
          <Button
            size="sm"
            onClick={handleLoadPlaylist}
            className="bg-green-500 hover:bg-green-600 h-8 px-3"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-white/40 text-center">
          Paste any Spotify playlist, album, or track URL
        </p>
      </CardContent>
    </Card>
  );
};

export default SpotifyWidget;