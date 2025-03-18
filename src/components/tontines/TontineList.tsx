
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Users, Edit, Trash2, EyeIcon } from 'lucide-react';
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

// Mock data for tontines
const MOCK_TONTINES = [
  {
    id: '1',
    name: 'Family Savings',
    description: 'Monthly savings for family goals',
    members: 8,
    amount: 250,
    frequency: 'Monthly',
    startDate: '2023-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Friends Group',
    description: 'Vacation fund with college friends',
    members: 5,
    amount: 100,
    frequency: 'Bi-weekly',
    startDate: '2023-03-01',
    status: 'active',
  },
  {
    id: '3',
    name: 'Work Colleagues',
    description: 'Office emergency fund',
    members: 12,
    amount: 50,
    frequency: 'Monthly',
    startDate: '2022-11-10',
    status: 'completed',
  },
];

const TontineList: React.FC = () => {
  const [tontines, setTontines] = useState(MOCK_TONTINES);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const handleDelete = (id: string) => {
    setTontines(tontines.filter(tontine => tontine.id !== id));
    toast({
      title: "Tontine deleted",
      description: "The tontine has been successfully deleted.",
    });
  };
  
  const filteredTontines = tontines.filter(tontine => 
    tontine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tontine.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Your Tontines</CardTitle>
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
      </CardHeader>
      <CardContent>
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
                        {tontine.members} members · ${tontine.amount} · {tontine.frequency}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tontine.members}</TableCell>
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
                              >
                                Delete
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
                    No tontines found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TontineList;
