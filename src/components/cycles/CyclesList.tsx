
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Cycle {
  id: string;
  created_at: string;
  tontine_id: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "completed";
  recipient_id: string | null;
  recipient_name?: string;
  total_contributed?: number;
  progress_percentage?: number;
  has_paid?: boolean;
  cycle_number: number;
}

const CyclesList = () => {
  const [searchParams] = useSearchParams();
  const tontineId = searchParams.get('tontine');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCycles = async () => {
      if (!tontineId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching cycles for tontine ID:', tontineId);
        
        const { data, error } = await supabase
          .from('cycles')
          .select(`
            id,
            created_at,
            tontine_id,
            start_date,
            end_date,
            status,
            recipient_id,
            cycle_number
          `)
          .eq('tontine_id', tontineId)
          .order('cycle_number', { ascending: true });
        
        if (error) {
          console.error('Error fetching cycles:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log('No cycles found for tontine ID:', tontineId);
          setCycles([]);
          setLoading(false);
          return;
        }
        
        console.log('Cycles data received:', data);
        
        // Enhance cycles with recipient names
        const enhancedCycles = await Promise.all(
          data.map(async (cycle) => {
            let recipientName = 'Unassigned';
            
            if (cycle.recipient_id) {
              const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('name')
                .eq('id', cycle.recipient_id)
                .maybeSingle();
              
              if (!memberError && memberData) {
                recipientName = memberData.name;
              }
            }
            
            // Default values for missing fields
            const totalContributed = 500; // Sample data
            const targetAmount = 1000; // Default as it might not exist in DB
            const progressPercentage = (totalContributed / targetAmount) * 100;
            const hasPaid = true; // Sample data
            const typedStatus = cycle.status as "upcoming" | "active" | "completed";
            
            return {
              ...cycle,
              status: typedStatus,
              recipient_name: recipientName,
              total_contributed: totalContributed,
              target_amount: targetAmount,
              progress_percentage: progressPercentage,
              has_paid: hasPaid
            } as Cycle;
          })
        );
        
        console.log('Enhanced cycles:', enhancedCycles);
        setCycles(enhancedCycles);
      } catch (err: any) {
        console.error('Error in fetchCycles:', err);
        setError(err);
        toast({
          title: "Error",
          description: err.message || "Failed to fetch cycles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCycles();
    
    // Set up realtime subscription for cycles updates
    const cyclesChannel = supabase
      .channel(`cycles-list-${tontineId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles',
          filter: `tontine_id=eq.${tontineId}`
        }, 
        (payload) => {
          console.log('Cycle change detected:', payload);
          fetchCycles();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(cyclesChannel);
    };
  }, [tontineId, toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading cycles...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
        <h3 className="font-semibold">Error Loading Cycles</h3>
        <p>{error.message}</p>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  if (!tontineId) {
    return (
      <div className="text-center p-6 border rounded-md">
        <p>Please select a tontine to view its cycles.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Cycles</h2>
        <Button asChild>
          <Link to={`/cycles/new?tontine=${tontineId}`}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Cycle
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Cycle #</TableHead>
              <TableHead className="w-[120px]">Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.length > 0 ? (
              cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell className="font-medium">#{cycle.cycle_number}</TableCell>
                  <TableCell>{format(new Date(cycle.start_date), 'PP')}</TableCell>
                  <TableCell>{format(new Date(cycle.end_date), 'PP')}</TableCell>
                  <TableCell>{cycle.recipient_name}</TableCell>
                  <TableCell>
                    <Badge variant={
                        cycle.status === 'active' ? 'default' :
                        cycle.status === 'upcoming' ? 'secondary' : 'success'
                      }
                      className="capitalize"
                    >
                      {cycle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/payments?cycle=${cycle.id}`}>
                        View Payments
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-muted-foreground">No cycles found for this tontine.</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/cycles/new?tontine=${tontineId}`}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create First Cycle
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CyclesList;
