export interface AssetResponse {
  id: number;
  documentId: number;
  kind: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  url: string;
  createdAt: string;
}

export interface AssetListParams {
  documentId?: number;
  kind?: string;
  page?: number;
  size?: number;
}

export interface AssetListResponse {
  items: AssetResponse[];
  total: number;
  page: number;
  size: number;
}
