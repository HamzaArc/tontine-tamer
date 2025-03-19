
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useInvitation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const processInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: { invitationId },
      });

      if (error) throw error;
      
      toast({
        title: 'Invitation sent',
        description: data.message || 'The invitation has been processed successfully.',
      });
      
      return data;
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process invitation',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processAllPendingInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-pending-invitations');

      if (error) throw error;
      
      toast({
        title: 'Invitations processed',
        description: `Processed ${data.processed} pending invitations.`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error processing pending invitations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process pending invitations',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    processInvitation,
    processAllPendingInvitations,
  };
};
