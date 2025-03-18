
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  ChevronLeft,
  Edit,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AddMemberDialog } from './AddMemberDialog';
import { MembersList } from './MembersList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

interface Tontine {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  status?: string;
  members_count?: number;
  total_collected?: number;
  next_payment_date?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

interface Cycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  recipient_id: string | null;
  recipient_name?: string;
}

const TontineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tontine, setTontine] = useState<Tontine | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Function to fetch all data
  const fetchData = async () => {
    if (!id) return;
    
    setRefreshing(true);
    await Promise.all([
      fetchTontineDetails(),
      fetchMembers(),
      fetchCycles()
    ]);
    setRefreshing(false);
  };
  
  const fetchTontineDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch tontine details
      const { data: tontineData, error: tontineError } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', id)
        .single();
      
      if (tontineError) throw tontineError;
      if (!tontineData) {
        toast({
          title: 'Error',
          description: 'Tontine not found',
          variant: 'destructive',
        });
        navigate('/tontines');
        return;
      }
      
      // Count members
      const { count: membersCount, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('tontine_id', id)
        .eq('is_active', true);
        
      if (countError) throw countError;
      
      // Calculate tontine status
      const now = new Date();
      const startDate = new Date(tontineData.start_date);
      const endDate = tontineData.end_date ? new Date(tontineData.end_date) : null;
      
      let status = 'active';
      if (startDate > now) {
        status = 'upcoming';
      } else if (endDate && endDate < now) {
        status = 'completed';
      }
      
      // Get total collected amount from payments
      let totalCollected = 0;
      
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontine_id', id);
        
      if (!cyclesError && cyclesData && cyclesData.length > 0) {
        const cycleIds = cyclesData.map(cycle => cycle.id);
        
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, status')
          .in('cycle_id', cycleIds)
          .eq('status', 'paid');
          
        if (!paymentsError && paymentsData) {
          totalCollected = paymentsData.reduce((sum, payment) => sum + Number(payment.amount), 0);
        }
      }
      
      // Calculate next payment date
      let nextPaymentDate = new Date(startDate);
      while (nextPaymentDate <= now) {
        switch (tontineData.frequency) {
          case 'Weekly':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
            break;
          case 'Bi-weekly':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
            break;
          case 'Monthly':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            break;
          case 'Quarterly':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
            break;
        }
      }
      
      setTontine({
        ...tontineData,
        status,
        members_count: membersCount || 0,
        total_collected: totalCollected,
        next_payment_date: format(nextPaymentDate, 'yyyy-MM-dd'),
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tontine details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMembers = async () => {
    if (!id) return;
    
    setMembersLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('tontine_id', id)
        .order('name');
        
      if (error) throw error;
      
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch members',
        variant: 'destructive',
      });
    } finally {
      setMembersLoading(false);
    }
  };
  
  const fetchCycles = async () => {
    if (!id) return;
    
    setCyclesLoading(true);
    try {
      // Fetch cycles
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select('*')
        .eq('tontine_id', id)
        .order('cycle_number', { ascending: true });
        
      if (cyclesError) throw cyclesError;
      
      // Get recipient names
      const enhancedCycles = await Promise.all(
        (cyclesData || []).map(async cycle => {
          let recipientName = 'Unassigned';
          
          if (cycle.recipient_id) {
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('name')
              .eq('id', cycle.recipient_id)
              .single();
            
            if (!memberError && memberData) {
              recipientName = memberData.name;
            }
          }
          
          // Determine status
          let status: 'upcoming' | 'active' | 'completed' = cycle.status as 'upcoming' | 'active' | 'completed';
          
          return {
            ...cycle,
            recipient_name: recipientName,
            status
          };
        })
      );
      
      setCycles(enhancedCycles);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch cycles',
        variant: 'destructive',
      });
    } finally {
      setCyclesLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Set up realtime subscriptions
    const tontineChannel = supabase
      .channel('tontine-details-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines',
          filter: `id=eq.${id}`
        }, 
        () => fetchTontineDetails()
      )
      .subscribe();
      
    const membersChannel = supabase
      .channel('tontine-members-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'members',
          filter: `tontine_id=eq.${id}`
        }, 
        () => {
          fetchMembers();
          fetchTontineDetails(); // To update member count
        }
      )
      .subscribe();
      
    const cyclesChannel = supabase
      .channel('tontine-cycles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cycles',
          filter: `tontine_id=eq.${id}`
        }, 
        () => fetchCycles()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tontineChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(cyclesChannel);
    };
  }, [id]);
  
  const handleMemberAdded = () => {
    fetchMembers();
    fetchTontineDetails(); // To update member count
  };
  
  const handleRefresh = () => {
    fetchData();
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!tontine) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/tontines">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Tontine Not Found</h1>
        </div>
        <p>The tontine you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link to="/tontines">Back to Tontines</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/tontines">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{tontine.name}</h1>
          <Badge variant={tontine.status === 'active' ? 'default' : 'secondary'}>
            {tontine.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button asChild>
            <Link to={`/tontines/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Tontine
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({tontine.members_count})</TabsTrigger>
          <TabsTrigger value="cycles" className="hidden md:flex">Cycles ({cycles.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tontine Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tontine.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p>{tontine.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
                    <p className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      ${tontine.amount}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Frequency</h3>
                    <p className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary" />
                      {tontine.frequency}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(parseISO(tontine.start_date), 'PPP')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
                    <p className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      {tontine.members_count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Collected</h3>
                    <p className="text-2xl font-bold text-primary">${tontine.total_collected}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Next Payment</h3>
                    <p className="text-lg">
                      {format(parseISO(tontine.next_payment_date || tontine.start_date), 'PPP')}
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Estimated Completion</h3>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {tontine.end_date ? format(parseISO(tontine.end_date), 'PPP') : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link to={`/cycles?tontine=${id}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      View Cycle Schedule
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  Manage members of this tontine
                </CardDescription>
              </div>
              <AddMemberDialog 
                tontineId={id || ''} 
                onMemberAdded={handleMemberAdded}
              />
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : members.length > 0 ? (
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <MembersList 
                    members={members} 
                    tontineId={id || ''} 
                    onMemberRemoved={handleMemberAdded}
                  />
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Members Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    This tontine doesn't have any members yet. Add members to start tracking contributions.
                  </p>
                  <AddMemberDialog 
                    tontineId={id || ''} 
                    onMemberAdded={handleMemberAdded}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Cycles</CardTitle>
                <CardDescription>
                  View and manage all payment cycles for this tontine
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="default" asChild>
                  <Link to={`/cycles?tontine=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Cycle
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/cycles?tontine=${id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Cycles
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cyclesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cycles.length > 0 ? (
                <div className="rounded-md border">
                  <ScrollArea className="h-[400px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium text-sm">Cycle #</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Recipient</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Date</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Status</th>
                          <th className="px-4 py-3 text-right font-medium text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycles.map((cycle) => (
                          <tr key={cycle.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <span className="font-medium">#{cycle.cycle_number}</span>
                            </td>
                            <td className="px-4 py-3 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {cycle.recipient_name}
                            </td>
                            <td className="px-4 py-3">
                              {format(parseISO(cycle.end_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={
                                  cycle.status === 'completed' ? 'default' : 
                                  cycle.status === 'active' ? 'success' : 'secondary'
                                }
                              >
                                {cycle.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {cycle.status !== 'upcoming' && (
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/payments?cycle=${cycle.id}`}>
                                    <DollarSign className="mr-1 h-3.5 w-3.5" />
                                    Payments
                                  </Link>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Cycles Yet</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    This tontine doesn't have any payment cycles yet. Create a cycle to start collecting payments.
                  </p>
                  <Button asChild>
                    <Link to={`/cycles?tontine=${id}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Cycle
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TontineDetails;
