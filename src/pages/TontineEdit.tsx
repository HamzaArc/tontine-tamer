
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageContainer from '@/components/layout/PageContainer';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the valid frequency values
type FrequencyType = 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().optional(),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  frequency: z.enum(['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']),
  startDate: z.date({
    required_error: 'Start date is required.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const TontineEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      frequency: 'Monthly',
      startDate: new Date(),
    },
  });

  useEffect(() => {
    const fetchTontine = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('tontines')
          .select('*')
          .eq('id', id)
          .eq('created_by', user.id)
          .single();

        if (error) throw error;

        if (data) {
          // Convert the database frequency to our enum type
          const frequency = data.frequency as FrequencyType;
          
          form.reset({
            name: data.name,
            description: data.description || '',
            amount: data.amount,
            frequency: frequency,
            startDate: new Date(data.start_date),
          });
        }
      } catch (error: any) {
        console.error('Error fetching tontine:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load tontine details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTontine();
  }, [id, form, toast, user]);

  const onSubmit = async (data: FormValues) => {
    if (!user || !id) return;

    setSubmitting(true);
    
    try {
      // Calculate an estimated end date based on frequency
      const startDate = new Date(data.startDate);
      let endDate = new Date(startDate);
      
      // Simple estimation for end date
      switch (data.frequency) {
        case 'Weekly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'Bi-weekly':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'Monthly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        case 'Quarterly':
          endDate.setFullYear(endDate.getFullYear() + 2);
          break;
      }
      
      const { error } = await supabase
        .from('tontines')
        .update({
          name: data.name,
          description: data.description || null,
          amount: data.amount,
          frequency: data.frequency,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Tontine updated',
        description: `${data.name} has been updated successfully.`,
      });
      
      navigate(`/tontines/${id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update tontine. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Edit Tontine">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Tontine">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Tontine</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Family Savings" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your tontine a descriptive name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Monthly savings for family goals..." 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="100" 
                          className="pl-8"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Contribution amount per period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often members will contribute.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When the first contribution cycle begins.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/tontines/${id}`)} 
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : 'Update Tontine'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageContainer>
  );
};

export default TontineEdit;
