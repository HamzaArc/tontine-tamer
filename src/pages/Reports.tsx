
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import TontinePerformance from '@/components/reports/TontinePerformance';
import ReportsSummary from '@/components/reports/ReportsSummary';
import PaymentsCalendar from '@/components/reports/PaymentsCalendar';
import MemberActivity from '@/components/reports/MemberActivity';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <PageContainer title="Reports">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="activity">Member Activity</TabsTrigger>
            <TabsTrigger value="calendar">Payment Calendar</TabsTrigger>
            <TabsTrigger value="performance">Tontine Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <ReportsSummary />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PaymentsCalendar showPreview={true} />
              <MemberActivity showPreview={true} />
            </div>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <MemberActivity showPreview={false} />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <PaymentsCalendar showPreview={false} />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <TontinePerformance />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default Reports;
