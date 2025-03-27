
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, ChevronLeft, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

interface TontineDetailsHeaderProps {
  tontineName: string;
  tontineStatus: 'active' | 'upcoming' | 'completed' | string;
  tontineId: string;
  onAddMember?: () => void;
}

const TontineDetailsHeader: React.FC<TontineDetailsHeaderProps> = ({
  tontineName,
  tontineStatus,
  tontineId,
  onAddMember,
}) => {
  const { isAdmin } = useUserRole(tontineId);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link to="/tontines" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Tontines</span>
          </Link>
          <h1 className="text-2xl font-bold">{tontineName}</h1>
          <Badge variant={
            tontineStatus === 'completed' ? 'outline' : 
            tontineStatus === 'active' ? 'default' : 'secondary'
          }>
            {tontineStatus}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage members, cycles, and payments for this tontine.
        </p>
      </div>
      
      <div className="flex gap-2 self-end md:self-auto">
        {isAdmin && (
          <>
            <Button variant="outline" onClick={onAddMember}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
            
            <Button variant="outline" asChild>
              <Link to={`/tontines/${tontineId}/edit`}>
                <PencilLine className="mr-2 h-4 w-4" />
                Edit Tontine
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TontineDetailsHeader;
