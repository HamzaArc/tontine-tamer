import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, Users, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SummaryData {
  activeTontines: number;
  totalMembers: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  paymentTrend: 'up' | 'down' | 'neutral';
  paymentRatio: number;
}

const DashboardSummary: React.FC = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    activeTontines: 0,
    totalMembers: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
    paymentTrend: 'neutral',
    paymentRatio: 0,
  });
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSummaryData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get active tontines count
      const { count: activeTontinesCount, error: tontinesError } = await supabase
        .from('tontines')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);
      
      if (tontinesError) throw tontinesError;
      
      // Get tontine ids for this user
      const { data: tontineIds, error: tontineIdsError } = await supabase
        .from('tontines')
        .select('id')
        .eq('created_by', user.id);
        
      if (tontineIdsError) throw tontineIdsError;
      
      const tontineIdList = tontineIds?.map(t => t.id) || [];
      
      // Get total members
      let totalMembersCount = 0;
      if (tontineIdList.length > 0) {
        const { count: membersCount, error: membersError } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .in('tontine_id', tontineIdList);
          
        if (membersError) throw membersError;
        totalMembersCount = membersCount || 0;
      }
      
      // Get payment statistics based on time frame
      let timeFilterQuery = supabase
        .from('payments')
        .select('status, amount');
      
      if (tontineIdList.length > 0) {
        const { data: cycleIds, error: cycleError } = await supabase
          .from('cycles')
          .select('id')
          .in('tontine_id', tontineIdList);
          
        if (cycleError) throw cycleError;
        
        const cycleIdList = cycleIds?.map(c => c.id) || [];
        
        if (cycleIdList.length > 0) {
          timeFilterQuery = timeFilterQuery.in('cycle_id', cycleIdList);
        }
      }
      
      // Add time frame filter if needed
      if (timeFrame !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (timeFrame === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else { // week
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        
        timeFilterQuery = timeFilterQuery.gte('payment_date', startDate.toISOString());
      }
      
      const { data: payments, error: paymentsError } = await timeFilterQuery;
      
      if (paymentsError) throw paymentsError;
      
      // Calculate payment statistics
      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
      const completedPayments = payments?.filter(p => p.status === 'completed').length || 0;
      const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      
      // Calculate payment trend (simplified for demo)
      const paymentRatio = completedPayments > 0 ? 
        completedPayments / (completedPayments + pendingPayments) : 0;
        
      let paymentTrend: 'up' | 'down' | 'neutral' = 'neutral';
      if (paymentRatio > 0.7) paymentTrend = 'up';
      else if (paymentRatio < 0.3) paymentTrend = 'down';
      
      setSummaryData({
        activeTontines: activeTontinesCount || 0,
        totalMembers: totalMembersCount,
        totalAmount,
        pendingPayments,
        completedPayments,
        paymentTrend,
        paymentRatio,
      });
      
    } catch (error: any) {
      console.error('Error loading dashboard summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSummaryData();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`dashboard-changes-${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'tontines',
            filter: `created_by=eq.${user.id}`
          }, 
          () => {
            loadSummaryData();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'members'
          },
          () => {
            loadSummaryData();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          () => {
            loadSummaryData();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cycles'
          },
          () => {
            loadSummaryData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, timeFrame]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Tabs
      defaultValue="all"
      value={timeFrame}
      onValueChange={(value) => setTimeFrame(value as 'all' | 'month' | 'week')}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="month">Last Month</TabsTrigger>
          <TabsTrigger value="week">Last Week</TabsTrigger>
        </TabsList>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <TabsContent value="all" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tontines
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.activeTontines}</div>
              <p className="text-xs text-muted-foreground">
                with {summaryData.totalMembers} members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                across all tontines
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Completion
              </CardTitle>
              {summaryData.paymentTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : summaryData.paymentTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summaryData.paymentRatio * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.completedPayments} of {summaryData.completedPayments + summaryData.pendingPayments} payments completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.pendingPayments}</div>
              <div className="flex items-center pt-1">
                <Badge className="mr-1" variant={summaryData.pendingPayments > 0 ? "destructive" : "outline"}>
                  {summaryData.pendingPayments > 0 ? "Action Required" : "All Caught Up"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="month" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tontines
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.activeTontines}</div>
              <p className="text-xs text-muted-foreground">
                with {summaryData.totalMembers} members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                across all tontines
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Completion
              </CardTitle>
              {summaryData.paymentTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : summaryData.paymentTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summaryData.paymentRatio * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.completedPayments} of {summaryData.completedPayments + summaryData.pendingPayments} payments completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.pendingPayments}</div>
              <div className="flex items-center pt-1">
                <Badge className="mr-1" variant={summaryData.pendingPayments > 0 ? "destructive" : "outline"}>
                  {summaryData.pendingPayments > 0 ? "Action Required" : "All Caught Up"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="week" className="mt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Tontines
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.activeTontines}</div>
              <p className="text-xs text-muted-foreground">
                with {summaryData.totalMembers} members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                across all tontines
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payment Completion
              </CardTitle>
              {summaryData.paymentTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : summaryData.paymentTrend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summaryData.paymentRatio * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.completedPayments} of {summaryData.completedPayments + summaryData.pendingPayments} payments completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.pendingPayments}</div>
              <div className="flex items-center pt-1">
                <Badge className="mr-1" variant={summaryData.pendingPayments > 0 ? "destructive" : "outline"}>
                  {summaryData.pendingPayments > 0 ? "Action Required" : "All Caught Up"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardSummary;
