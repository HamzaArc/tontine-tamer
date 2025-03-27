
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/ui/role-badge';

interface TontineDetailsHeaderProps {
  tontineName: string;
  tontineStatus: 'active' | 'upcoming' | 'completed';
  tontineId: string;
  onAddMember: () => void;
  isAdmin: boolean;
}

const TontineDetailsHeader: React.FC<TontineDetailsHeaderProps> = ({
  tontineName,
  tontineStatus,
  tontineId,
  onAddMember,
  isAdmin
}) => {
  const navigate = useNavigate();
  const { role } = useUserRole(tontineId);
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/tontines')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h1 className="text-2xl font-bold">{tontineName}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={tontineStatus} />
            {role && <RoleBadge role={role} />}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button asChild>
            <Link to={`/cycles?tontine=${tontineId}`}>
              View Payment Cycles
            </Link>
          </Button>
          
          {isAdmin && (
            <Button variant="outline" onClick={onAddMember}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant: "default" | "outline" | "secondary" | "destructive" | "success" = "default";
  
  switch (status) {
    case 'active':
      variant = "default";
      break;
    case 'upcoming':
      variant = "secondary";
      break;
    case 'completed':
      variant = "success";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
};

export default TontineDetailsHeader;
