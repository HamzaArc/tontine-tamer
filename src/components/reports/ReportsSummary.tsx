
import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryData {
  activeTontines: number;
  activeMembers: number;
  totalContributed: number;
  contributionGrowth: number;
  pendingPayments: number;
  overduePayments: number;
  upcomingPayouts: number;
}

const ReportsSummary: React.FC = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    activeTontines: 0,
    activeMembers: 0,
    totalContributed: 0,
    contributionGrowth: 0,
    pendingPayments: 0,
    overduePayments: 0,
    upcomingPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get tontines
        const { data: tontines, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, amount')
          .eq('created_by', user.id);
          
        if (tontinesError) throw tontinesError;
        
        if (!tontines || tontines.length === 0) {
          setLoading(false);
          return;
        }
        
        const tontineIds = tontines.map(t => t.id);
        
        // Get active tontines (those with active cycles)
        const { data: activeCycles, error: cyclesError } = await supabase
          .from('cycles')
          .select('tontine_id')
          .in('tontine_id', tontineIds)
          .eq('status', 'active');
          
        if (cyclesError) throw cyclesError;
        
        const activeTontinesIds = [...new Set(activeCycles?.map(c => c.tontine_id) || [])];
        
        // Get members in all tontines
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, tontine_id')
          .in('tontine_id', tontineIds)
          .eq('is_active', true);
          
        if (membersError) throw membersError;
        
        // Count members in active tontines
        const activeMembers = members?.filter(m => activeTontinesIds.includes(m.tontine_id)).length || 0;
        
        // Get total contributions
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('status', 'completed');
          
        if (paymentsError) throw paymentsError;
        
        const totalContributed = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
        
        // Calculate contribution growth (comparing current month to previous month)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const currentMonthPayments = payments?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= currentMonthStart && paymentDate < now;
        });
        
        const previousMonthPayments = payments?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= previousMonthStart && paymentDate < currentMonthStart;
        });
        
        const currentMonthTotal = currentMonthPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
        const previousMonthTotal = previousMonthPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
        
        let contributionGrowth = 0;
        if (previousMonthTotal > 0) {
          contributionGrowth = Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100);
        }
        
        // Get pending and overdue payments
        const activeCycleIds = activeCycles?.map(c => c.id) || [];
        let pendingPayments = 0;
        let overduePayments = 0;
        
        if (activeCycleIds.length > 0) {
          const { data: cycles, error: detailedCyclesError } = await supabase
            .from('cycles')
            .select('id, end_date')
            .in('id', activeCycleIds);
            
          if (detailedCyclesError) throw detailedCyclesError;
          
          await Promise.all(
            cycles?.map(async (cycle) => {
              // Get members who should pay in this cycle
              const { data: cycleMembers, error: cycleMembersError } = await supabase
                .from('members')
                .select('id')
                .eq('tontine_id', cycle.tontine_id)
                .eq('is_active', true);
                
              if (cycleMembersError) throw cycleMembersError;
              
              if (!cycleMembers || cycleMembers.length === 0) return;
              
              // Get members who have already paid
              const { data: paidMembers, error: paidMembersError } = await supabase
                .from('payments')
                .select('member_id')
                .eq('cycle_id', cycle.id)
                .eq('status', 'completed');
                
              if (paidMembersError) throw paidMembersError;
              
              const paidMemberIds = paidMembers?.map(p => p.member_id) || [];
              const unpaidMembers = cycleMembers.filter(m => !paidMemberIds.includes(m.id));
              
              // Check if cycle end date is past
              const cycleEndDate = new Date(cycle.end_date);
              const isOverdue = cycleEndDate < now;
              
              if (isOverdue) {
                overduePayments += unpaidMembers.length;
              } else {
                pendingPayments += unpaidMembers.length;
              }
            }) || []
          );
        }
        
        // Get upcoming payouts (cycles ending in next 30 days)
        const thirtyDaysFromNow = new Date(now);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: upcomingPayouts, error: upcomingError } = await supabase
          .from('cycles')
          .select('id', { count: 'exact', head: true })
          .in('tontine_id', tontineIds)
          .eq('status', 'active')
          .lte('end_date', thirtyDaysFromNow.toISOString())
          .gte('end_date', now.toISOString());
          
        if (upcomingError) throw upcomingError;
        
        setSummaryData({
          activeTontines: activeTontinesIds.length,
          activeMembers,
          totalContributed,
          contributionGrowth,
          pendingPayments,
          overduePayments,
          upcomingPayouts: upcomingPayouts || 0
        });
      } catch (error) {
        console.error('Error fetching summary data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummaryData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('reports-summary-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        }, 
        () => {
          fetchSummaryData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        }, 
        () => {
          fetchSummaryData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        () => {
          fetchSummaryData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'members'
        }, 
        () => {
          fetchSummaryData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
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
              <h3 className="text-2xl font-bold mt-1">${summaryData.totalContributed.toFixed(2)}</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm mt-2 flex items-center gap-1" 
             style={{ color: summaryData.contributionGrowth >= 0 ? 'green' : 'red' }}>
            {summaryData.contributionGrowth >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(summaryData.contributionGrowth)}% {summaryData.contributionGrowth >= 0 ? 'increase' : 'decrease'} this month
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
