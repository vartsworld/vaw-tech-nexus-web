import React from 'react';
import SalesContentSection from './SalesContentSection';
import { useStaffData } from "@/hooks/useStaffData";
import ClientOnboardingCreator from '../staff/ClientOnboardingCreator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";

const SalesOnboarding = () => {
  const { profile } = useStaffData();
  const isTeamHead = profile?.role === 'lead' || profile?.role === 'manager' || profile?.is_department_head;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesContentSection
            sectionKey="onboarding"
            title="Onboarding Process"
            subtitle="Standard Operating Procedures for New Partners"
            isTeamHead={!!isTeamHead}
          />
        </div>
        <div className="space-y-6">
          <Card className="bg-zinc-900/60 border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Quick Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {profile?.user_id && (
                <ClientOnboardingCreator userId={profile.user_id} />
              )}
            </CardContent>
          </Card>

          <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Pro Tip</h4>
            <p className="text-[11px] text-white/60 leading-relaxed font-medium">
              Use the Link Creator to generate unique onboarding forms for each package. These links can be shared directly with clients to automate data collection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOnboarding;
