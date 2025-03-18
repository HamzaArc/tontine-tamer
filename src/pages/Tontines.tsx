
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import TontineList from '@/components/tontines/TontineList';
import CreateTontineButton from '@/components/tontines/CreateTontineButton';

const Tontines: React.FC = () => {
  return (
    <PageContainer title="Tontines">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Your Tontines</h1>
          <CreateTontineButton />
        </div>
        
        <TontineList />
      </div>
    </PageContainer>
  );
};

export default Tontines;
