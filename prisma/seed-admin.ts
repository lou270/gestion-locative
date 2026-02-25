
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Skipping admin seed.');
        return;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.update({
                where: { email },
                data: { password: hashedPassword, role: 'ADMIN' }
            });
            console.log(`✅  Admin user '${email}' password updated from environment variables.`);
        } else if (user.role !== 'ADMIN') {
            user = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' }
            });
            console.log(`✅  Admin user '${email}' role promoted to ADMIN.`);
        } else {
            console.log(`✅  Admin user '${email}' already up to date.`);
        }
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Super Admin',
                role: 'ADMIN',
            },
        });
        console.log(`✅  Admin user '${email}' created.`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
