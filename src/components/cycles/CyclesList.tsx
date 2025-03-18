
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Calendar, User, DollarSign, Edit, LinkIcon } from 'lucide-react';
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

interface Cycle {
  id: string;
  number: number;
  date: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  status: 'pending' | 'active' | 'completed';
  contributionsCount: number;
  totalContributions: number;
}

interface CyclesListProps {
  tontineId: string;
}

// Mock data for cycles
const generateMockCycles = (tontineId: string): Cycle[] => {
  const today = new Date();
  const futureDate = (monthsToAdd: number) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() + monthsToAdd);
    return date.toISOString();
  };
  
  return [
    {
      id: '1',
      number: 1,
      date: futureDate(-1),
      recipientId: '1',
      recipientName: 'John Doe',
      amount: 2000,
      status: 'completed',
      contributionsCount: 8,
      totalContributions: 2000,
    },
    {
      id: '2',
      number: 2,
      date: futureDate(0),
      recipientId: '2',
      recipientName: 'Jane Smith',
      amount: 2000,
      status: 'active',
      contributionsCount: 6,
      totalContributions: 1500,
    },
    {
      id: '3',
      number: 3,
      date: futureDate(1),
      recipientId: '3',
      recipientName: 'Alex Johnson',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
    {
      id: '4',
      number: 4,
      date: futureDate(2),
      recipientId: '4',
      recipientName: 'Sarah Williams',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
    {
      id: '5',
      number: 5,
      date: futureDate(3),
      recipientId: '5',
      recipientName: 'Michael Brown',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
    {
      id: '6',
      number: 6,
      date: futureDate(4),
      recipientId: '6',
      recipientName: 'Emily Davis',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
    {
      id: '7',
      number: 7,
      date: futureDate(5),
      recipientId: '7',
      recipientName: 'David Wilson',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
    {
      id: '8',
      number: 8,
      date: futureDate(6),
      recipientId: '8',
      recipientName: 'Lisa Miller',
      amount: 2000,
      status: 'pending',
      contributionsCount: 0,
      totalContributions: 0,
    },
  ];
};

const CyclesList: React.FC<CyclesListProps> = ({ tontineId }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // In a real app, this would be an API call
    setCycles(generateMockCycles(tontineId));
  }, [tontineId]);
  
  const filteredCycles = cycles.filter(cycle => 
    cycle.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'default';
      case 'active': return 'success';
      case 'pending': return 'secondary';
      default: return 'default';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Payment Cycles</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient..."
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
                <TableHead>Cycle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Contributions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCycles.length > 0 ? (
                filteredCycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>#{cycle.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(cycle.date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {cycle.recipientName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {cycle.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(cycle.status) as any}>
                        {cycle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cycle.contributionsCount > 0 ? (
                        <span>{cycle.contributionsCount} / 8</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {cycle.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/payments/${cycle.id}`}>
                              <DollarSign className="h-4 w-4" />
                              <span className="sr-only">Payments</span>
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link to={`/cycles/${cycle.id}`}>
                            <LinkIcon className="h-4 w-4" />
                            <span className="sr-only">Details</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          disabled={cycle.status === 'completed'}
                        >
                          <Link to={`/cycles/${cycle.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No cycles found.
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

export default CyclesList;
