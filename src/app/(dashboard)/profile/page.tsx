'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useHRMS } from '@/lib/context/HRMSContext';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser } = useHRMS();

  useEffect(() => {
    router.replace(currentUser ? `/employees/${currentUser.id}` : '/sign-in');
  }, [currentUser, router]);

  return null;
}
