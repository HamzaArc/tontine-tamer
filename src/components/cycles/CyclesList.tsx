import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { CalendarDays } from 'lucide-react';
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
  recipient_id: string;
  recipient_name?: string;
  total_contributed?: number;
  progress_percentage?: number;
  has_paid?: boolean;
}

const CyclesList = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchCycles = async () => {
    try {
      setLoading(true);
      
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
          recipient:profiles (full_name)
        `);
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('No cycles found');
      }

      const formattedCycles = data.map(cycle => {
        // Safely access recipient data
        const recipientData = cycle.recipient as any;
        const recipientName = recipientData ? recipientData.full_name : 'N/A';
        
        // Default values for missing fields
        const totalContributed = 500;
        const targetAmount = 1000; // Default as it doesn't exist in DB
        const progressPercentage = (totalContributed / targetAmount) * 100;
        const hasPaid = true;
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
      });
      
      setCycles(formattedCycles);
    } catch (error: any) {
      console.error('Error fetching cycles:', error);
      setError(error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch cycles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCycles();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading cycles...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500">Error: {error.message}</div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Cycles</h2>
        <Button asChild>
          <Link to="/cycles/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Cycle
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.map((cycle) => (
              <TableRow key={cycle.id}>
                <TableCell className="font-medium">{format(new Date(cycle.start_date), 'PPP')}</TableCell>
                <TableCell>{format(new Date(cycle.end_date), 'PPP')}</TableCell>
                <TableCell>{cycle.recipient_name}</TableCell>
                <TableCell>
                  <Badge variant={
                      cycle.status === 'active' ? 'default' :
                      cycle.status === 'upcoming' ? 'secondary' : 'success'
                    }
                  >
                    {cycle.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/cycles/${cycle.id}`}>
                      View Details
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {cycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No cycles found.
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
