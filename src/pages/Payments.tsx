
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import PaymentsList from '@/components/payments/PaymentsList';
import CycleSelector from '@/components/payments/CycleSelector';
import PaymentsSummary from '@/components/payments/PaymentsSummary';

// Mock data for tontines and cycles
const MOCK_TONTINES = [
  { id: '1', name: 'Family Savings' },
  { id: '2', name: 'Friends Group' },
  { id: '3', name: 'Work Colleagues' },
];

const MOCK_CYCLES = [
  { id: '1', number: 1, tontineId: '1', recipientName: 'John Doe' },
  { id: '2', number: 2, tontineId: '1', recipientName: 'Jane Smith' },
  { id: '3', number: 1, tontineId: '2', recipientName: 'Alex Johnson' },
  { id: '4', number: 2, tontineId: '2', recipientName: 'Sarah Williams' },
  { id: '5', number: 1, tontineId: '3', recipientName: 'Michael Brown' },
];

const Payments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCycleId = searchParams.get('cycle');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(initialCycleId);
  
  // Find the selected cycle
  const selectedCycle = MOCK_CYCLES.find(cycle => cycle.id === selectedCycleId);
  
  return (
    <PageContainer title="Payments">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Manage Payments</h1>
          
          <CycleSelector 
            tontines={MOCK_TONTINES} 
            cycles={MOCK_CYCLES} 
            selectedCycleId={selectedCycleId} 
            onSelectCycle={setSelectedCycleId}
          />
        </div>
        
        {selectedCycleId && selectedCycle ? (
          <>
            <PaymentsSummary cycleId={selectedCycleId} />
            <PaymentsList cycleId={selectedCycleId} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-medium mb-2">Select a Cycle</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Please select a tontine and cycle from the dropdown above to view and manage payments.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Payments;
