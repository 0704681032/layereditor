import { type FC, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { getDocument } from '@/features/editor/api/document';
import { EditorLayout } from '@/features/editor/components/layout/EditorLayout';
import { EditorErrorBoundary } from '@/features/editor/components/layout/EditorErrorBoundary';
import { clearHistory, pushHistory } from '@/features/editor/store/history';
import { normalizePosterLayers } from '@/features/editor/data/imageTemplates';

export const EditorPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setDocument = useEditorStore((s) => s.setDocument);
  const content = useEditorStore((s) => s.content);
  const reset = useEditorStore((s) => s.reset);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      message.error('Invalid document ID');
      navigate('/');
      return;
    }

    getDocument(docId)
      .then((doc) => {
        const normalized = normalizePosterLayers(doc.content.layers);
        const content = normalized.changed
          ? { ...doc.content, layers: normalized.layers }
          : doc.content;

        setDocument({
          documentId: doc.id,
          title: doc.title,
          currentVersion: doc.currentVersion,
          content,
        });
        if (normalized.changed) {
          useEditorStore.getState().markDirty();
        }
        clearHistory();
        pushHistory({ content, selectedLayerIds: [] });
      })
      .catch((e) => {
        message.error(e.message || 'Failed to load document');
        navigate('/');
      });

    return () => {
      reset();
    };
  }, [id]);

  if (!content) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <EditorErrorBoundary>
      <EditorLayout />
    </EditorErrorBoundary>
  );
};
