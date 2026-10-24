import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStaffData } from "@/hooks/useStaffData";
import VirtualOfficeLayout from "@/components/staff/VirtualOfficeLayout";
import AttendanceChecker from "@/components/staff/AttendanceChecker";
import MoodQuoteChecker from "@/components/staff/MoodQuoteChecker";
import { supabase } from "@/integrations/supabase/client";

// HR Components
import StaffManagement from "@/components/hr/StaffManagement";
import AttendanceReports from "@/components/hr/AttendanceReports";
import TaskManagement from "@/components/hr/TaskManagement";
import TaskTemplateManagement from "@/components/hr/TaskTemplateManagement";
import ClientManagement from "@/components/hr/ClientManagement";
import DepartmentManagement from "@/components/hr/DepartmentManagement";
import PerformanceMetrics from "@/components/hr/PerformanceMetrics";
import PointsMonitoring from "@/components/hr/PointsMonitoring";
import RewardsManagement from "@/components/hr/RewardsManagement";
import RedemptionApprovals from "@/components/hr/RedemptionApprovals";
import AdminConsole from "@/components/hr/AdminConsole";
import AnnouncementsHub from "@/components/hr/AnnouncementsHub";
import TeamApplicationsList from "@/components/hr/TeamApplicationsList";
import InternshipApplicationsList from "@/components/admin/InternshipApplicationsList";
import PricingManagement from "@/components/hr/PricingManagement";
import FinancialOversight from "@/components/hr/FinancialOversight";
import ApiIntegration from "@/components/hr/ApiIntegration";
import SupportTicketManagement from "@/components/hr/SupportTicketManagement";
import AcademyEnquiriesList from "@/components/hr/AcademyEnquiriesList";
import ManageProjects from "@/components/hr/ManageProjects";
import QRManagement from "@/components/hr/QRManagement";
import EmmaAssistant from "@/components/ai/EmmaAssistant";
import MonthlyPlanner from "@/components/staff/MonthlyPlanner";
import MeetingRoom from "@/components/staff/MeetingRoom";
import TeamChat from "@/components/staff/TeamChat";

import PricingRequests from "@/components/hr/PricingRequests";
import GeneralInquiries from "@/components/hr/GeneralInquiries";
import LeaveRequests from "@/components/hr/LeaveRequests";
import HROverview from "@/components/hr/HROverview";
import HRCommandBar from "@/components/hr/HRCommandBar";
import { findRoom, toSidebarLinks } from "@/components/hr/hrNavigation";
import { useHRBadges } from "@/hooks/useHRBadges";
import { LayoutDashboard, Inbox, Users, CheckSquare, Menu } from "lucide-react";

const SIDEBAR_LINKS = toSidebarLinks();

const MOBILE_TABS = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "pricing-requests", label: "Requests", icon: Inbox },
  { id: "staff", label: "Staff", icon: Users },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "menu", label: "More", icon: Menu },
];

