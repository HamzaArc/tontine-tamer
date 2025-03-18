import React, { useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import DashboardCard from '@/components/dashboard/DashboardCard';
import ActiveTontines from '@/components/dashboard/ActiveTontines';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import { useAuth } from '@/contexts/AuthContext';
import { useAppNotification } from '@/hooks/use-notification';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    showWelcomeNotification,
    showUpcomingPaymentNotification 
  } = useAppNotification();
  
  useEffect(() => {
    // Show welcome notification when dashboard loads
    const hasShownWelcome = localStorage.getItem('has_shown_welcome');
    
    if (!hasShownWelcome && user) {
      showWelcomeNotification();
      localStorage.setItem('has_shown_welcome', 'true');
      
      // Example: Show an upcoming payment notification after a delay
      setTimeout(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        
        showUpcomingPaymentNotification(formattedDate);
      }, 3000);
    }
  }, [user, showWelcomeNotification, showUpcomingPaymentNotification]);

  return (
    <PageContainer title="Dashboard">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DashboardCard 
          title="Total Active Tontines" 
          value="3"
          description="Across all your groups"
          trend="up"
          trendValue="1"
        />
        <DashboardCard 
          title="Upcoming Payments" 
          value="8"
          description="Due in the next 7 days"
          trend="neutral"
          trendValue="0"
        />
        <DashboardCard 
          title="Total Members" 
          value="24"
          description="Across all your tontines"
          trend="up"
          trendValue="3"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveTontines />
        <UpcomingPayments />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
