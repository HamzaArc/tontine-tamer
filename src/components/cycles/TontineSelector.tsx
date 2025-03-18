
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tontine {
  id: string;
  name: string;
}

interface TontineSelectorProps {
  tontines: Tontine[];
  selectedTontineId: string | null;
  onSelect: (tontineId: string) => void;
}

const TontineSelector: React.FC<TontineSelectorProps> = ({ 
  tontines, 
  selectedTontineId, 
  onSelect 
}) => {
  return (
    <Select 
      value={selectedTontineId || undefined} 
      onValueChange={onSelect}
    >
      <SelectTrigger className="w-full md:w-[200px]">
        <SelectValue placeholder="Select Tontine" />
      </SelectTrigger>
      <SelectContent>
        {tontines.map((tontine) => (
          <SelectItem key={tontine.id} value={tontine.id}>
            {tontine.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TontineSelector;
