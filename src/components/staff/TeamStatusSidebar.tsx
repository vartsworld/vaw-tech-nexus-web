import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserStatusBadge } from "./UserStatusBadge";

interface TeamMember {
  user_id: string;
  full_name: string;
  status: string;
  avatar_url?: string;
}

interface TeamStatusSidebarProps {
  onlineUsers: Record<string, any>;
}

const TeamStatusSidebar = ({ onlineUsers }: TeamStatusSidebarProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeamStatuses();
    
    // Subscribe to real-time status changes
    const channel = supabase
      .channel('team_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence_status'
        },
        () => {
          fetchTeamStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlineUsers]);

  const fetchTeamStatuses = async () => {
    try {
      // Get unique user IDs from onlineUsers
      const uniqueUserIds = new Set<string>();
      Object.values(onlineUsers).forEach((presences: any) => {
        const presenceArray = Array.isArray(presences) ? presences : [presences];
        presenceArray.forEach((presence: any) => {
          if (presence.user_id && presence.user_id !== 'demo-user') {
            uniqueUserIds.add(presence.user_id);
          }
        });
      });

      if (uniqueUserIds.size === 0) {
        setTeamMembers([]);
        return;
      }

      // Fetch profiles and statuses
      const { data: profiles } = await supabase
        .from('staff_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', Array.from(uniqueUserIds));

      const { data: statuses } = await supabase
        .from('user_presence_status')
        .select('user_id, current_status')
        .in('user_id', Array.from(uniqueUserIds));

      if (profiles && statuses) {
        const members: TeamMember[] = profiles.map(profile => {
          const status = statuses.find(s => s.user_id === profile.user_id);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            status: status?.current_status || 'online',
            avatar_url: profile.avatar_url
          };
        });

        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team statuses:', error);
    }
  };

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-4 text-white/50 text-sm">
        No team members online
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teamMembers.map((member) => {
        const initials = member.full_name?.split(' ').map((n: string) => n[0]).join('') || '?';
        
        return (
          <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{member.full_name}</p>
              <div className="mt-1">
                <UserStatusBadge status={member.status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamStatusSidebar;
