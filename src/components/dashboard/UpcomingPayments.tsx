
import { Calendar } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { Badge } from '@/components/ui/badge';

interface Payment {
  id: string;
  tontineName: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'paid';
}

const UpcomingPayments = () => {
  // Sample data - would be fetched from API in a real application
  const payments: Payment[] = [
    {
      id: '1',
      tontineName: 'Family Savings',
      amount: 250,
      dueDate: '2023-05-15',
      status: 'upcoming',
    },
    {
      id: '2',
      tontineName: 'Friends Group',
      amount: 100,
      dueDate: '2023-05-10',
      status: 'overdue',
    },
    {
      id: '3',
      tontineName: 'Work Colleagues',
      amount: 150,
      dueDate: '2023-05-20',
      status: 'upcoming',
    },
    {
      id: '4',
      tontineName: 'Neighborhood Fund',
      amount: 75,
      dueDate: '2023-05-25',
      status: 'upcoming',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'overdue':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'paid':
        return 'bg-green-50 text-green-600 border-green-200';
      default:
        return '';
    }
  };

  return (
    <DashboardCard 
      title="Upcoming Payments" 
      subtitle="Your next payments due"
      icon={<Calendar className="h-4 w-4" />}
      className="col-span-1 md:col-span-2"
    >
      <div className="mt-4">
        <div className="space-y-4">
          {payments.map((payment) => (
            <div 
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border animate-fade-in"
            >
              <div className="flex flex-col">
                <span className="font-medium">{payment.tontineName}</span>
                <span className="text-sm text-muted-foreground">Due {formatDate(payment.dueDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">${payment.amount}</span>
                <Badge variant="outline" className={getStatusColor(payment.status)}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default UpcomingPayments;
