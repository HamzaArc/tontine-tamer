
import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Users, Calendar } from 'lucide-react';
import DashboardCard from './dashboard/DashboardCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalBalance: number;
  totalContributions: number;
  activeGroups: number;
  totalMembers: number;
  upcomingPayouts: number;
}

const DashboardSummary = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalContributions: 0,
    activeGroups: 0,
    totalMembers: 0,
    upcomingPayouts: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      try {
        // Get all user's tontines
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
        
        // Get total members across all tontines
        const { count: totalMembers, error: membersError } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .in('tontine_id', tontineIds)
          .eq('is_active', true);
          
        if (membersError) throw membersError;
        
        // Get active cycles
        const { data: activeCycles, error: cyclesError } = await supabase
          .from('cycles')
          .select('id, tontine_id')
          .in('tontine_id', tontineIds)
          .eq('status', 'active');
          
        if (cyclesError) throw cyclesError;
        
        // Count number of active groups
        const activeGroups = new Set(activeCycles?.map(c => c.tontine_id) || []).size;
        
        // Get total payments (contributions) for the current month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        
        const { data: paymentsThisMonth, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', firstDayOfMonth);
          
        if (paymentsError) throw paymentsError;
        
        const totalContributions = paymentsThisMonth?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
        
        // Get total balance (all payments)
        const { data: allPayments, error: allPaymentsError } = await supabase
          .from('payments')
          .select('amount');
          
        if (allPaymentsError) throw allPaymentsError;
        
        const totalBalance = allPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
        
        // Get upcoming payouts (cycles ending in next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { count: upcomingPayouts, error: upcomingError } = await supabase
          .from('cycles')
          .select('id', { count: 'exact', head: true })
          .in('tontine_id', tontineIds)
          .eq('status', 'active')
          .lte('end_date', thirtyDaysFromNow.toISOString())
          .gte('end_date', currentDate.toISOString());
          
        if (upcomingError) throw upcomingError;
        
        setStats({
          totalBalance,
          totalContributions,
          activeGroups,
          totalMembers: totalMembers || 0,
          upcomingPayouts: upcomingPayouts || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('dashboard-summary-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        }, 
        () => {
          fetchDashboardStats();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        }, 
        () => {
          fetchDashboardStats();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        () => {
          fetchDashboardStats();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'members'
        }, 
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg animate-pulse">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <DashboardCard
        title="Total Balance"
        value={`$${stats.totalBalance.toFixed(2)}`}
        subtitle="Across all tontines"
        icon={<Wallet />}
      />
      <DashboardCard
        title="Total Contributions"
        value={`$${stats.totalContributions.toFixed(2)}`}
        subtitle="This month"
        icon={<TrendingUp />}
      />
      <DashboardCard
        title="Active Groups"
        value={stats.activeGroups.toString()}
        subtitle={`Across ${stats.totalMembers} members`}
        icon={<Users />}
      />
      <DashboardCard
        title="Upcoming Payouts"
        value={stats.upcomingPayouts.toString()}
        subtitle="In the next 30 days"
        icon={<Calendar />}
      />
    </div>
  );
};

export default DashboardSummary;
