/**
 * Slide Templates
 * Pre-built slide layouts for quick content creation
 */

import type { SlideTemplate } from '../types/slides';

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  // ============================================================================
  // BASIC TEMPLATES
  // ============================================================================
  {
    id: 'title',
    type: 'title',
    name: 'Title Slide',
    description: 'Bold title with optional subtitle',
    category: 'basic',
    thumbnail: '/templates/thumbnails/title.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Presentation Title',
        position: { x: 5, y: 35, width: 90, height: 20 },
        style: {
          fontSize: '3.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        type: 'subheading',
        content: 'Subtitle or Author Name',
        position: { x: 10, y: 58, width: 80, height: 10 },
        style: {
          fontSize: '1.5rem',
          fontWeight: 'normal',
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
    ],
    defaultBackground: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
  },
  {
    id: 'title-subtitle',
    type: 'title-subtitle',
    name: 'Title + Description',
    description: 'Title with extended description text',
    category: 'basic',
    thumbnail: '/templates/thumbnails/title-subtitle.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Section Title',
        position: { x: 5, y: 25, width: 90, height: 15 },
        style: {
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        type: 'paragraph',
        content: 'Add a brief description or introduction to this section here. This text provides context for the content that follows.',
        position: { x: 15, y: 45, width: 70, height: 25 },
        style: {
          fontSize: '1.25rem',
          textAlign: 'center',
          color: '#cbd5e1',
        },
      },
    ],
  },
  {
    id: 'section-header',
    type: 'section-header',
    name: 'Section Header',
    description: 'Large section divider',
    category: 'basic',
    thumbnail: '/templates/thumbnails/section-header.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Section Title',
        position: { x: 10, y: 40, width: 80, height: 20 },
        style: {
          fontSize: '4rem',
          fontWeight: 'bold',
          textAlign: 'left',
        },
      },
      {
        type: 'divider',
        content: '',
        position: { x: 10, y: 65, width: 30, height: 1 },
        style: {
          backgroundColor: '#0ea5e9',
        },
      },
    ],
    defaultBackground: {
      type: 'solid',
      value: '#0f172a',
    },
  },

  // ============================================================================
  // CONTENT TEMPLATES
  // ============================================================================
  {
    id: 'content',
    type: 'content',
    name: 'Content Slide',
    description: 'Title with body text',
    category: 'content',
    thumbnail: '/templates/thumbnails/content.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Slide Title',
        position: { x: 5, y: 5, width: 90, height: 12 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'paragraph',
        content: 'Add your main content here. You can include detailed explanations, key points, or any relevant information for this slide.',
        position: { x: 5, y: 22, width: 90, height: 65 },
        style: {
          fontSize: '1.125rem',
          color: '#e2e8f0',
        },
      },
    ],
  },
  {
    id: 'bullet-points',
    type: 'bullet-points',
    name: 'Bullet Points',
    description: 'Title with bullet list',
    category: 'content',
    thumbnail: '/templates/thumbnails/bullet-points.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Key Points',
        position: { x: 5, y: 5, width: 90, height: 12 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'bullet-list',
        content: 'First key point or concept\nSecond important item\nThird supporting detail\nFourth point to consider\nFifth concluding item',
        position: { x: 5, y: 22, width: 90, height: 65 },
        style: {
          fontSize: '1.25rem',
        },
      },
    ],
  },
  {
    id: 'two-column',
    type: 'two-column',
    name: 'Two Columns',
    description: 'Side-by-side comparison',
    category: 'content',
    thumbnail: '/templates/thumbnails/two-column.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Comparison',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'subheading',
        content: 'Left Column Title',
        position: { x: 5, y: 18, width: 42, height: 8 },
        style: {
          fontSize: '1.25rem',
          fontWeight: 'semibold',
          color: '#0ea5e9',
        },
      },
      {
        type: 'paragraph',
        content: 'Content for the left column goes here. Use this for comparisons, pros/cons, or contrasting information.',
        position: { x: 5, y: 28, width: 42, height: 60 },
        style: {
          fontSize: '1rem',
        },
      },
      {
        type: 'subheading',
        content: 'Right Column Title',
        position: { x: 53, y: 18, width: 42, height: 8 },
        style: {
          fontSize: '1.25rem',
          fontWeight: 'semibold',
          color: '#22d3ee',
        },
      },
      {
        type: 'paragraph',
        content: 'Content for the right column goes here. Balance this with the left column for effective comparison.',
        position: { x: 53, y: 28, width: 42, height: 60 },
        style: {
          fontSize: '1rem',
        },
      },
    ],
  },
  {
    id: 'comparison',
    type: 'comparison',
    name: 'Comparison Table',
    description: 'Feature comparison layout',
    category: 'content',
    thumbnail: '/templates/thumbnails/comparison.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Feature Comparison',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'table',
        content: JSON.stringify({
          headers: ['Feature', 'Option A', 'Option B'],
          rows: [
            ['Feature 1', '✓', '✓'],
            ['Feature 2', '✓', '✗'],
            ['Feature 3', '✗', '✓'],
          ],
        }),
        position: { x: 5, y: 20, width: 90, height: 65 },
      },
    ],
  },

  // ============================================================================
  // MEDIA TEMPLATES
  // ============================================================================
  {
    id: 'image-left',
    type: 'image-left',
    name: 'Image Left',
    description: 'Image on left with text on right',
    category: 'media',
    thumbnail: '/templates/thumbnails/image-left.svg',
    defaultElements: [
      {
        type: 'image',
        content: '/placeholder-image.svg',
        position: { x: 5, y: 10, width: 40, height: 75 },
      },
      {
        type: 'heading',
        content: 'Title Goes Here',
        position: { x: 50, y: 10, width: 45, height: 12 },
        style: {
          fontSize: '1.75rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'paragraph',
        content: 'Description text accompanies the image. Use this layout when the visual is equally important as the text content.',
        position: { x: 50, y: 26, width: 45, height: 60 },
        style: {
          fontSize: '1.125rem',
        },
      },
    ],
  },
  {
    id: 'image-right',
    type: 'image-right',
    name: 'Image Right',
    description: 'Text on left with image on right',
    category: 'media',
    thumbnail: '/templates/thumbnails/image-right.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Title Goes Here',
        position: { x: 5, y: 10, width: 45, height: 12 },
        style: {
          fontSize: '1.75rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'paragraph',
        content: 'Description text accompanies the image. Use this layout when the visual is equally important as the text content.',
        position: { x: 5, y: 26, width: 45, height: 60 },
        style: {
          fontSize: '1.125rem',
        },
      },
      {
        type: 'image',
        content: '/placeholder-image.svg',
        position: { x: 55, y: 10, width: 40, height: 75 },
      },
    ],
  },
  {
    id: 'image-full',
    type: 'image-full',
    name: 'Full Image',
    description: 'Full-bleed image with overlay text',
    category: 'media',
    thumbnail: '/templates/thumbnails/image-full.svg',
    defaultElements: [
      {
        type: 'image',
        content: '/placeholder-image.svg',
        position: { x: 0, y: 0, width: 100, height: 100 },
      },
      {
        type: 'heading',
        content: 'Overlay Title',
        position: { x: 5, y: 70, width: 90, height: 15 },
        style: {
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '1rem',
          borderRadius: '0.5rem',
        },
      },
    ],
    defaultBackground: {
      type: 'solid',
      value: '#000000',
    },
  },
  {
    id: 'quote',
    type: 'quote',
    name: 'Quote',
    description: 'Highlighted quotation',
    category: 'media',
    thumbnail: '/templates/thumbnails/quote.svg',
    defaultElements: [
      {
        type: 'quote',
        content: '"Add an impactful quote or statement here that resonates with your audience."',
        position: { x: 10, y: 25, width: 80, height: 35 },
        style: {
          fontSize: '1.75rem',
          fontWeight: 'medium',
          textAlign: 'center',
          fontFamily: 'Georgia, serif',
        },
      },
      {
        type: 'paragraph',
        content: '— Attribution Name',
        position: { x: 10, y: 65, width: 80, height: 10 },
        style: {
          fontSize: '1.125rem',
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
    ],
    defaultBackground: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    },
  },
  {
    id: 'stats',
    type: 'stats',
    name: 'Statistics',
    description: 'Key numbers and metrics',
    category: 'media',
    thumbnail: '/templates/thumbnails/stats.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Key Metrics',
        position: { x: 5, y: 5, width: 90, height: 12 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        type: 'heading',
        content: '95%',
        position: { x: 5, y: 30, width: 28, height: 20 },
        style: {
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#22d3ee',
        },
      },
      {
        type: 'paragraph',
        content: 'Success Rate',
        position: { x: 5, y: 52, width: 28, height: 8 },
        style: {
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
      {
        type: 'heading',
        content: '500+',
        position: { x: 36, y: 30, width: 28, height: 20 },
        style: {
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#22d3ee',
        },
      },
      {
        type: 'paragraph',
        content: 'Cases Reviewed',
        position: { x: 36, y: 52, width: 28, height: 8 },
        style: {
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
      {
        type: 'heading',
        content: '24/7',
        position: { x: 67, y: 30, width: 28, height: 20 },
        style: {
          fontSize: '3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#22d3ee',
        },
      },
      {
        type: 'paragraph',
        content: 'Availability',
        position: { x: 67, y: 52, width: 28, height: 8 },
        style: {
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
    ],
  },

  // ============================================================================
  // MEDICAL TEMPLATES
  // ============================================================================
  {
    id: 'case-presentation',
    type: 'case-presentation',
    name: 'Case Presentation',
    description: 'Patient case overview',
    category: 'medical',
    thumbnail: '/templates/thumbnails/case-presentation.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Case Presentation',
        position: { x: 5, y: 3, width: 60, height: 10 },
        style: {
          fontSize: '1.75rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'subheading',
        content: '👤 Patient Demographics',
        position: { x: 5, y: 15, width: 90, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#0ea5e9',
        },
      },
      {
        type: 'paragraph',
        content: 'XX y/o M/F presenting with...',
        position: { x: 5, y: 22, width: 90, height: 10 },
        style: {
          fontSize: '0.95rem',
        },
      },
      {
        type: 'subheading',
        content: '📋 Chief Complaint',
        position: { x: 5, y: 35, width: 90, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#22c55e',
        },
      },
      {
        type: 'paragraph',
        content: 'Primary symptom and duration',
        position: { x: 5, y: 42, width: 90, height: 10 },
        style: {
          fontSize: '0.95rem',
        },
      },
      {
        type: 'subheading',
        content: '📜 History of Present Illness',
        position: { x: 5, y: 55, width: 90, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#f59e0b',
        },
      },
      {
        type: 'paragraph',
        content: 'Onset, duration, character, associated symptoms...',
        position: { x: 5, y: 62, width: 90, height: 25 },
        style: {
          fontSize: '0.95rem',
        },
      },
    ],
  },
  {
    id: 'differential-diagnosis',
    type: 'differential-diagnosis',
    name: 'Differential Diagnosis',
    description: 'Differential diagnosis list',
    category: 'medical',
    thumbnail: '/templates/thumbnails/differential-dx.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Differential Diagnosis',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'subheading',
        content: '⚠️ Must Not Miss',
        position: { x: 5, y: 18, width: 45, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#ef4444',
        },
      },
      {
        type: 'bullet-list',
        content: 'Critical diagnosis 1\nCritical diagnosis 2\nCritical diagnosis 3',
        position: { x: 5, y: 26, width: 42, height: 30 },
        style: {
          fontSize: '0.95rem',
        },
      },
      {
        type: 'subheading',
        content: '✓ Most Likely',
        position: { x: 53, y: 18, width: 42, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#22c55e',
        },
      },
      {
        type: 'bullet-list',
        content: 'Common diagnosis 1\nCommon diagnosis 2\nCommon diagnosis 3',
        position: { x: 53, y: 26, width: 42, height: 30 },
        style: {
          fontSize: '0.95rem',
        },
      },
      {
        type: 'subheading',
        content: '? Other Considerations',
        position: { x: 5, y: 60, width: 90, height: 6 },
        style: {
          fontSize: '1rem',
          fontWeight: 'semibold',
          color: '#f59e0b',
        },
      },
      {
        type: 'paragraph',
        content: 'Less likely but possible diagnoses to consider...',
        position: { x: 5, y: 68, width: 90, height: 20 },
        style: {
          fontSize: '0.95rem',
        },
      },
    ],
  },
  {
    id: 'treatment-algorithm',
    type: 'treatment-algorithm',
    name: 'Treatment Algorithm',
    description: 'Step-by-step treatment flow',
    category: 'medical',
    thumbnail: '/templates/thumbnails/treatment-algo.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Treatment Algorithm',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'diagram',
        content: JSON.stringify({
          type: 'flowchart',
          nodes: [
            { id: '1', label: 'Initial Assessment', type: 'start' },
            { id: '2', label: 'Stabilize Patient', type: 'action' },
            { id: '3', label: 'Responsive?', type: 'decision' },
            { id: '4', label: 'Continue Protocol', type: 'action' },
            { id: '5', label: 'Escalate Care', type: 'action' },
          ],
          edges: [
            { from: '1', to: '2' },
            { from: '2', to: '3' },
            { from: '3', to: '4', label: 'Yes' },
            { from: '3', to: '5', label: 'No' },
          ],
        }),
        position: { x: 10, y: 18, width: 80, height: 70 },
      },
    ],
  },
  {
    id: 'lab-results',
    type: 'lab-results',
    name: 'Lab Results',
    description: 'Laboratory values display',
    category: 'medical',
    thumbnail: '/templates/thumbnails/lab-results.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Laboratory Results',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'table',
        content: JSON.stringify({
          headers: ['Test', 'Result', 'Reference', 'Status'],
          rows: [
            ['WBC', '12.5', '4.5-11.0', '⬆️'],
            ['Hgb', '13.2', '12-16', '✓'],
            ['Plt', '250', '150-400', '✓'],
            ['Na', '138', '136-145', '✓'],
            ['K', '4.2', '3.5-5.0', '✓'],
            ['Cr', '1.1', '0.7-1.3', '✓'],
          ],
        }),
        position: { x: 5, y: 18, width: 90, height: 70 },
      },
    ],
  },
  {
    id: 'anatomy-diagram',
    type: 'anatomy-diagram',
    name: 'Anatomy Diagram',
    description: 'Anatomical illustration with labels',
    category: 'medical',
    thumbnail: '/templates/thumbnails/anatomy.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Anatomical Overview',
        position: { x: 5, y: 5, width: 90, height: 10 },
        style: {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
      },
      {
        type: 'image',
        content: '/anatomy-placeholder.svg',
        position: { x: 20, y: 18, width: 60, height: 70 },
      },
    ],
  },

  // ============================================================================
  // CONCLUSION TEMPLATES
  // ============================================================================
  {
    id: 'thank-you',
    type: 'thank-you',
    name: 'Thank You',
    description: 'Closing slide',
    category: 'conclusion',
    thumbnail: '/templates/thumbnails/thank-you.svg',
    defaultElements: [
      {
        type: 'heading',
        content: 'Thank You',
        position: { x: 5, y: 35, width: 90, height: 20 },
        style: {
          fontSize: '4rem',
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        type: 'paragraph',
        content: 'Questions?',
        position: { x: 10, y: 60, width: 80, height: 10 },
        style: {
          fontSize: '1.5rem',
          textAlign: 'center',
          color: '#94a3b8',
        },
      },
    ],
    defaultBackground: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    },
  },
];

// Category metadata for filtering
export const TEMPLATE_CATEGORIES = [
  { id: 'basic', name: 'Basic', icon: '📄', description: 'Simple layouts' },
  { id: 'content', name: 'Content', icon: '📝', description: 'Text-focused slides' },
  { id: 'media', name: 'Media', icon: '🖼️', description: 'Image and visual slides' },
  { id: 'medical', name: 'Medical', icon: '🏥', description: 'Healthcare templates' },
  { id: 'conclusion', name: 'Conclusion', icon: '✅', description: 'Closing slides' },
];

export default SLIDE_TEMPLATES;
