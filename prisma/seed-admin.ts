
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Super Admin',
            role: 'ADMIN',
        },
    });

    console.log(`✅  Admin user '${email}' synced with database.`);
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
