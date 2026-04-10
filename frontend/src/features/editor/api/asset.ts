import api from '@/shared/lib/api';
import type { AssetResponse, AssetListParams, AssetListResponse } from '../types';

export async function uploadAsset(file: File, documentId?: number, kind = 'image'): Promise<AssetResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (documentId) formData.append('documentId', String(documentId));
  formData.append('kind', kind);
  const res = await api.post('/assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getAsset(id: number): Promise<AssetResponse> {
  const res = await api.get(`/assets/${id}`);
  return res.data;
}

export async function listAssets(params: AssetListParams = {}): Promise<AssetListResponse> {
  const res = await api.get('/assets', { params });
  return res.data;
}
