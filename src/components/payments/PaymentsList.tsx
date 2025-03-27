import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, ClockIcon, Mail, Phone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Payment {
  id: string;
  cycle_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'late';
  notes: string | null;
  member_name?: string;
  member_email?: string;
  member_phone?: string;
}

interface CycleDetails {
  id: string;
  tontine_id: string;
  start_date: string;
  end_date: string;
  target_amount?: number;
  status: 'upcoming' | 'active' | 'completed';
}

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

const PaymentsList = () => {
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycleDetails, setCycleDetails] = useState<CycleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);

  const fetchCycleDetails = async (cycleId: string) => {
    try {
      if (!cycleId) return;
      setLoading(true);

      const { data: cycle, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', cycleId)
        .single();

      if (error) {
        console.error('Error fetching cycle details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch cycle details. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (cycle) {
        const typedStatus = cycle.status as "upcoming" | "active" | "completed";
        
        setCycleDetails({
          ...cycle,
          status: typedStatus,
          tontine_id: cycle.tontine_id,
          target_amount: 1000
        });
      }
    } catch (error) {
      console.error('Error fetching cycle details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cycle details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      if (!cycleId) return;
      setLoading(true);

      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (
            name,
            email,
            phone
          )
        `)
        .eq('cycle_id', cycleId);

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch payments. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (paymentsData.length > 0) {
        const formattedPayments = paymentsData.map(payment => {
          const memberName = (payment.members as any)?.name || 'Unknown';
          const memberEmail = (payment.members as any)?.email || null;
          const memberPhone = (payment.members as any)?.phone || null;
          const typedStatus = payment.status as "paid" | "pending" | "late";
          
          return {
            ...payment,
            status: typedStatus,
            member_name: memberName,
            member_email: memberEmail,
            member_phone: memberPhone
          } as Payment;
        });
        
        setPayments(formattedPayments as Payment[]);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cycleId) {
      fetchCycleDetails(cycleId);
      fetchPayments();
    }
  }, [cycleId]);

  const handleRecordPayment = (member: Member) => {
    setSelectedMember(member);
    setSelectedCycle(cycleId);
    setIsRecordDialogOpen(true);
  };

  const handleSendReminder = (member: Member) => {
    setSelectedMember(member);
    setSelectedCycle(cycleId);
    setIsReminderDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Payments for Cycle: {cycleDetails ? format(new Date(cycleDetails.start_date), 'MMM dd, yyyy') : 'Loading...'}
        </h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading payments...</TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No payments recorded for this cycle.</TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.member_name}</TableCell>
                  <TableCell>${payment.amount}</TableCell>
                  <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRecordPayment({ id: payment.member_id, name: payment.member_name || '', email: payment.member_email || null, phone: payment.member_phone || null })}>
                          <Edit className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendReminder({ id: payment.member_id, name: payment.member_name || '', email: payment.member_email || null, phone: payment.member_phone || null })}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedMember && (
        <RecordPaymentDialog
          isOpen={isRecordDialogOpen}
          onOpenChange={setIsRecordDialogOpen}
          cycleId={selectedCycle || ''}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          onSuccess={fetchPayments}
        />
      )}

      {selectedMember && (
        <SendReminderDialog
          isOpen={isReminderDialogOpen}
          onOpenChange={setIsReminderDialogOpen}
          cycleId={selectedCycle || ''}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          memberEmail={selectedMember.email || ''}
          memberPhone={selectedMember.phone || ''}
          onSuccess={fetchPayments}
        />
      )}
    </div>
  );
};

interface PaymentStatusBadgeProps {
  status: 'paid' | 'pending' | 'late';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  let variant: "default" | "outline" | "secondary" | "destructive" | "success" = "default";
  let text = status;

  switch (status) {
    case 'paid':
      variant = "success";
      break;
    case 'pending':
      variant = "secondary";
      break;
    case 'late':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }

  return (
    <Badge variant={variant} className="capitalize">
      {text}
    </Badge>
  );
};

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}

const recordPaymentFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  paymentDate: z.date({
    required_error: "A date is required.",
  }),
  status: z.enum(['paid', 'pending', 'late']),
  notes: z.string().optional(),
});

type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;

const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({ isOpen, onOpenChange, cycleId, memberId, memberName, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      status: 'pending',
      notes: '',
    },
  });

  const onSubmit = async (data: RecordPaymentFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('payments').insert({
        cycle_id: cycleId,
        member_id: memberId,
        amount: data.amount,
        payment_date: format(data.paymentDate, 'yyyy-MM-dd'),
        status: data.status,
        notes: data.notes,
      });

      if (error) throw error;

      toast({
        title: 'Payment Recorded',
        description: `Payment recorded successfully for ${memberName}.`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {memberName} in this cycle.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={format(field.value, 'yyyy-MM-dd')}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Payment notes (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

interface SendReminderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  onSuccess: () => void;
}

const SendReminderDialog: React.FC<SendReminderDialogProps> = ({ isOpen, onOpenChange, cycleId, memberId, memberName, memberEmail, memberPhone, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendReminder = async () => {
    setIsSubmitting(true);

    try {
      // Simulate sending a reminder (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Reminder Sent',
        description: `Reminder sent successfully to ${memberName}.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
          <DialogDescription>
            Send a payment reminder to {memberName} for this cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p>Are you sure you want to send a payment reminder to {memberName}?</p>
          {memberEmail && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{memberEmail}</span>
            </div>
          )}
          {memberPhone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{memberPhone}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSendReminder} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentsList;
