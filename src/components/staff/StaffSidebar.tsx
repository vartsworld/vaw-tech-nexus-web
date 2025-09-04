import React from 'react';
import { Users, User, Circle } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import MiniChess from './MiniChess';
import { useStaffData } from '@/hooks/useStaffData';

interface StaffSidebarProps {
  userId: string;
  userProfile: any;
}

const StaffSidebar = ({ userId, userProfile }: StaffSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { teamMembers } = useStaffData();

  // Mock online team members for now
  const onlineMembers = [
    { id: '1', name: 'John Doe', status: 'online' },
    { id: '2', name: 'Sarah Wilson', status: 'online' },
    { id: '3', name: 'Mike Johnson', status: 'away' },
  ];

  return (
    <Sidebar
      className={`${isCollapsed ? 'w-14' : 'w-80'} bg-black/20 backdrop-blur-lg border-r border-white/10`}
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Team Online Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80 font-medium">
            <Users className="w-4 h-4 mr-2" />
            {!isCollapsed && 'Team Online'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Online team members */}
              {!isCollapsed && onlineMembers.map((member) => (
                <SidebarMenuItem key={member.id}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black/20 ${
                        member.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{member.name}</p>
                      <p className="text-white/60 text-xs capitalize">{member.status}</p>
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
              
              {/* Mini Chess Widget */}
              <SidebarMenuItem>
                <div className="mt-4">
                  {!isCollapsed ? (
                    <MiniChess userId={userId} userProfile={userProfile} />
                  ) : (
                    <div className="flex justify-center p-2">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Circle className="w-4 h-4 text-white/60" />
                      </div>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default StaffSidebar;