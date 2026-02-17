
import { Navbar } from '@/components/Navbar';

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
