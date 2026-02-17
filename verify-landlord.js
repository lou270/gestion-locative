
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking prisma.landlord...');
    if (prisma.landlord) {
        console.log('prisma.landlord exists');
        const l = await prisma.landlord.findFirst();
        console.log('Landlord found:', l);
    } else {
        console.error('prisma.landlord is UNDEFINED');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
