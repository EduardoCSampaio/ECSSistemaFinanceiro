import type { Metadata } from 'next';
import Link from 'next/link';
import { Menu } from 'lucide-react';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Maestro Financeiro',
  description: 'Sistema financeiro empresarial robusto para controle total.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'bg-background text-foreground')}>
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                  <Icons.logo className="h-6 w-6" />
                  <span className="">Maestro Financeiro</span>
                </Link>
              </div>
              <div className="flex-1">
                <MainNav />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Alternar menu de navegação</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                  <div className="flex-1">
                    <MainNav isMobile={true} />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="w-full flex-1">
                {/* Search can be added here */}
              </div>
              <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
