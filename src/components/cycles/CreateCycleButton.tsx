import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addMonths, startOfMonth } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  name: string;
}

const formSchema = z.object({
  date: z.date({
    required_error: 'Date is required.',
  }),
  recipientId: z.string({
    required_error: 'Recipient is required.',
  }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateCycleButtonProps {
  tontineId: string;
}

const CreateCycleButton: React.FC<CreateCycleButtonProps> = ({ tontineId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCycleNumber, setNextCycleNumber] = useState(1);
  const [nextPayoutDate, setNextPayoutDate] = useState(new Date());
  const [defaultAmount, setDefaultAmount] = useState(2000);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !tontineId) return;
      
      try {
        const { data, error } = await supabase
          .from('tontines')
          .select('created_by')
          .eq('id', tontineId)
          .single();
          
        if (error) throw error;
        
        setIsAdmin(data?.created_by === user.id);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [tontineId, user]);

  useEffect(() => {
    const fetchMembersAndDefaults = async () => {
      if (!tontineId) return;
      
      setLoading(true);
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, name')
          .eq('tontine_id', tontineId)
          .eq('is_active', true)
          .order('name');
          
        if (membersError) throw membersError;
        setMembers(membersData || []);

        const { data: tontineData, error: tontineError } = await supabase
          .from('tontines')
          .select('amount')
          .eq('id', tontineId)
          .single();
          
        if (tontineError) throw tontineError;
        
        if (tontineData) {
          setDefaultAmount(tontineData.amount);
        }
        
        const { data: cycles, error: cyclesError } = await supabase
          .from('cycles')
          .select('cycle_number, end_date')
          .eq('tontine_id', tontineId)
          .order('cycle_number', { ascending: false })
          .limit(1);
          
        if (cyclesError) throw cyclesError;
        
        if (cycles && cycles.length > 0) {
          setNextCycleNumber(cycles[0].cycle_number + 1);
          const lastCycleDate = new Date(cycles[0].end_date);
          const nextDate = addMonths(lastCycleDate, 1);
          setNextPayoutDate(startOfMonth(nextDate));
        } else {
          setNextCycleNumber(1);
          const today = new Date();
          setNextPayoutDate(today);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembersAndDefaults();
  }, [tontineId, toast, isOpen]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: nextPayoutDate,
      recipientId: '',
      amount: defaultAmount,
    },
  });

  useEffect(() => {
    form.setValue('date', nextPayoutDate);
    form.setValue('amount', defaultAmount);
  }, [nextPayoutDate, defaultAmount, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .insert({
          cycle_number: nextCycleNumber,
          tontine_id: tontineId,
          recipient_id: data.recipientId,
          start_date: format(data.date, 'yyyy-MM-dd'),
          end_date: format(data.date, 'yyyy-MM-dd'), 
          status: 'upcoming',
        })
        .select()
        .single();
        
      if (cycleError) throw cycleError;
      
      if (data.amount !== defaultAmount) {
        const { error: tontineError } = await supabase
          .from('tontines')
          .update({ amount: data.amount })
          .eq('id', tontineId);
          
        if (tontineError) throw tontineError;
      }
      
      const recipientName = members.find(m => m.id === data.recipientId)?.name || 'Unknown';
      
      toast({
        title: 'Cycle created',
        description: `Cycle #${nextCycleNumber} has been created for ${recipientName}.`,
      });
      
      setNextCycleNumber(prev => prev + 1);
      
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cycle. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Cycle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Payment Cycle</DialogTitle>
          <DialogDescription>
            Set up a new payment cycle and assign a recipient for this tontine.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="cycleNumber"
              render={() => (
                <FormItem>
                  <FormLabel>Cycle Number</FormLabel>
                  <FormControl>
                    <Input type="number" value={nextCycleNumber} disabled />
                  </FormControl>
                  <FormDescription>
                    Cycle number is automatically assigned
                  </FormDescription>
                </FormItem>
              )}
            />
              
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Payout Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input 
                        type="number" 
                        placeholder="2000" 
                        className="pl-8"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {members.length > 0 
                      ? `Each member will contribute $${(field.value / members.length).toFixed(2)}`
                      : 'Add members to calculate individual contributions'}
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
                  <FormLabel>Payout Date</FormLabel>
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
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date this cycle's payout will occur.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading members...
                        </div>
                      ) : members.length > 0 ? (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {member.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No members found for this tontine
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The tontine member who will receive this cycle's payout.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || members.length === 0}>Create Cycle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCycleButton;
