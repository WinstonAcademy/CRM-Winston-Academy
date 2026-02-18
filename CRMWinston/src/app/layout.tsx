import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { EditFormProvider } from '@/context/EditFormContext';
import { AuthProvider } from '@/context/AuthContext';
import SyncStatus from '@/components/common/SyncStatus';
import PermissionRefreshHandler from '@/components/common/PermissionRefreshHandler';
import ClientOnly from '@/components/common/ClientOnly';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Winston Academy CRM',
  description: 'Customer Relationship Management System for Winston Academy',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <EditFormProvider>
                {children}
                <ClientOnly>
                  <SyncStatus />
                  <PermissionRefreshHandler />
                </ClientOnly>
              </EditFormProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
