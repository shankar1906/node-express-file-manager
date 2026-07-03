'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const checkHydration = () => {
      setHydrated(useAuthStore.persist.hasHydrated() && useUIStore.persist.hasHydrated());
    };

    const unsubAuth = useAuthStore.persist.onFinishHydration(checkHydration);
    const unsubUi = useUIStore.persist.onFinishHydration(checkHydration);

    checkHydration();

    return () => {
      unsubAuth();
      unsubUi();
    };
  }, []);

  return hydrated;
}
