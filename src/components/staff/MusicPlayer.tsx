import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Music,
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const SPOTIFY_TOKEN = 'BQAMvAVielEOOCS2BdwabtzthdbCixyq6MxFtA-5NwjhjVnMRnT18V8REF5bFEeAGPeBhbkvRTt7qXyQxD5fLJjxX4TNtOyTY5LSaCxtaElEKwrDvanFL0pTChhEp82jzwWQKkkXMwYoc3uqTssmSb57VwnBfHc7236Nacr08ZE-AosBgZNm0wlx_SP5kwC4iHrFUDvGXtC42iOHpnY-jYfLnoVY8mcpDHuDZk05ocT2ZGk96CpSLUDMP-AqlnMm37XdoQdakCsuOZOpSc3Nx9YzWwJrwVMThUs_vnY1fmnHpKD0u7eJAVa5bTy5gKx2drDi';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  album: string;
  uri: string;
  image?: string;
  duration_ms: number;
}

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState([0]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('https://api.spotify.org/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${SPOTIFY_TOKEN}`
        }
      });
      const data = await response.json();
      if (data.devices && data.devices.length > 0) {
        const active = data.devices.find((d: any) => d.is_active) || data.devices[0];
        setActiveDeviceId(active.id);
        return active.id;
      }
      return null;
    } catch (error) {
      console.error("Error fetching Spotify devices:", error);
      return null;
    }
  }, []);

  // Initialize: Get active device
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const searchTracks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://api.spotify.org/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
          'Authorization': `Bearer ${SPOTIFY_TOKEN}`
        }
      });
      const data = await response.json();

      if (data.error) {
        if (data.error.status === 401) {
          toast.error("Spotify token expired. Please update the token.");
        } else {
          toast.error(`Spotify Error: ${data.error.message}`);
        }
        return;
      }

      const tracks: Track[] = data.tracks.items.map((item: any) => ({
        id: item.id,
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(", "),
        duration: formatTime(Math.floor(item.duration_ms / 1000)),
        album: item.album.name,
        uri: item.uri,
        image: item.album.images[0]?.url,
        duration_ms: item.duration_ms
      }));
      setSearchResults(tracks);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search tracks");
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = async (track: Track) => {
    let deviceId = activeDeviceId;
    if (!deviceId) {
      deviceId = await fetchDevices();
    }

    try {
      const response = await fetch(`https://api.spotify.org/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SPOTIFY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      });

      if (response.status === 204) {
        setCurrentTrack(track);
        setIsPlaying(true);
        setSearchQuery("");
        setSearchResults([]);
        toast.success(`Playing: ${track.title}`);
      } else {
        const data = await response.json();
        if (data.error?.reason === "NO_ACTIVE_DEVICE" || !deviceId) {
          toast.error("Please open Spotify on a device first.");
        } else {
          toast.error(`Playback error: ${data.error?.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Failed to start playback");
    }
  };

  const togglePlay = async () => {
    if (!currentTrack) return;

    const endpoint = isPlaying ? 'pause' : 'play';
    try {
      const response = await fetch(`https://api.spotify.org/v1/me/player/${endpoint}${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SPOTIFY_TOKEN}`
        }
      });

      if (response.status === 204) {
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      toast.error("Error toggling playback");
    }
  };

  // Sync volume with Spotify
  useEffect(() => {
    if (!activeDeviceId) return;
    const syncVolume = async () => {
      try {
        await fetch(`https://api.spotify.org/v1/me/player/volume?volume_percent=${volume[0]}&device_id=${activeDeviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${SPOTIFY_TOKEN}` }
        });
      } catch (error) { }
    };
    const debounce = setTimeout(syncVolume, 500);
    return () => clearTimeout(debounce);
  }, [volume, activeDeviceId]);

  // Polling for playback state
  useEffect(() => {
    const pollPlayback = async () => {
      try {
        const response = await fetch('https://api.spotify.org/v1/me/player', {
          headers: { 'Authorization': `Bearer ${SPOTIFY_TOKEN}` }
        });
        if (response.status === 200) {
          const data = await response.json();
          setIsPlaying(data.is_playing);
          if (data.item) {
            setCurrentTrack({
              id: data.item.id,
              title: data.item.name,
              artist: data.item.artists.map((a: any) => a.name).join(", "),
              duration: formatTime(Math.floor(data.item.duration_ms / 1000)),
              album: data.item.album.name,
              uri: data.item.uri,
              image: data.item.album.images[0]?.url,
              duration_ms: data.item.duration_ms
            });
            setProgress([Math.floor((data.progress_ms / data.item.duration_ms) * 100)]);
          }
        }
      } catch (error) { }
    };

    const interval = setInterval(pollPlayback, 5000);
    pollPlayback();
    return () => clearInterval(interval);
  }, []);

  const nextTrack = async () => {
    try {
      await fetch(`https://api.spotify.org/v1/me/player/next${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SPOTIFY_TOKEN}` }
      });
      // In a real app, we'd poll for the new track info
    } catch (error) { }
  };

  const prevTrack = async () => {
    try {
      await fetch(`https://api.spotify.org/v1/me/player/previous${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SPOTIFY_TOKEN}` }
      });
    } catch (error) { }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>

      <CardContent className="p-4 relative z-10">
        {/* Search Header */}
        <div className="relative mb-4">
          <div className="relative flex items-center group">
            <Search className="absolute left-3 w-4 h-4 text-gray-500 group-focus-within:text-green-400 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchTracks(e.target.value);
              }}
              placeholder="Search Spotify..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-green-500/50 focus:border-green-500/50 h-9 text-sm rounded-full transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 w-4 h-4 text-green-400 animate-spin" />
            )}
          </div>

          {/* Search Results Overlay */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64">
              <ScrollArea className="h-full">
                <div className="p-1">
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                        {track.image ? (
                          <img src={track.image} alt={track.album} className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 m-auto text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-green-400">
                          {track.title}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {track.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Current Track Display */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center shadow-lg border border-white/5 group-hover:border-green-500/30 transition-all overflow-hidden">
            {currentTrack?.image ? (
              <img src={currentTrack.image} alt={currentTrack.album} className="w-full h-full object-cover" />
            ) : (
              <Music className={`${isPlaying ? 'w-8 h-8 text-green-400' : 'w-8 h-8 text-gray-600'} transition-colors animate-pulse`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold truncate text-base">
              {currentTrack?.title || "No Track Selected"}
            </h4>
            <p className="text-gray-400 text-sm truncate uppercase tracking-wider font-medium">
              {currentTrack?.artist || "Search to start playing"}
            </p>
            {isPlaying && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-green-500 rounded-full animate-[sound-bar_1.2s_ease-in-out_infinite]"></div>
                  <div className="w-0.5 h-3 bg-green-500 rounded-full animate-[sound-bar_1.2s_ease-in-out_0.2s_infinite]"></div>
                  <div className="w-0.5 h-3 bg-green-500 rounded-full animate-[sound-bar_1.2s_ease-in-out_0.4s_infinite]"></div>
                </div>
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Live from Spotify</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={1}
            className="w-full music-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1.5">
            <span>{formatTime(Math.floor((progress[0] / 100) * (currentTrack?.duration_ms || 0) / 1000))}</span>
            <span>{currentTrack?.duration || "0:00"}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShuffled(!isShuffled)}
            className={`h-8 w-8 hover:bg-white/5 transition-all ${isShuffled ? 'text-green-400' : 'text-gray-500'}`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevTrack}
              className="text-gray-300 hover:text-white hover:bg-white/5 h-10 w-10 transition-all font-bold"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </Button>

            <Button
              onClick={togglePlay}
              disabled={!currentTrack}
              className={`w-12 h-12 rounded-full shadow-lg transition-all transform active:scale-95 ${isPlaying
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-green-500 text-white hover:bg-green-400 scale-110 shadow-green-500/20'
                }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextTrack}
              className="text-gray-300 hover:text-white hover:bg-white/5 h-10 w-10 transition-all"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRepeating(!isRepeating)}
            className={`h-8 w-8 hover:bg-white/5 transition-all ${isRepeating ? 'text-green-400' : 'text-gray-500'}`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mt-6 bg-white/5 p-2 rounded-full px-4">
          <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1 volume-slider"
          />
        </div>
      </CardContent>

      <style>{`
        @keyframes sound-bar {
          0%, 100% { height: 4px; opacity: 0.5; }
          50% { height: 12px; opacity: 1; }
        }
        .music-slider [role="slider"] {
          width: 0px;
          height: 0px;
        }
        .music-slider .relative {
          height: 4px;
        }
        .volume-slider .relative {
          height: 3px;
        }
      `}</style>
    </Card>
  );
};

export default MusicPlayer;