
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Tontine {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  cycle_number: number; 
  tontine_id: string;
  recipient_name?: string;
  status: string;
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
              {tontineCycles.map((cycle) => {
                const isActive = cycle.status === 'active';
                const isCompleted = cycle.status === 'completed';
                
                return (
                  <SelectItem 
                    key={cycle.id} 
                    value={cycle.id}
                    className={cn(
                      isActive && "font-semibold",
                      isCompleted && "text-green-600"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      Cycle #{cycle.cycle_number} 
                      {cycle.recipient_name && <span>({cycle.recipient_name})</span>}
                      
                      {isActive && (
                        <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                          Active
                        </Badge>
                      )}
                      
                      {isCompleted && (
                        <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default CycleSelector;
