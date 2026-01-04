import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
  Search,
  Loader2,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

interface SpotifySession {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

interface MusicPlayerProps {
  userId?: string;
}

const MusicPlayer = ({ userId }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState([0]);


  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check for Spotify session
  useEffect(() => {
    const checkSpotifySession = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        const { data: session, error } = await supabase
          .from('user_spotify_sessions')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching Spotify session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.access_token) {
          // Check if token is expired
          const expiresAt = session.expires_at ? new Date(session.expires_at) : null;
          const now = new Date();

          if (expiresAt && expiresAt > now) {
            setSpotifyToken(session.access_token);
            setIsConnected(true);
          } else if (session.refresh_token) {
            // Token expired, need to refresh - for now just show as disconnected
            setIsConnected(false);
          }
        }
      } catch (error) {
        console.error('Error checking Spotify session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSpotifySession();
  }, []);

  const fetchDevices = useCallback(async () => {
    if (!spotifyToken) return null;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });

      if (response.status === 401) {
        setIsConnected(false);
        setSpotifyToken(null);
        return null;
      }

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
  }, [spotifyToken]);

  useEffect(() => {
    if (isConnected && spotifyToken) {
      fetchDevices();
    }
  }, [fetchDevices, isConnected, spotifyToken]);

  // Sync volume with Spotify
  useEffect(() => {
    if (!activeDeviceId || !spotifyToken) return;
    const syncVolume = async () => {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume[0]}&device_id=${activeDeviceId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
      } catch (error) { }
    };
    const debounce = setTimeout(syncVolume, 500);
    return () => clearTimeout(debounce);
  }, [volume, activeDeviceId, spotifyToken]);

  // Polling for playback state
  useEffect(() => {
    if (!isConnected || !spotifyToken) return;

    const pollPlayback = async () => {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });

        if (response.status === 401) {
          setIsConnected(false);
          setSpotifyToken(null);
          return;
        }

        if (response.status === 200) {
          const data = await response.json();
          setIsPlaying(data.is_playing);
          if (data.item) {
            const durationMs = data.item.duration_ms || 1;
            const progressMs = data.progress_ms || 0;

            setCurrentTrack({
              id: data.item.id,
              title: data.item.name,
              artist: data.item.artists.map((a: any) => a.name).join(", "),
              duration: formatTime(Math.floor(durationMs / 1000)),
              album: data.item.album.name,
              uri: data.item.uri,
              image: data.item.album.images[0]?.url,
              duration_ms: durationMs
            });

            const progressVal = Math.min(100, Math.max(0, Math.floor((progressMs / durationMs) * 100)));
            setProgress([progressVal]);
          }
        }
      } catch (error) { }
    };

    const interval = setInterval(pollPlayback, 5000);
    pollPlayback();
    return () => clearInterval(interval);
  }, [isConnected, spotifyToken]);

  const searchTracks = async (query: string) => {
    if (!query.trim() || !spotifyToken) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
      const data = await response.json();

      if (data.error) {
        if (data.error.status === 401) {
          toast.error("Spotify session expired. Please reconnect.");
          setIsConnected(false);
          setSpotifyToken(null);
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
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = async (track: Track) => {
    if (!spotifyToken) return;

    let deviceId = activeDeviceId;
    if (!deviceId) {
      deviceId = await fetchDevices();
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.uri]
        })
      });

      if (response.status === 204) {
        setCurrentTrack(track);
        setIsPlaying(true);
        toast.success(`Playing: ${track.title}`);
      } else {
        const data = await response.json();
        if (data.error?.reason === "NO_ACTIVE_DEVICE" || !deviceId) {
          toast.error("Please open Spotify on a device first.");
        }
      }
    } catch (error) {
      toast.error("Failed to start playback");
    }
  };

  const togglePlay = async () => {
    if (!currentTrack || !spotifyToken) return;
    const endpoint = isPlaying ? 'pause' : 'play';
    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
      if (response.status === 204) setIsPlaying(!isPlaying);
    } catch (error) { }
  };

  const nextTrack = async () => {
    if (!spotifyToken) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/next${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
    } catch (error) { }
  };

  const prevTrack = async () => {
    if (!spotifyToken) return;
    try {
      await fetch(`https://api.spotify.com/v1/me/player/previous${activeDeviceId ? `?device_id=${activeDeviceId}` : ''}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
    } catch (error) { }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnectSpotify = () => {
    // Open Spotify in a new tab - users can listen there while working
    window.open('https://open.spotify.com', '_blank');
    toast.info("Listen on Spotify while you work! Full integration coming soon.");
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-white/5 shadow-2xl">
        <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Not connected - show connect UI
  if (!isConnected) {
    return (
      <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-green-950/30 border-white/5 shadow-2xl overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
              <Music className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-900">
              <span className="text-lg">🎧</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Spotify Music</h3>
            <p className="text-zinc-400 max-w-[300px]">
              Listen to your favorite music while you work
            </p>
          </div>

          <Button
            onClick={handleConnectSpotify}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-6 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Open Spotify
          </Button>

          <p className="text-xs text-zinc-600">
            🎵 Play music on Spotify while staying productive!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="lg:col-span-1 xl:col-span-8 flex flex-col lg:flex-row gap-6">
      {/* Player Section */}
      <Card className="flex-1 bg-zinc-900 border-white/5 shadow-2xl overflow-hidden relative min-w-[320px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0"></div>
        {currentTrack?.image && (
          <img
            src={currentTrack.image}
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-150 rotate-12"
            alt=""
          />
        )}

        <CardContent className="p-8 relative z-10 h-full flex flex-col justify-between min-h-[450px]">
          <div className="flex justify-between items-start mb-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold tracking-widest px-3 py-1">SPOTIFY CONNECTED</Badge>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-1 h-4 bg-green-500 rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="aspect-square w-48 sm:w-64 mx-auto rounded-2xl shadow-2xl border-4 border-white/10 overflow-hidden group relative">
              {currentTrack?.image ? (
                <img src={currentTrack.image} alt={currentTrack.album} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Music className="w-20 h-20 text-zinc-700 animate-pulse" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-2xl sm:text-3xl font-black text-white truncate px-4 tracking-tighter">
                {currentTrack?.title || "Ready to Rock?"}
              </h4>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                {currentTrack?.artist || "Search for your favorite tracks"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                className="music-slider-redesign"
              />
              <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-500">
                <span>{formatTime(Math.floor((progress[0] / 100) * (currentTrack?.duration_ms || 0) / 1000))}</span>
                <span>{currentTrack?.duration || "0:00"}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <Button variant="ghost" onClick={prevTrack} className="hover:bg-white/5 text-zinc-400 hover:text-white transition-all transform active:scale-90 h-10 w-10 p-0">
                <SkipBack className="w-6 h-6 fill-current" />
              </Button>
              <Button
                onClick={togglePlay}
                disabled={!currentTrack}
                className={`w-16 h-16 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${isPlaying ? 'bg-white text-black' : 'bg-green-500 text-white'
                  }`}
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
              </Button>
              <Button variant="ghost" onClick={nextTrack} className="hover:bg-white/5 text-zinc-400 hover:text-white transition-all transform active:scale-90 h-10 w-10 p-0">
                <SkipForward className="w-6 h-6 fill-current" />
              </Button>
            </div>

            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
              <Volume2 className="w-4 h-4 text-zinc-500" />
              <Slider value={volume} onValueChange={setVolume} max={100} className="volume-slider-redesign" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Results Section */}
      <Card className="flex-[1.2] bg-zinc-900/80 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[600px] lg:max-h-none h-full">
        <CardHeader className="p-6 border-b border-white/5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchTracks(e.target.value);
              }}
              placeholder="Search artists, tracks, or albums..."
              className="pl-12 h-14 bg-black/40 border-white/10 text-white rounded-2xl text-lg font-medium focus:ring-green-500/50"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {isSearching ? (
              <div className="flex items-center justify-center p-20">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 p-4 gap-2">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all group text-left border border-transparent hover:border-white/10"
                  >
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                      <img src={track.image} alt={track.album} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate group-hover:text-green-400 transition-colors">{track.title}</p>
                      <p className="text-zinc-500 text-sm truncate font-medium">{track.artist}</p>
                    </div>
                    <div className="text-zinc-600 font-mono text-xs pr-2">{track.duration}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div className="p-6 bg-zinc-800 rounded-full">
                  <Search className="w-12 h-12 text-zinc-600" />
                </div>
                <div>
                  <h5 className="text-white font-bold text-xl tracking-tight">Discover Music</h5>
                  <p className="text-zinc-500 max-w-[200px] mx-auto text-sm">Tune in to your vibe while you grind.</p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="p-4 bg-black/40 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Powered by Spotify API v1</p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        .music-slider-redesign [role="slider"] {
          width: 0px;
          height: 0px;
        }
        .music-slider-redesign .relative {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 99px;
        }
        .music-slider-redesign [style*="width"] {
          background: linear-gradient(90deg, #22c55e, #10b981);
          box-shadow: 0 0 10px rgba(34,197,94,0.4);
        }
        .volume-slider-redesign .relative {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
