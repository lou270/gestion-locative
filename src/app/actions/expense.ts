'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireSession, UnauthorizedError } from '@/lib/auth-guard'
import {
    ActionFailure,
    ActionResult,
    expenseSchema,
    updateExpenseSchema,
    validateFormData,
} from '@/lib/validation'

function toFailure(error: unknown, fallback: string): ActionFailure {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message }
    console.error(fallback, error)
    return { success: false, error: fallback }
}

function revalidateFiscal() {
    revalidatePath('/fiscal')
    revalidatePath('/')
}

/**
 * Vérifie que le bien existe avant l'écriture : une clé étrangère invalide
 * ferait sinon remonter une erreur Prisma brute au lieu d'un message métier.
 */
async function assertPropertyExists(propertyId: string | null): Promise<boolean> {
    if (!propertyId) return true
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true },
    })
    return Boolean(property)
}

export async function createExpense(formData: FormData): Promise<ActionResult<{ id: string }>> {
    try {
        await requireSession()

        const parsed = validateFormData(expenseSchema, formData)
        if (!parsed.ok) return parsed.result

        if (!(await assertPropertyExists(parsed.data.propertyId))) {
            return { success: false, error: 'Bien introuvable.' }
        }

        const expense = await prisma.expense.create({ data: parsed.data })

        revalidateFiscal()
        return { success: true, data: { id: expense.id }, message: 'Charge enregistrée.' }
    } catch (error) {
        return toFailure(error, "Impossible d'enregistrer la charge.")
    }
}

export async function updateExpense(formData: FormData): Promise<ActionResult> {
    try {
        await requireSession()

        const parsed = validateFormData(updateExpenseSchema, formData)
        if (!parsed.ok) return parsed.result

        const { id, ...data } = parsed.data

        const existing = await prisma.expense.findUnique({ where: { id }, select: { id: true } })
        if (!existing) return { success: false, error: 'Charge introuvable.' }

        if (!(await assertPropertyExists(data.propertyId))) {
            return { success: false, error: 'Bien introuvable.' }
        }

        await prisma.expense.update({ where: { id }, data })

        revalidateFiscal()
        return { success: true, message: 'Charge mise à jour.' }
    } catch (error) {
        return toFailure(error, 'Impossible de mettre à jour la charge.')
    }
}

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
    try {
        await requireSession()

        const existing = await prisma.expense.findUnique({
            where: { id: expenseId },
            select: { id: true },
        })
        if (!existing) return { success: false, error: 'Charge introuvable.' }

        await prisma.expense.delete({ where: { id: expenseId } })

        revalidateFiscal()
        return { success: true, message: 'Charge supprimée.' }
    } catch (error) {
        return toFailure(error, 'Impossible de supprimer la charge.')
    }
}
