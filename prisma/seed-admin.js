/**
 * Création / mise à jour du compte administrateur à partir de l'environnement.
 *
 * Écrit en CommonJS et non en TypeScript : ce script est exécuté par
 * `node prisma/seed-admin.js` au démarrage du conteneur, où ni `ts-node` ni
 * `tsx` ne sont disponibles. L'ancienne version déclenchait un
 * `npx -y tsx` — un téléchargement depuis le registre npm à chaque
 * démarrage, qui échouait silencieusement sur un serveur sans accès sortant.
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        console.warn(
            '⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD absent : aucun compte administrateur ' +
                'ne sera créé, et la connexion sera donc impossible.',
        )
        return
    }

    if (password.length < 6) {
        // La connexion rejette les mots de passe de moins de 6 caractères :
        // créer un tel compte donnerait un compte inutilisable.
        throw new Error('ADMIN_PASSWORD doit comporter au moins 6 caractères.')
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (!existing) {
        await prisma.user.create({
            data: {
                email,
                password: await bcrypt.hash(password, 10),
                name: 'Administrateur',
                role: 'ADMIN',
            },
        })
        console.log(`✅  Compte administrateur « ${email} » créé.`)
        return
    }

    const passwordsMatch = await bcrypt.compare(password, existing.password)

    if (!passwordsMatch) {
        await prisma.user.update({
            where: { email },
            data: { password: await bcrypt.hash(password, 10), role: 'ADMIN' },
        })
        console.log(`✅  Mot de passe de « ${email} » mis à jour depuis l'environnement.`)
    } else if (existing.role !== 'ADMIN') {
        await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
        console.log(`✅  Rôle de « ${email} » promu ADMIN.`)
    } else {
        console.log(`✅  Compte administrateur « ${email} » déjà à jour.`)
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
        console.error('❌  Échec du seed administrateur :', error)
        await prisma.$disconnect()
        process.exit(1)
    })
