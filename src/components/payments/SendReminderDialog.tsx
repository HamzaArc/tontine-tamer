
import React from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  reminderType: z.enum(['email', 'sms', 'both']),
  customMessage: z.string().optional(),
  sendImmediate: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface SendReminderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onSendReminder: () => void;
}

export const SendReminderDialog: React.FC<SendReminderDialogProps> = ({
  isOpen,
  onOpenChange,
  member,
  onSendReminder,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reminderType: 'both',
      customMessage: '',
      sendImmediate: true,
    },
  });
  
  const onSubmit = (data: FormValues) => {
    // In a real app, this would send a reminder via the appropriate channel
    console.log('Sending reminder:', data);
    onSendReminder();
    onOpenChange(false);
    form.reset();
  };
  
  if (!member) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
          <DialogDescription>
            Send a payment reminder to {member.name}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Recipient Details</h3>
              <div className="pl-2 border-l-2 space-y-1">
                <p className="text-sm">Name: {member.name}</p>
                <p className="text-sm">Email: {member.email}</p>
                <p className="text-sm">Phone: {member.phone}</p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="reminderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Both Email and SMS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How the reminder will be sent to the member.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please remember to submit your contribution for this month's cycle..."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add a personalized message to the standard reminder text.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sendImmediate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Send immediately</FormLabel>
                    <FormDescription>
                      If unchecked, the reminder will be scheduled for the next reminder batch.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Reminder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
