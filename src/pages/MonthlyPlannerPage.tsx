import React, { useState, useEffect } from 'react';
import MonthlyPlanner from '@/components/staff/MonthlyPlanner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MonthlyPlannerPage = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data, error } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error) throw error;
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
     return (
       <div className="flex h-screen items-center justify-center bg-black text-white">
         <p>Access Denied. Please login as staff.</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight uppercase italic">
            Monthly <span className="text-primary">Planner</span>
          </h1>
          <p className="text-white/40 uppercase text-xs font-bold tracking-[0.2em] mt-2">
            Strategic Company Roadmap & Client Directives
          </p>
        </div>
        <MonthlyPlanner userId={user.id} userProfile={profile} />
      </div>
    </div>
  );
};

export default MonthlyPlannerPage;
