import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Erreur 404
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Page introuvable</h1>
            <p className="mt-2 max-w-md text-slate-500">
                La page ou la fiche demandée n’existe pas, ou a été supprimée.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
                Retour au tableau de bord
            </Link>
        </main>
    )
}
