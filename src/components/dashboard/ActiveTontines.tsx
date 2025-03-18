
import { Users } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { Progress } from '@/components/ui/progress';

interface Tontine {
  id: string;
  name: string;
  members: number;
  cycleProgress: number;
  nextPayout: string;
  amountCollected: number;
  totalAmount: number;
}

const ActiveTontines = () => {
  // Sample data - would be fetched from API in a real application
  const tontines: Tontine[] = [
    {
      id: '1',
      name: 'Family Savings',
      members: 8,
      cycleProgress: 75,
      nextPayout: '2023-05-20',
      amountCollected: 2000,
      totalAmount: 2500,
    },
    {
      id: '2',
      name: 'Friends Group',
      members: 5,
      cycleProgress: 40,
      nextPayout: '2023-06-15',
      amountCollected: 500,
      totalAmount: 1250,
    },
    {
      id: '3',
      name: 'Work Colleagues',
      members: 10,
      cycleProgress: 20,
      nextPayout: '2023-07-05',
      amountCollected: 300,
      totalAmount: 1500,
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <DashboardCard 
      title="Active Tontines" 
      subtitle="Your ongoing tontine groups"
      icon={<Users className="h-4 w-4" />}
      className="col-span-1 md:col-span-2"
    >
      <div className="mt-4">
        <div className="space-y-4">
          {tontines.map((tontine) => (
            <div 
              key={tontine.id}
              className="p-4 rounded-lg glass animate-fade-in"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{tontine.name}</h3>
                  <p className="text-sm text-muted-foreground">{tontine.members} members</p>
                </div>
                <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                  Next: {formatDate(tontine.nextPayout)}
                </span>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Cycle progress</span>
                  <span>{tontine.cycleProgress}%</span>
                </div>
                <Progress value={tontine.cycleProgress} className="h-2" />
              </div>
              
              <div className="mt-3 text-sm flex justify-between">
                <span className="text-muted-foreground">Collected: ${tontine.amountCollected}</span>
                <span className="font-medium">Total: ${tontine.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

export default ActiveTontines;
