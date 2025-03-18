
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import CyclesList from '@/components/cycles/CyclesList';
import CreateCycleButton from '@/components/cycles/CreateCycleButton';
import TontineSelector from '@/components/cycles/TontineSelector';

// Mock data for tontines
const MOCK_TONTINES = [
  { id: '1', name: 'Family Savings' },
  { id: '2', name: 'Friends Group' },
  { id: '3', name: 'Work Colleagues' },
];

const Cycles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTontineId = searchParams.get('tontine');
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(initialTontineId);
  
  useEffect(() => {
    if (initialTontineId) {
      setSelectedTontineId(initialTontineId);
    }
  }, [initialTontineId]);
  
  return (
    <PageContainer title="Cycles">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Manage Payment Cycles</h1>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <TontineSelector 
              tontines={MOCK_TONTINES} 
              selectedTontineId={selectedTontineId} 
              onSelect={setSelectedTontineId}
            />
            
            {selectedTontineId && (
              <CreateCycleButton tontineId={selectedTontineId} />
            )}
          </div>
        </div>
        
        {selectedTontineId ? (
          <CyclesList tontineId={selectedTontineId} />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-medium mb-2">Select a Tontine</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Please select a tontine from the dropdown above to view and manage its payment cycles.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Cycles;
