// app/(app)/layout.tsx

import WelcomeEngagementModal from "@/components/layout/WelcomeEngagementModal";


export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        /* items-stretch asegura que el sidebar y el contenido midan lo mismo y empiecen en 0 */
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 items-stretch">

                <WelcomeEngagementModal />

                {/* Contenido principal */}
                <div className="flex-1">
                    {children}
                </div>
        </div>
    );
}