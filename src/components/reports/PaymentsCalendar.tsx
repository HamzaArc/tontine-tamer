
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DayContentProps } from 'react-day-picker';

interface PaymentsCalendarProps {
  showPreview?: boolean;
}

interface CalendarEvent {
  date: Date;
  type: 'payout' | 'dueDate';
  tontineName: string;
  description?: string;
  recipientName?: string;
  amount: number;
  cycle_id?: string;
}

const PaymentsCalendar: React.FC<PaymentsCalendarProps> = ({ showPreview = false }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch cycles to get due dates and recipients
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select(`
            id,
            cycle_number,
            start_date,
            end_date,
            recipient_id,
            tontine_id,
            tontines(name, amount)
          `);
        
        if (cyclesError) throw cyclesError;
        
        // Fetch member information for recipients
        const recipientIds = cyclesData
          .map(cycle => cycle.recipient_id)
          .filter(Boolean);
          
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, name')
          .in('id', recipientIds);
          
        if (membersError) throw membersError;
        
        // Transform cycles data to calendar events
        const events: CalendarEvent[] = [];
        
        // Add due dates (start dates of cycles)
        cyclesData.forEach(cycle => {
          // Check if cycle has a valid start date
          if (cycle.start_date) {
            const startDate = new Date(cycle.start_date);
            
            // Add cycle start date as due date
            events.push({
              date: startDate,
              type: 'dueDate',
              tontineName: cycle.tontines?.name || 'Unknown Tontine',
              description: `Payment due for Cycle #${cycle.cycle_number}`,
              amount: cycle.tontines?.amount || 0,
              cycle_id: cycle.id
            });
            
            // If there's a recipient, add a payout event
            if (cycle.recipient_id) {
              const recipient = membersData.find(m => m.id === cycle.recipient_id);
              
              events.push({
                date: startDate, // Using same date for now, can be adjusted as needed
                type: 'payout',
                tontineName: cycle.tontines?.name || 'Unknown Tontine',
                recipientName: recipient?.name || 'Unknown Recipient',
                amount: cycle.tontines?.amount || 0,
                cycle_id: cycle.id
              });
            }
          }
        });
        
        setCalendarEvents(events);
      } catch (error: any) {
        console.error('Error fetching calendar events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load calendar events.',
          variant: 'destructive',
        });
        setCalendarEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendarEvents();
    
    // Set up real-time subscription for cycles changes
    const channel = supabase
      .channel('calendar-events-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles' 
        }, 
        () => {
          fetchCalendarEvents();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  
  // Filter events for the selected date
  const selectedDateEvents = date 
    ? calendarEvents.filter(event => isSameDay(event.date, date))
    : [];
  
  // Custom renderer to highlight dates with events
  const renderDayContent = (props: DayContentProps) => {
    const dayDate = props.date; // Correctly access the date property
    
    // Make sure dayDate is a valid date
    if (!dayDate) return <div>{props.children}</div>;
    
    const dayEvents = calendarEvents.filter(event => isSameDay(event.date, dayDate));
    
    const hasPayoutEvent = dayEvents.some(event => event.type === 'payout');
    const hasDueDateEvent = dayEvents.some(event => event.type === 'dueDate');
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {props.children}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
          {hasPayoutEvent && (
            <div className="h-1 w-1 rounded-full bg-green-500"></div>
          )}
          {hasDueDateEvent && (
            <div className="h-1 w-1 rounded-full bg-yellow-500"></div>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments Calendar</CardTitle>
        <CardDescription>
          View upcoming payments and payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="border rounded-md p-3 pointer-events-auto"
            components={{
              DayContent: renderDayContent
            }}
          />
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex w-full justify-between p-0">
              <span className="font-medium">
                Events for {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEvents.map((event, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{event.tontineName}</h4>
                        {event.type === 'payout' ? (
                          <p className="text-sm">
                            Payout to {event.recipientName}
                          </p>
                        ) : (
                          <p className="text-sm">{event.description}</p>
                        )}
                      </div>
                      <Badge 
                        variant={event.type === 'payout' ? 'default' : 'secondary'}
                      >
                        ${event.amount}
                      </Badge>
                    </div>
                    {event.cycle_id && (
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <Link to={`/cycles/${event.cycle_id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-3">
                No events scheduled for this date
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      {showPreview && (
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link to="/reports?tab=calendar">
              <span>View Full Calendar</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PaymentsCalendar;
