
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TontineDetailsHeader from '@/components/tontines/TontineDetailsHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddMemberDialog } from '@/components/tontines/AddMemberDialog'; // Using named import
import { RoleDisplay } from '@/components/ui/role-display';

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
  target_amount: number; // Required in interface
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecipient, setIsRecipient] = useState(false);
  
  const fetchTontineDetails = async () => {
    if (!tontineId) {
      setError('Tontine ID is missing.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch tontine details
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', tontineId)
        .single();
        
      if (tontineError) throw tontineError;
      
      setTontine(tontineData as Tontine);
      
      // Fetch active cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('*')
        .eq('tontine_id', tontineId)
        .eq('status', 'active')
        .single();
        
      if (cycleError && cycleError.code !== 'PGRST116') throw cycleError; // Ignore "no data found" error
      
      // Add default target_amount if it doesn't exist in the database
      if (cycleData) {
        setActiveCycle({
          ...cycleData,
          target_amount: 1000, // Default value
          status: cycleData.status as 'upcoming' | 'active' | 'completed'
        } as Cycle);
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
      
      // Check user role in this tontine
      const checkUserRole = async () => {
        if (!user) return;
        
        try {
          const { data: roleData, error } = await supabase.rpc(
            'get_user_role_in_tontine',
            { user_id: user.id, tontine_id: tontineId }
          );
          
          if (error) throw error;
          
          setIsAdmin(roleData === 'admin');
          setIsRecipient(roleData === 'recipient');
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      };
      
      checkUserRole();
    }
  }, [tontineId, user]);
  
  const handleAddMember = () => {
    setIsAddMemberDialogVisible(true);
  };
  
  if (loading) {
    return <div>Loading tontine details...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
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
          
          {/* Using the AddMemberDialog without isOpen and onOpenChange props */}
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
