
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type TontineRole = 'admin' | 'recipient' | 'member' | null;

export const useUserRole = (tontineId: string | null) => {
  const [role, setRole] = useState<TontineRole>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !tontineId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching user role for tontine:', tontineId, 'user:', user.id);
        
        // Direct query approach without RPC
        // First check if user is admin (creator)
        const { data: tontineData, error: tontineError } = await supabase
          .from('tontines')
          .select('created_by')
          .eq('id', tontineId)
          .single();
          
        if (tontineError) {
          console.error('Error fetching tontine data:', tontineError);
          throw tontineError;
        }
        
        if (tontineData && tontineData.created_by === user.id) {
          console.log('User is admin of tontine');
          setRole('admin');
          setLoading(false);
          return;
        }
        
        // Next check if user is a recipient of active cycle
        const { data: cycleData, error: cycleError } = await supabase
          .from('cycles')
          .select('recipient_id')
          .eq('tontine_id', tontineId)
          .eq('status', 'active');
          
        if (cycleError) {
          console.error('Error fetching cycle data:', cycleError);
          throw cycleError;
        }
        
        if (cycleData && cycleData.length > 0) {
          const recipientIds = cycleData.map(cycle => cycle.recipient_id);
          
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id, email')
            .in('id', recipientIds)
            .eq('email', user.email)
            .single();
            
          if (memberError && memberError.code !== 'PGRST116') {
            console.error('Error checking recipient status:', memberError);
            throw memberError;
          }
          
          if (memberData) {
            console.log('User is recipient in tontine');
            setRole('recipient');
            setLoading(false);
            return;
          }
        }
        
        // Finally check if user is a regular member
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('tontine_id', tontineId)
          .eq('email', user.email)
          .eq('is_active', true);
          
        if (memberError) {
          console.error('Error checking member status:', memberError);
          throw memberError;
        }
        
        if (memberData && memberData.length > 0) {
          console.log('User is member of tontine');
          setRole('member');
        } else {
          console.log('User has no role in tontine');
          setRole(null);
        }
      } catch (error: any) {
        console.error('Error in useUserRole hook:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, tontineId]);

  return { 
    role, 
    loading, 
    isAdmin: role === 'admin', 
    isRecipient: role === 'recipient', 
    isMember: role === 'member' || role === 'admin' || role === 'recipient'
  };
};
