const { PrismaClient } = require('@prisma/client');

async function testPort(port, password) {
  const url = `postgresql://postgres:${password}@localhost:${port}/prerna_store?schema=public`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    console.log(`>>> SUCCESS on port ${port} with password '${password}': users=${userCount}, products=${productCount}`);
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.log(`FAILED on port ${port} (${password}):`, e.message);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  const ports = [5432, 5433, 5435];
  const passwords = ['postgrespassword', 'postgres', 'admin', 'root', 'Prerna@123'];
  for (const port of ports) {
    for (const pw of passwords) {
      const ok = await testPort(port, pw);
      if (ok) return;
    }
  }
}

main();
