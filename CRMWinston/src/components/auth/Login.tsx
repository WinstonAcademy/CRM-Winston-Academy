"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { realBackendAuthService } from '../../services/realBackendAuthService';
import { useTheme } from '../../context/ThemeContext';

const HERO_IMAGE = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80";

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm transition-colors focus-within:border-brand-400/70 focus-within:bg-brand-500/10">
    {children}
  </div>
);

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setIsClient(true); }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login({ identifier: formData.identifier.trim(), password: formData.password });

      const user = realBackendAuthService.getCurrentUser();
      if (user?.id) {
        const flagKey = `password_changed_${user.id}`;
        const alreadyChanged = localStorage.getItem(flagKey);
        if (!alreadyChanged) {
          const firstLoginKey = `first_login_done_${user.id}`;
          const firstLoginDone = localStorage.getItem(firstLoginKey);
          if (!firstLoginDone) {
            localStorage.setItem(firstLoginKey, 'true');
            router.push('/change-password');
            return;
          }
        }
      }

      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      if (errorMessage.includes('Too many login attempts')) {
        setError('Too many login attempts. Please wait 30 seconds and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] overflow-hidden">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 relative">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-gray-900 dark:text-white">
              <span className="font-light tracking-tighter">Welcome Back</span>
            </h1>
            <p className="animate-element animate-delay-200 text-gray-500 dark:text-gray-400">
              Sign in to Winston Academy CRM
            </p>

            {error && (
              <div className="animate-element bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-2xl p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-error-400 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-error-600 dark:text-error-400">{error}</span>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email or Username</label>
                <GlassInputWrapper>
                  <input
                    type="text"
                    placeholder="Enter your email or username"
                    value={formData.identifier}
                    onChange={(e) => handleChange('identifier', e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword
                        ? <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                        : <Eye className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                      }
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-end text-sm">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); router.push('/forgot-password'); }}
                  className="hover:underline text-brand-500 dark:text-brand-400 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-brand-500 py-4 font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
      </section>
    </div>
  );
};

export default Login;
