
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/DashboardSummary';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import ActiveTontines from '@/components/dashboard/ActiveTontines';

const Dashboard: React.FC = () => {
  return (
    <PageContainer title="Dashboard">
      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ActiveTontines />
        <UpcomingPayments />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
