
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'admin' | 'recipient' | 'member' | null;

export const useUserRole = (tontineId: string | null) => {
  const [role, setRole] = useState<UserRole>(null);
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
        setLoading(true);
        
        // Call the database function to get the user's role
        const { data, error } = await supabase.rpc(
          'get_user_role_in_tontine',
          { user_id: user.id, tontine_id: tontineId }
        );
        
        if (error) throw error;
        
        setRole(data as UserRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    
    // Set up a subscription to detect role changes
    if (tontineId && user) {
      const cyclesChannel = supabase
        .channel(`role-changes-${tontineId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cycles',
            filter: `tontine_id=eq.${tontineId}`
          }, 
          () => {
            console.log('Cycle change detected, refreshing role');
            fetchUserRole();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(cyclesChannel);
      };
    }
  }, [tontineId, user]);

  return { role, loading };
};
