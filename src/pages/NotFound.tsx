
import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Log the error to console
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Show toast notification
    toast({
      title: "Page not found",
      description: `The requested path "${location.pathname}" doesn't exist.`,
      variant: "destructive",
    });
  }, [location.pathname, toast]);

  // Function to determine if we should provide specific redirect suggestions
  const getSuggestion = () => {
    const path = location.pathname.toLowerCase();

    if (path.includes('tontin') && !path.includes('tontine')) {
      return {
        text: "Looking for tontines?",
        path: "/tontines"
      };
    }
    
    if (path.includes('report') && !path.includes('reports')) {
      return {
        text: "Looking for reports?",
        path: "/reports"
      };
    }
    
    if (path.includes('payment') && !path.includes('payments')) {
      return {
        text: "Looking for payments?",
        path: "/payments"
      };
    }
    
    if (path.includes('cycle') && !path.includes('cycles')) {
      return {
        text: "Looking for cycles?",
        path: "/cycles"
      };
    }
    
    return null;
  };

  const suggestion = getSuggestion();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-bold mb-2">404</CardTitle>
          <CardDescription className="text-xl">Page Not Found</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            Sorry, we couldn't find the page you're looking for. The URL 
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mx-1">{location.pathname}</span> 
            doesn't exist.
          </p>
          
          {suggestion && (
            <div className="my-4 p-3 bg-primary/10 rounded-md">
              <p className="font-medium">{suggestion.text}</p>
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => navigate(suggestion.path)}
              >
                Click here to go to {suggestion.path}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/dashboard">
              <HomeIcon className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFound;
