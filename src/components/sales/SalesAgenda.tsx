import React from 'react';
import SalesContentSection from './SalesContentSection';
import { useStaffData } from "@/hooks/useStaffData";

const SalesAgenda = () => {
  const { profile } = useStaffData();
  const isTeamHead = profile?.role === 'lead' || profile?.role === 'manager' || profile?.is_department_head;

  return (
    <div className="animate-in fade-in duration-500">
      <SalesContentSection
        sectionKey="agenda"
        title="Company Agenda"
        subtitle="Strategic Sales Directives"
        isTeamHead={!!isTeamHead}
      />
    </div>
  );
};

export default SalesAgenda;
