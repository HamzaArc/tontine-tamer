
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Calendar, User, DollarSign, Edit, LinkIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, isBefore, isEqual, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ongoing' | 'completed';
  recipient_id: string | null;
  recipient_name?: string;
  tontine_id: string;
  amount?: number;
  contributions_count?: number;
  members_count?: number;
}

interface CyclesListProps {
  tontineId: string;
}

const CyclesList: React.FC<CyclesListProps> = ({ tontineId }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  const determineStatus = (
    cycle: any, 
    paymentsCount: number, 
    membersCount: number, 
    hasAnyPayment: boolean
  ): 'upcoming' | 'active' | 'ongoing' | 'completed' => {
    const today = new Date();
    const startDate = parseISO(cycle.start_date);
    
    // 1. If cycle's start date is in the future, it's upcoming
    if (isBefore(today, startDate)) {
      return 'upcoming';
    }
    
    // 2. If all payments are recorded, it's completed
    if (paymentsCount === membersCount && membersCount > 0) {
      return 'completed';
    }
    
    // 3. If at least one payment was recorded, it's ongoing
    if (hasAnyPayment) {
      return 'ongoing';
    }
    
    // 4. If cycle's date is less or equal to today's date, it's active
    if (isBefore(startDate, today) || isEqual(startDate, today)) {
      return 'active';
    }
    
    // Default to the stored status
    return cycle.status;
  };
  
  const fetchCycles = async () => {
    if (!tontineId) return;
    
    setRefreshing(true);
    try {
      console.log('Fetching cycles for tontine:', tontineId);
      
      // Fetch tontine to get amount
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('amount')
        .eq('id', tontineId)
        .single();
      
      if (tontineError) throw tontineError;
      
      // Count active members in the tontine
      const { count: membersCount, error: membersCountError } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('tontine_id', tontineId)
        .eq('is_active', true);
      
      if (membersCountError) throw membersCountError;
      
      // Fetch cycles for this tontine
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select('*')
        .eq('tontine_id', tontineId)
        .order('cycle_number', { ascending: true });
      
      if (cyclesError) throw cyclesError;

      console.log('Cycles data:', cyclesData);
      
      // For cycles with recipients, get recipient names
      const enhancedCycles = await Promise.all(
        (cyclesData || []).map(async (cycle) => {
          let recipientName = 'Unassigned';
          
          if (cycle.recipient_id) {
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('name')
              .eq('id', cycle.recipient_id)
              .single();
            
            if (!memberError && memberData) {
              recipientName = memberData.name;
            }
          }
          
          // Count all payments for this cycle
          const { count: paymentsCount, error: paymentsCountError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('cycle_id', cycle.id)
            .eq('status', 'paid');
            
          if (paymentsCountError) throw paymentsCountError;
          
          // Check if there's at least one payment recorded
          const hasAnyPayment = paymentsCount ? paymentsCount > 0 : false;
          
          // Determine the correct status
          const calculatedStatus = determineStatus(
            cycle, 
            paymentsCount || 0, 
            membersCount || 0, 
            hasAnyPayment
          );
          
          // Update the cycle status in the database if it's different
          if (calculatedStatus !== cycle.status) {
            const { error: updateError } = await supabase
              .from('cycles')
              .update({ status: calculatedStatus })
              .eq('id', cycle.id);
              
            if (updateError) console.error('Error updating cycle status:', updateError);
          }
          
          return {
            ...cycle,
            recipient_name: recipientName,
            amount: tontineData.amount,
            contributions_count: paymentsCount || 0,
            members_count: membersCount || 0,
            // Use the calculated status
            status: calculatedStatus
          };
        })
      );
      
      console.log('Enhanced cycles:', enhancedCycles);
      setCycles(enhancedCycles);
    } catch (error: any) {
      console.error('Error fetching cycles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch cycles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (tontineId) {
      fetchCycles();
      
      // Set up realtime subscription for cycles
      const cyclesChannel = supabase
        .channel('cycles-changes-' + tontineId)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cycles',
            filter: `tontine_id=eq.${tontineId}`
          }, 
          (payload) => {
            console.log('Cycles change detected:', payload);
            fetchCycles();
          }
        )
        .subscribe();
      
      // Also listen for payment changes which could affect cycle status
      const paymentsChannel = supabase
        .channel('payments-changes-cycles-' + tontineId)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments'
          },
          (payload) => {
            console.log('Payment change detected that might affect cycle status:', payload);
            fetchCycles();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(cyclesChannel);
        supabase.removeChannel(paymentsChannel);
      };
    }
  }, [tontineId]);
  
  const handleRefresh = () => {
    fetchCycles();
  };
  
  const filteredCycles = cycles.filter(cycle => 
    cycle.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'default';
      case 'active': return 'success';
      case 'ongoing': return 'success';
      case 'upcoming': return 'secondary';
      default: return 'default';
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Payment Cycles</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Contributions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCycles.length > 0 ? (
                filteredCycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>#{cycle.cycle_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(cycle.start_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {cycle.recipient_name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {cycle.amount ? cycle.amount.toLocaleString() : '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(cycle.status) as any}>
                        {cycle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cycle.status !== 'upcoming' ? (
                        <span>{cycle.contributions_count} / {cycle.members_count}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cycle.status !== 'upcoming' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/payments?cycle=${cycle.id}`}>
                              <DollarSign className="h-4 w-4" />
                              <span className="sr-only">Payments</span>
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/cycles/${cycle.id}`}>
                            <LinkIcon className="h-4 w-4" />
                            <span className="sr-only">Details</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          disabled={cycle.status === 'completed'}
                        >
                          <Link to={`/cycles/${cycle.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchQuery ? (
                      <div>
                        <p>No cycles found matching your search.</p>
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <p>No payment cycles have been created for this tontine yet.</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CyclesList;
