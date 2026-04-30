import type { EditorLayer } from '@/features/editor/types';

export interface DocumentTemplate {
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

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'social-media-post',
    name: 'Social Media Post',
    description: 'Vibrant 1080x1080 post with colorful background, headline and shapes',
    category: 'Social Media',
    thumbnailColor: '#667eea',
    thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    canvas: { width: 1080, height: 1080, background: '#667eea' },
    layers: [
      { id: tid(), type: 'rect', name: 'Background Accent', x: 0, y: 0, width: 1080, height: 1080, fill: '#764ba2', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Decorative Circle 1', x: 780, y: -80, width: 400, height: 400, fill: '#ffffff15', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Decorative Circle 2', x: -100, y: 780, width: 360, height: 360, fill: '#ffffff10', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Content Card', x: 90, y: 200, width: 900, height: 680, fill: '#ffffff20', cornerRadius: 24, visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'CTA Button', x: 340, y: 720, width: 400, height: 70, fill: '#FFD700', cornerRadius: 35, visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Headline', x: 540, y: 340, text: 'YOUR\nMESSAGE', fontSize: 72, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Subtitle', x: 540, y: 540, text: 'Add your subtitle here', fontSize: 28, fontFamily: 'Arial', fill: '#ffffffcc', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'CTA Text', x: 540, y: 736, text: 'SHOP NOW', fontSize: 24, fontFamily: 'Arial', fill: '#333333', fontStyle: 'bold', align: 'center', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Gradient Background', x: 0, y: 0, width: 1080, height: 1920, fill: '#764ba2', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Top Glow', x: 200, y: -200, width: 680, height: 680, fill: '#ffffff15', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Bottom Glow', x: -100, y: 1400, width: 600, height: 600, fill: '#ffffff10', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Content Frame', x: 80, y: 400, width: 920, height: 1100, fill: '#ffffff12', cornerRadius: 32, visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Main Title', x: 540, y: 600, text: 'SWIPE UP', fontSize: 96, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Sub Heading', x: 540, y: 800, text: 'for more details', fontSize: 36, fontFamily: 'Arial', fill: '#ffffffcc', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Swipe Button', x: 340, y: 1300, width: 400, height: 80, fill: '#ffffff', cornerRadius: 40, visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Button Label', x: 540, y: 1318, text: 'Learn More', fontSize: 28, fontFamily: 'Arial', fill: '#764ba2', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Brand Tag', x: 540, y: 1650, text: '@yourbrand', fontSize: 22, fontFamily: 'Arial', fill: '#ffffff80', align: 'center', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Right Panel', x: 0, y: 0, width: 820, height: 312, fill: '#2b6cb0', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Accent Circle', x: 600, y: -80, width: 350, height: 350, fill: '#ffffff10', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Accent Bar', x: 60, y: 220, width: 120, height: 4, fill: '#63b3ed', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Company Name', x: 60, y: 80, text: 'YOUR COMPANY', fontSize: 52, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Tagline', x: 60, y: 160, text: 'Innovation meets excellence', fontSize: 24, fontFamily: 'Arial', fill: '#bee3f8', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Website', x: 60, y: 250, text: 'www.yourcompany.com', fontSize: 16, fontFamily: 'Arial', fill: '#63b3ed', align: 'left', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Right Half', x: 960, y: 0, width: 960, height: 1080, fill: '#2d3748', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Accent Line', x: 120, y: 280, width: 80, height: 6, fill: '#4299e1', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Slide Title', x: 120, y: 320, text: 'PRESENTATION\nTITLE', fontSize: 72, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Presenter', x: 120, y: 560, text: 'Presented by: Your Name', fontSize: 24, fontFamily: 'Arial', fill: '#a0aec0', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Date', x: 120, y: 620, text: 'Date: April 2026', fontSize: 20, fontFamily: 'Arial', fill: '#718096', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Decorative Circle', x: 1400, y: 240, width: 600, height: 600, fill: '#4299e118', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Small Circle', x: 1600, y: 600, width: 200, height: 200, fill: '#4299e110', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Background Overlay', x: 0, y: 0, width: 1280, height: 720, fill: '#dd6b20', visible: true, locked: false },
      { id: tid(), type: 'ellipse', name: 'Corner Glow', x: 900, y: -100, width: 500, height: 500, fill: '#ffffff15', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Overlay Strip', x: 0, y: 200, width: 1280, height: 320, fill: '#00000040', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Main Hook', x: 640, y: 260, text: 'WATCH THIS!', fontSize: 96, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Sub Text', x: 640, y: 420, text: 'You won\'t believe what happens next', fontSize: 32, fontFamily: 'Arial', fill: '#ffffffcc', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Badge', x: 40, y: 40, width: 180, height: 50, fill: '#ffffff', cornerRadius: 8, visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Badge Text', x: 130, y: 50, text: 'NEW VIDEO', fontSize: 18, fontFamily: 'Arial', fill: '#e53e3e', fontStyle: 'bold', align: 'center', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Header Band', x: 0, y: 0, width: 800, height: 320, fill: '#2f855a', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Poster Title', x: 400, y: 80, text: 'YOUR EVENT', fontSize: 64, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Event Date', x: 400, y: 190, text: 'April 20, 2026', fontSize: 28, fontFamily: 'Arial', fill: '#c6f6d5', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Section 1 Title', x: 60, y: 380, text: 'About This Event', fontSize: 28, fontFamily: 'Arial', fill: '#2f855a', fontStyle: 'bold', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Divider 1', x: 60, y: 420, width: 100, height: 3, fill: '#2f855a', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Section 1 Body', x: 60, y: 440, text: 'Add your event description here.\nDescribe what attendees can expect.', fontSize: 18, fontFamily: 'Arial', fill: '#4a5568', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Section 2 Title', x: 60, y: 600, text: 'Key Highlights', fontSize: 28, fontFamily: 'Arial', fill: '#2f855a', fontStyle: 'bold', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Divider 2', x: 60, y: 640, width: 100, height: 3, fill: '#2f855a', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Section 2 Body', x: 60, y: 660, text: 'Highlight 1: Keynote speakers\nHighlight 2: Live workshops\nHighlight 3: Networking', fontSize: 18, fontFamily: 'Arial', fill: '#4a5568', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Footer Band', x: 0, y: 1040, width: 800, height: 91, fill: '#276749', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Footer Text', x: 400, y: 1064, text: 'www.yourevent.com  |  Register Now', fontSize: 16, fontFamily: 'Arial', fill: '#c6f6d5', align: 'center', visible: true, locked: false },
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
      { id: tid(), type: 'rect', name: 'Left Panel', x: 0, y: 0, width: 380, height: 600, fill: '#2d3748', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Accent Strip', x: 375, y: 0, width: 10, height: 600, fill: '#4299e1', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Full Name', x: 190, y: 180, text: 'JOHN DOE', fontSize: 36, fontFamily: 'Arial', fill: '#ffffff', fontStyle: 'bold', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Job Title', x: 190, y: 250, text: 'Creative Director', fontSize: 18, fontFamily: 'Arial', fill: '#a0aec0', align: 'center', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Company', x: 600, y: 140, text: 'ACME Corp', fontSize: 28, fontFamily: 'Arial', fill: '#2d3748', fontStyle: 'bold', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'rect', name: 'Contact Divider', x: 440, y: 200, width: 60, height: 3, fill: '#4299e1', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Email', x: 440, y: 260, text: 'john@acmecorp.com', fontSize: 16, fontFamily: 'Arial', fill: '#4a5568', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Phone', x: 440, y: 310, text: '+1 (555) 123-4567', fontSize: 16, fontFamily: 'Arial', fill: '#4a5568', align: 'left', visible: true, locked: false },
      { id: tid(), type: 'text', name: 'Website', x: 440, y: 360, text: 'www.acmecorp.com', fontSize: 16, fontFamily: 'Arial', fill: '#4a5568', align: 'left', visible: true, locked: false },
    ],
  },
];