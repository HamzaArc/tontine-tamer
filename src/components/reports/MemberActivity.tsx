
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Mock data for member activity
const MEMBER_ACTIVITY_DATA = [
  { 
    id: '1',
    name: 'John Doe',
    tontineName: 'Family Savings',
    actionType: 'payment',
    amount: 250,
    date: '2023-05-02T14:30:00',
    status: 'completed',
  },
  { 
    id: '2',
    name: 'Jane Smith',
    tontineName: 'Friends Group',
    actionType: 'payment',
    amount: 100,
    date: '2023-05-03T10:15:00',
    status: 'completed',
  },
  { 
    id: '3',
    name: 'Alex Johnson',
    tontineName: 'Work Colleagues',
    actionType: 'payout',
    amount: 1200,
    date: '2023-05-01T16:45:00',
    status: 'completed',
  },
  { 
    id: '4',
    name: 'Sarah Williams',
    tontineName: 'Family Savings',
    actionType: 'payment',
    amount: 250,
    date: '2023-05-04T09:20:00',
    status: 'pending',
  },
  { 
    id: '5',
    name: 'Michael Brown',
    tontineName: 'Friends Group',
    actionType: 'payment',
    amount: 100,
    date: '2023-05-04T11:05:00',
    status: 'overdue',
  },
  { 
    id: '6',
    name: 'Emily Davis',
    tontineName: 'Work Colleagues',
    actionType: 'payment',
    amount: 50,
    date: '2023-05-03T13:40:00',
    status: 'completed',
  },
  { 
    id: '7',
    name: 'David Wilson',
    tontineName: 'Family Savings',
    actionType: 'payment',
    amount: 250,
    date: '2023-05-05T08:50:00',
    status: 'completed',
  },
  { 
    id: '8',
    name: 'Lisa Miller',
    tontineName: 'Friends Group',
    actionType: 'payout',
    amount: 800,
    date: '2023-04-30T15:25:00',
    status: 'completed',
  },
];

interface MemberActivityProps {
  showPreview?: boolean;
}

const MemberActivity: React.FC<MemberActivityProps> = ({ showPreview = false }) => {
  const activityData = showPreview 
    ? MEMBER_ACTIVITY_DATA.slice(0, 5) 
    : MEMBER_ACTIVITY_DATA;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Member Activity</CardTitle>
        <CardDescription>
          Recent payments, payouts, and other member activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityData.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{activity.name}</div>
                    <div className="text-sm text-muted-foreground">{activity.tontineName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium capitalize">
                      {activity.actionType}
                    </div>
                    <div className="text-sm">${activity.amount}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(activity.date), 'MMM d, yyyy')}
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(activity.date), 'h:mm a')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activity.status)}
                    <span className="hidden md:inline">
                      {getStatusBadge(activity.status)}
                    </span>
                    <span className="md:hidden capitalize text-sm">
                      {activity.status}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {showPreview && (
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link to="/reports?tab=activity">
              <span>View All Activity</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default MemberActivity;
