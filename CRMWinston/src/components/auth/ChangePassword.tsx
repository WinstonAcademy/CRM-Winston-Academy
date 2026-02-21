"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sun, Moon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';

const HERO_IMAGE = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80";

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-900/5 dark:bg-white/5 backdrop-blur-sm transition-colors focus-within:border-brand-400/70 focus-within:bg-brand-500/10">
    {children}
  </div>
);

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  animDelay,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  animDelay: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className={`animate-element ${animDelay}`}>
      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <GlassInputWrapper>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 flex items-center">
            {show
              ? <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
              : <Eye className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
            }
          </button>
        </div>
      </GlassInputWrapper>
    </div>
  );
};

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsClient(true);
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
    return null;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError('Current password and new password are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('real_backend_token');
      if (!token) {
        throw new Error('Authentication token not found. Please sign in again.');
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change password');
      }

      if (user?.id) {
        localStorage.setItem(`password_changed_${user.id}`, 'true');
      }
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient || !user) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] overflow-hidden">
      {/* Left column: change password form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900 relative overflow-y-auto">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-gray-900 dark:text-white">
              <span className="font-light tracking-tighter">Secure Your Account</span>
            </h1>
            <p className="animate-element animate-delay-200 text-gray-500 dark:text-gray-400">
              Please set a new password for your account
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <PasswordField
                label="Current Password"
                value={formData.currentPassword}
                onChange={(v) => handleChange('currentPassword', v)}
                placeholder="Enter current password"
                disabled={isLoading}
                animDelay="animate-delay-300"
              />

              <PasswordField
                label="New Password"
                value={formData.password}
                onChange={(v) => handleChange('password', v)}
                placeholder="Enter new password"
                disabled={isLoading}
                animDelay="animate-delay-400"
              />

              <PasswordField
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChange={(v) => handleChange('confirmPassword', v)}
                placeholder="Confirm new password"
                disabled={isLoading}
                animDelay="animate-delay-500"
              />

              {/* Password requirements */}
              <div className="animate-element animate-delay-600 rounded-2xl border border-brand-100 dark:border-brand-900/40 bg-brand-25 dark:bg-brand-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-brand-500" />
                  <h4 className="text-sm font-medium text-brand-700 dark:text-brand-300">Password Requirements</h4>
                </div>
                <ul className="text-xs text-brand-600 dark:text-brand-400 space-y-1 pl-6">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase letter (A-Z)</li>
                  <li>Contains lowercase letter (a-z)</li>
                  <li>Contains number (0-9)</li>
                  <li>Contains special character (!@#$%^&*)</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-700 w-full rounded-2xl bg-brand-500 py-4 font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Changing Password...
                  </div>
                ) : (
                  'Change Password'
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

export default ChangePassword;
