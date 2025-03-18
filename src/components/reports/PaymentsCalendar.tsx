
import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PaymentsCalendarProps {
  showPreview?: boolean;
}

// Mock data for calendar events
const CALENDAR_EVENTS = [
  {
    date: new Date(2023, 4, 15),
    type: 'payout',
    tontineName: 'Family Savings',
    recipientName: 'Jane Smith',
    amount: 2000,
  },
  {
    date: new Date(2023, 4, 10),
    type: 'dueDate',
    tontineName: 'Family Savings',
    description: 'Payment due for Cycle #2',
    amount: 250,
  },
  {
    date: new Date(2023, 4, 22),
    type: 'payout',
    tontineName: 'Friends Group',
    recipientName: 'Alex Johnson',
    amount: 800,
  },
  {
    date: new Date(2023, 4, 20),
    type: 'dueDate',
    tontineName: 'Friends Group',
    description: 'Payment due for Cycle #3',
    amount: 100,
  },
  {
    date: new Date(2023, 4, 28),
    type: 'payout',
    tontineName: 'Work Colleagues',
    recipientName: 'Michael Brown',
    amount: 1200,
  },
  {
    date: new Date(2023, 4, 25),
    type: 'dueDate',
    tontineName: 'Work Colleagues',
    description: 'Payment due for Cycle #1',
    amount: 150,
  },
];

const PaymentsCalendar: React.FC<PaymentsCalendarProps> = ({ showPreview = false }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(true);
  
  // Filter events for the selected date
  const selectedDateEvents = date 
    ? CALENDAR_EVENTS.filter(event => 
        event.date.getDate() === date.getDate() && 
        event.date.getMonth() === date.getMonth() && 
        event.date.getFullYear() === date.getFullYear()
      )
    : [];
  
  // Custom renderer to highlight dates with events
  const renderDayContent = (day: Date) => {
    const dayEvents = CALENDAR_EVENTS.filter(event => 
      event.date.getDate() === day.getDate() && 
      event.date.getMonth() === day.getMonth() && 
      event.date.getFullYear() === day.getFullYear()
    );
    
    const hasPayoutEvent = dayEvents.some(event => event.type === 'payout');
    const hasDueDateEvent = dayEvents.some(event => event.type === 'dueDate');
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {day.getDate()}
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
