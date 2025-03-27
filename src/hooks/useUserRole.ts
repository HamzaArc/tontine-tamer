
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
        console.log('Fetching user role for tontine:', tontineId);
        // Use direct object matching for the parameters to match the function definition
        const { data, error } = await supabase.rpc('get_user_role_in_tontine', {
          user_id: user.id,
          tontine_id: tontineId
        });

        if (error) {
          console.error('Error fetching user role:', error);
          throw error;
        }

        console.log('User role:', data);
        setRole(data as TontineRole);
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
