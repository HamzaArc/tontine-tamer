
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tontine {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  cycle_number: number; 
  tontine_id: string;
  recipient_name?: string;
}

interface CycleSelectorProps {
  tontines: Tontine[];
  cycles: Cycle[];
  selectedCycleId: string | null;
  onSelectCycle: (cycleId: string) => void;
}

const CycleSelector: React.FC<CycleSelectorProps> = ({ 
  tontines, 
  cycles, 
  selectedCycleId, 
  onSelectCycle 
}) => {
  return (
    <Select 
      value={selectedCycleId || undefined} 
      onValueChange={onSelectCycle}
    >
      <SelectTrigger className="w-full md:w-[280px]">
        <SelectValue placeholder="Select Tontine & Cycle" />
      </SelectTrigger>
      <SelectContent>
        {tontines.map((tontine) => {
          const tontineCycles = cycles.filter(cycle => cycle.tontine_id === tontine.id);
          if (tontineCycles.length === 0) return null;
          
          return (
            <SelectGroup key={tontine.id}>
              <SelectLabel>{tontine.name}</SelectLabel>
              {tontineCycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  Cycle #{cycle.cycle_number} ({cycle.recipient_name})
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default CycleSelector;
