import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Find an admin user
  const admin = await prisma.user.findFirst({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN']
      }
    }
  });

  if (!admin) {
    console.error('No Admin or Super Admin user found in database.');
    return;
  }

  console.log(`Found admin user: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);

  // Generate JWT token
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  console.log('Generated auth token successfully.');

  const newDescription = "This is a new test description via API patch at " + new Date().toISOString();
  console.log(`Sending PATCH to http://localhost:5000/api/v1/policy with: ${newDescription}`);

  try {
    const response = await axios.patch(
      'http://localhost:5000/api/v1/policy',
      { description: newDescription },
      {
        headers: {
          Authorization: `${token}`
        }
      }
    );

    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.error('API Error Response Status:', error.response.status);
      console.error('API Error Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Request Error:', error.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
