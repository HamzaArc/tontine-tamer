
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  date: z.date({
    required_error: 'Date is required.',
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  member: Member | null;
  onRecordPayment: (memberId: string, amount: number) => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  isOpen,
  onOpenChange,
  memberId,
  member,
  onRecordPayment,
}) => {
  const [defaultAmount, setDefaultAmount] = useState<number>(0);
  
  useEffect(() => {
    const fetchTontineInfo = async () => {
      try {
        // First, get cycle_id from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const cycleId = urlParams.get('cycle');
        
        if (!cycleId) return;
        
        // Get the cycle to get tontine_id
        const { data: cycleData, error: cycleError } = await supabase
          .from('cycles')
          .select('tontine_id')
          .eq('id', cycleId)
          .single();
        
        if (cycleError) throw cycleError;
        
        // Get tontine amount and active members count
        const { data: tontineData, error: tontineError } = await supabase
          .from('tontines')
          .select('amount')
          .eq('id', cycleData.tontine_id)
          .single();
        
        if (tontineError) throw tontineError;
        
        // Count active members
        const { count, error: membersError } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('tontine_id', cycleData.tontine_id)
          .eq('is_active', true);
        
        if (membersError) throw membersError;
        
        // Calculate amount per member
        if (count && count > 0) {
          const amountPerMember = Math.round((tontineData.amount / count) * 100) / 100;
          setDefaultAmount(amountPerMember);
        }
      } catch (error) {
        console.error('Error fetching tontine info:', error);
      }
    };
    
    if (isOpen) {
      fetchTontineInfo();
    }
  }, [isOpen]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultAmount,
      date: new Date(),
      notes: '',
    },
    values: {
      amount: defaultAmount,
      date: new Date(),
      notes: '',
    }
  });
  
  // Update form values when defaultAmount changes
  useEffect(() => {
    form.setValue('amount', defaultAmount);
  }, [defaultAmount, form]);
  
  const onSubmit = (data: FormValues) => {
    onRecordPayment(memberId, data.amount);
    onOpenChange(false);
    form.reset();
  };
  
  if (!member) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment from {member.name} for the current cycle.
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input 
                        type="number" 
                        className="pl-8"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The amount contributed by the member.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date > new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the payment was received.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details about the payment..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
