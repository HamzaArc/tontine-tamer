import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import CycleSelector from '@/components/payments/CycleSelector';
import PaymentsList from '@/components/payments/PaymentsList';
import PaymentsSummary from '@/components/payments/PaymentsSummary';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppNotification } from '@/hooks/use-notification';
import { Loader2 } from 'lucide-react';

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
  const { toast } = useToast();
  const { showContributionRecordedNotification } = useAppNotification();
  
  useEffect(() => {
    if (initialCycleId) {
      setSelectedCycleId(initialCycleId);
    }
  }, [initialCycleId]);
  
  useEffect(() => {
    const fetchTontinesAndCycles = async () => {
      setLoading(true);
      try {
        // Fetch tontines
        const { data: tontinesData, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, name')
          .order('created_at', { ascending: false });
        
        if (tontinesError) throw tontinesError;
        
        setTontines(tontinesData || []);
        
        // Fetch all active cycles
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select('id, cycle_number, tontine_id, status, recipient_id')
          .in('status', ['active', 'ongoing', 'completed'])
          .order('cycle_number', { ascending: true });
        
        if (cyclesError) throw cyclesError;
        
        // Enhance cycles with recipient names
        const enhancedCycles = await Promise.all(
          (cyclesData || []).map(async cycle => {
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
              ...cycle,
              recipient_name: recipientName
            };
          })
        );
        
        setCycles(enhancedCycles);
        
        // If no cycle is selected and we have cycles, select the first one
        if (!selectedCycleId && enhancedCycles.length > 0) {
          setSelectedCycleId(enhancedCycles[0].id);
        }
      } catch (error: any) {
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
  }, [selectedCycleId]);
  
  const handleSelectCycle = (cycleId: string) => {
    setSelectedCycleId(cycleId);
  };
  
  const handleRecordPayment = async (memberId: string, amount: number) => {
    try {
      if (!selectedCycleId) {
        throw new Error('No cycle selected');
      }
      
      // Get member name for notification
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('name')
        .eq('id', memberId)
        .single();
      
      if (memberError) throw memberError;
      
      // Show notification
      if (memberData) {
        showContributionRecordedNotification(memberData.name, amount);
      }
      
    } catch (error: any) {
      console.error('Error in handleRecordPayment:', error);
    }
  };
  
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Payments</h1>
          
          <CycleSelector
            tontines={tontines}
            cycles={cycles}
            selectedCycleId={selectedCycleId}
            onSelectCycle={handleSelectCycle}
          />
        </div>
        
        {selectedCycleId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PaymentsList 
                cycleId={selectedCycleId} 
                onRecordPayment={handleRecordPayment} 
              />
            </div>
            <div>
              <PaymentsSummary cycleId={selectedCycleId} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-medium mb-2">No Active Cycles</h2>
            <p className="text-muted-foreground text-center max-w-md">
              There are no active payment cycles. Please create a cycle or wait for a cycle to become active.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Payments;
