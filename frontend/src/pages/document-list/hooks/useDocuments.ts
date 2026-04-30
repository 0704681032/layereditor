import { useState, useCallback } from 'react';
import { App } from 'antd';
import { listDocuments, type DocumentListResponse } from '@/features/editor/api/document';

interface DocumentItem {
  id: number;
  title: string;
  currentVersion: number;
  updatedAt: string;
  content?: {
    canvas?: { width?: number; height?: number; background?: string };
    thumbnail?: string;
  };
}

interface UseDocumentsReturn {
  documents: DocumentItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  fetchDocuments: (pageNum?: number, sizeNum?: number) => Promise<void>;
}

export function useDocuments(): UseDocumentsReturn {
  const { message } = App.useApp();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchDocuments = useCallback(
    async (pageNum = page, sizeNum = pageSize) => {
      try {
        setLoading(true);
        const res: DocumentListResponse = await listDocuments(pageNum, sizeNum);
        setDocuments(res.items);
        setTotal(res.total);
        setPage(res.page);
        setPageSize(res.size);
      } catch (e: any) {
        message.error(e.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, message]
  );

  return { documents, loading, total, page, pageSize, fetchDocuments };
}