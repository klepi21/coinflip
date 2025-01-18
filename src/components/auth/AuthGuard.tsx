'use client'

import { useEffect } from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/scratch'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useGetLoginInfo();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!PUBLIC_ROUTES.includes(pathname || '')) {
      router.replace('/');
    }
  }, [pathname, router]);

  return <>{children}</>;
}