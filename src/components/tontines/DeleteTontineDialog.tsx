
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteTontineDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  tontineId: string | null;
}

const DeleteTontineDialog: React.FC<DeleteTontineDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  tontineId
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Tontine</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this tontine? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 py-4">
          <div className="bg-amber-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Warning: This will permanently delete:</p>
            <ul className="list-disc ml-5 mt-2 text-muted-foreground">
              <li>All member information</li>
              <li>All payment cycles</li>
              <li>All payment records</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            Delete Tontine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteTontineDialog;
