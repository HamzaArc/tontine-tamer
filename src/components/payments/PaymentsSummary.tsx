
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, DollarSign, User, Calendar } from 'lucide-react';

interface PaymentsSummaryProps {
  cycleId: string;
}

interface PaymentSummary {
  cycleNumber: number;
  recipientName: string;
  tontineName: string;
  payoutDate: string;
  totalAmount: number;
  currentAmount: number;
  completionPercentage: number;
  membersCount: number;
  paidMembersCount: number;
}

// Mock data for payment summary
const getMockPaymentSummary = (cycleId: string): PaymentSummary => {
  // In a real app, this would be fetched from the backend
  return {
    cycleNumber: 2,
    recipientName: 'Jane Smith',
    tontineName: 'Family Savings',
    payoutDate: '2023-06-15',
    totalAmount: 2000,
    currentAmount: 1500,
    completionPercentage: 75,
    membersCount: 8,
    paidMembersCount: 6,
  };
};

const PaymentsSummary: React.FC<PaymentsSummaryProps> = ({ cycleId }) => {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  
  useEffect(() => {
    // In a real app, this would be an API call
    setSummary(getMockPaymentSummary(cycleId));
  }, [cycleId]);
  
  if (!summary) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Cycle</h3>
            <div className="flex flex-col">
              <span className="text-xl font-semibold">
                #{summary.cycleNumber} - {summary.tontineName}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                Recipient: {summary.recipientName}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Collection Progress</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="text-lg font-medium">${summary.currentAmount}</span>
                <span className="text-sm text-muted-foreground">of ${summary.totalAmount}</span>
              </div>
              <Progress value={summary.completionPercentage} className="h-2" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                {summary.paidMembersCount} of {summary.membersCount} members paid
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Payout Date</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">
                {new Date(summary.payoutDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {getRemainingDays(summary.payoutDate)} days remaining
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium text-muted-foreground">Total Payout</h3>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">${summary.totalAmount}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              ${summary.totalAmount / summary.membersCount} per member
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate days remaining
const getRemainingDays = (dateString: string): number => {
  const today = new Date();
  const payoutDate = new Date(dateString);
  const timeDiff = payoutDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
};

export default PaymentsSummary;
