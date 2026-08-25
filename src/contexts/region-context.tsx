import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { AUTO_REGION_ID } from '@/lib/regions';

const STORAGE_KEY = 'divine-calendar:selected-region';

interface RegionContextValue {
  regionId: string;
  setRegionId: (id: string) => void;
}

const RegionContext = createContext<RegionContextValue>({
  regionId: AUTO_REGION_ID,
  setRegionId: () => {},
});

export function RegionProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionIdState] = useState(AUTO_REGION_ID);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setRegionIdState(saved);
    });
  }, []);

  const setRegionId = (id: string) => {
    setRegionIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return <RegionContext.Provider value={{ regionId, setRegionId }}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  return useContext(RegionContext);
}
