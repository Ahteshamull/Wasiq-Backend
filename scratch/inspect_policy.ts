import { PrismaClient } from '@prisma/client';
import { PrivacyServices } from '../src/app/modules/Privacy_Policy/policy.service';

const prisma = new PrismaClient();

async function main() {
  // Find a user to act as admin
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found in database!');
    return;
  }
  console.log('Using admin user ID:', user.id);

  // Get current policy
  const policiesBefore = await prisma.privacy_Policy.findMany();
  console.log('Before update:', JSON.stringify(policiesBefore, null, 2));

  // Run the update service
  const newDescription = "This is a brand new description of the privacy policy created at " + new Date().toISOString();
  console.log('Updating with new description:', newDescription);
  const result = await PrivacyServices.createOrUpdatePolicy(user.id, newDescription);
  console.log('Service result:', JSON.stringify(result, null, 2));

  // Get policy after update
  const policiesAfter = await prisma.privacy_Policy.findMany();
  console.log('After update:', JSON.stringify(policiesAfter, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
