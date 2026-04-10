import { useState, useEffect } from 'react';
import { getAsset } from '../api/asset';
import type { AssetResponse } from '../types';

const cache = new Map<number, AssetResponse>();

export function useImageAsset(assetId: number | undefined) {
  const [assetState, setAssetState] = useState<{ assetId?: number; asset: AssetResponse | null }>({
    assetId,
    asset: assetId ? cache.get(assetId) ?? null : null,
  });
  const resolvedAsset = assetId
    ? cache.get(assetId) ?? (assetState.assetId === assetId ? assetState.asset : null)
    : null;

  useEffect(() => {
    if (!assetId) {
      return;
    }
    if (cache.has(assetId)) {
      return;
    }
    getAsset(assetId)
      .then((data) => {
        cache.set(assetId, data);
        setAssetState({ assetId, asset: data });
      })
      .catch(console.error);
  }, [assetId]);

  return { asset: resolvedAsset, loading: false, url: resolvedAsset?.url ?? null };
}
