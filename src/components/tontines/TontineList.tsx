import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, RefreshCw, Edit, Trash2, EyeIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Tontine {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  frequency: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  status: string;
  members_count?: number;
}

const TontineList: React.FC = () => {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchTontines = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      console.log('Fetching tontines with user ID:', user.id);
      const { data: tontinesData, error: tontinesError } = await supabase
        .from('tontines')
        .select('*')
        .eq('created_by', user.id) // Ensure we filter by user
        .order('created_at', { ascending: false });
        
      if (tontinesError) throw tontinesError;
      
      console.log('Tontines fetched:', tontinesData?.length);
      
      const tontinesWithMembers = await Promise.all(
        (tontinesData || []).map(async (tontine) => {
          const { count, error: membersError } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('tontine_id', tontine.id);
            
          if (membersError) throw membersError;
          
          const now = new Date();
          const startDate = new Date(tontine.start_date);
          const endDate = tontine.end_date ? new Date(tontine.end_date) : null;
          
          let status = 'active';
          if (startDate > now) {
            status = 'upcoming';
          } else if (endDate && endDate < now) {
            status = 'completed';
          }
          
          return {
            ...tontine,
            members_count: count || 0,
            status,
          };
        })
      );
      
      console.log('Enhanced tontines with member counts:', tontinesWithMembers.length);
      setTontines(tontinesWithMembers);
    } catch (error: any) {
      console.error('Error fetching tontines:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tontines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTontines();
      
      const channelName = `tontines-list-changes-${user.id}`;
      console.log('Setting up realtime subscription on channel:', channelName);
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'tontines',
            filter: `created_by=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Tontine change detected:', payload);
            fetchTontines();
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'members'
          },
          (payload) => {
            console.log('Member change detected:', payload);
            fetchTontines();
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for ${channelName}:`, status);
        });
      
      return () => {
        console.log('Cleaning up supabase channel:', channelName);
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);
  
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTontines(tontines.filter(tontine => tontine.id !== id));
      
      toast({
        title: "Tontine deleted",
        description: "The tontine has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tontine",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleRefresh = () => {
    fetchTontines();
  };
  
  const filteredTontines = tontines.filter(tontine => 
    tontine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tontine.description && tontine.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Your Tontines</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tontines..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Members</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTontines.length > 0 ? (
                  filteredTontines.map((tontine) => (
                    <TableRow key={tontine.id}>
                      <TableCell>
                        <div className="font-medium">{tontine.name}</div>
                        <div className="text-sm text-muted-foreground md:hidden">
                          {tontine.members_count} members · ${tontine.amount} · {tontine.frequency}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tontine.members_count}</TableCell>
                      <TableCell className="hidden md:table-cell">${tontine.amount}</TableCell>
                      <TableCell className="hidden md:table-cell">{tontine.frequency}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={tontine.status === 'active' ? 'default' : 'secondary'}
                        >
                          {tontine.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/tontines/${tontine.id}`}>
                              <EyeIcon className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/tontines/${tontine.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the tontine "{tontine.name}" and all associated data.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(tontine.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingId === tontine.id}
                                >
                                  {deletingId === tontine.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {searchQuery ? (
                        <div>
                          <p>No tontines found matching "{searchQuery}".</p>
                          <Button 
                            variant="link" 
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6">
                          <p className="mb-4">You haven't created any tontines yet.</p>
                          <Button asChild>
                            <Link to="/tontines">
                              <Plus className="mr-2 h-4 w-4" />
                              Create Your First Tontine
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TontineList;
