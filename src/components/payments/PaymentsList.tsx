import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Check, X, Bell, User, MoreHorizontal, RefreshCw, Loader2 } from 'lucide-react';
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
import { SendReminderDialog } from './SendReminderDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Payment {
  id: string;
  member_id: string;
  status: 'paid' | 'pending';
  amount: number;
  payment_date?: string;
  member?: Member;
}

interface PaymentsListProps {
  cycleId: string;
  onRecordPayment?: (memberId: string, amount: number) => void;
}

const PaymentsList: React.FC<PaymentsListProps> = ({ cycleId, onRecordPayment }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  
  const fetchPayments = async () => {
    if (!cycleId) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('tontine_id')
        .eq('id', cycleId)
        .single();
      
      if (cycleError) throw cycleError;
      
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, name, email, phone')
        .eq('tontine_id', cycleData.tontine_id)
        .eq('is_active', true);
      
      if (membersError) throw membersError;
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, member_id, status, amount, payment_date')
        .eq('cycle_id', cycleId);
      
      if (paymentsError) throw paymentsError;
      
      const paymentsByMemberId: Record<string, Payment> = {};
      paymentsData?.forEach(payment => {
        const status = payment.status === 'paid' ? 'paid' : 'pending';
        paymentsByMemberId[payment.member_id] = {
          ...payment,
          status
        };
      });
      
      const { data: cycleAmountData, error: amountError } = await supabase
        .from('cycles')
        .select('*, tontines(amount)')
        .eq('id', cycleId)
        .single();
        
      if (amountError) throw amountError;
      
      const totalAmount = cycleAmountData.tontines.amount;
      const defaultAmount = membersData?.length > 0 ? totalAmount / membersData.length : 0;
      
      const allPayments: Payment[] = membersData?.map(member => {
        const existingPayment = paymentsByMemberId[member.id];
        
        if (existingPayment) {
          return {
            ...existingPayment,
            member
          };
        } else {
          return {
            id: 'temp-' + member.id,
            member_id: member.id,
            status: 'pending',
            amount: Math.round(defaultAmount * 100) / 100,
            member
          };
        }
      });
      
      setPayments(allPayments || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchPayments();
    
    const paymentsChannel = supabase
      .channel('payments-list-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments',
          filter: `cycle_id=eq.${cycleId}`
        }, 
        () => {
          fetchPayments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, [cycleId]);
  
  const handleRecordPayment = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsRecordPaymentOpen(true);
  };
  
  const handlePaymentRecorded = async (memberId: string, amount: number) => {
    try {
      const selectedPayment = payments.find(p => p.member_id === memberId);
      
      if (selectedPayment && !selectedPayment.id.startsWith('temp-')) {
        const { error } = await supabase
          .from('payments')
          .update({
            amount,
            status: 'paid',
            payment_date: new Date().toISOString(),
          })
          .eq('id', selectedPayment.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payments')
          .insert({
            cycle_id: cycleId,
            member_id: memberId,
            amount,
            status: 'paid',
            payment_date: new Date().toISOString(),
            payment_method: 'manual',
          });
          
        if (error) throw error;
      }
      
      toast({
        title: 'Payment recorded',
        description: `Payment of $${amount} has been recorded.`,
      });
      
      if (onRecordPayment) {
        onRecordPayment(memberId, amount);
      }
      
      fetchPayments();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };
  
  const handleSendReminder = (memberId: string) => {
    const member = payments.find(p => p.member_id === memberId)?.member;
    if (!member) return;
    
    toast({
      title: 'Reminder sent',
      description: `Payment reminder has been sent to ${member.name}.`,
    });
  };
  
  const handleSendAllReminders = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    toast({
      title: 'Reminders sent',
      description: `Payment reminders have been sent to ${pendingPayments.length} members.`,
    });
  };
  
  const handleReversePayment = async (memberId: string) => {
    try {
      const selectedPayment = payments.find(p => p.member_id === memberId);
      if (!selectedPayment || selectedPayment.id.startsWith('temp-')) return;
      
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'pending',
          payment_date: null,
        })
        .eq('id', selectedPayment.id);
        
      if (error) throw error;
      
      const memberName = selectedPayment.member?.name || 'Member';
      
      toast({
        title: 'Payment reversed',
        description: `Payment from ${memberName} has been marked as pending.`,
      });
      
      fetchPayments();
    } catch (error: any) {
      console.error('Error reversing payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reverse payment',
        variant: 'destructive',
      });
    }
  };
  
  const filteredPayments = payments.filter(payment => 
    payment.member?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.member?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Member Contributions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {payments.length - pendingCount} of {payments.length} members have paid
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchPayments} 
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            
            {pendingCount > 0 && (
              <Button variant="outline" onClick={handleSendAllReminders}>
                <Bell className="mr-2 h-4 w-4" />
                Send All Reminders
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Payment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {payment.member?.name || 'Unknown Member'}
                          </div>
                          <span className="text-sm text-muted-foreground">{payment.member?.email || 'No email'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ${payment.amount}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === 'paid' ? 'default' : 'secondary'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {payment.status === 'paid' ? (
                            <>
                              <Check className="h-3 w-3" />
                              Paid
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payment.payment_date ? (
                          format(new Date(payment.payment_date), 'MMM d, yyyy')
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {payment.status === 'pending' ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRecordPayment(payment.member_id)}
                              >
                                Record Payment
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleSendReminder(payment.member_id)}
                              >
                                <Bell className="h-4 w-4" />
                                <span className="sr-only">Send Reminder</span>
                              </Button>
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRecordPayment(payment.member_id)}>
                                  Modify Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReversePayment(payment.member_id)}>
                                  Reverse Payment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {searchQuery ? (
                        <div>
                          <p>No members found matching your search.</p>
                          <Button 
                            variant="link" 
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        <p>No members found for this cycle.</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <RecordPaymentDialog 
        isOpen={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        memberId={selectedMemberId || ''}
        member={payments.find(p => p.member_id === selectedMemberId)?.member || null}
        onRecordPayment={handlePaymentRecorded}
      />
    </Card>
  );
};

export default PaymentsList;
