
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  AlertTriangle, 
  Calendar,
  CreditCard
} from 'lucide-react';

const ReportsSummary: React.FC = () => {
  // In a real app, this data would come from an API
  const summaryData = {
    activeTontines: 4,
    activeMembers: 24,
    totalContributed: 8750,
    contributionGrowth: 12,
    pendingPayments: 5,
    overduePayments: 2,
    upcomingPayouts: 3,
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Tontines</p>
              <h3 className="text-2xl font-bold mt-1">{summaryData.activeTontines}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {summaryData.activeMembers} total members
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
              <h3 className="text-2xl font-bold mt-1">${summaryData.totalContributed}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            {summaryData.contributionGrowth}% increase this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
              <h3 className="text-2xl font-bold mt-1">{summaryData.pendingPayments}</h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <CreditCard className="h-4 w-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {summaryData.overduePayments} overdue
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Payouts</p>
              <h3 className="text-2xl font-bold mt-1">{summaryData.upcomingPayouts}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <Calendar className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
            Next in the next 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSummary;
