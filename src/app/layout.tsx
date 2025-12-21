'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { UserProvider } from "@/app/settings/UserContext";
import { DeveloperProvider } from "@/app/contexts/DeveloperContext";
import { ClientProvider } from "@/app/contexts/ClientContext";
import { createContext, useState, ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Context for page title and description
export const PageTitleContext = createContext<(title: { title: string; description: string }) => void>(() => {});

// Context for page actions (buttons in the header bar)
export const PageActionsContext = createContext<(actions: ReactNode) => void>(() => {});

// Context for Production Status sidebar toggle (shared between Navigation and Sidebar)
export const ProductionStatusContext = createContext<{
  showServers: boolean;
  setShowServers: (show: boolean) => void;
  toggleServers: () => void;
}>({
  showServers: true,
  setShowServers: () => {},
  toggleServers: () => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isStudioPage = pathname?.startsWith('/studio');

  const [pageTitle, setPageTitle] = useState<{ title: string; description: string }>({
    title: 'Dashboard',
    description: 'Your daily overview'
  });
  const [pageActions, setPageActions] = useState<ReactNode>(null);
  const [showServers, setShowServers] = useState(true);

  return (
    <html lang="en" className="dark">
      <head>
        <title>Kodiack Dashboard</title>
        <meta name="description" content="Kodiack Studios Control Center" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <DeveloperProvider>
            <ClientProvider>
              <PageTitleContext.Provider value={setPageTitle}>
                <PageActionsContext.Provider value={setPageActions}>
                  <ProductionStatusContext.Provider value={{
                  showServers,
                  setShowServers,
                  toggleServers: () => setShowServers(prev => !prev),
                }}>
                  <div className="h-screen flex flex-col overflow-hidden">
                    <Navigation pageTitle={pageTitle} pageActions={pageActions} />
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                      {/* Hide regular sidebar on Studio page - Studio has its own icon sidebar */}
                      {!isStudioPage && (
                        <Suspense fallback={<div className="w-64 bg-gray-900" />}>
                          <Sidebar />
                        </Suspense>
                      )}
                      <main className={`flex-1 bg-gray-900 ${isStudioPage ? 'overflow-hidden' : 'overflow-auto px-8 py-4'}`}>
                        {children}
                      </main>
                    </div>
                  </div>
                </ProductionStatusContext.Provider>
                </PageActionsContext.Provider>
              </PageTitleContext.Provider>
            </ClientProvider>
          </DeveloperProvider>
        </UserProvider>
      </body>
    </html>
  );
}
