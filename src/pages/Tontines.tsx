
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import TontineList from '@/components/tontines/TontineList';
import CreateTontineButton from '@/components/tontines/CreateTontineButton';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Tontines: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [canViewTontines, setCanViewTontines] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const testAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Test if we can access tontines
        const { data, error } = await supabase
          .from('tontines')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('Error testing tontine access:', error);
          toast({
            title: 'Access Error',
            description: 'There was an issue accessing tontines data. Please try again later.',
            variant: 'destructive',
          });
          setCanViewTontines(false);
        } else {
          setCanViewTontines(true);
        }
      } catch (error: any) {
        console.error('Error in tontines access test:', error);
        toast({
          title: 'Unexpected Error',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
        setCanViewTontines(false);
      } finally {
        setLoading(false);
      }
    };

    testAccess();
  }, [user, toast]);

  if (loading) {
    return (
      <PageContainer title="Tontines">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tontines">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Your Tontines</h1>
          <CreateTontineButton />
        </div>
        
        {canViewTontines ? (
          <TontineList />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-medium mb-2">Welcome to Tontines</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create your first tontine to get started. A tontine is a group savings arrangement where members contribute regularly and take turns receiving the pool.
            </p>
            <CreateTontineButton />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Tontines;
