
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Check, X, Bell, User, MoreHorizontal } from 'lucide-react';
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
import { SendReminderDialog } from './SendReminderDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'paid' | 'pending';
  amount: number;
  paymentDate?: string;
}

interface PaymentsListProps {
  cycleId: string;
}

// Mock data for members and their payment status
const generateMockMembers = (cycleId: string): Member[] => {
  // In a real app, this would be fetched from the backend based on cycleId
  return [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-02',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1987654321',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-03',
    },
    {
      id: '3',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '+1122334455',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-05',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+1555666777',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-06',
    },
    {
      id: '5',
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '+1888999000',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-07',
    },
    {
      id: '6',
      name: 'Emily Davis',
      email: 'emily@example.com',
      phone: '+1222333444',
      status: 'paid',
      amount: 250,
      paymentDate: '2023-05-10',
    },
    {
      id: '7',
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '+1777888999',
      status: 'pending',
      amount: 250,
    },
    {
      id: '8',
      name: 'Lisa Miller',
      email: 'lisa@example.com',
      phone: '+1444555666',
      status: 'pending',
      amount: 250,
    },
  ];
};

const PaymentsList: React.FC<PaymentsListProps> = ({ cycleId }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real app, this would be an API call
    setMembers(generateMockMembers(cycleId));
  }, [cycleId]);
  
  const handleRecordPayment = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsRecordPaymentOpen(true);
  };
  
  const handlePaymentRecorded = (memberId: string, amount: number) => {
    setMembers(members.map(member => 
      member.id === memberId 
        ? { 
            ...member, 
            status: 'paid', 
            paymentDate: new Date().toISOString(),
            amount
          } 
        : member
    ));
    
    toast({
      title: 'Payment recorded',
      description: `Payment of $${amount} has been recorded.`,
    });
  };
  
  const handleSendReminder = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    toast({
      title: 'Reminder sent',
      description: `Payment reminder has been sent to ${member.name}.`,
    });
  };
  
  const handleSendAllReminders = () => {
    const pendingMembers = members.filter(m => m.status === 'pending');
    
    toast({
      title: 'Reminders sent',
      description: `Payment reminders have been sent to ${pendingMembers.length} members.`,
    });
  };
  
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const pendingCount = members.filter(m => m.status === 'pending').length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Member Contributions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {members.length - pendingCount} of {members.length} members have paid
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-60">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {pendingCount > 0 && (
              <Button variant="outline" onClick={handleSendAllReminders}>
                <Bell className="mr-2 h-4 w-4" />
                Send All Reminders
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Payment Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {member.name}
                        </div>
                        <span className="text-sm text-muted-foreground">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${member.amount}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={member.status === 'paid' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {member.status === 'paid' ? (
                          <>
                            <Check className="h-3 w-3" />
                            Paid
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {member.paymentDate ? (
                        format(new Date(member.paymentDate), 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {member.status === 'pending' ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRecordPayment(member.id)}
                            >
                              Record Payment
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleSendReminder(member.id)}
                            >
                              <Bell className="h-4 w-4" />
                              <span className="sr-only">Send Reminder</span>
                            </Button>
                          </>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRecordPayment(member.id)}>
                                Modify Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setMembers(members.map(m => 
                                  m.id === member.id 
                                    ? { ...m, status: 'pending', paymentDate: undefined } 
                                    : m
                                ));
                                toast({
                                  title: 'Payment reversed',
                                  description: `Payment from ${member.name} has been marked as pending.`,
                                });
                              }}>
                                Reverse Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <RecordPaymentDialog 
        isOpen={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        memberId={selectedMemberId || ''}
        member={members.find(m => m.id === selectedMemberId) || null}
        onRecordPayment={handlePaymentRecorded}
      />
    </Card>
  );
};

export default PaymentsList;
