"use client";
import ResetPassword from '@/components/auth/ResetPassword';
import { Suspense } from 'react';

function ResetPasswordContent() {
  return <ResetPassword />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';

