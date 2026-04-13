import { type ChangeEvent, type FC, useEffect, useRef, useState } from 'react';
import { Button, Card, Typography, App, Empty, Spin, Modal, Input, InputNumber, Popconfirm, Checkbox, Select, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, UploadOutlined, DeleteOutlined, FormOutlined, FileImageOutlined, AppstoreOutlined, LayoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listDocuments, createDocument, importDocumentFromFile, updateDocumentTitle, deleteDocument, deleteDocuments } from '@/features/editor/api/document';
import type { EditorLayer } from '@/features/editor/types';

const { Title, Text } = Typography;

const CANVAS_PRESETS = [
  { label: 'Social Media Post', value: 'social', width: 1080, height: 1080, bg: '#FFFFFF', icon: '📱' },
  { label: 'Instagram Story', value: 'story', width: 1080, height: 1920, bg: '#FFFFFF', icon: '📸' },
  { label: 'Facebook Cover', value: 'fb', width: 1640, height: 856, bg: '#FFFFFF', icon: '🖥' },
  { label: 'Presentation (16:9)', value: 'slides', width: 1920, height: 1080, bg: '#FFFFFF', icon: '📊' },
  { label: 'A4 Portrait', value: 'a4', width: 794, height: 1123, bg: '#FFFFFF', icon: '📄' },
  { label: 'Banner (728x90)', value: 'banner', width: 728, height: 90, bg: '#FFFFFF', icon: '🖼' },
  { label: 'Custom', value: 'custom', width: 1200, height: 800, bg: '#FFFFFF', icon: '✏' },
];

// ---------------------------------------------------------------------------
// Document Templates
// ---------------------------------------------------------------------------

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailColor: string;
  thumbnailGradient?: string;
  canvas: { width: number; height: number; background: string };
  layers: EditorLayer[];
}

