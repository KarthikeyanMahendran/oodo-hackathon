'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyPayslipsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/my-salary');
  }, [router]);

  return null;
}
