
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TontineDetailsHeader from '@/components/tontines/TontineDetailsHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddMemberDialog } from '@/components/tontines/AddMemberDialog';
import { RoleDisplay } from '@/components/ui/role-display';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface Tontine {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string;
  created_at: string;
  created_by: string;
}

interface Cycle {
  id: string;
  tontine_id: string;
  start_date: string;
  end_date: string;
  target_amount: number;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

const TontineDetails = () => {
  const { id } = useParams<{ id: string }>();
  const tontineId = id || null;
  const [tontine, setTontine] = useState<Tontine | null>(null);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberDialogVisible, setIsAddMemberDialogVisible] = useState(false);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole(tontineId);
  
  const fetchTontineDetails = async () => {
    if (!tontineId) {
      setError('Tontine ID is missing.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching tontine details for ID:', tontineId);
      
      // Fetch tontine details
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', tontineId)
        .single();
        
      if (tontineError) {
        console.error('Error fetching tontine:', tontineError);
        throw tontineError;
      }
      
      console.log('Tontine data received:', tontineData);
      setTontine(tontineData as Tontine);
      
      // Fetch active cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('*')
        .eq('tontine_id', tontineId)
        .eq('status', 'active')
        .single();
        
      if (cycleError && cycleError.code !== 'PGRST116') {
        console.error('Error fetching cycle:', cycleError);
        throw cycleError; // Ignore "no data found" error
      }
      
      console.log('Active cycle data:', cycleData);
      
      if (cycleData) {
        setActiveCycle(cycleData as Cycle);
      } else {
        setActiveCycle(null);
      }
    } catch (err: any) {
      console.error('Error fetching tontine details:', err);
      setError(err.message || 'Failed to load tontine details.');
      toast.error('Error: ' + (err.message || 'Failed to load tontine details.'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (tontineId) {
      fetchTontineDetails();
    }
  }, [tontineId, user]);
  
  const handleAddMember = () => {
    setIsAddMemberDialogVisible(true);
  };
  
  const isAdmin = role === 'admin';
  const isRecipient = role === 'recipient';
  
  if (loading || roleLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Error: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      {tontine && (
        <>
          <TontineDetailsHeader
            tontineName={tontine.name}
            tontineStatus={activeCycle?.status || "upcoming"}
            tontineId={tontineId || ''}
            onAddMember={handleAddMember}
            isAdmin={isAdmin}
          />
          
          <RoleDisplay tontineId={tontineId || ''} tontineName={tontine.name} />
          
          <AddMemberDialog
            tontineId={tontineId || ''}
            onMemberAdded={() => fetchTontineDetails()}
          />
        </>
      )}
      
      {!tontine && !loading && (
        <div>Tontine not found.</div>
      )}
    </div>
  );
};

export default TontineDetails;
