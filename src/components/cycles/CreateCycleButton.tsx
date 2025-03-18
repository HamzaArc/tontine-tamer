
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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// Mock data for tontine members
const MOCK_MEMBERS = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Alex Johnson' },
  { id: '4', name: 'Sarah Williams' },
  { id: '5', name: 'Michael Brown' },
  { id: '6', name: 'Emily Davis' },
  { id: '7', name: 'David Wilson' },
  { id: '8', name: 'Lisa Miller' },
];

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
  const [members, setMembers] = useState(MOCK_MEMBERS);
  
  useEffect(() => {
    // In a real app, fetch members based on tontineId
    console.log('Fetching members for tontine:', tontineId);
    // setMembers(fetchedMembers)
  }, [tontineId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cycleNumber: 1,
      date: new Date(),
      recipientId: '',
      amount: 2000,
    },
  });

  const onSubmit = (data: FormValues) => {
    // In a real app, this would send data to the backend
    console.log('Form submitted:', data, 'for tontine:', tontineId);
    
    const recipientName = members.find(m => m.id === data.recipientId)?.name || 'Unknown';
    
    toast({
      title: 'Cycle created',
      description: `Cycle #${data.cycleNumber} has been created for ${recipientName}.`,
    });
    
    setIsOpen(false);
    form.reset();
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
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {member.name}
                          </div>
                        </SelectItem>
                      ))}
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
