
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Loader2, 
  RefreshCw,
  Clock,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/ui/role-badge';

interface CyclesListProps {
  tontineId: string;
}

interface Cycle {
  id: string;
  cycle_number: number;
  status: 'upcoming' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  tontine_id: string;
  recipient_id: string | null;
  recipient_name: string | null;
  total_contributed: number;
  target_amount: number;
  progress_percentage: number;
  has_paid: boolean;
}

const CyclesList: React.FC<CyclesListProps> = ({ tontineId }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role } = useUserRole(tontineId);
  
  const isAdmin = role === 'admin';
  
  const fetchCycles = async () => {
    if (!tontineId) return;
    
    setRefreshing(true);
    try {
      // Get tontine info first to know the target amount
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('amount')
        .eq('id', tontineId)
        .single();
        
      if (tontineError) throw tontineError;
      
      const targetAmount = tontineData.amount;
      
      // Get cycles for this tontine
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select(`
          id, 
          cycle_number, 
          status, 
          start_date, 
          end_date, 
          tontine_id, 
          recipient_id
        `)
        .eq('tontine_id', tontineId)
        .order('cycle_number', { ascending: true });
      
      if (cyclesError) throw cyclesError;
      
      if (!cyclesData) {
        setCycles([]);
        setRefreshing(false);
        setLoading(false);
        return;
      }
      
      const enhancedCycles = await Promise.all(cyclesData.map(async (cycle) => {
        // Get recipient name
        let recipientName = 'Unassigned';
        if (cycle.recipient_id) {
          const { data: recipientData, error: recipientError } = await supabase
            .from('members')
            .select('name, email')
            .eq('id', cycle.recipient_id)
            .single();
            
          if (!recipientError && recipientData) {
            recipientName = recipientData.name;
          }
        }
        
        // Get payments for this cycle
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, status, member_id')
          .eq('cycle_id', cycle.id);
          
        if (paymentsError) throw paymentsError;
        
        // Calculate total contributed
        const paidPayments = paymentsData?.filter(p => p.status === 'paid') || [];
        const totalContributed = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        
        // Check if current user has paid
        let hasPaid = false;
        if (user) {
          const { data: userMember, error: userMemberError } = await supabase
            .from('members')
            .select('id')
            .eq('tontine_id', tontineId)
            .eq('email', user.email)
            .single();
            
          if (!userMemberError && userMember) {
            hasPaid = paidPayments.some(payment => payment.member_id === userMember.id);
          }
        }
        
        return {
          ...cycle,
          recipient_name: recipientName,
          total_contributed: totalContributed,
          target_amount: targetAmount,
          progress_percentage: targetAmount > 0 ? Math.round((totalContributed / targetAmount) * 100) : 0,
          has_paid: hasPaid
        };
      }));
      
      setCycles(enhancedCycles);
    } catch (error: any) {
      console.error('Error fetching cycles:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch cycles',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCycles();
    
    // Set up realtime subscription for cycles
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
      
    // Also track payments changes
    const paymentsChannel = supabase
      .channel(`payments-for-cycles-${tontineId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        }, 
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchCycles();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(cyclesChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [tontineId]);
  
  const handleRefresh = () => {
    fetchCycles();
  };
  
  const copyPaymentLink = (cycleId: string) => {
    const link = `${window.location.origin}/payments?cycle=${cycleId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link Copied',
      description: 'Payment link copied to clipboard',
    });
  };
  
  const handleCompleteCycle = async (cycleId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only tontine administrators can complete cycles.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Update the cycle status to completed
      const { error: updateError } = await supabase
        .from('cycles')
        .update({ status: 'completed' })
        .eq('id', cycleId);
        
      if (updateError) throw updateError;
      
      // Find the next upcoming cycle and set it to active
      const nextCycle = cycles.find(c => 
        c.status === 'upcoming' && 
        c.cycle_number > (cycles.find(c2 => c2.id === cycleId)?.cycle_number || 0)
      );
      
      if (nextCycle) {
        const { error: activateError } = await supabase
          .from('cycles')
          .update({ status: 'active' })
          .eq('id', nextCycle.id);
          
        if (activateError) throw activateError;
      }
      
      toast({
        title: 'Cycle Completed',
        description: nextCycle 
          ? 'Cycle has been completed and the next cycle is now active.'
          : 'Cycle has been completed.',
      });
      
      fetchCycles();
    } catch (error: any) {
      console.error('Error completing cycle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete cycle',
        variant: 'destructive',
      });
    }
  };
  
  const getCycleActions = (cycle: Cycle) => {
    const actions = [];
    
    // View payments button (anyone can view)
    actions.push(
      <Button 
        key="view" 
        variant="outline" 
        size="sm" 
        asChild
      >
        <Link to={`/payments?cycle=${cycle.id}`}>
          <DollarSign className="mr-1 h-3.5 w-3.5" />
          Payments
        </Link>
      </Button>
    );
    
    // Copy link button (admin and recipient can share)
    if (role === 'admin' || (role === 'recipient' && cycle.status === 'active')) {
      actions.push(
        <Button 
          key="copy" 
          variant="outline" 
          size="sm" 
          onClick={() => copyPaymentLink(cycle.id)}
        >
          <LinkIcon className="mr-1 h-3.5 w-3.5" />
          Copy Link
        </Button>
      );
    }
    
    // Complete cycle button (only admin can complete active cycles)
    if (isAdmin && cycle.status === 'active') {
      actions.push(
        <Button 
          key="complete" 
          variant="outline" 
          size="sm" 
          onClick={() => handleCompleteCycle(cycle.id)}
        >
          <Clock className="mr-1 h-3.5 w-3.5" />
          Complete Cycle
        </Button>
      );
    }
    
    return actions;
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between py-5">
        <div>
          <CardTitle className="text-xl">Payment Cycles</CardTitle>
          <CardDescription>
            View and manage payment cycles for this tontine
          </CardDescription>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      
      <CardContent>
        {cycles.length > 0 ? (
          <div className="space-y-4">
            {cycles.map((cycle) => (
              <div 
                key={cycle.id} 
                className="border rounded-lg p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          cycle.status === 'completed' ? 'success' : 
                          cycle.status === 'active' ? 'default' : 
                          'secondary'
                        }
                      >
                        {cycle.status}
                      </Badge>
                      
                      <h3 className="text-lg font-medium">
                        Cycle #{cycle.cycle_number}
                      </h3>
                      
                      {cycle.status === 'active' && cycle.recipient_id && 
                       user?.email && cycle.recipient_name === user.email && (
                        <RoleBadge role="recipient" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(cycle.start_date), 'MMM d')} - {format(new Date(cycle.end_date), 'MMM d, yyyy')}
                      </div>
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Recipient: {cycle.recipient_name}
                      </div>
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${cycle.total_contributed} of ${cycle.target_amount} collected
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-start justify-end">
                    {getCycleActions(cycle)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Payment Cycles</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              There are no payment cycles for this tontine yet. 
              {isAdmin ? " Create your first cycle to start collecting payments." : ""}
            </p>
            
            {isAdmin && (
              <Button onClick={() => navigate(`/cycles?tontine=${tontineId}`)}>
                Create First Cycle
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CyclesList;
