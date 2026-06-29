const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.downloadLog.deleteMany()
  await prisma.file.deleteMany()
  await prisma.folder.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const adminHash = await bcrypt.hash('admin123', 12)
  const userHash = await bcrypt.hash('user123', 12)
  const plusHash = await bcrypt.hash('contrib123', 12)

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@local.net',
      password: adminHash,
      role: 'ADMIN',
    },
  })

  const contributor = await prisma.user.create({
    data: {
      name: 'Dr. Contributor',
      email: 'contributor@local.net',
      password: plusHash,
      role: 'USER_PLUS',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@local.net',
      password: userHash,
      role: 'USER',
    },
  })

  // Create folders
  const publicFolder = await prisma.folder.create({
    data: {
      name: 'Public Resources',
      isPublic: true,
      createdById: admin.id,
    },
  })

  const researchFolder = await prisma.folder.create({
    data: {
      name: 'Research Papers',
      isPublic: true,
      createdById: contributor.id,
    },
  })

  await prisma.folder.create({
    data: {
      name: 'Internal Reports',
      isPublic: false,
      createdById: admin.id,
    },
  })

  console.log('✅ Created 3 users and 3 folders')
  console.log('📋 Credentials:')
  console.log('   ADMIN      → admin@local.net       / admin123')
  console.log('   USER_PLUS  → contributor@local.net / contrib123')
  console.log('   USER       → user@local.net        / user123')
  console.log('')
  console.log('📂 Folders:')
  console.log(`   [ID ${publicFolder.id}]  "Public Resources"  — PUBLIC`)
  console.log(`   [ID ${researchFolder.id}]  "Research Papers"  — PUBLIC`)
  console.log('   [ID 3]  "Internal Reports"  — PRIVATE')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Seed complete!')
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
