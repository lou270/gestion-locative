import LoginForm from '@/components/LoginForm'
import { Logo } from '@/components/Logo'

export const metadata = { title: 'Connexion · Gestion Locative' }

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex justify-center">
                    <Logo />
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
                    <h1 className="text-xl font-bold text-slate-900">Connexion</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Accédez à votre espace de gestion locative.
                    </p>

                    <div className="mt-6">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </main>
    )
}