export default function HRDashboard() {
  const { profile: userProfile, loading: profileLoading } = useStaffData();
  const navigate = useNavigate();
  const location = useLocation();
  const badges = useHRBadges();
  const sidebarBadges = useMemo(() => ({
    'pricing-requests': badges.pricing,
    inquiries: badges.inquiries,
    leave: badges.leave,
    applications: badges.applications,
    support: badges.support,
    tasks: badges.overdueTasks,
  }), [badges]);

  const [currentRoom, setCurrentRoom] = useState('dashboard');
  const [showAttendanceChecker, setShowAttendanceChecker] = useState(false);
  const [showMoodChecker, setShowMoodChecker] = useState(false);
  const [initialChecksDone, setInitialChecksDone] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    
    if (!userProfile) {
      navigate('/staff/login');
      return;
    }

    if (userProfile.role !== 'hr' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      navigate('/staff');
      return;
    }

    const checkDailyRequirements = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const nowMs = Date.now();
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;

        // Check latest attendance entry
        const { data: attendanceData } = await supabase
          .from('staff_attendance')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasRecentAttendance = attendanceData && (
          attendanceData.date === today ||
          (attendanceData.created_at && (nowMs - new Date(attendanceData.created_at).getTime()) < twentyFourHoursMs)
        );

        // Check latest mood entry
        const { data: moodData } = await supabase
          .from('user_mood_entries')
          .select('*')
          .eq('user_id', userProfile.user_id || userProfile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasRecentMood = moodData && (
          moodData.date === today ||
          (moodData.created_at && (nowMs - new Date(moodData.created_at).getTime()) < twentyFourHoursMs)
        );

        if (!hasRecentAttendance) {
          setShowAttendanceChecker(true);
          setShowMoodChecker(false);
        } else if (!hasRecentMood) {
          setShowAttendanceChecker(false);
          setShowMoodChecker(true);
        } else {
          setShowAttendanceChecker(false);
          setShowMoodChecker(false);
          setInitialChecksDone(true);
        }
      } catch (error) {
        console.error("Error checking daily requirements:", error);
        setInitialChecksDone(true); // Fallback to let them in if DB fails
      }
    };

    checkDailyRequirements();
  }, [userProfile, profileLoading, navigate]);

  // Synchronize room state from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchRoom = Array.from(params.keys())[0];
    const pathParts = location.pathname.split('/');
    const pathRoom = pathParts[2] || pathParts[1];

    // Unknown names fall back to the overview instead of leaving the sidebar with nothing highlighted
    if (searchRoom && searchRoom !== 'dashboard' && searchRoom !== 'hr' && findRoom(searchRoom)) {
      setCurrentRoom(findRoom(searchRoom)!.id);
    } else if (pathRoom && pathRoom !== 'hr' && pathRoom !== 'dashboard' && findRoom(pathRoom)) {
      setCurrentRoom(findRoom(pathRoom)!.id);
    } else {
      setCurrentRoom('dashboard');
    }
  }, [location.search, location.pathname]);

  const handleRoomChange = (room: string) => {
    setCurrentRoom(room);
    if (room === 'dashboard' || room === 'home') {
      navigate('/hr');
    } else {
      navigate(`/hr?${room}`);
    }
  };

  if (profileLoading || (!initialChecksDone && !showAttendanceChecker && !showMoodChecker)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading HR Portal...</p>
        </div>
      </div>
    );
  }

  if (showAttendanceChecker) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 1: Mark Attendance</h2>
            <p className="text-white/80">Please mark your attendance to access the HR Dashboard</p>
          </div>
          <AttendanceChecker 
            userId={userProfile?.user_id || ''}
            onAttendanceMarked={async () => {
              setShowAttendanceChecker(false);
              const today = new Date().toISOString().split('T')[0];
              const { data: moodData } = await supabase
                .from('user_mood_entries')
                .select('*')
                .eq('user_id', userProfile?.user_id || userProfile?.id || '')
                .eq('date', today)
                .maybeSingle();
                
              if (!moodData) {
                setShowMoodChecker(true);
              } else {
                setInitialChecksDone(true);
              }
            }} 
          />
        </div>
      </div>
    );
  }

  if (showMoodChecker) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 2: How are you feeling?</h2>
            <p className="text-white/80">Share your daily status to unlock your dashboard</p>
          </div>
          <MoodQuoteChecker 
            userId={userProfile?.user_id || userProfile?.id || ''}
            onMoodSubmitted={() => {
              setShowMoodChecker(false);
              setInitialChecksDone(true);
            }} 
          />
        </div>
      </div>
    );
  }

  const renderRoomContent = () => {
    switch (currentRoom) {
      case 'dashboard':
      case 'home':
        return <HROverview firstName={userProfile?.full_name?.split(' ')[0]} onNavigate={handleRoomChange} />;
      case 'calendar':
      case 'planner':
        return <MonthlyPlanner userId={userProfile?.user_id || userProfile?.id || ''} userProfile={userProfile} />;
      case 'meeting': return <MeetingRoom />;
      case 'chat':
      case 'inbox':
        return <TeamChat userId={userProfile?.user_id || ''} userProfile={userProfile} />;
      case 'emma': return <EmmaAssistant role="hr" />;
      case 'pricing-requests': return <PricingRequests />;
      case 'inquiries': return <GeneralInquiries />;
      case 'leave': return <LeaveRequests />;
      case 'tasks': return <TaskManagement />;
      case 'templates': return <TaskTemplateManagement />;
      case 'attendance': return <AttendanceReports />;
      case 'staff': return <StaffManagement />;
      case 'departments': return <DepartmentManagement />;
      case 'clients': return <ClientManagement />;
      case 'manage-projects': return <ManageProjects />;
      case 'applications': return <TeamApplicationsList />;
      case 'interns': return <InternshipApplicationsList />;
      case 'support': return <SupportTicketManagement />;
      case 'academy': return <AcademyEnquiriesList />;
      case 'performance': return <PerformanceMetrics />;
      case 'points': return <PointsMonitoring />;
      case 'rewards': return <div className="space-y-6"><RewardsManagement /><RedemptionApprovals /></div>;
      case 'pricing': return <PricingManagement />;
      case 'financials': return <FinancialOversight />;
      case 'announcements': return <AnnouncementsHub initialTab={new URLSearchParams(location.search).has('banners') ? 'banners' : 'notifications'} />;
      case 'api-integration': return <ApiIntegration />;
      case 'qr': return <QRManagement />;
      case 'admin': return <AdminConsole />;
      default: 
        return <HROverview firstName={userProfile?.full_name?.split(' ')[0]} onNavigate={handleRoomChange} />;
    }
  };

  return (
    <VirtualOfficeLayout
      currentRoom={currentRoom}
      onRoomChange={handleRoomChange}
      userId={userProfile?.user_id}
      userProfile={userProfile}
      customSidebarLinks={SIDEBAR_LINKS}
      badges={sidebarBadges}
      mobileNavItems={MOBILE_TABS}
      header={() => (
        <HRCommandBar
          currentRoom={currentRoom}
          onNavigate={handleRoomChange}
          badges={sidebarBadges}
        />
      )}
    >
      <div className="animate-in fade-in duration-300 relative z-10">
        <div className="max-w-7xl mx-auto">
          {renderRoomContent()}
        </div>
      </div>
    </VirtualOfficeLayout>
  );
}
