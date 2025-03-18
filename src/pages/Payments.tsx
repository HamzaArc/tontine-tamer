
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import PaymentsList from '@/components/payments/PaymentsList';
import CycleSelector from '@/components/payments/CycleSelector';
import PaymentsSummary from '@/components/payments/PaymentsSummary';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tontine {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  cycle_number: number;
  tontine_id: string;
  recipient_name?: string;
}

const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCycleId = searchParams.get('cycle');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(initialCycleId);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (initialCycleId) {
      setSelectedCycleId(initialCycleId);
    }
  }, [initialCycleId]);

  useEffect(() => {
    const fetchTontinesAndCycles = async () => {
      if (!user) return;

      try {
        // Fetch tontines
        const { data: tontinesData, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, name')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
          
        if (tontinesError) throw tontinesError;
        
        setTontines(tontinesData || []);
        
        // Fetch all cycles across all tontines
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select(`
            id, 
            cycle_number, 
            tontine_id, 
            recipient_id
          `)
          .order('tontine_id', { ascending: true })
          .order('cycle_number', { ascending: true });
          
        if (cyclesError) throw cyclesError;
        
        if (!cyclesData || cyclesData.length === 0) {
          setCycles([]);
          setLoading(false);
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
                .single();
              
              if (!memberError && memberData) {
                recipientName = memberData.name;
              }
            }
            
            return {
              id: cycle.id,
              cycle_number: cycle.cycle_number,
              tontine_id: cycle.tontine_id,
              recipient_name: recipientName
            } as Cycle;
          })
        );
        
        setCycles(enhancedCycles);
        
        // If no cycle is selected but we have cycles, select the first one
        if (!selectedCycleId && enhancedCycles.length > 0) {
          setSelectedCycleId(enhancedCycles[0].id);
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
      }
    };
    
    fetchTontinesAndCycles();
    
    // Set up realtime subscription for tontines and cycles
    const tontinesChannel = supabase
      .channel('tontines-changes-payments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        },
        () => fetchTontinesAndCycles()
      )
      .subscribe();
      
    const cyclesChannel = supabase
      .channel('cycles-changes-payments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles'
        },
        () => fetchTontinesAndCycles()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tontinesChannel);
      supabase.removeChannel(cyclesChannel);
    };
  }, [user, selectedCycleId]);
  
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
          <h1 className="text-2xl font-bold">Manage Payments</h1>
          
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
            <PaymentsList cycleId={selectedCycleId} />
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

export default Payments;
