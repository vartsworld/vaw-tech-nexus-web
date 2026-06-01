import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStaffData } from "@/hooks/useStaffData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Video,
  Users,
  Calendar,
  Clock,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  FileText,
  LogOut,
  MonitorOff,
  Maximize,
  Minimize,
  Settings,
  UserPlus
} from "lucide-react";

// Video component
const VideoPlayer = ({ stream, isLocal, name, isMuted, isVideoOff, profileImage, onPin, isPinned, isActiveSpeaker, isAdmin, onAdminAction }: { stream: MediaStream | null, isLocal?: boolean, name?: string, isMuted?: boolean, isVideoOff?: boolean, profileImage?: string, onPin?: () => void, isPinned?: boolean, isActiveSpeaker?: boolean, isAdmin?: boolean, onAdminAction?: (action: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [computedAudioLevel, setComputedAudioLevel] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Simulate or compute active speaker via AudioContext
  useEffect(() => {
    if (!stream || isLocal || isVideoOff) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.minDecibels = -70;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.8;
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      
      const mediaStreamSource = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
      mediaStreamSource.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animationId: number;
      
      const checkAudioLevel = () => {
         analyser.getByteFrequencyData(dataArray);
         const sum = dataArray.reduce((a, b) => a + b, 0);
         const average = sum / dataArray.length;
         setComputedAudioLevel(average > 25);
         animationId = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      
      return () => {
         cancelAnimationFrame(animationId);
         audioContext.close();
      };
    } catch (e) {
      console.warn("AudioContext not supported or allowed", e);
    }
  }, [stream, isLocal, isVideoOff]);

  const active = isActiveSpeaker || computedAudioLevel;

  return (
    <div className={`relative aspect-video bg-zinc-900/60 rounded-2xl overflow-hidden border transition-all duration-300 group shadow-lg ${active ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-white/10'}`}>
       {isVideoOff ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
             <Avatar className={`w-24 h-24 border-4 transition-colors ${active ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-white/10'}`}>
               <AvatarImage src={profileImage} />
               <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-3xl text-white font-bold">
                 {name?.charAt(0) || 'U'}
               </AvatarFallback>
             </Avatar>
             <span className="mt-3 text-white/70 text-sm font-medium">{name}</span>
          </div>
       ) : (
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted={isLocal} 
           className={`w-full h-full object-cover transition-transform ${isLocal ? 'scale-x-[-1]' : ''}`}
         />
       )}
       
       <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
         <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
           <span className="text-white text-xs font-semibold tracking-wide">{name || 'User'}</span>
           {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
         </div>
       </div>

       <div className="absolute top-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
             <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10" onClick={onPin}>
                {isPinned ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
             </Button>
          )}
          {isAdmin && !isLocal && onAdminAction && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10">
                      <Settings className="w-4 h-4" />
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white">
                   <DropdownMenuItem onClick={() => onAdminAction('mute')} className="hover:bg-white/10 cursor-pointer">Mute Microphone</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onAdminAction('disable_video')} className="hover:bg-white/10 cursor-pointer">Disable Camera</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onAdminAction('kick')} className="text-red-400 focus:text-red-300 hover:bg-red-500/20 cursor-pointer">Remove from Meeting</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          )}
       </div>
    </div>
  );
};

