import { db } from './lib/db';
import { hashPassword } from './lib/auth';

async function main() {
  // Create school
  const school = await db.school.upsert({
    where: { name: 'Hyperion Lyceum' },
    update: {},
    create: { name: 'Hyperion Lyceum', code: 'HYPERION' }
  });

  console.log('Created school:', school.name);

  // Create class
  const cls = await db.class.upsert({
    where: { id: 'class-1d-hyperion' },
    update: {},
    create: { id: 'class-1d-hyperion', name: '1D', schoolId: school.id, year: 1 }
  });

  console.log('Created class:', cls.name);

  // Create admin user
  const hashedPassword = await hashPassword('TOESJABLOX');
  const admin = await db.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      isAdmin: true,
      isPro: true,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      isAdmin: true,
      isPro: true,
      onboardingDone: true,
      schoolId: school.id,
      classId: cls.id,
    }
  });

  console.log('Created admin user:', admin.username);

  // Create some keuzelessen
  const keuzelessen = [
    { name: 'Kunst & Cultuur', teacher: 'Mr. Jansen', description: 'Ontdek kunst en cultuur' },
    { name: 'Sport & Gezondheid', teacher: 'Mevr. de Vries', description: 'Sporten en gezond leven' },
    { name: 'Techniek & Innovatie', teacher: 'Mr. Bakker', description: 'Robotica en programmeren' },
  ];

  for (const k of keuzelessen) {
    await db.keuzeles.upsert({
      where: { name: k.name },
      update: {},
      create: { ...k, schoolId: school.id, maxStudents: 30 }
    });
  }

  console.log('Created keuzelessen');

  // Create subjects
  const subjects = [
    { name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱' },
    { name: 'engels', displayName: 'Engels', icon: '🇬🇧' },
    { name: 'wiskunde', displayName: 'Wiskunde', icon: '📐' },
    { name: 'biologie', displayName: 'Biologie', icon: '🧬' },
    { name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜' },
    { name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍' },
    { name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️' },
    { name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪' },
    { name: 'tekenen', displayName: 'Tekenen', icon: '🎨' },
    { name: 'muziek', displayName: 'Muziek', icon: '🎵' },
    { name: 'lo', displayName: 'Lichamelijke Opvoeding', icon: '⚽' },
  ];

  for (const s of subjects) {
    await db.subject.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
  }

  console.log('Created subjects');

  // Create time slots for Hyperion Lyceum
  const timeSlots = [
    { period: 1, startTime: '09:00', endTime: '09:45' },
    { period: 2, startTime: '09:45', endTime: '10:30' },
    { period: 3, startTime: '10:45', endTime: '11:30' },
    { period: 4, startTime: '11:30', endTime: '12:15' },
    { period: 5, startTime: '12:45', endTime: '13:30' },
    { period: 6, startTime: '13:30', endTime: '14:15' },
    { period: 7, startTime: '14:30', endTime: '15:15' },
    { period: 8, startTime: '15:15', endTime: '16:00' },
  ];

  for (const slot of timeSlots) {
    await db.timeSlot.upsert({
      where: { schoolId_period: { schoolId: school.id, period: slot.period } },
      update: slot,
      create: { ...slot, schoolId: school.id }
    });
  }

  console.log('Created time slots');
  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
