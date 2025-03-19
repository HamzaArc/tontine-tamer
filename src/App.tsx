
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Tontines from "./pages/Tontines";
import TontineEdit from "./pages/TontineEdit";
import Cycles from "./pages/Cycles";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import SideNavigation from "./components/layout/SideNavigation";
import TontineDetails from "./components/tontines/TontineDetails";

const queryClient = new QueryClient();

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
            
            {/* Protected Routes */}
            {/* App Layout with Sidebar */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <Tontines />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines/:id" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <div className="flex-1">
                      <TontineDetails />
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/tontines/:id/edit" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <TontineEdit />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/cycles" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <Cycles />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/payments" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <Payments />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <Reports />
                  </div>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="flex w-full">
                    <SideNavigation />
                    <div className="flex-1 p-8">
                      <h1 className="text-2xl font-bold mb-4">Settings</h1>
                      <p>Settings page coming soon.</p>
                    </div>
                  </div>
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
