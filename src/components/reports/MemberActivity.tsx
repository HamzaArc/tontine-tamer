
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityItem {
  id: string;
  name: string;
  tontineName: string;
  actionType: 'payment' | 'payout';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface MemberActivityProps {
  showPreview?: boolean;
}

const MemberActivity: React.FC<MemberActivityProps> = ({ showPreview = false }) => {
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        
        // Fetch payments data from Supabase
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            payment_date,
            status,
            payment_method,
            notes,
            created_at,
            member_id,
            cycle_id,
            members(name),
            cycles(tontine_id, cycle_number)
          `)
          .order('created_at', { ascending: false })
          .limit(showPreview ? 5 : 20);
          
        if (paymentsError) throw paymentsError;
        
        // Get tontine names for the payments
        const tontineIds = [...new Set(paymentsData.map(p => p.cycles?.tontine_id).filter(Boolean))];
        
        const { data: tontinesData, error: tontinesError } = await supabase
          .from('tontines')
          .select('id, name')
          .in('id', tontineIds);
          
        if (tontinesError) throw tontinesError;
        
        // Transform the data to match our ActivityItem interface
        const mappedData: ActivityItem[] = paymentsData.map(payment => {
          const tontine = tontinesData.find(t => t.id === payment.cycles?.tontine_id);
          
          return {
            id: payment.id,
            name: payment.members?.name || 'Unknown Member',
            tontineName: tontine?.name || 'Unknown Tontine',
            actionType: 'payment',
            amount: payment.amount,
            date: payment.created_at,
            status: payment.status === 'paid' ? 'completed' : 
                   payment.status === 'pending' ? 'pending' : 'overdue',
          };
        });
        
        setActivityData(mappedData);
      } catch (error: any) {
        console.error('Error fetching activity data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load member activity data.',
          variant: 'destructive',
        });
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityData();
    
    // Set up real-time subscription for payments changes
    const channel = supabase
      .channel('member-activity-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments' 
        }, 
        () => {
          fetchActivityData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showPreview, toast]);
  
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
        <CardTitle>Recent Member Activity</CardTitle>
        <CardDescription>
          Recent payments, payouts, and other member activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activityData.length > 0 ? (
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
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No activity data available
          </div>
        )}
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
