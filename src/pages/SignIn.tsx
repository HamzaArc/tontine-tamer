
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { checkSupabaseConnection } from '@/integrations/supabase/client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, WifiOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

type FormData = z.infer<typeof formSchema>;

const SignIn: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkConnection();
  }, []);

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to sign in. Please try again.';
      
      // More specific network error handling
      if (error.message?.includes('Network error') || 
          error.message?.includes('fetch') || 
          error.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Unable to connect to authentication service. Please check your internet connection and try again.";
        setConnectionStatus('disconnected');
      }
      
      setAuthError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                T
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Sign in to TontineTamer</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === 'disconnected' && (
              <Alert variant="destructive" className="mb-4">
                <WifiOff className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Connection to authentication service unavailable. Please check your internet connection and refresh the page.
                </AlertDescription>
              </Alert>
            )}
            
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading || connectionStatus === 'disconnected'}>
                  {loading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : connectionStatus === 'checking' ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Checking connection...
                    </>
                  ) : connectionStatus === 'disconnected' ? (
                    'Connection Unavailable'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
