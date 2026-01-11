import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { rooms } from './schema';

const DEFAULT_ROOM_SLUG = 'landing-zone';

async function seedDefaultRoom() {
  console.log('Checking for default room...');

  const existingRoom = await db.query.rooms.findFirst({
    where: eq(rooms.slug, DEFAULT_ROOM_SLUG),
  });

  if (existingRoom) {
    console.log('Default room already exists:', existingRoom.name);
    return existingRoom;
  }

  console.log('Creating default room...');
  const now = new Date();
  const roomId = nanoid();

  await db.insert(rooms).values({
    id: roomId,
    slug: DEFAULT_ROOM_SLUG,
    name: 'Landing Zone',
    description: 'The default chat room for all users',
    createdBy: null, // System-created room
    isDefault: true,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log('Default room created successfully');
  return db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
}

// Note: User migration is no longer needed.
// New users auto-join the default room via BetterAuth databaseHooks.
// This function is kept for reference but not called in main().

async function main() {
  try {
    await seedDefaultRoom();
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
