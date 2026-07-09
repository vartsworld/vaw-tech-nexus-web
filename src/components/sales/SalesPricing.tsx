import React from 'react';
import SalesContentSection from './SalesContentSection';
import { useStaffData } from "@/hooks/useStaffData";

const SalesPricing = () => {
  const { profile } = useStaffData();
  const isTeamHead = profile?.role === 'lead' || profile?.role === 'manager' || profile?.is_department_head;

  return (
    <div className="animate-in fade-in duration-500">
      <SalesContentSection
        sectionKey="pricing"
        title="Service Pricing"
        subtitle="Current Market Rate Cards"
        isTeamHead={!!isTeamHead}
      />
    </div>
  );
};

export default SalesPricing;
