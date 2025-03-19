
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TourStep = {
  title: string;
  description: string;
  route: string;
  element?: string;
};

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const tourSteps: TourStep[] = [
    {
      title: 'Welcome to Tontine App',
      description: 'This tour will guide you through the main features of the application. Let\'s get started!',
      route: '/dashboard',
    },
    {
      title: 'Dashboard Overview',
      description: 'The dashboard gives you a quick overview of your tontines, upcoming payments, and recent activity.',
      route: '/dashboard',
    },
    {
      title: 'Create a Tontine',
      description: 'Start by creating a tontine. Click on "Create Tontine" to set up a new savings group.',
      route: '/tontines',
    },
    {
      title: 'Add Members',
      description: 'Add members to your tontine. They\'ll receive an invitation to join the platform.',
      route: '/tontines',
      element: 'button[contains(., "Add Member")]',
    },
    {
      title: 'Create Cycles',
      description: 'Set up payment cycles for your tontine and assign recipients for each cycle.',
      route: '/cycles',
    },
    {
      title: 'Record Payments',
      description: 'Track payments from tontine members to ensure everyone contributes on time.',
      route: '/payments',
    },
    {
      title: 'View Reports',
      description: 'Generate reports to analyze your tontine\'s performance and member activity.',
      route: '/reports',
    },
  ];

  useEffect(() => {
    if (isTourActive && currentStep < tourSteps.length) {
      // Navigate to the route for the current step
      const targetRoute = tourSteps[currentStep].route;
      if (location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [currentStep, isTourActive, location.pathname, navigate]);

  const startTour = () => {
    setCurrentStep(0);
    setIsTourActive(true);
    setIsOpen(false);
    
    toast({
      title: 'Tour Started',
      description: 'Follow the steps to learn how to use the app.',
    });
    
    navigate(tourSteps[0].route);
  };

  const endTour = () => {
    setIsTourActive(false);
    
    toast({
      title: 'Tour Ended',
      description: 'You can restart the tour anytime from the help icon.',
    });
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(true)}
              className="relative"
            >
              <BookOpen className="h-5 w-5" />
              <span className="sr-only">Product Tour</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Product Tour</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Welcome to Tontine App</DialogTitle>
            <DialogDescription>
              Would you like a guided tour of the application?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Our guided tour will show you:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>How to create and manage tontines</li>
              <li>Adding members and inviting them</li>
              <li>Setting up payment cycles</li>
              <li>Recording and tracking payments</li>
              <li>Viewing reports and analytics</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Skip Tour
            </Button>
            <Button onClick={startTour}>
              Start Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isTourActive && (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">
              Step {currentStep + 1} of {tourSteps.length}
            </h3>
            <Button variant="ghost" size="icon" onClick={endTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <h4 className="font-semibold text-primary">
            {tourSteps[currentStep].title}
          </h4>
          <p className="my-2 text-sm text-gray-600 dark:text-gray-300">
            {tourSteps[currentStep].description}
          </p>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button 
              size="sm" 
              onClick={nextStep}
            >
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
              {currentStep < tourSteps.length - 1 && (
                <ArrowRight className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
