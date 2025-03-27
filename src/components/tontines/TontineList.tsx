import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Users, Calendar, DollarSign, Edit, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DeleteTontineDialog from './DeleteTontineDialog';

interface Tontine {
  id: string;
  name: string;
  description: string;
  amount: number;
  created_at: string;
  created_by: string;
  members_count?: number;
  cycles_count?: number;
}

const TontineList = () => {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchTontines = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      console.log('Fetching tontines for user:', user.id);
      
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log('Tontines retrieved:', data?.length);
      
      // Enhance tontines with member and cycle counts
      const enhancedTontines = await Promise.all(
        (data || []).map(async (tontine) => {
          const { count: membersCount, error: membersError } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('tontine_id', tontine.id);
            
          if (membersError) console.error('Error fetching members count:', membersError);
          
          const { count: cyclesCount, error: cyclesError } = await supabase
            .from('cycles')
            .select('id', { count: 'exact', head: true })
            .eq('tontine_id', tontine.id);
            
          if (cyclesError) console.error('Error fetching cycles count:', cyclesError);
          
          return {
            ...tontine,
            members_count: membersCount || 0,
            cycles_count: cyclesCount || 0
          };
        })
      );
      
      setTontines(enhancedTontines);
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
    fetchTontines();
    
    // Set up realtime subscription for tontine changes
    const tontinesChannel = supabase
      .channel('tontines-realtime-list')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tontines'
        }, 
        (payload) => {
          console.log('Tontine change detected:', payload);
          fetchTontines();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(tontinesChannel);
    };
  }, []);
  
  const handleRefresh = () => {
    fetchTontines();
  };
  
  const handleDeleteClick = (tontineId: string) => {
    setSelectedTontineId(tontineId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedTontineId) return;
    
    try {
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', selectedTontineId);
        
      if (error) throw error;
      
      toast({
        title: 'Tontine deleted',
        description: 'The tontine has been successfully deleted.',
      });
      
      fetchTontines();
    } catch (error: any) {
      console.error('Error deleting tontine:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete tontine',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTontineId(null);
    }
  };
  
  const filteredTontines = tontines.filter(tontine => 
    tontine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tontine.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Members</TableHead>
                <TableHead className="hidden md:table-cell">Cycles</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTontines.length > 0 ? (
                filteredTontines.map((tontine) => (
                  <TableRow key={tontine.id}>
                    <TableCell>
                      <div className="font-medium">{tontine.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {tontine.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(tontine.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {tontine.members_count}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {tontine.cycles_count} cycles
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {tontine.amount ? tontine.amount.toLocaleString() : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/tontines/${tontine.id}`}>
                            <Users className="h-4 w-4" />
                            <span className="sr-only">Members</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/tontines/${tontine.id}/cycles`}>
                            <Calendar className="h-4 w-4" />
                            <span className="sr-only">Cycles</span>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(tontine.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchQuery ? (
                      <div>
                        <p>No tontines found matching your search.</p>
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p>You haven't created any tontines yet.</p>
                        <Button 
                          variant="link" 
                          asChild
                          className="mt-2"
                        >
                          <Link to="/tontines/create">
                            Create your first tontine
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
      </CardContent>
      
      <DeleteTontineDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        tontineId={selectedTontineId}
      />
    </Card>
  );
};

export default TontineList;
