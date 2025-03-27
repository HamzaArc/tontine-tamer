import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import PaymentsList from '@/components/payments/PaymentsList';
import CycleSelector from '@/components/payments/CycleSelector';
import PaymentsSummary from '@/components/payments/PaymentsSummary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Tontine {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  cycle_number: number;
  tontine_id: string;
  recipient_name?: string;
  status: string;
}

const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCycleId = searchParams.get('cycle');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(initialCycleId);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (initialCycleId) {
      setSelectedCycleId(initialCycleId);
    }
  }, [initialCycleId]);

  const fetchTontinesAndCycles = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      console.log('Fetching tontines and cycles for payments page');
      
      // Fetch tontines
      const { data: tontinesData, error: tontinesError } = await supabase
        .from('tontines')
        .select('id, name')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
        
      if (tontinesError) throw tontinesError;
      
      console.log('Tontines retrieved:', tontinesData?.length);
      setTontines(tontinesData || []);
      
      if (!tontinesData || tontinesData.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch all cycles across all tontines
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select(`
          id, 
          cycle_number, 
          tontine_id, 
          recipient_id,
          status
        `)
        .in('tontine_id', tontinesData.map(t => t.id))
        .order('tontine_id', { ascending: true })
        .order('cycle_number', { ascending: true });
        
      if (cyclesError) throw cyclesError;
      
      console.log('Cycles retrieved:', cyclesData?.length);
      
      if (!cyclesData || cyclesData.length === 0) {
        setCycles([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Enhance cycles with recipient names
      const enhancedCycles = await Promise.all(
        cyclesData.map(async (cycle) => {
          let recipientName = 'Unassigned';
          
          if (cycle.recipient_id) {
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('name')
              .eq('id', cycle.recipient_id)
              .maybeSingle();
            
            if (!memberError && memberData) {
              recipientName = memberData.name;
            }
          }
          
          return {
            id: cycle.id,
            cycle_number: cycle.cycle_number,
            tontine_id: cycle.tontine_id,
            recipient_name: recipientName,
            status: cycle.status
          } as Cycle;
        })
      );
      
      console.log('Enhanced cycles:', enhancedCycles.length);
      setCycles(enhancedCycles);
      
      // If no cycle is selected but we have cycles, select the first one
      if (!selectedCycleId && enhancedCycles.length > 0) {
        // Try to find an active cycle first
        const activeCycle = enhancedCycles.find(cycle => cycle.status === 'active');
        if (activeCycle) {
          console.log('Setting active cycle:', activeCycle.id);
          setSelectedCycleId(activeCycle.id);
        } else {
          console.log('Setting first cycle:', enhancedCycles[0].id);
          setSelectedCycleId(enhancedCycles[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTontinesAndCycles();
    
    // Set up improved realtime subscription for tontines with unique channel names
    const tontinesChannel = supabase
      .channel('tontines-changes-payments-page')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        },
        (payload) => {
          console.log('Tontine change detected in payments page:', payload);
          fetchTontinesAndCycles();
        }
      )
      .subscribe();
      
    const cyclesChannel = supabase
      .channel('cycles-changes-payments-page')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        },
        (payload) => {
          console.log('Cycle change detected in payments page:', payload);
          fetchTontinesAndCycles();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tontinesChannel);
      supabase.removeChannel(cyclesChannel);
    };
  }, [user]);
  
  // Find the selected cycle
  const selectedCycle = cycles.find(cycle => cycle.id === selectedCycleId);
  
  if (loading) {
    return (
      <PageContainer title="Payments">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="Payments">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-row items-center gap-2">
            <h1 className="text-2xl font-bold">Manage Payments</h1>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchTontinesAndCycles}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
          
          <CycleSelector 
            tontines={tontines} 
            cycles={cycles} 
            selectedCycleId={selectedCycleId} 
            onSelectCycle={setSelectedCycleId}
          />
        </div>
        
        {selectedCycleId && selectedCycle ? (
          <>
            <PaymentsSummary cycleId={selectedCycleId} />
            <PaymentsList />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            {cycles.length > 0 ? (
              <>
                <h2 className="text-xl font-medium mb-2">Select a Cycle</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Please select a tontine and cycle from the dropdown above to view and manage payments.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-medium mb-2">No Cycles Found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  You haven't created any cycles yet. Go to the Cycles page to create your first payment cycle.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

// Helper function to conditionally apply classes
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default Payments;
