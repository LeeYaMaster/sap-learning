import { useCallback, useEffect, useState } from 'react';
import { api } from './client';
import type {
  Material,
  OrgResponse,
  Partner,
  Plant,
  StorageLocation,
} from './types';

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export function useMaster() {
  const state = useAsync(async () => {
    const [org, materials, customers, vendors] = await Promise.all([
      api.get<OrgResponse>('/org'),
      api.get<Material[]>('/materials'),
      api.get<Partner[]>('/customers'),
      api.get<Vendor[]>('/vendors'),
    ]);
    const plants: Plant[] = org.companies.flatMap((c) => c.plants);
    const slocs: StorageLocation[] = plants.flatMap(
      (p) => p.storageLocations ?? [],
    );
    return { org, materials, customers, vendors, plants, slocs };
  }, []);
  return state;
}

type Vendor = Partner;
