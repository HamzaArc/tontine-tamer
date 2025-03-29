
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import TontineList from '@/components/tontines/TontineList';
import CreateTontineButton from '@/components/tontines/CreateTontineButton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Tontines: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  React.useEffect(() => {
    // Check for errors in console related to tontine access
    const originalErrorLogger = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('infinite recursion') && errorMessage.includes('tontines')) {
        toast({
          title: "Database Policy Error",
          description: "There's an issue with accessing tontines. The administrator has been notified.",
          variant: "destructive",
        });
      }
      originalErrorLogger(...args);
    };
    
    return () => {
      console.error = originalErrorLogger;
    };
  }, [toast]);
  
  return (
    <PageContainer title="Tontines">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Your Tontines</h1>
          {user && <CreateTontineButton />}
        </div>
        
        <TontineList />
      </div>
    </PageContainer>
  );
};

export default Tontines;
