
import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Payment {
  id: string;
  tontineName: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'paid';
}

const UpcomingPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      if (!user) return;
      
      try {
        // First, get tontines created by the user
        const { data: tontines, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, name')
          .eq('created_by', user.id);
          
        if (tontinesError) throw tontinesError;
        
        if (!tontines || tontines.length === 0) {
          setPayments([]);
          setLoading(false);
          return;
        }
        
        // Get active cycles for these tontines
        const tontineIds = tontines.map(t => t.id);
        const { data: cycles, error: cyclesError } = await supabase
          .from('cycles')
          .select('id, tontine_id, end_date')
          .in('tontine_id', tontineIds)
          .eq('status', 'active')
          .order('end_date', { ascending: true });
          
        if (cyclesError) throw cyclesError;
        
        if (!cycles || cycles.length === 0) {
          setPayments([]);
          setLoading(false);
          return;
        }
        
        // Create a map of tontine names for quick lookup
        const tontineNamesMap = tontines.reduce((map, tontine) => {
          map[tontine.id] = tontine.name;
          return map;
        }, {} as Record<string, string>);
        
        // For each cycle, get members who haven't paid yet
        const upcomingPayments: Payment[] = [];
        
        await Promise.all(
          cycles.map(async (cycle) => {
            // Get all members in the tontine
            const { data: members, error: membersError } = await supabase
              .from('members')
              .select('id, name')
              .eq('tontine_id', cycle.tontine_id)
              .eq('is_active', true);
              
            if (membersError) throw membersError;
            
            if (!members || members.length === 0) return;
            
            // Get payments already made for this cycle
            const { data: existingPayments, error: paymentsError } = await supabase
              .from('payments')
              .select('member_id, status')
              .eq('cycle_id', cycle.id);
              
            if (paymentsError) throw paymentsError;
            
            // Find members who haven't paid yet
            const membersPaid = existingPayments?.map(p => p.member_id) || [];
            const unpaidMembers = members.filter(m => !membersPaid.includes(m.id));
            
            // Get the tontine amount
            const { data: tontineData, error: tontineError } = await supabase
              .from('tontines')
              .select('amount')
              .eq('id', cycle.tontine_id)
              .single();
              
            if (tontineError) throw tontineError;
            
            // Add unpaid members to upcoming payments
            const currentDate = new Date();
            const dueDate = new Date(cycle.end_date);
            
            unpaidMembers.forEach(member => {
              const status = currentDate > dueDate ? 'overdue' : 'upcoming';
              
              upcomingPayments.push({
                id: `${cycle.id}-${member.id}`,
                tontineName: tontineNamesMap[cycle.tontine_id],
                amount: parseFloat(tontineData.amount),
                dueDate: cycle.end_date,
                status
              });
            });
          })
        );
        
        // Sort by due date and limit to 4 items
        upcomingPayments.sort((a, b) => {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        });
        
        setPayments(upcomingPayments.slice(0, 4));
      } catch (error) {
        console.error('Error fetching upcoming payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingPayments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('dashboard-payments-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        () => {
          fetchUpcomingPayments();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        }, 
        () => {
          fetchUpcomingPayments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'overdue':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'paid':
        return 'bg-green-50 text-green-600 border-green-200';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <DashboardCard 
        title="Upcoming Payments" 
        subtitle="Your next payments due"
        icon={<Calendar className="h-4 w-4" />}
        className="col-span-1 md:col-span-2"
      >
        <div className="mt-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard 
      title="Upcoming Payments" 
      subtitle="Your next payments due"
      icon={<Calendar className="h-4 w-4" />}
      className="col-span-1 md:col-span-2"
    >
      <div className="mt-4">
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border animate-fade-in"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{payment.tontineName}</span>
                  <span className="text-sm text-muted-foreground">Due {formatDate(payment.dueDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">${payment.amount.toFixed(2)}</span>
                  <Badge variant="outline" className={getStatusColor(payment.status)}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-muted-foreground">No upcoming payments found</p>
            <p className="text-sm text-muted-foreground mt-1">All payments are up to date</p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default UpcomingPayments;
