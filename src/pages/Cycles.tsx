
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
import { useUserRole } from '@/hooks/useUserRole';

interface Tontine {
  id: string;
  name: string;
}

const Cycles: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTontineId = searchParams.get('tontine');
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(initialTontineId);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { role } = useUserRole(selectedTontineId);
  const isAdmin = role === 'admin';
  
  // Update the URL when selectedTontineId changes
  useEffect(() => {
    if (selectedTontineId) {
      setSearchParams({ tontine: selectedTontineId });
    }
  }, [selectedTontineId, setSearchParams]);
  
  // Initialize selectedTontineId from URL
  useEffect(() => {
    if (initialTontineId) {
      setSelectedTontineId(initialTontineId);
    }
  }, [initialTontineId]);

  const fetchTontines = async () => {
    if (!user) return;

    try {
      console.log('Fetching tontines for cycles page');
      setLoading(true);
      
      // Find all tontines the user is associated with (as admin, recipient or member)
      const { data, error } = await supabase
        .from('tontines')
        .select('id, name')
        .order('created_at', { ascending: false });
          
      if (error) {
        console.error('Error fetching tontines:', error);
        throw error;
      }
      
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
  
  useEffect(() => {
    fetchTontines();
    
    // Set up realtime subscription with improved channel naming
    const channel = supabase
      .channel('tontines-changes-cycles-page')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines'
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
  }, [user]);
  
  const handleTontineSelect = (tontineId: string) => {
    setSelectedTontineId(tontineId);
  };
  
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
              onSelect={handleTontineSelect}
            />
            
            {selectedTontineId && isAdmin && (
              <CreateCycleButton tontineId={selectedTontineId} />
            )}
          </div>
        </div>
        
        {tontines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-medium mb-2">No Tontines Found</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't created or joined any tontines yet. Go to the Tontines page to create your first tontine.
            </p>
          </div>
        ) : (
          <CyclesList tontineId={selectedTontineId} userRole={role} />
        )}
      </div>
    </PageContainer>
  );
};

export default Cycles;
