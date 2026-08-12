'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
    'w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
    'transition-colors outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ' +
    'disabled:bg-slate-50 disabled:text-slate-500'

const VALID = 'border-slate-200'
const INVALID = 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'

interface FieldProps {
    label: string
    hint?: string
    error?: string
    required?: boolean
    className?: string
    /** Suffixe affiché dans le champ (ex : « € »). */
    suffix?: string
    children: (props: { id: string; className: string; 'aria-invalid': boolean }) => React.ReactNode
}

/**
 * Enveloppe label + contrôle + message d'erreur, pour que tous les
 * formulaires partagent exactement la même présentation.
 */
export function Field({
    label,
    hint,
    error,
    required,
    className,
    suffix,
    children,
}: FieldProps) {
    const id = useId()

    return (
        <div className={cn('space-y-1.5', className)}>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>

            <div className="relative">
                {children({
                    id,
                    className: cn(CONTROL, error ? INVALID : VALID, suffix && 'pr-9'),
                    'aria-invalid': Boolean(error),
                })}
                {suffix && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {suffix}
                    </span>
                )}
            </div>

            {error ? (
                <p className="text-xs text-rose-600">{error}</p>
            ) : hint ? (
                <p className="text-xs text-slate-500">{hint}</p>
            ) : null}
        </div>
    )
}

/** Champ texte standard. */
export function TextField({
    label,
    hint,
    error,
    required,
    className,
    suffix,
    ...props
}: Omit<FieldProps, 'children'> & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <Field
            label={label}
            hint={hint}
            error={error}
            required={required}
            className={className}
            suffix={suffix}
        >
            {(fieldProps) => (
                <input {...fieldProps} className={cn(fieldProps.className, 'h-10')} {...props} />
            )}
        </Field>
    )
}

/** Liste déroulante standard. */
export function SelectField({
    label,
    hint,
    error,
    required,
    className,
    children,
    ...props
}: Omit<FieldProps, 'children' | 'suffix'> &
    React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
    return (
        <Field label={label} hint={hint} error={error} required={required} className={className}>
            {(fieldProps) => (
                <select {...fieldProps} className={cn(fieldProps.className, 'h-10 pr-9')} {...props}>
                    {children}
                </select>
            )}
        </Field>
    )
}
