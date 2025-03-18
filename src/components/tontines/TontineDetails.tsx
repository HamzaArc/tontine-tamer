
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Edit
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

// Mock data for a tontine
const MOCK_TONTINE = {
  id: '1',
  name: 'Family Savings',
  description: 'Monthly savings for family goals',
  members: [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', status: 'active' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1987654321', status: 'active' },
    { id: '3', name: 'Alex Johnson', email: 'alex@example.com', phone: '+1122334455', status: 'active' },
  ],
  amount: 250,
  frequency: 'Monthly',
  startDate: '2023-01-15',
  status: 'active',
  totalCollected: 2000,
  nextPaymentDate: '2023-05-15',
  completionDate: '2023-09-15',
};

const TontineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tontine, setTontine] = useState(MOCK_TONTINE);
  const [activeTab, setActiveTab] = useState('overview');
  
  // In a real app, you would fetch the tontine data based on the ID
  
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
        <Button asChild>
          <Link to={`/tontines/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Tontine
          </Link>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({tontine.members.length})</TabsTrigger>
          <TabsTrigger value="cycles" className="hidden md:flex">Cycles</TabsTrigger>
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
                      {new Date(tontine.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
                    <p className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      {tontine.members.length}
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
                    <p className="text-2xl font-bold text-primary">${tontine.totalCollected}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Next Payment</h3>
                    <p className="text-lg">
                      {new Date(tontine.nextPaymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Estimated Completion</h3>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(tontine.completionDate).toLocaleDateString()}
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
              <AddMemberDialog tontineId={id || ''} />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <MembersList 
                  members={tontine.members} 
                  tontineId={id || ''} 
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cycles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cycles</CardTitle>
              <CardDescription>
                View and manage all payment cycles for this tontine
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Button asChild>
                <Link to={`/cycles?tontine=${id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Manage Cycles
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TontineDetails;
