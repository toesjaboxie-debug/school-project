import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const subjects = [
  { name: 'wiskunde', displayName: 'Wiskunde', icon: '📐', color: '#3B82F6' },
  { name: 'engels', displayName: 'Engels', icon: '🇬🇧', color: '#10B981' },
  { name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱', color: '#F59E0B' },
  { name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜', color: '#8B5CF6' },
  { name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍', color: '#06B6D4' },
  { name: 'biologie', displayName: 'Biologie', icon: '🧬', color: '#22C55E' },
  { name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️', color: '#EF4444' },
  { name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪', color: '#F97316' },
  { name: 'frans', displayName: 'Frans', icon: '🇫🇷', color: '#EC4899' },
  { name: 'duits', displayName: 'Duits', icon: '🇩🇪', color: '#6366F1' },
  { name: 'economie', displayName: 'Economie', icon: '📊', color: '#14B8A6' },
  { name: 'maatschappijleer', displayName: 'Maatschappijleer', icon: '🏛️', color: '#A855F7' },
  { name: 'algemeen', displayName: 'Algemeen', icon: '📚', color: '#6B7280' },
];

async function main() {
  console.log('Seeding database...');

  // Create subjects
  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {
        displayName: subject.displayName,
        icon: subject.icon,
        color: subject.color,
      },
      create: {
        name: subject.name,
        displayName: subject.displayName,
        icon: subject.icon,
        color: subject.color,
      },
    });
  }
  console.log('Subjects created');

  // Create default site settings
  const existingLogo = await prisma.siteSettings.findUnique({
    where: { key: 'logo' },
  });

  if (!existingLogo) {
    await prisma.siteSettings.create({
      data: {
        key: 'logo',
        value: '/logo.svg',
      },
    });
    console.log('Default logo setting created');
  }

  // Create site name setting
  const existingSiteName = await prisma.siteSettings.findUnique({
    where: { key: 'siteName' },
  });

  if (!existingSiteName) {
    await prisma.siteSettings.create({
      data: {
        key: 'siteName',
        value: 'EduLearn AI',
      },
    });
    console.log('Default site name setting created');
  }

  // Create admin user if not exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('TOESJABLOX', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        isAdmin: true,
      },
    });
    console.log('Admin user created (username: admin, password: TOESJABLOX)');
  } else {
    // Update admin password
    const hashedPassword = await bcrypt.hash('TOESJABLOX', 10);
    await prisma.user.update({
      where: { username: 'admin' },
      data: { password: hashedPassword },
    });
    console.log('Admin password updated');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
