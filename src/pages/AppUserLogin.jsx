import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { trpc } from '@/trpc'; // Use the alias to the file we just creat

export default function AppUserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Define the Supabase login mutation using tRPC
  const supabaseLogin = trpc.auth.login.useMutation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 2. Control which database to hit via environment variable
    const isSupabaseMode = import.meta.env.VITE_DB_MODE === 'SUPABASE';

    try {
      if (isSupabaseMode) {
        // --- NEW SUPABASE FLOW ---
        const response = await supabaseLogin.mutateAsync({ email, password });
        
        localStorage.setItem('appUserAuth', JSON.stringify(response.user));
        localStorage.setItem('roleOverride', JSON.stringify({ 
          role: response.user.role, 
          state: response.user.state?.[0] || null 
        }));
        
        window.location.href = '/AdminDashboard';
      } else {
        // --- ORIGINAL BASE44 FLOW ---
        const response = await base44.functions.invoke('appUserLogin', { email, password });
        
        if (response.data.success) {
          localStorage.setItem('appUserAuth', JSON.stringify(response.data.user));
          localStorage.setItem('roleOverride', JSON.stringify({ 
            role: 'admin', 
            state: response.data.user.state[0] 
          }));
          
          window.location.href = '/AdminDashboard';
        } else {
          setError(response.data.message || 'Login failed');
        }
      }
    } catch (err) {
      // 3. Centralized error handling for both auth methods
      console.error("Login error:", err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <p className="text-sm text-gray-500">Log masuk untuk akses admin dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log Masuk'}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Default password: <code className="bg-gray-100 px-2 py-1 rounded">password</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}