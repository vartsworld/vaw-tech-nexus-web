import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/context/UserContext";
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
import NotificationCenter from "@/components/hr/NotificationCenter";
import BannerManagement from "@/components/hr/BannerManagement";
import TeamApplicationsList from "@/components/hr/TeamApplicationsList";
import InternshipApplicationsList from "@/components/admin/InternshipApplicationsList";
import PricingManagement from "@/components/hr/PricingManagement";
import FinancialOversight from "@/components/hr/FinancialOversight";
import ApiIntegration from "@/components/hr/ApiIntegration";
import SupportTicketManagement from "@/components/hr/SupportTicketManagement";
import AcademyEnquiriesList from "@/components/hr/AcademyEnquiriesList";

import {
  Users, CheckSquare, Settings2, HandCoins, Building2, BarChart3,
  Award, Bell, Image as ImageIcon, Briefcase, UserPlus, CreditCard,
  DollarSign, Code, LifeBuoy, GraduationCap, LayoutDashboard
} from "lucide-react";

export default function HRDashboard() {
  const { userProfile, isLoading: profileLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const [currentRoom, setCurrentRoom] = useState('home');
  const [showAttendanceChecker, setShowAttendanceChecker] = useState(false);
  const [showMoodChecker, setShowMoodChecker] = useState(false);
  const [initialChecksDone, setInitialChecksDone] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    
    if (!userProfile) {
      navigate('/admin');
      return;
    }

    if (userProfile.role !== 'hr' && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      navigate('/staff');
      return;
    }

    const checkDailyRequirements = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Check if user has marked attendance today
        const { data: attendanceData } = await supabase
          .from('staff_attendance')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('date', today)
          .maybeSingle();

        // Check if user has submitted mood today
        const { data: moodData } = await supabase
          .from('user_mood_entries')
          .select('*')
          .eq('user_id', userProfile.id)
          .eq('entry_date', today)
          .maybeSingle();

        if (!attendanceData) {
          setShowAttendanceChecker(true);
          setShowMoodChecker(false);
        } else if (!moodData) {
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = Array.from(params.keys())[0];
    if (room && typeof room === 'string') {
      setCurrentRoom(room);
    }
  }, [location.search]);

  if (profileLoading || (!initialChecksDone && !showAttendanceChecker && !showMoodChecker)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showAttendanceChecker) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 1: Mark Attendance</h2>
            <p className="text-white/80">Please mark your attendance to continue</p>
          </div>
          <AttendanceChecker 
            userId={userProfile?.id || ''}
            onAttendanceMarked={async () => {
              setShowAttendanceChecker(false);
              const today = new Date().toISOString().split('T')[0];
              const { data: moodData } = await supabase
                .from('user_mood_entries')
                .select('*')
                .eq('user_id', userProfile?.id)
                .eq('entry_date', today)
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Step 2: How are you feeling?</h2>
            <p className="text-white/80">Share your mood to unlock your dashboard</p>
          </div>
          <MoodQuoteChecker 
            onMoodSubmitted={() => {
              setShowMoodChecker(false);
              setInitialChecksDone(true);
            }} 
          />
        </div>
      </div>
    );
  }

  const customSidebarLinks = [
    {
      title: "Operations",
      icon: LayoutDashboard,
      items: [
        { id: 'tasks', name: 'Task Board', icon: CheckSquare, path: '/hr?tasks' },
        { id: 'templates', name: 'Templates', icon: Settings2, path: '/hr?templates' },
        { id: 'attendance', name: 'Attendance', icon: HandCoins, path: '/hr?attendance' },
        { id: 'staff', name: 'Staff Management', icon: Users, path: '/hr?staff' },
        { id: 'departments', name: 'Departments', icon: Building2, path: '/hr?departments' },
      ]
    },
    {
      title: "Relationships",
      icon: Users,
      items: [
        { id: 'clients', name: 'Clients', icon: Briefcase, path: '/hr?clients' },
        { id: 'applications', name: 'Team Applications', icon: UserPlus, path: '/hr?applications' },
        { id: 'interns', name: 'Interns', icon: GraduationCap, path: '/hr?interns' },
        { id: 'support', name: 'Support Tickets', icon: LifeBuoy, path: '/hr?support' },
        { id: 'academy', name: 'Academy', icon: Award, path: '/hr?academy' },
      ]
    },
    {
      title: "Administration",
      icon: Settings2,
      items: [
        { id: 'performance', name: 'Performance', icon: BarChart3, path: '/hr?performance' },
        { id: 'points', name: 'Points & Analytics', icon: Award, path: '/hr?points' },
        { id: 'rewards', name: 'Rewards', icon: Award, path: '/hr?rewards' },
        { id: 'pricing', name: 'Pricing', icon: CreditCard, path: '/hr?pricing' },
        { id: 'financials', name: 'Financials', icon: DollarSign, path: '/hr?financials' },
        { id: 'notifications', name: 'Notifications', icon: Bell, path: '/hr?notifications' },
        { id: 'banners', name: 'Banners', icon: ImageIcon, path: '/hr?banners' },
        { id: 'api-integration', name: 'API Integrations', icon: Code, path: '/hr?api-integration' },
        { id: 'legacy', name: 'Legacy Admin', icon: LayoutDashboard, path: '/hr/legacy' }
      ]
    }
  ];

  const renderRoomContent = () => {
    switch (currentRoom) {
      case 'tasks': return <TaskManagement />;
      case 'templates': return <TaskTemplateManagement />;
      case 'attendance': return <AttendanceReports />;
      case 'staff': return <StaffManagement />;
      case 'departments': return <DepartmentManagement />;
      case 'clients': return <ClientManagement />;
      case 'applications': return <TeamApplicationsList />;
      case 'interns': return <InternshipApplicationsList />;
      case 'support': return <SupportTicketManagement />;
      case 'academy': return <AcademyEnquiriesList />;
      case 'performance': return <PerformanceMetrics />;
      case 'points': return <PointsMonitoring />;
      case 'rewards': return <div className="space-y-6"><RewardsManagement /><RedemptionApprovals /></div>;
      case 'pricing': return <PricingManagement />;
      case 'financials': return <FinancialOversight />;
      case 'notifications': return <NotificationCenter />;
      case 'banners': return <BannerManagement />;
      case 'api-integration': return <ApiIntegration />;
      default: 
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
            <h1 className="text-4xl font-bold">HR Virtual Office</h1>
            <p className="text-muted-foreground max-w-md">
              Welcome to the new HR Dashboard. Select a module from the sidebar to manage your operations and team data.
            </p>
          </div>
        );
    }
  };

  return (
    <VirtualOfficeLayout
      currentRoom={currentRoom}
      onRoomChange={setCurrentRoom}
      userId={userProfile?.id}
      userProfile={userProfile}
      customSidebarLinks={customSidebarLinks}
    >
      <div className="p-4 md:p-6 pb-24 lg:pb-6 animate-in fade-in duration-300">
        {renderRoomContent()}
      </div>
    </VirtualOfficeLayout>
  );
}
