import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Autenticação - Maestro Financeiro',
    description: 'Acesse ou crie sua conta.',
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            {children}
        </div>
    );
}
