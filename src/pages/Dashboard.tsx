
import React, { useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import DashboardSummary from '@/components/DashboardSummary';
import UpcomingPayments from '@/components/dashboard/UpcomingPayments';
import ActiveTontines from '@/components/dashboard/ActiveTontines';
import { useInvitation } from '@/hooks/useInvitation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Bell } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { processAllPendingInvitations, loading } = useInvitation();
  
  useEffect(() => {
    // Process any pending invitations when dashboard loads
    const processPendingInvites = async () => {
      try {
        await processAllPendingInvitations();
      } catch (error) {
        console.error("Failed to process pending invitations", error);
      }
    };
    
    processPendingInvites();
  }, []);
  
  return (
    <PageContainer title="Dashboard">
      <DashboardSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3">
          <ActiveTontines />
        </div>
        <div className="lg:col-span-1">
          <UpcomingPayments />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Invitations</CardTitle>
              <CardDescription>Process pending member invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={processAllPendingInvitations} 
                disabled={loading}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {loading ? 'Processing...' : 'Send Pending Invitations'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will send email notifications to all pending members.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