function tid(): string {
  return 'layer_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'social-media-post',
    name: 'Social Media Post',
    description: 'Vibrant 1080x1080 post with colorful background, headline and shapes',
    category: 'Social Media',
    thumbnailColor: '#667eea',
    thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    canvas: { width: 1080, height: 1080, background: '#667eea' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Background Accent',
        x: 0, y: 0, width: 1080, height: 1080,
        fill: '#764ba2', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Decorative Circle 1',
        x: 780, y: -80, width: 400, height: 400,
        fill: '#ffffff15', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Decorative Circle 2',
        x: -100, y: 780, width: 360, height: 360,
        fill: '#ffffff10', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Content Card',
        x: 90, y: 200, width: 900, height: 680,
        fill: '#ffffff20', cornerRadius: 24, visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'CTA Button',
        x: 340, y: 720, width: 400, height: 70,
        fill: '#FFD700', cornerRadius: 35, visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Headline',
        x: 540, y: 340, text: 'YOUR\nMESSAGE',
        fontSize: 72, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Subtitle',
        x: 540, y: 540, text: 'Add your subtitle here',
        fontSize: 28, fontFamily: 'Arial', fill: '#ffffffcc',
        align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'CTA Text',
        x: 540, y: 736, text: 'SHOP NOW',
        fontSize: 24, fontFamily: 'Arial', fill: '#333333',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Gradient background story layout with bold text layers',
    category: 'Social Media',
    thumbnailColor: '#f093fb',
    thumbnailGradient: 'linear-gradient(180deg, #667eea 0%, #f093fb 100%)',
    canvas: { width: 1080, height: 1920, background: '#667eea' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Gradient Background',
        x: 0, y: 0, width: 1080, height: 1920,
        fill: '#764ba2', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Top Glow',
        x: 200, y: -200, width: 680, height: 680,
        fill: '#ffffff15', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Bottom Glow',
        x: -100, y: 1400, width: 600, height: 600,
        fill: '#ffffff10', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Content Frame',
        x: 80, y: 400, width: 920, height: 1100,
        fill: '#ffffff12', cornerRadius: 32, visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Main Title',
        x: 540, y: 600, text: 'SWIPE UP',
        fontSize: 96, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Sub Heading',
        x: 540, y: 800, text: 'for more details',
        fontSize: 36, fontFamily: 'Arial', fill: '#ffffffcc',
        align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Swipe Button',
        x: 340, y: 1300, width: 400, height: 80,
        fill: '#ffffff', cornerRadius: 40, visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Button Label',
        x: 540, y: 1318, text: 'Learn More',
        fontSize: 28, fontFamily: 'Arial', fill: '#764ba2',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Brand Tag',
        x: 540, y: 1650, text: '@yourbrand',
        fontSize: 22, fontFamily: 'Arial', fill: '#ffffff80',
        align: 'center', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    description: 'Professional 820x312 header with title and tagline',
    category: 'Social Media',
    thumbnailColor: '#1a365d',
    thumbnailGradient: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
    canvas: { width: 820, height: 312, background: '#1a365d' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Right Panel',
        x: 0, y: 0, width: 820, height: 312,
        fill: '#2b6cb0', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Accent Circle',
        x: 600, y: -80, width: 350, height: 350,
        fill: '#ffffff10', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Accent Bar',
        x: 60, y: 220, width: 120, height: 4,
        fill: '#63b3ed', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Company Name',
        x: 60, y: 80, text: 'YOUR COMPANY',
        fontSize: 52, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Tagline',
        x: 60, y: 160, text: 'Innovation meets excellence',
        fontSize: 24, fontFamily: 'Arial', fill: '#bee3f8',
        align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Website',
        x: 60, y: 250, text: 'www.yourcompany.com',
        fontSize: 16, fontFamily: 'Arial', fill: '#63b3ed',
        align: 'left', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'presentation-slide',
    name: 'Presentation Slide',
    description: '16:9 title slide with content layout for presentations',
    category: 'Business',
    thumbnailColor: '#1a202c',
    thumbnailGradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
    canvas: { width: 1920, height: 1080, background: '#1a202c' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Right Half',
        x: 960, y: 0, width: 960, height: 1080,
        fill: '#2d3748', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Accent Line',
        x: 120, y: 280, width: 80, height: 6,
        fill: '#4299e1', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Slide Title',
        x: 120, y: 320, text: 'PRESENTATION\nTITLE',
        fontSize: 72, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Presenter',
        x: 120, y: 560, text: 'Presented by: Your Name',
        fontSize: 24, fontFamily: 'Arial', fill: '#a0aec0',
        align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Date',
        x: 120, y: 620, text: 'Date: April 2026',
        fontSize: 20, fontFamily: 'Arial', fill: '#718096',
        align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Decorative Circle',
        x: 1400, y: 240, width: 600, height: 600,
        fill: '#4299e118', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Small Circle',
        x: 1600, y: 600, width: 200, height: 200,
        fill: '#4299e110', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Bold 1280x720 thumbnail with eye-catching text and background',
    category: 'Social Media',
    thumbnailColor: '#e53e3e',
    thumbnailGradient: 'linear-gradient(135deg, #e53e3e 0%, #dd6b20 100%)',
    canvas: { width: 1280, height: 720, background: '#e53e3e' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Background Overlay',
        x: 0, y: 0, width: 1280, height: 720,
        fill: '#dd6b20', visible: true, locked: false,
      },
      {
        id: tid(), type: 'ellipse', name: 'Corner Glow',
        x: 900, y: -100, width: 500, height: 500,
        fill: '#ffffff15', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Overlay Strip',
        x: 0, y: 200, width: 1280, height: 320,
        fill: '#00000040', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Main Hook',
        x: 640, y: 260, text: 'WATCH THIS!',
        fontSize: 96, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Sub Text',
        x: 640, y: 420, text: 'You won\'t believe what happens next',
        fontSize: 32, fontFamily: 'Arial', fill: '#ffffffcc',
        align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Badge',
        x: 40, y: 40, width: 180, height: 50,
        fill: '#ffffff', cornerRadius: 8, visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Badge Text',
        x: 130, y: 50, text: 'NEW VIDEO',
        fontSize: 18, fontFamily: 'Arial', fill: '#e53e3e',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'poster-a4',
    name: 'Poster (A4)',
    description: 'A4 poster layout with title, content sections and footer',
    category: 'Print',
    thumbnailColor: '#2f855a',
    thumbnailGradient: 'linear-gradient(180deg, #2f855a 0%, #276749 100%)',
    canvas: { width: 800, height: 1131, background: '#f7fafc' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Header Band',
        x: 0, y: 0, width: 800, height: 320,
        fill: '#2f855a', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Poster Title',
        x: 400, y: 80, text: 'YOUR EVENT',
        fontSize: 64, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Event Date',
        x: 400, y: 190, text: 'April 20, 2026',
        fontSize: 28, fontFamily: 'Arial', fill: '#c6f6d5',
        align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Section 1 Title',
        x: 60, y: 380, text: 'About This Event',
        fontSize: 28, fontFamily: 'Arial', fill: '#2f855a',
        fontStyle: 'bold', align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Divider 1',
        x: 60, y: 420, width: 100, height: 3,
        fill: '#2f855a', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Section 1 Body',
        x: 60, y: 440, text: 'Add your event description here.\nDescribe what attendees can expect.',
        fontSize: 18, fontFamily: 'Arial', fill: '#4a5568',
        align: 'left', lineHeight: 1.6, visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Section 2 Title',
        x: 60, y: 600, text: 'Key Highlights',
        fontSize: 28, fontFamily: 'Arial', fill: '#2f855a',
        fontStyle: 'bold', align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Divider 2',
        x: 60, y: 640, width: 100, height: 3,
        fill: '#2f855a', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Section 2 Body',
        x: 60, y: 660, text: 'Highlight 1: Keynote speakers\nHighlight 2: Live workshops\nHighlight 3: Networking',
        fontSize: 18, fontFamily: 'Arial', fill: '#4a5568',
        align: 'left', lineHeight: 1.6, visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Footer Band',
        x: 0, y: 1040, width: 800, height: 91,
        fill: '#276749', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Footer Text',
        x: 400, y: 1064, text: 'www.yourevent.com  |  Register Now',
        fontSize: 16, fontFamily: 'Arial', fill: '#c6f6d5',
        align: 'center', visible: true, locked: false,
      },
    ],
  },
  {
    id: 'business-card',
    name: 'Business Card',
    description: 'Minimal professional card with name, title and contact info',
    category: 'Print',
    thumbnailColor: '#2d3748',
    thumbnailGradient: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
    canvas: { width: 1050, height: 600, background: '#ffffff' },
    layers: [
      {
        id: tid(), type: 'rect', name: 'Left Panel',
        x: 0, y: 0, width: 380, height: 600,
        fill: '#2d3748', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Accent Strip',
        x: 375, y: 0, width: 10, height: 600,
        fill: '#4299e1', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Full Name',
        x: 190, y: 180, text: 'JOHN DOE',
        fontSize: 36, fontFamily: 'Arial', fill: '#ffffff',
        fontStyle: 'bold', align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Job Title',
        x: 190, y: 250, text: 'Creative Director',
        fontSize: 18, fontFamily: 'Arial', fill: '#a0aec0',
        align: 'center', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Company',
        x: 600, y: 140, text: 'ACME Corp',
        fontSize: 28, fontFamily: 'Arial', fill: '#2d3748',
        fontStyle: 'bold', align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'rect', name: 'Contact Divider',
        x: 440, y: 200, width: 60, height: 3,
        fill: '#4299e1', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Email',
        x: 440, y: 260, text: 'john@acmecorp.com',
        fontSize: 16, fontFamily: 'Arial', fill: '#4a5568',
        align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Phone',
        x: 440, y: 310, text: '+1 (555) 123-4567',
        fontSize: 16, fontFamily: 'Arial', fill: '#4a5568',
        align: 'left', visible: true, locked: false,
      },
      {
        id: tid(), type: 'text', name: 'Website',
        x: 440, y: 360, text: 'www.acmecorp.com',
        fontSize: 16, fontFamily: 'Arial', fill: '#4a5568',
        align: 'left', visible: true, locked: false,
      },
    ],
  },
];

export const DocumentListPage: FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<{ id: number; title: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled Document');
  const [selectedPreset, setSelectedPreset] = useState('social');
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const fetchDocuments = async () => {
    try { setLoading(true); setDocuments(await listDocuments()); }
    catch (e: any) { message.error(e.message || 'Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleCreate = async () => {
    try {
      const preset = CANVAS_PRESETS.find(p => p.value === selectedPreset) ?? CANVAS_PRESETS[0];
      const width = selectedPreset === 'custom' ? customWidth : preset.width;
      const height = selectedPreset === 'custom' ? customHeight : preset.height;
      const bg = preset.bg;
      const doc = await createDocument({
        title: newTitle || 'Untitled Document', schemaVersion: 1,
        content: { schemaVersion: 1, canvas: { width, height, background: bg }, layers: [] },
      });
      message.success('Document created');
      setCreateModalOpen(false);
      navigate(`/editor/${doc.id}`);
    } catch (e: any) { message.error(e.message || 'Failed to create document'); }
  };

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    try {
      setCreatingTemplate(true);
      const doc = await createDocument({
        title: template.name, schemaVersion: 1,
        content: {
          schemaVersion: 1,
          canvas: { ...template.canvas },
          layers: template.layers.map(l => ({ ...l, id: tid() })),
        },
      });
      message.success(`Created from "${template.name}" template`);
      setTemplateModalOpen(false);
      navigate(`/editor/${doc.id}`);
    } catch (e: any) {
      message.error(e.message || 'Failed to create document from template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const doc = await importDocumentFromFile(file);
      message.success('Import completed');
      navigate(`/editor/${doc.id}`);
    } catch (e: any) { message.error(e.message || 'Import failed'); }
    finally { setImporting(false); event.target.value = ''; }
  };

  const openEditModal = (doc: { id: number; title: string }, e: React.MouseEvent) => {
    e.stopPropagation(); setEditingDoc(doc); setEditTitle(doc.title); setEditModalOpen(true);
  };

  const handleSaveTitle = async () => {
    if (!editingDoc || !editTitle.trim()) return;
    try { setSaving(true); await updateDocumentTitle(editingDoc.id, editTitle.trim()); message.success('Title updated'); setEditModalOpen(false); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteDocument(id); message.success('Deleted'); setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; }); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Delete failed'); }
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(documents.map(d => d.id)) : new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try { await deleteDocuments(Array.from(selectedIds)); message.success(`Deleted ${selectedIds.size} documents`); setSelectedIds(new Set()); fetchDocuments(); }
    catch (e: any) { message.error(e.message || 'Batch delete failed'); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#fafafa',
      backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(22, 119, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(114, 46, 209, 0.03) 0%, transparent 50%)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
        <input ref={importInputRef} type="file" accept="image/*,.svg,image/svg+xml" style={{ display: 'none' }} onChange={handleImport} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
              Layer Editor
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Professional design tool for everyone</Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedIds.size > 0 && (
              <Popconfirm title={`Delete ${selectedIds.size} selected documents?`} onConfirm={handleBatchDelete} okText="Delete" cancelText="Cancel">
                <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                  Delete ({selectedIds.size})
                </Button>
              </Popconfirm>
            )}
            <Button icon={<UploadOutlined />} loading={importing} onClick={() => importInputRef.current?.click()}
              style={{ borderRadius: 8 }}>
              Import
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setNewTitle('Untitled Document'); setSelectedPreset('social'); setCreateModalOpen(true); }}
              style={{ borderRadius: 8, fontWeight: 500 }}>
              New Document
            </Button>
            <Button icon={<LayoutOutlined />} onClick={() => setTemplateModalOpen(true)}
              style={{ borderRadius: 8, fontWeight: 500 }}>
              From Template
            </Button>
          </div>
        </div>

        {/* Document grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : documents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#fff', borderRadius: 16, border: '1px dashed #d9d9d9',
          }}>
            <FileImageOutlined style={{ fontSize: 48, color: '#d0d0d0', marginBottom: 16 }} />
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 16, color: '#666' }}>No documents yet</Text>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Create your first design document to get started</Text>
            <Space size={12}>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}
                style={{ borderRadius: 10, height: 44, paddingInline: 28, fontWeight: 500 }}>
                Blank Document
              </Button>
              <Button size="large" icon={<LayoutOutlined />} onClick={() => setTemplateModalOpen(true)}
                style={{ borderRadius: 10, height: 44, paddingInline: 28, fontWeight: 500 }}>
                From Template
              </Button>
            </Space>
          </div>
        ) : (
          <>
            {documents.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox checked={selectedIds.size === documents.length} indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length} onChange={(e) => toggleAll(e.target.checked)}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Select all ({documents.length})</Text>
                </Checkbox>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {documents.map((doc) => {
                const preset = CANVAS_PRESETS.find(p => `${p.width}x${p.height}` === `${doc.content?.canvas?.width ?? 0}x${doc.content?.canvas?.height ?? 0}`);
                return (
                    <Card
                      key={doc.id}
                      hoverable
                      onClick={() => navigate(`/editor/${doc.id}`)}
                      style={{
                        cursor: 'pointer', borderRadius: 12,
                        border: selectedIds.has(doc.id) ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        overflow: 'hidden', transition: 'all 0.2s ease',
                      }}
                      styles={{ body: { padding: 0 } }}
                    >
                      {/* Canvas preview area */}
                      <div style={{
                        background: '#f8f8f8',
                        borderBottom: '1px solid #f0f0f0',
                        height: 140,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {doc.content?.thumbnail ? (
                          <img
                            src={doc.content.thumbnail}
                            alt={doc.title}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              borderRadius: 4,
                            }}
                          />
                        ) : (
                        <div style={{
                          background: doc.content?.canvas?.background ?? '#fff',
                          width: '60%', height: '70%',
                          border: '1px solid #e8e8e8',
                          borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                          <FileImageOutlined style={{ fontSize: 24, color: '#d0d0d0' }} />
                        </div>
                        )}
                        {preset && (
                          <Tag style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, margin: 0, borderRadius: 4, background: 'rgba(255,255,255,0.9)' }}>
                            {preset.icon} {preset.width}×{preset.height}
                          </Tag>
                        )}
                        {/* Selection checkbox */}
                        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                          <Checkbox checked={selectedIds.has(doc.id)} onChange={(e) => toggleSelection(doc.id, e.target.checked)} onClick={(e) => e.stopPropagation()} />
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: '12px 14px 8px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          v{doc.currentVersion} · {formatDate(doc.updatedAt)}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ padding: '4px 14px 12px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button size="small" type="text" icon={<FormOutlined />} onClick={(e) => openEditModal(doc, e)}
                          style={{ borderRadius: 6, fontSize: 12, color: '#999' }}>
                          Rename
                        </Button>
                        <Popconfirm title="Delete this document?" onConfirm={(e) => handleDelete(doc.id, e as unknown as React.MouseEvent)} onCancel={(e) => e?.stopPropagation()} okText="Delete" cancelText="Cancel">
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}
                            style={{ borderRadius: 6, fontSize: 12 }}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </div>
                    </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Create Dialog */}
        <Modal title="New Document" open={createModalOpen} onOk={handleCreate} onCancel={() => setCreateModalOpen(false)}
          okText="Create" width={480}
        >
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Title</Text>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter document title" style={{ marginTop: 6, borderRadius: 8 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Canvas Preset</Text>
            <Select value={selectedPreset} onChange={setSelectedPreset} style={{ width: '100%', marginTop: 6 }}
              options={CANVAS_PRESETS.map(p => ({ label: `${p.icon} ${p.label} (${p.width}×${p.height})`, value: p.value }))} />
          </div>
          {selectedPreset === 'custom' && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Size</Text>
              <Space style={{ marginTop: 6, width: '100%' }} size={12}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>Width</Text>
                  <InputNumber value={customWidth} onChange={(v: number | null) => setCustomWidth(v ?? 1200)} style={{ width: '100%' }} min={100} max={4096} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#999' }}>Height</Text>
                  <InputNumber value={customHeight} onChange={(v: number | null) => setCustomHeight(v ?? 800)} style={{ width: '100%' }} min={100} max={4096} />
                </div>
              </Space>
            </div>
          )}
        </Modal>

        {/* Rename Dialog */}
        <Modal title="Rename Document" open={editModalOpen} onOk={handleSaveTitle} onCancel={() => setEditModalOpen(false)}
          confirmLoading={saving} okText="Save" cancelText="Cancel"
        >
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Enter document title" onPressEnter={handleSaveTitle}
            style={{ borderRadius: 8 }} />
        </Modal>

        {/* Template Browser Dialog */}
        <Modal
          title={<span><AppstoreOutlined style={{ marginRight: 8 }} />Create from Template</span>}
          open={templateModalOpen}
          onCancel={() => setTemplateModalOpen(false)}
          footer={null}
          width={740}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
            Choose a template to get started quickly with pre-designed content
          </Text>
          {creatingTemplate && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large"><Text type="secondary">Creating document...</Text></Spin>
            </div>
          )}
          {!creatingTemplate && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {DOCUMENT_TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  hoverable
                  onClick={() => handleCreateFromTemplate(tpl)}
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                  styles={{ body: { padding: 0 } }}
                >
                  {/* Thumbnail preview */}
                  <div style={{
                    height: 120,
                    background: tpl.thumbnailGradient ?? tpl.thumbnailColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Mini canvas shape preview */}
                    <div style={{
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      padding: '8px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <div style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />
                      <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                      <div style={{ width: 50, height: 3, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                      <div style={{ width: 30, height: 12, background: 'rgba(255,255,255,0.4)', borderRadius: 6, marginTop: 4 }} />
                    </div>
                    <Tag style={{
                      position: 'absolute', bottom: 6, right: 6, fontSize: 10,
                      margin: 0, borderRadius: 4, background: 'rgba(255,255,255,0.9)',
                    }}>
                      {tpl.canvas.width}x{tpl.canvas.height}
                    </Tag>
                  </div>
                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tpl.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tpl.description}
                    </div>
                    <Tag color="blue" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{tpl.category}</Tag>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
