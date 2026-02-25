
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <div className="flex-1">
                {children}
            </div>
        </>
    );
}
