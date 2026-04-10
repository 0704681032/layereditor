import { createBrowserRouter } from 'react-router-dom';
import { DocumentListPage } from '@/pages/document-list';
import { EditorPage } from '@/pages/editor';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DocumentListPage />,
  },
  {
    path: '/editor/:id',
    element: <EditorPage />,
  },
]);
