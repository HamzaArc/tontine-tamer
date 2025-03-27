
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import CyclesList from '@/components/cycles/CyclesList';
import CreateCycleButton from '@/components/cycles/CreateCycleButton';
import TontineSelector from '@/components/cycles/TontineSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tontine {
  id: string;
  name: string;
}

const Cycles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTontineId = searchParams.get('tontine');
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(initialTontineId);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (initialTontineId) {
      setSelectedTontineId(initialTontineId);
    }
  }, [initialTontineId]);

  useEffect(() => {
    const fetchTontines = async () => {
      if (!user) return;

      try {
        console.log('Fetching tontines for cycles page');
        const { data, error } = await supabase
          .from('tontines')
          .select('id, name')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        console.log('Tontines retrieved:', data?.length);
        setTontines(data || []);
        
        // If no tontine is selected but we have tontines, select the first one
        if (!selectedTontineId && data && data.length > 0) {
          setSelectedTontineId(data[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching tontines:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch tontines',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTontines();
    
    // Set up realtime subscription with improved channel naming
    const channel = supabase
      .channel('tontines-changes-cycles-page')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `created_by=eq.${user?.id}`
        }, 
        (payload) => {
          console.log('Tontine change detected in cycles page:', payload);
          fetchTontines();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  
  if (loading) {
    return (
      <PageContainer title="Cycles">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="Cycles">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Manage Payment Cycles</h1>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <TontineSelector 
              tontines={tontines} 
              selectedTontineId={selectedTontineId} 
              onSelect={setSelectedTontineId}
            />
            
            {selectedTontineId && (
              <CreateCycleButton tontineId={selectedTontineId} />
            )}
          </div>
        </div>
        
        {selectedTontineId ? (
          // Remove the tontineId prop since it's not expected by CyclesList
          <CyclesList />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            {tontines.length > 0 ? (
              <>
                <h2 className="text-xl font-medium mb-2">Select a Tontine</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Please select a tontine from the dropdown above to view and manage its payment cycles.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-medium mb-2">No Tontines Found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  You haven't created any tontines yet. Go to the Tontines page to create your first tontine.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Cycles;
