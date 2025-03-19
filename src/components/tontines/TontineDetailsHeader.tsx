
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Plus, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface TontineDetailsHeaderProps {
  tontineName: string;
  tontineStatus: string;
  tontineId: string;
  onAddMember: () => void;
}

const TontineDetailsHeader: React.FC<TontineDetailsHeaderProps> = ({
  tontineName,
  tontineStatus,
  tontineId,
  onAddMember
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/tontines')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Tontine Details</h1>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{tontineName}</h2>
          <Badge variant={tontineStatus === 'active' ? 'default' : 'secondary'}>
            {tontineStatus}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddMember}
          >
            <Users className="mr-1.5 h-4 w-4" />
            Add Member
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/tontines/${tontineId}/edit`)}
          >
            <Edit className="mr-1.5 h-4 w-4" />
            Edit Tontine
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate(`/cycles?tontine=${tontineId}`)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Cycle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TontineDetailsHeader;
