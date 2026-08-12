export default function Loading() {
    return (
        <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Chargement">
            <div className="space-y-3">
                <div className="h-8 w-64 rounded-lg bg-slate-200" />
                <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-28 rounded-2xl border border-slate-200/70 bg-white" />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="h-80 rounded-2xl border border-slate-200/70 bg-white lg:col-span-2" />
                <div className="h-80 rounded-2xl border border-slate-200/70 bg-white" />
            </div>
        </div>
    )
}
