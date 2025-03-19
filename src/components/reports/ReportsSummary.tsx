
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, PieChart } from '@/components/ui/custom-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Check, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, subMonths } from 'date-fns';

interface PaymentData {
  month: string;
  completed: number;
  pending: number;
}

interface MemberContribution {
  name: string;
  value: number;
}

interface TontinePerformance {
  name: string;
  completion: number;
  amount: number;
}

const ReportsSummary: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState<'month6' | 'month3' | 'month1'>('month3');
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [memberContributions, setMemberContributions] = useState<MemberContribution[]>([]);
  const [tontinePerformance, setTontinePerformance] = useState<TontinePerformance[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReportData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`reports-changes-${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'payments'
          }, 
          () => {
            loadReportData();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tontines',
            filter: `created_by=eq.${user.id}`
          },
          () => {
            loadReportData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, timeFrame]);

  const loadReportData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get time frame dates
      const now = new Date();
      let startDate: Date;
      
      if (timeFrame === 'month6') {
        startDate = subMonths(now, 6);
      } else if (timeFrame === 'month3') {
        startDate = subMonths(now, 3);
      } else {
        startDate = subMonths(now, 1);
      }
      
      // Get tontine ids for this user
      const { data: tontineIds, error: tontineIdsError } = await supabase
        .from('tontines')
        .select('id, name')
        .eq('created_by', user.id);
        
      if (tontineIdsError) throw tontineIdsError;
      
      const tontineIdList = tontineIds?.map(t => t.id) || [];
      
      if (tontineIdList.length === 0) {
        setPaymentData([]);
        setMemberContributions([]);
        setTontinePerformance([]);
        setLoading(false);
        return;
      }
      
      // Get cycles for these tontines
      const { data: cycles, error: cyclesError } = await supabase
        .from('cycles')
        .select('id, tontine_id')
        .in('tontine_id', tontineIdList);
        
      if (cyclesError) throw cyclesError;
      
      const cycleIdList = cycles?.map(c => c.id) || [];
      
      if (cycleIdList.length === 0) {
        setPaymentData([]);
        setMemberContributions([]);
        setTontinePerformance([]);
        setLoading(false);
        return;
      }
      
      // Get all payments within time frame
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          members(name, tontine_id),
          cycles(tontine_id)
        `)
        .in('cycle_id', cycleIdList)
        .gte('payment_date', startDate.toISOString());
        
      if (paymentsError) throw paymentsError;
      
      // Process payment data by month
      const paymentsByMonth: Record<string, { completed: number; pending: number }> = {};
      
      // Initialize months array
      const monthsData: PaymentData[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= now) {
        const monthKey = format(currentDate, 'yyyy-MM');
        const monthLabel = format(currentDate, 'MMM yyyy');
        
        paymentsByMonth[monthKey] = {
          completed: 0,
          pending: 0
        };
        
        monthsData.push({
          month: monthLabel,
          completed: 0,
          pending: 0
        });
        
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
      
      // Fill in payment data
      payments?.forEach(payment => {
        const paymentMonth = format(parseISO(payment.payment_date), 'yyyy-MM');
        
        if (paymentsByMonth[paymentMonth]) {
          if (payment.status === 'completed') {
            paymentsByMonth[paymentMonth].completed += payment.amount;
          } else {
            paymentsByMonth[paymentMonth].pending += payment.amount;
          }
        }
      });
      
      // Convert to array for chart
      const formattedPaymentData = Object.entries(paymentsByMonth).map(([month, data]) => ({
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        completed: data.completed,
        pending: data.pending
      }));
      
      // Process member contributions
      const memberData: Record<string, { amount: number; count: number }> = {};
      
      payments?.forEach(payment => {
        const memberName = payment.members?.name || 'Unknown';
        
        if (!memberData[memberName]) {
          memberData[memberName] = { amount: 0, count: 0 };
        }
        
        if (payment.status === 'completed') {
          memberData[memberName].amount += payment.amount;
          memberData[memberName].count += 1;
        }
      });
      
      // Convert to array and sort for PieChart
      const formattedMemberData = Object.entries(memberData)
        .map(([name, data]) => ({
          name,
          value: data.amount
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 contributors
      
      // Process tontine performance
      const tontineData: Record<string, { completed: number; total: number; amount: number }> = {};
      
      tontineIds?.forEach(tontine => {
        tontineData[tontine.id] = {
          completed: 0,
          total: 0,
          amount: 0
        };
      });
      
      payments?.forEach(payment => {
        const tontineId = payment.cycles?.tontine_id;
        
        if (tontineId && tontineData[tontineId]) {
          tontineData[tontineId].total += 1;
          
          if (payment.status === 'completed') {
            tontineData[tontineId].completed += 1;
            tontineData[tontineId].amount += payment.amount;
          }
        }
      });
      
      // Convert to array and calculate completion rate
      const formattedTontineData = tontineIds
        ?.map(tontine => {
          const data = tontineData[tontine.id];
          return {
            name: tontine.name,
            completion: data.total > 0 ? (data.completed / data.total) * 100 : 0,
            amount: data.amount
          };
        })
        .sort((a, b) => b.completion - a.completion);
      
      setPaymentData(formattedPaymentData);
      setMemberContributions(formattedMemberData);
      setTontinePerformance(formattedTontineData || []);
      
    } catch (error: any) {
      console.error('Error loading report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs
          defaultValue="month3"
          value={timeFrame}
          onValueChange={(value) => setTimeFrame(value as 'month6' | 'month3' | 'month1')}
        >
          <TabsList>
            <TabsTrigger value="month6">Last 6 Months</TabsTrigger>
            <TabsTrigger value="month3">Last 3 Months</TabsTrigger>
            <TabsTrigger value="month1">Last Month</TabsTrigger>
          </TabsList>
        </Tabs>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {!loading && paymentData.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Report Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start adding tontines and recording payments to see reports and analytics
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart 
                className="h-80"
                data={paymentData}
                categories={['completed', 'pending']}
                colors={['#16a34a', '#ef4444']}
                valueFormatter={formatCurrency}
                showLegend={true}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart 
                className="h-80"
                data={memberContributions}
                colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
                valueFormatter={formatCurrency}
                showLegend={true}
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                Tontine Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart 
                className="h-80"
                data={tontinePerformance}
                categories={['completion']}
                index='name'
                colors={['#3b82f6']}
                valueFormatter={formatPercentage}
                showLegend={false}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsSummary;
