
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Users,
  Calendar,
  Clock,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  FileText
} from "lucide-react";

const MeetingRoom = () => {
  const upcomingMeetings = [
    {
      title: "Daily Standup",
      time: "10:00 AM",
      duration: "15 min",
      attendees: 6,
      status: "Starting Soon",
      type: "Team Meeting"
    },
    {
      title: "Project Review",
      time: "2:00 PM",
      duration: "45 min",
      attendees: 4,
      status: "Scheduled",
      type: "Review"
    },
    {
      title: "Client Presentation",
      time: "4:00 PM",
      duration: "60 min",
      attendees: 8,
      status: "Scheduled",
      type: "Client Call"
    }
  ];

  const activeMeeting = {
    title: "Team Brainstorming",
    participants: ["Alex", "Sarah", "Mike", "Emily", "David"],
    duration: "25:43",
    isRecording: true
  };

  return (
    <div className="p-6 space-y-6">
      {/* Meeting Room Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Meeting Room</h2>
        <p className="text-purple-300">Collaborate and connect with your team! 📹</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Meeting */}
        <div className="lg:col-span-2">
          <Card className="bg-black/20 backdrop-blur-lg border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-green-400" />
                  {activeMeeting.title}
                </div>
                <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                  🔴 LIVE - {activeMeeting.duration}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Video Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {activeMeeting.participants.slice(0, 6).map((participant, index) => (
                  <div key={index} className="aspect-video bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    <div className="text-center relative z-10">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r shadow-lg ${index === 0 ? 'from-blue-400 to-cyan-500' :
                          index === 1 ? 'from-green-400 to-blue-500' :
                            index === 2 ? 'from-purple-400 to-pink-500' :
                              index === 3 ? 'from-yellow-400 to-red-500' :
                                'from-indigo-400 to-purple-500'
                        } flex items-center justify-center text-white font-bold mx-auto mb-2 text-sm sm:text-base`}>
                        {participant[0]}
                      </div>
                      <p className="text-white text-xs sm:text-sm font-medium">{participant}</p>
                    </div>

                    {/* Mic indicator */}
                    <div className="absolute bottom-2 left-2 z-20">
                      <div className={`p-1 rounded-full ${index < 3 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {index < 3 ? (
                          <Mic className="w-3 h-3 text-green-400" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meeting Controls */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="sm" className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30">
                  <ScreenShare className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm" className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30">
                  Leave
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Notes */}
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Meeting Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-32">
                <p className="text-gray-400 text-sm mb-2">Live notes for {activeMeeting.title}</p>
                <div className="space-y-2 text-white text-sm">
                  <p>• Discussed new project timeline</p>
                  <p>• Reviewed client feedback on designs</p>
                  <p>• Action items: Update mockups by Friday</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs">Auto-saving notes...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        <div className="space-y-4">
          <Card className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium text-sm">{meeting.title}</h4>
                    <Badge variant={meeting.status === 'Starting Soon' ? 'destructive' : 'secondary'} className="text-xs">
                      {meeting.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {meeting.time} • {meeting.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {meeting.attendees} attendees
                    </div>
                    <p className="text-purple-300">{meeting.type}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                  >
                    {meeting.status === 'Starting Soon' ? 'Join Now' : 'Set Reminder'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Join */}
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-bold mb-2">Quick Join</h3>
              <p className="text-green-300 text-sm mb-4">Enter meeting ID or start instant meeting</p>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Meeting ID..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
                    Join
                  </Button>
                  <Button size="sm" variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
                    Start New
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
