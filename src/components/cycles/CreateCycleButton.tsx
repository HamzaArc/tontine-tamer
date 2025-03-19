
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
import { format } from 'date-fns';
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

interface Member {
  id: string;
  name: string;
}

const formSchema = z.object({
  cycleNumber: z.coerce.number().int().positive({ message: 'Cycle number must be positive.' }),
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
  
  useEffect(() => {
    const fetchMembers = async () => {
      if (!tontineId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, name')
          .eq('tontine_id', tontineId)
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        
        setMembers(data || []);
      } catch (error: any) {
        console.error('Error fetching members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load members. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMembers();
  }, [tontineId, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cycleNumber: 1,
      date: new Date(),
      recipientId: '',
      amount: 2000,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Create the new cycle in the database
      const { data: cycleData, error: cycleError } = await supabase
        .from('cycles')
        .insert({
          cycle_number: data.cycleNumber,
          tontine_id: tontineId,
          recipient_id: data.recipientId,
          start_date: format(data.date, 'yyyy-MM-dd'),
          end_date: format(data.date, 'yyyy-MM-dd'), // For simplicity, using same date 
          status: 'upcoming'
        })
        .select()
        .single();
        
      if (cycleError) throw cycleError;
      
      const recipientName = members.find(m => m.id === data.recipientId)?.name || 'Unknown';
      
      toast({
        title: 'Cycle created',
        description: `Cycle #${data.cycleNumber} has been created for ${recipientName}.`,
      });
      
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error creating cycle:', error);
      toast({
        title: 'Error',
        description: 'Failed to create cycle. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cycleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Number</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payout Amount</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
              <Button type="submit">Create Cycle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCycleButton;