const MeetingRoom = () => {
  const { profile, teamMembers } = useStaffData();
  
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream, profile: any, isVideoOff?: boolean, isMuted?: boolean }>>({});
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>(() => {
    const stored = localStorage.getItem('vaw_scheduled_meetings');
    if (stored) return JSON.parse(stored);
    return [
      {
        title: "Daily Standup",
        time: "10:00 AM",
        duration: "15 min",
        attendees: 6,
        status: "Starting Soon",
        type: "Team Meeting"
      }
    ];
  });
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleRecurring, setScheduleRecurring] = useState("none");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.is_department_head === true;

  // Auto-join from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('ID');
    if (id && !inRoom && profile?.user_id) {
      setRoomId(id);
      setRoomIdInput(id);
      setInRoom(true);
    }
  }, [profile?.user_id]);

  // Update URL on room change
  useEffect(() => {
    if (inRoom && roomId) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', 'meeting');
      url.searchParams.set('ID', roomId);
      window.history.pushState({}, '', url.toString());
    } else if (!inRoom) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ID');
      window.history.pushState({}, '', url.toString());
    }
  }, [inRoom, roomId]);

  const handleJoin = () => {
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Meeting ID");
      return;
    }
    setRoomId(roomIdInput.trim().toLowerCase());
    setInRoom(true);
  };
  
  const handleStartNew = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomIdInput(newRoomId);
    setRoomId(newRoomId);
    setInRoom(true);
  };

  const handleScheduleMeeting = () => {
    if (!newMeetingTitle.trim()) return;
    const meetingId = Math.random().toString(36).substring(2, 9);
    const meetingLink = `${window.location.origin}${window.location.pathname}?room=meeting&ID=${meetingId}`;
    const newMeeting = {
      title: newMeetingTitle,
      time: scheduleTime || new Date(Date.now() + 3600000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      date: scheduleDate || new Date().toLocaleDateString(),
      duration: "30 min",
      status: "Scheduled",
      type: scheduleRecurring !== 'none' ? `Recurring (${scheduleRecurring})` : "Custom Meeting",
      link: meetingLink
    };
    const updated = [newMeeting, ...upcomingMeetings];
    setUpcomingMeetings(updated);
    localStorage.setItem('vaw_scheduled_meetings', JSON.stringify(updated));
    setNewMeetingTitle("");
    setScheduleDate("");
    setScheduleTime("");
    setScheduleRecurring("none");
    setIsScheduleOpen(false);
    toast.success("Meeting Scheduled!");
  };

  const handleInvite = async (memberId: string) => {
    const channel = supabase.channel(`profile-updates-${memberId}`);
    await channel.subscribe(async (status) => {
       if (status === 'SUBSCRIBED') {
           await channel.send({
               type: 'broadcast',
               event: 'meeting_invite',
               payload: {
                   roomId,
                   senderName: profile?.full_name
               }
           });
           supabase.removeChannel(channel);
           toast.success("Invite sent successfully!");
       }
    });
  };
  
  const createPeerConnection = (peerId: string, peerProfile: any, isInitiator: boolean, currentStream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    currentStream.getTracks().forEach(track => {
      pc.addTrack(track, currentStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc',
          payload: {
            type: 'ice-candidate',
            senderId: profile?.user_id,
            targetId: peerId,
            candidate: event.candidate,
            senderProfile: profile
          }
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          stream: event.streams[0],
          profile: peerProfile
        }
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
        delete peersRef.current[peerId];
        if (pinnedId === peerId) setPinnedId(null);
      }
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc',
          payload: {
            type: 'offer',
            senderId: profile?.user_id,
            targetId: peerId,
            sdp: pc.localDescription,
            senderProfile: profile
          }
        });
      });
    }

    peersRef.current[peerId] = pc;
    return pc;
  };

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    
    const startMeeting = async () => {
      if (!inRoom || !roomId || !profile?.user_id) return;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        const channel = supabase.channel(`room:${roomId}`, {
          config: {
            presence: { key: profile.user_id }
          }
        });
        channelRef.current = channel;
        
        channel.on('presence', { event: 'sync' }, () => {
          if (!active) return;
          const state = channel.presenceState();
          Object.keys(state).forEach(presId => {
            const presences = state[presId] as any[];
            if (presences && presences.length > 0) {
              const peerPresence = presences[0];
              const peerId = peerPresence.user_id;
              
              if (peerId && peerId !== profile.user_id && !peersRef.current[peerId]) {
                if (profile.user_id < peerId) {
                  createPeerConnection(peerId, peerPresence.profile, true, stream!);
                }
              }
              // Sync video/audio states from presence payload
              if (peerId && peerId !== profile.user_id) {
                setRemoteStreams(prev => {
                  if (!prev[peerId]) return prev;
                  return {
                    ...prev,
                    [peerId]: {
                      ...prev[peerId],
                      isVideoOff: peerPresence.isVideoOff,
                      isMuted: peerPresence.isMuted
                    }
                  }
                });
              }
            }
          });
        });
        
        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
           if (!active) return;
           const peerId = leftPresences[0]?.user_id;
           if (peerId && peersRef.current[peerId]) {
             peersRef.current[peerId].close();
             delete peersRef.current[peerId];
             setRemoteStreams(prev => {
               const next = { ...prev };
               delete next[peerId];
               return next;
             });
             if (pinnedId === peerId) setPinnedId(null);
           }
        });

        channel.on('broadcast', { event: 'webrtc' }, async (payload) => {
          if (!active) return;
          const { type, senderId, targetId, sdp, candidate, senderProfile } = payload.payload;
          if (targetId !== profile.user_id) return; 
          
          let pc = peersRef.current[senderId];
          
          if (type === 'offer') {
            if (!pc) {
              pc = createPeerConnection(senderId, senderProfile, false, stream!);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            channel.send({
              type: 'broadcast',
              event: 'webrtc',
              payload: {
                type: 'answer',
                senderId: profile.user_id,
                targetId: senderId,
                sdp: pc.localDescription,
                senderProfile: profile
              }
            });
          } else if (type === 'answer') {
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
          } else if (type === 'ice-candidate') {
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
            }
          }
        });

        channel.on('broadcast', { event: 'admin_action' }, (payload) => {
          if (!active) return;
          const { action, targetId } = payload.payload;
          if (targetId === profile.user_id) {
             if (action === 'mute') {
                 if (localStreamRef.current) {
                     const audioTrack = localStreamRef.current.getAudioTracks()[0];
                     if (audioTrack && audioTrack.enabled) {
                         audioTrack.enabled = false;
                         setIsMuted(true);
                         updatePresenceState(true, isVideoOff);
                         toast.warning("An admin muted your microphone");
                     }
                 }
             } else if (action === 'disable_video') {
                 if (localStreamRef.current) {
                     const videoTrack = localStreamRef.current.getVideoTracks()[0];
                     if (videoTrack && videoTrack.enabled) {
                         videoTrack.enabled = false;
                         setIsVideoOff(true);
                         updatePresenceState(isMuted, true);
                         toast.warning("An admin disabled your camera");
                     }
                 }
             } else if (action === 'kick') {
                 handleLeave();
                 toast.error("You were removed from the meeting by an admin");
             }
          }
        });
        
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && active) {
            await channel.track({
              user_id: profile.user_id,
              profile: profile,
              online_at: new Date().toISOString(),
              isVideoOff: false,
              isMuted: false
            });
          }
        });
        
        toast.success(`Joined room: ${roomId}`);
      } catch (err) {
        console.error('Error starting media:', err);
        toast.error("Could not access camera/microphone. Please check permissions.");
        handleLeave();
      }
    };
    
    if (inRoom) {
      startMeeting();
    }
    
    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      setRemoteStreams({});
      setLocalStream(null);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [inRoom, roomId, profile?.user_id]);

  const updatePresenceState = async (muted: boolean, videoOff: boolean) => {
    if (channelRef.current) {
      await channelRef.current.track({
        user_id: profile?.user_id,
        profile: profile,
        online_at: new Date().toISOString(),
        isMuted: muted,
        isVideoOff: videoOff
      });
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsMuted(newMutedState);
        updatePresenceState(newMutedState, isVideoOff);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newVideoOffState = !videoTrack.enabled;
        setIsVideoOff(newVideoOffState);
        updatePresenceState(isMuted, newVideoOffState);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        const newStream = new MediaStream([screenTrack, localStreamRef.current!.getAudioTracks()[0]]);
        setLocalStream(newStream);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
           stopScreenShare();
        };
      } catch (e) {
        console.error('Error sharing screen:', e);
        toast.error("Failed to share screen");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      setLocalStream(localStreamRef.current);
    }
    setIsScreenSharing(false);
  };

  const handleAdminAction = (peerId: string, action: string) => {
    if (channelRef.current) {
        channelRef.current.send({
            type: 'broadcast',
            event: 'admin_action',
            payload: { action, targetId: peerId }
        });
        toast.success(`Action sent to user`);
    }
  };

  const handleLeave = () => {
    setInRoom(false);
    setRoomId("");
    setRoomIdInput("");
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setPinnedId(null);
  };

  if (!inRoom) {
    return (
      <div className="p-4 sm:p-6 space-y-8 relative z-10 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight uppercase">MEETING <span className="text-green-500">ROOM</span></h2>
          <p className="text-white/90 font-semibold bg-green-600/30 backdrop-blur-md inline-block px-4 py-1 rounded-full border border-green-500/30 shadow-lg">
            Collaborate and connect with your team! 📹
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-green-400" />
                Join or Start Meeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter Meeting ID..."
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 text-lg text-center font-mono tracking-widest shadow-inner rounded-xl"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleJoin} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-12 font-bold shadow-lg shadow-blue-500/20 border-none rounded-xl">
                    Join Room
                  </Button>
                  <Button onClick={handleStartNew} variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30 h-12 font-bold transition-colors rounded-xl">
                    Start New
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                 <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                    <DialogTrigger asChild>
                       <Button variant="secondary" className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 h-12 rounded-xl">
                          <Calendar className="w-5 h-5 mr-2" /> Schedule a Meeting
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px] rounded-2xl">
                       <DialogHeader>
                          <DialogTitle>Schedule a Meeting</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                             <label className="text-sm font-medium text-white/70">Meeting Title</label>
                             <Input 
                                placeholder="E.g., Weekly Sync" 
                                value={newMeetingTitle} 
                                onChange={e => setNewMeetingTitle(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Date</label>
                                <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70">Time</label>
                                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="bg-white/5 border-white/10 text-white [color-scheme:dark]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-sm font-medium text-white/70">Recurring Options</label>
                             <select value={scheduleRecurring} onChange={e => setScheduleRecurring(e.target.value)} className="w-full h-10 px-3 bg-zinc-900 border border-white/10 rounded-md text-white text-sm outline-none focus:border-white/30 transition-colors">
                                <option value="none">Does not repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                             </select>
                          </div>
                          <Button onClick={handleScheduleMeeting} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-12 mt-2 rounded-xl border-none">
                             Schedule Meeting
                          </Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col transition-all hover:bg-white/10 group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">{meeting.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 text-purple-400/70 shrink-0" />
                        {meeting.date && <span>{meeting.date} • </span>}{meeting.time} • {meeting.type || meeting.duration}
                      </div>
                    </div>
                    <Badge variant={meeting.status === 'Starting Soon' ? 'destructive' : 'secondary'} className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2 ${meeting.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-300' : ''}`}>
                      {meeting.status}
                    </Badge>
                  </div>
                  {meeting.link && (
                    <div className="mt-3 flex items-center gap-2">
                      <Input value={meeting.link} readOnly className="h-8 bg-black/40 border-white/10 text-xs text-white/50 px-2" />
                      <Button size="sm" variant="secondary" className="h-8 shrink-0 text-xs px-3" onClick={() => { navigator.clipboard.writeText(meeting.link); toast.success("Meeting link copied!"); }}>
                         Copy Link
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {upcomingMeetings.length === 0 && (
                 <div className="text-center text-white/50 text-sm py-8">No upcoming meetings.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active Meeting UI
  return (
    <div className="p-2 sm:p-4 lg:p-6 h-[calc(100vh-60px)] lg:h-[calc(100vh-80px)] flex flex-col relative z-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 sm:p-4 flex flex-col shadow-2xl overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto mb-4 custom-scrollbar">
          {pinnedId ? (
             <div className="flex flex-col lg:flex-row gap-4 h-full">
                <div className="lg:w-3/4 h-64 lg:h-full shrink-0 lg:shrink">
                   <VideoPlayer 
                      stream={pinnedId === 'local' ? localStream : remoteStreams[pinnedId]?.stream}
                      isLocal={pinnedId === 'local' && !isScreenSharing}
                      name={pinnedId === 'local' ? `${profile?.full_name || 'You'} (Me)` : remoteStreams[pinnedId]?.profile?.full_name}
                      isMuted={pinnedId === 'local' ? isMuted : remoteStreams[pinnedId]?.isMuted}
                      isVideoOff={pinnedId === 'local' ? isVideoOff : remoteStreams[pinnedId]?.isVideoOff}
                      profileImage={pinnedId === 'local' ? profile?.profile_photo_url || profile?.avatar_url : remoteStreams[pinnedId]?.profile?.profile_photo_url || remoteStreams[pinnedId]?.profile?.avatar_url}
                      isPinned={true}
                      onPin={() => setPinnedId(null)}
                      isAdmin={isAdmin}
                      onAdminAction={(action) => handleAdminAction(pinnedId, action)}
                   />
                </div>
                <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:w-1/4 h-32 lg:h-full p-1 custom-scrollbar">
                   {pinnedId !== 'local' && (
                       <div className="w-48 lg:w-full shrink-0">
                          <VideoPlayer stream={localStream} isLocal={!isScreenSharing} name={`${profile?.full_name || 'You'} (Me)`} isMuted={isMuted} isVideoOff={isVideoOff} profileImage={profile?.profile_photo_url || profile?.avatar_url} onPin={() => setPinnedId('local')} />
                       </div>
                   )}
                   {Object.entries(remoteStreams).filter(([id]) => id !== pinnedId).map(([peerId, data]) => (
                       <div key={peerId} className="w-48 lg:w-full shrink-0">
                          <VideoPlayer stream={data.stream} name={data.profile?.full_name} isMuted={data.isMuted} isVideoOff={data.isVideoOff} profileImage={data.profile?.profile_photo_url || data.profile?.avatar_url} onPin={() => setPinnedId(peerId)} isAdmin={isAdmin} onAdminAction={(action) => handleAdminAction(peerId, action)} />
                       </div>
                   ))}
                </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full content-start p-1 sm:p-2">
                <VideoPlayer 
                  stream={localStream} 
                  isLocal={!isScreenSharing} 
                  name={`${profile?.full_name || 'You'} (Me)`} 
                  isMuted={isMuted} 
                  isVideoOff={isVideoOff}
                  profileImage={profile?.profile_photo_url || profile?.avatar_url}
                  onPin={() => setPinnedId('local')}
                />
                {Object.entries(remoteStreams).map(([peerId, data]) => (
                  <VideoPlayer 
                    key={peerId} 
                    stream={data.stream} 
                    name={data.profile?.full_name || 'Team Member'} 
                    isMuted={data.isMuted}
                    isVideoOff={data.isVideoOff}
                    profileImage={data.profile?.profile_photo_url || data.profile?.avatar_url}
                    onPin={() => setPinnedId(peerId)}
                    isAdmin={isAdmin}
                    onAdminAction={(action) => handleAdminAction(peerId, action)}
                  />
                ))}
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="h-16 sm:h-20 shrink-0 flex items-center justify-between bg-black/60 rounded-2xl border border-white/10 px-2 sm:px-6 backdrop-blur-xl shadow-inner w-full">
          
          {/* Left: Room Badge (Hidden on very small screens) */}
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/10 px-4 py-2 text-sm font-medium shadow-inner flex items-center gap-2">
               <span className="text-white/50 uppercase text-[10px] tracking-widest">Room ID</span>
               <span className="text-green-400 font-mono tracking-wider font-bold">{roomId}</span>
            </Badge>
          </div>
          
          {/* Center: Media Controls */}
          <div className="flex items-center gap-2 sm:gap-4 mx-auto md:mx-0">
            <Button 
              onClick={toggleMute}
              variant="outline" 
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-none transition-all shadow-lg ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
            <Button 
              onClick={toggleVideo}
              variant="outline" 
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-none transition-all shadow-lg ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
            <Button 
              onClick={toggleScreenShare}
              variant="outline" 
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-none transition-all shadow-lg ${isScreenSharing ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <ScreenShare className="w-5 h-5 sm:w-6 sm:h-6" />}
            </Button>
          </div>
          
          {/* Right: Invite & Leave */}
          <div className="flex items-center gap-2 sm:gap-3">
             <Dialog>
                <DialogTrigger asChild>
                   <Button variant="secondary" size="icon" className="w-10 h-10 sm:w-auto sm:h-12 sm:px-4 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30 rounded-xl">
                      <UserPlus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline font-semibold">Invite</span>
                   </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-white/10 text-white max-h-[80vh] overflow-y-auto rounded-2xl">
                   <DialogHeader>
                      <DialogTitle>Invite to Meeting</DialogTitle>
                   </DialogHeader>
                   <div className="space-y-2 mt-4">
                      {teamMembers?.length > 0 ? teamMembers.map(member => (
                         <div key={member.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                               <Avatar className="w-8 h-8">
                                  <AvatarImage src={member.profile_photo_url || member.avatar_url} />
                                  <AvatarFallback className="bg-blue-500">{member.full_name?.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <span className="text-sm font-medium">{member.full_name}</span>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => handleInvite(member.user_id)}>Invite</Button>
                         </div>
                      )) : (
                         <p className="text-center text-white/50 text-sm py-4">No other team members found.</p>
                      )}
                   </div>
                </DialogContent>
             </Dialog>

             <div className="w-px h-6 sm:h-8 bg-white/10 mx-1"></div>

             <Button 
               onClick={handleLeave}
               variant="destructive" 
               className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-bold shadow-lg shadow-red-500/20 text-sm sm:text-base"
             >
               <LogOut className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
               <span className="hidden sm:inline">Leave</span>
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
