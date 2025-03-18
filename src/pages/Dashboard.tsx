
import React from 'react';
import { Wallet, TrendingUp, Users, Calendar, PieChart } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import DashboardCard from '@/components/dashboard/DashboardCard';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import ActiveTontines from '@/components/dashboard/ActiveTontines';

const Dashboard: React.FC = () => {
  return (
    <PageContainer title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard
          title="Total Balance"
          value="$5,240"
          subtitle="Across all tontines"
          icon={<Wallet />}
          trend={{ value: 12, positive: true }}
        />
        <DashboardCard
          title="Total Contributions"
          value="$2,850"
          subtitle="This month"
          icon={<TrendingUp />}
          trend={{ value: 5, positive: true }}
        />
        <DashboardCard
          title="Active Groups"
          value="4"
          subtitle="Across 24 members"
          icon={<Users />}
        />
        <DashboardCard
          title="Upcoming Payouts"
          value="3"
          subtitle="In the next 30 days"
          icon={<Calendar />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ActiveTontines />
        <UpcomingPayments />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
