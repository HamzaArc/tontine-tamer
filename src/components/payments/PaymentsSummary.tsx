
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, DollarSign, User, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentsSummaryProps {
  cycleId: string;
}

interface PaymentSummary {
  cycleNumber: number;
  recipientName: string;
  tontineName: string;
  payoutDate: string;
  totalAmount: number;
  currentAmount: number;
  completionPercentage: number;
  membersCount: number;
  paidMembersCount: number;
}

const PaymentsSummary: React.FC<PaymentsSummaryProps> = ({ cycleId }) => {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchPaymentSummary = async () => {
    if (!cycleId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching payment summary for cycle:', cycleId);
      // Fetch cycle details with tontine info
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select(`
          id,
          cycle_number,
          end_date,
          recipient_id,
          tontine_id,
          tontines (
            name,
            amount
          )
        `)
        .eq('id', cycleId)
        .single();
      
      if (cycleError) throw cycleError;
      
      if (!cycleData) {
        setLoading(false);
        return;
      }
      
      // Get recipient name if available
      let recipientName = 'Unassigned';
      if (cycleData.recipient_id) {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('name')
          .eq('id', cycleData.recipient_id)
          .single();
        
        if (!memberError && memberData) {
          recipientName = memberData.name;
        }
      }
      
      // Count total members in tontine
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('tontine_id', cycleData.tontine_id)
        .eq('is_active', true);
        
      if (membersError) throw membersError;
      
      const membersCount = membersData?.length || 0;
      
      // Count paid members for this cycle and sum their contributions
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('cycle_id', cycleId);
        
      if (paymentsError) throw paymentsError;
      
      const paidMembers = payments?.filter(payment => payment.status === 'paid') || [];
      const paidMembersCount = paidMembers.length;
      const currentAmount = paidMembers.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Calculate total expected amount - this is the total amount to be paid to the recipient
      const totalAmount = cycleData.tontines.amount;
      
      // Calculate completion percentage
      const completionPercentage = totalAmount > 0 
        ? Math.round((currentAmount / totalAmount) * 100) 
        : 0;
      
      setSummary({
        cycleNumber: cycleData.cycle_number,
        recipientName,
        tontineName: cycleData.tontines.name,
        payoutDate: cycleData.end_date,
        totalAmount,
        currentAmount,
        completionPercentage,
        membersCount,
        paidMembersCount
      });
    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch payment summary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPaymentSummary();
    
    // Set up realtime subscription for payments changes
    const paymentsChannel = supabase
      .channel(`payments-summary-${cycleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments',
          filter: `cycle_id=eq.${cycleId}`
        }, 
        (payload) => {
          console.log('Payment change detected in PaymentsSummary:', payload);
          fetchPaymentSummary();
        }
      )
      .subscribe();
    
    // Also listen for member changes since they can affect the payment calculations
    const membersChannel = supabase
      .channel(`members-summary-${cycleId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          console.log('Member change detected in PaymentsSummary:', payload);
          fetchPaymentSummary();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [cycleId]);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (!summary) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Cycle</h3>
            <div className="flex flex-col">
              <span className="text-xl font-semibold">
                #{summary.cycleNumber} - {summary.tontineName}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                Recipient: {summary.recipientName}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Collection Progress</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="text-lg font-medium">${summary.currentAmount}</span>
                <span className="text-sm text-muted-foreground">of ${summary.totalAmount}</span>
              </div>
              <Progress value={summary.completionPercentage} className="h-2" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {summary.paidMembersCount} of {summary.membersCount} members paid
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Payout Date</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">
                {new Date(summary.payoutDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {getRemainingDays(summary.payoutDate)} days remaining
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Total Payout</h3>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">${summary.totalAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              ${summary.membersCount > 0 ? (summary.totalAmount / summary.membersCount).toFixed(2) : 0} per member
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate days remaining
const getRemainingDays = (dateString: string): number => {
  const today = new Date();
  const payoutDate = new Date(dateString);
  const timeDiff = payoutDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
};

export default PaymentsSummary;
