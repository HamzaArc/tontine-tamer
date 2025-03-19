
import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Tontine {
  id: string;
  name: string;
  members: number;
  cycleProgress: number;
  nextPayout: string;
  amountCollected: number;
  totalAmount: number;
}

const ActiveTontines = () => {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTontines = async () => {
      if (!user) return;
      
      try {
        // Fetch tontines created by the user
        const { data: tontinesData, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, name, amount, start_date')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (tontinesError) throw tontinesError;
        
        if (!tontinesData || tontinesData.length === 0) {
          setTontines([]);
          setLoading(false);
          return;
        }

        // Get details for each tontine
        const enhancedTontines = await Promise.all(
          tontinesData.map(async (tontine) => {
            // Get member count
            const { count: membersCount, error: membersError } = await supabase
              .from('members')
              .select('id', { count: 'exact', head: true })
              .eq('tontine_id', tontine.id);
              
            if (membersError) throw membersError;

            // Get cycles
            const { data: cyclesData, error: cyclesError } = await supabase
              .from('cycles')
              .select('id, cycle_number, start_date, end_date, status')
              .eq('tontine_id', tontine.id)
              .order('cycle_number', { ascending: true });
              
            if (cyclesError) throw cyclesError;

            // Calculate next payout date and cycle progress
            let nextPayout = 'N/A';
            let cycleProgress = 0;
            
            const activeCycle = cyclesData?.find(cycle => cycle.status === 'active');
            
            if (activeCycle) {
              nextPayout = activeCycle.end_date;
              
              // Calculate progress based on dates
              const startDate = new Date(activeCycle.start_date);
              const endDate = new Date(activeCycle.end_date);
              const currentDate = new Date();
              
              if (currentDate >= startDate && currentDate <= endDate) {
                const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                const daysPassed = (currentDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                cycleProgress = Math.round((daysPassed / totalDays) * 100);
              } else if (currentDate > endDate) {
                cycleProgress = 100;
              }

              // Get payment information for active cycle
              if (activeCycle) {
                const { data: paymentsData, error: paymentsError } = await supabase
                  .from('payments')
                  .select('amount')
                  .eq('cycle_id', activeCycle.id);
                  
                if (paymentsError) throw paymentsError;
                
                const amountCollected = paymentsData?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
                const totalAmount = (membersCount || 0) * parseFloat(tontine.amount);
                
                return {
                  id: tontine.id,
                  name: tontine.name,
                  members: membersCount || 0,
                  cycleProgress,
                  nextPayout,
                  amountCollected,
                  totalAmount
                };
              }
            }
            
            return {
              id: tontine.id,
              name: tontine.name,
              members: membersCount || 0,
              cycleProgress: cycleProgress,
              nextPayout: nextPayout,
              amountCollected: 0,
              totalAmount: (membersCount || 0) * parseFloat(tontine.amount)
            };
          })
        );

        setTontines(enhancedTontines);
      } catch (error) {
        console.error('Error fetching tontines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTontines();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('dashboard-tontines-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        }, 
        () => {
          fetchTontines();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        }, 
        () => {
          fetchTontines();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        () => {
          fetchTontines();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'members'
        }, 
        () => {
          fetchTontines();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (dateString: string) => {
    if (dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  if (loading) {
    return (
      <DashboardCard 
        title="Active Tontines" 
        subtitle="Your ongoing tontine groups"
        icon={<Users className="h-4 w-4" />}
        className="col-span-1 md:col-span-2"
      >
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg glass animate-pulse">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-2 w-full mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard 
      title="Active Tontines" 
      subtitle="Your ongoing tontine groups"
      icon={<Users className="h-4 w-4" />}
      className="col-span-1 md:col-span-2"
    >
      <div className="mt-4">
        {tontines.length > 0 ? (
          <div className="space-y-4">
            {tontines.map((tontine) => (
              <div 
                key={tontine.id}
                className="p-4 rounded-lg glass animate-fade-in"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{tontine.name}</h3>
                    <p className="text-sm text-muted-foreground">{tontine.members} members</p>
                  </div>
                  <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                    Next: {formatDate(tontine.nextPayout)}
                  </span>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cycle progress</span>
                    <span>{tontine.cycleProgress}%</span>
                  </div>
                  <Progress value={tontine.cycleProgress} className="h-2" />
                </div>
                
                <div className="mt-3 text-sm flex justify-between">
                  <span className="text-muted-foreground">Collected: ${tontine.amountCollected.toFixed(2)}</span>
                  <span className="font-medium">Total: ${tontine.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-muted-foreground">No active tontines found</p>
            <p className="text-sm text-muted-foreground mt-1">Create a tontine to start tracking your progress</p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default ActiveTontines;
