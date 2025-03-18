
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import "./App.css";
import Dashboard from './pages/Dashboard';
import Tontines from './pages/Tontines';
import TontineEdit from './pages/TontineEdit';
import Cycles from './pages/Cycles';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tontines"
              element={
                <ProtectedRoute>
                  <Tontines />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tontines/:id"
              element={
                <ProtectedRoute>
                  <TontineEdit mode="view" />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tontines/:id/edit"
              element={
                <ProtectedRoute>
                  <TontineEdit mode="edit" />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tontines/new"
              element={
                <ProtectedRoute>
                  <TontineEdit mode="create" />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/cycles"
              element={
                <ProtectedRoute>
                  <Cycles />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
