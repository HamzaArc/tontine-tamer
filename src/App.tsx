
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Tontines from "./pages/Tontines";
import TontineEdit from "./pages/TontineEdit";
import Cycles from "./pages/Cycles";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SideNavigation from "./components/layout/SideNavigation";
import TontineDetails from "./components/tontines/TontineDetails";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex w-full">
      {!isMobile && <SideNavigation />}
      
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="fixed top-4 left-4 z-40">
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SideNavigation mobile onNavigate={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex-1">{children}</div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Redirect common misspellings or mistake paths */}
            <Route path="/login" element={<Navigate to="/signin" replace />} />
            <Route path="/register" element={<Navigate to="/signup" replace />} />
            <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
            <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
            
            {/* Protected Routes */}
            {/* App Layout with Sidebar */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Tontines />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="flex-1">
                      <TontineDetails />
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines/:id/edit" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TontineEdit />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/cycles" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Cycles />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/cycles/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="flex-1" data-tour="cycle-details">
                      {/* Cycle detail component should be added here */}
                      <Navigate to="/cycles" replace />
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/cycles/:id/edit" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="flex-1">
                      {/* Cycle edit component should be added here */}
                      <Navigate to="/cycles" replace />
                    </div>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Payments />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Reports />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
