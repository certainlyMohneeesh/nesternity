const { PrismaClient } = require('@prisma/client')

async function main() {
  try {
    const prisma = new PrismaClient()
    const keys = Object.keys(prisma).filter(k => typeof prisma[k] === 'object')
    console.log('Prisma client keys:', keys)
    console.log('Has razorpaySubscription:', !!prisma.razorpaySubscription)
    await prisma.$disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error checking prisma:', err)
    process.exit(1)
  }
}

main()