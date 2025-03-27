
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
  RefreshCw, 
  DollarSign, 
  User, 
  CalendarDays, 
  Loader2, 
  Plus,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { SendReminderDialog } from './SendReminderDialog';
import { useUserRole } from '@/hooks/useUserRole';

interface PaymentsListProps {
  cycleId: string;
}

interface Payment {
  id: string;
  member_id: string;
  cycle_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  payment_date: string | null;
  member_name: string;
  member_email: string;
  member_phone: string;
}

interface CycleDetails {
  tontine_id: string;
  status: 'upcoming' | 'active' | 'completed';
}

const PaymentsList: React.FC<PaymentsListProps> = ({ cycleId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');
  const [selectedMemberEmail, setSelectedMemberEmail] = useState<string>('');
  const [selectedMemberPhone, setSelectedMemberPhone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cycleDetails, setCycleDetails] = useState<CycleDetails | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { role } = useUserRole(cycleDetails?.tontine_id || null);
  
  const canManagePayments = role === 'admin' || 
    (role === 'recipient' && cycleDetails?.status === 'active');
  
  const fetchCycleDetails = async () => {
    if (!cycleId) return;
    
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('tontine_id, status')
        .eq('id', cycleId)
        .single();
        
      if (error) throw error;
      setCycleDetails(data);
      
    } catch (error: any) {
      console.error('Error fetching cycle details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch cycle details',
        variant: 'destructive',
      });
    }
  };
  
  const fetchPayments = async () => {
    if (!cycleId) return;
    
    setRefreshing(true);
    try {
      console.log('Fetching payments for cycle:', cycleId);
      
      // First, get all members in the tontine
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .select('tontine_id')
        .eq('id', cycleId)
        .single();
        
      if (cycleError) throw cycleError;
      
      const tontineId = cycleData.tontine_id;
      
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, name, email, phone')
        .eq('tontine_id', tontineId)
        .eq('is_active', true);
        
      if (membersError) throw membersError;
      
      // Get existing payments for this cycle
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, member_id, cycle_id, amount, status, payment_date')
        .eq('cycle_id', cycleId);
        
      if (paymentsError) throw paymentsError;
      
      // Create a merged list of all members with their payment status
      const mergedPayments: Payment[] = membersData.map(member => {
        const existingPayment = paymentsData?.find(p => p.member_id === member.id);
        
        if (existingPayment) {
          return {
            ...existingPayment,
            member_name: member.name,
            member_email: member.email || '',
            member_phone: member.phone || ''
          };
        } else {
          return {
            id: '',
            member_id: member.id,
            cycle_id: cycleId,
            amount: 0,
            status: 'pending',
            payment_date: null,
            member_name: member.name,
            member_email: member.email || '',
            member_phone: member.phone || ''
          };
        }
      });
      
      setPayments(mergedPayments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchCycleDetails();
    fetchPayments();
    
    // Set up realtime subscription for payments
    const paymentsChannel = supabase
      .channel(`payments-list-${cycleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments',
          filter: `cycle_id=eq.${cycleId}`
        }, 
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchPayments();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, [cycleId]);
  
  const handleRefresh = () => {
    fetchPayments();
  };
  
  const openRecordDialog = (memberId: string, memberName: string) => {
    if (!canManagePayments) {
      toast({
        title: 'Permission Denied',
        description: 'You don\'t have permission to record payments.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
    setIsRecordDialogOpen(true);
  };
  
  const openReminderDialog = (memberId: string, memberName: string, memberEmail: string, memberPhone: string) => {
    if (!canManagePayments) {
      toast({
        title: 'Permission Denied',
        description: 'You don\'t have permission to send reminders.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
    setSelectedMemberEmail(memberEmail);
    setSelectedMemberPhone(memberPhone);
    setIsReminderDialogOpen(true);
  };
  
  const handlePaymentRecorded = () => {
    fetchPayments();
    setIsRecordDialogOpen(false);
  };
  
  const handleReminderSent = () => {
    toast({
      title: 'Reminder Sent',
      description: `Payment reminder sent to ${selectedMemberName}.`,
    });
    setIsReminderDialogOpen(false);
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
          <CardTitle className="text-xl">Payments</CardTitle>
          <CardDescription>
            Track and manage payments for this cycle
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
        {payments.length > 0 ? (
          <div className="border rounded-md">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Member</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Amount</th>
                    <th scope="col" className="px-4 py-3 font-medium">Date</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr 
                      key={payment.member_id} 
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{payment.member_name}</div>
                        <div className="text-xs text-muted-foreground">{payment.member_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {payment.status === 'paid' ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-green-500" />
                            ${payment.amount}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {payment.payment_date ? (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {payment.status !== 'paid' && canManagePayments && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRecordDialog(payment.member_id, payment.member_name)}
                            >
                              <DollarSign className="mr-1 h-3.5 w-3.5" />
                              Record
                            </Button>
                          )}
                          
                          {payment.status !== 'paid' && canManagePayments && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openReminderDialog(
                                payment.member_id, 
                                payment.member_name,
                                payment.member_email,
                                payment.member_phone
                              )}
                            >
                              <Mail className="mr-1 h-3.5 w-3.5" />
                              Remind
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Members</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              There are no members in this tontine yet.
            </p>
          </div>
        )}
        
        {canManagePayments && payments.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button onClick={() => {
              // Find the first unpaid member
              const unpaidMember = payments.find(p => p.status !== 'paid');
              if (unpaidMember) {
                openRecordDialog(unpaidMember.member_id, unpaidMember.member_name);
              } else {
                toast({
                  title: 'All Paid',
                  description: 'All members have already paid for this cycle.',
                });
              }
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        )}
      </CardContent>
      
      <RecordPaymentDialog 
        isOpen={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        onPaymentRecorded={handlePaymentRecorded}
        memberId={selectedMemberId || ''}
        memberName={selectedMemberName}
        cycleId={cycleId}
      />
      
      <SendReminderDialog 
        isOpen={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        onReminderSent={handleReminderSent}
        memberId={selectedMemberId || ''}
        memberName={selectedMemberName}
        memberEmail={selectedMemberEmail}
        memberPhone={selectedMemberPhone}
        cycleId={cycleId}
      />
    </Card>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'paid':
      return (
        <Badge variant="success" className="gap-1">
          <DollarSign className="h-3 w-3" />
          Paid
        </Badge>
      );
    case 'late':
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Late
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <User className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
};

export default PaymentsList;
