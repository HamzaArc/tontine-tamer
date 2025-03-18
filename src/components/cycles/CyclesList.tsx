
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
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Cycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  recipient_id: string | null;
  recipient_name?: string;
  tontine_id: string;
  amount?: number;
  contributions_count?: number;
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
  
  const fetchCycles = async () => {
    if (!tontineId) return;
    
    setRefreshing(true);
    try {
      // Fetch tontine to get amount
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('amount')
        .eq('id', tontineId)
        .single();
      
      if (tontineError) throw tontineError;
      
      // Fetch cycles for this tontine
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select('*')
        .eq('tontine_id', tontineId)
        .order('cycle_number', { ascending: true });
      
      if (cyclesError) throw cyclesError;
      
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
          
          // Count contributions for active cycles
          let contributionsCount = 0;
          if (cycle.status !== 'upcoming') {
            const { count, error: paymentsError } = await supabase
              .from('payments')
              .select('*', { count: 'exact', head: true })
              .eq('cycle_id', cycle.id)
              .eq('status', 'paid');
            
            if (!paymentsError) {
              contributionsCount = count || 0;
            }
          }
          
          return {
            ...cycle,
            recipient_name: recipientName,
            amount: tontineData.amount,
            contributions_count: contributionsCount
          };
        })
      );
      
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
      
      // Set up realtime subscription
      const channel = supabase
        .channel('cycles-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cycles',
            filter: `tontine_id=eq.${tontineId}`
          }, 
          () => {
            fetchCycles();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
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
                        <span>{cycle.contributions_count} / 8</span>
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
