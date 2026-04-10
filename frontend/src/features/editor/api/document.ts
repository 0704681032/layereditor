import api from '@/shared/lib/api';
import type { EditorDocumentDetail, DocumentListItem, DocumentUpdateResponse } from '../types';

interface CreateDocumentRequest {
  title: string;
  schemaVersion: number;
  content: unknown;
}

interface UpdateDocumentRequest {
  title: string;
  schemaVersion: number;
  currentVersion: number;
  content: unknown;
}

interface UpdateTitleRequest {
  title: string;
}

export async function createDocument(data: CreateDocumentRequest): Promise<EditorDocumentDetail> {
  const res = await api.post('/documents', data);
  return res.data;
}

export async function importDocumentFromFile(file: File, title?: string): Promise<EditorDocumentDetail> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }
  const res = await api.post('/documents/import-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getDocument(id: number): Promise<EditorDocumentDetail> {
  const res = await api.get(`/documents/${id}`);
  return res.data;
}

export async function listDocuments(): Promise<DocumentListItem[]> {
  const res = await api.get('/documents');
  return res.data;
}

export async function updateDocument(id: number, data: UpdateDocumentRequest): Promise<DocumentUpdateResponse> {
  const res = await api.put(`/documents/${id}`, data);
  return res.data;
}

export async function updateDocumentTitle(id: number, title: string): Promise<void> {
  await api.patch(`/documents/${id}/title`, { title });
}

export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function deleteDocuments(ids: number[]): Promise<void> {
  await Promise.all(ids.map(id => api.delete(`/documents/${id}`)));
}
