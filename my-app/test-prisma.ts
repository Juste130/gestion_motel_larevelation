import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
})

async function main() {
  const count = await prisma.user.count()
  console.log("User count:", count)
}

main().catch(console.error)
