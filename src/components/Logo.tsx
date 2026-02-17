
export function Logo({ className = "w-8 h-8", textClassName = "text-xl" }: { className?: string, textClassName?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`${className} bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center p-1.5 shadow-lg shadow-indigo-200`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 21V7L13 3L21 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 10C9 10 10 9 12 9C14 9 15 10 15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21V15C9 14.4 9.4 14 10 14H14C14.6 14 15 14.4 15 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className={`${textClassName} font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent`}>
                Gestion Locative
            </span>
        </div>
    );
}
