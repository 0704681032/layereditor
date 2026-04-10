import api from '@/shared/lib/api';

export interface RevisionItem {
  id: number;
  documentId: number;
  versionNo: number;
  message: string | null;
  createdAt: string;
}

export interface RevisionDetail extends RevisionItem {
  snapshot: unknown;
}

export async function createRevision(documentId: number, message?: string): Promise<RevisionItem> {
  const res = await api.post(`/documents/${documentId}/revisions`, { message });
  return res.data;
}

export async function listRevisions(documentId: number): Promise<RevisionItem[]> {
  const res = await api.get(`/documents/${documentId}/revisions`);
  return res.data;
}

export async function getRevisionDetail(documentId: number, revisionId: number): Promise<RevisionDetail> {
  const res = await api.get(`/documents/${documentId}/revisions/${revisionId}`);
  return res.data;
}
