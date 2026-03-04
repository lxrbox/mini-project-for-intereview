const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.ledgerEntry.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.user.deleteMany();

  const users = Array.from({ length: 10 }).map((_, idx) => {
    const no = String(idx + 1).padStart(2, "0");
    return {
      email: `player${no}@example.com`,
      displayName: `Player ${no}`,
    };
  });

  await prisma.user.createMany({ data: users });

  // eslint-disable-next-line no-console
  console.log(`Seed complete: ${users.length} users created.`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
