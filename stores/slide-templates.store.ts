/**
 * Slide Templates Store
 * Manages built-in and user-created slide templates with categories
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SlideTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  html: string;
  thumbnail?: string;
  isBuiltIn: boolean;
  createdAt: number;
  tags: string[];
}

export type TemplateCategory =
  | 'title'
  | 'content'
  | 'quiz'
  | 'case-study'
  | 'diagram'
  | 'comparison'
  | 'timeline'
  | 'list'
  | 'image'
  | 'custom';

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'title': 'Title Slides',
  'content': 'Content',
  'quiz': 'Quizzes',
  'case-study': 'Case Studies',
  'diagram': 'Diagrams',
  'comparison': 'Comparisons',
  'timeline': 'Timelines',
  'list': 'Lists',
  'image': 'Image Slides',
  'custom': 'My Templates'
};

interface SlideTemplatesState {
  templates: SlideTemplate[];
  addTemplate: (template: Omit<SlideTemplate, 'id' | 'createdAt' | 'isBuiltIn'>) => void;
  removeTemplate: (id: string) => void;
  getTemplatesByCategory: (category: TemplateCategory) => SlideTemplate[];
  getAllCategories: () => TemplateCategory[];
  searchTemplates: (query: string) => SlideTemplate[];
}

// Built-in templates
const BUILT_IN_TEMPLATES: SlideTemplate[] = [
  // Title Slides
  {
    id: 'builtin-title-1',
    name: 'Simple Title',
    category: 'title',
    description: 'Clean title slide with subtitle',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['title', 'intro', 'simple'],
    html: `<section class="slide-section" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h1 style="font-size: 4rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1rem;">Your Title Here</h1>
  <p style="font-size: 1.5rem; color: #94a3b8; max-width: 600px;">Add your subtitle or description</p>
</section>`
  },
  {
    id: 'builtin-title-2',
    name: 'Title with Gradient',
    category: 'title',
    description: 'Bold title with gradient text effect',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['title', 'gradient', 'bold'],
    html: `<section class="slide-section" style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; background: #0f172a;">
  <h1 style="font-size: 5rem; font-weight: 800; background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.5rem;">Gradient Title</h1>
  <p style="font-size: 1.25rem; color: #64748b; max-width: 500px;">Engaging subtitle for your presentation</p>
  <div style="margin-top: 3rem; display: flex; gap: 1rem;">
    <span style="background: rgba(34,211,238,0.2); color: #22d3ee; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem;">Tag One</span>
    <span style="background: rgba(168,85,247,0.2); color: #a855f7; padding: 0.5rem 1rem; border-radius: 9999px; font-size: 0.875rem;">Tag Two</span>
  </div>
</section>`
  },

  // Content Slides
  {
    id: 'builtin-content-1',
    name: 'Two Column',
    category: 'content',
    description: 'Split content into two columns',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['columns', 'layout', 'split'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2.5rem; font-weight: 700; color: #f1f5f9; margin-bottom: 2rem;">Two Column Layout</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
    <div>
      <h3 style="color: #22d3ee; font-size: 1.25rem; margin-bottom: 1rem;">Left Column</h3>
      <p style="color: #cbd5e1; line-height: 1.75;">Add your content here. This column is great for explanatory text or key points.</p>
    </div>
    <div>
      <h3 style="color: #a855f7; font-size: 1.25rem; margin-bottom: 1rem;">Right Column</h3>
      <p style="color: #cbd5e1; line-height: 1.75;">Add complementary content, examples, or supporting information here.</p>
    </div>
  </div>
</section>`
  },
  {
    id: 'builtin-content-2',
    name: 'Key Points',
    category: 'content',
    description: 'Highlight 3 key points with icons',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['points', 'icons', 'features'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2.5rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 3rem;">Key Points</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; max-width: 1000px; margin: 0 auto;">
    <div style="background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3); border-radius: 1rem; padding: 2rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: rgba(34,211,238,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem;">1</div>
      <h3 style="color: #22d3ee; font-size: 1.125rem; margin-bottom: 0.5rem;">First Point</h3>
      <p style="color: #94a3b8; font-size: 0.875rem;">Description of the first key point</p>
    </div>
    <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 1rem; padding: 2rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: rgba(168,85,247,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem;">2</div>
      <h3 style="color: #a855f7; font-size: 1.125rem; margin-bottom: 0.5rem;">Second Point</h3>
      <p style="color: #94a3b8; font-size: 0.875rem;">Description of the second key point</p>
    </div>
    <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 1rem; padding: 2rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: rgba(34,197,94,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem;">3</div>
      <h3 style="color: #22c55e; font-size: 1.125rem; margin-bottom: 0.5rem;">Third Point</h3>
      <p style="color: #94a3b8; font-size: 0.875rem;">Description of the third key point</p>
    </div>
  </div>
</section>`
  },

  // Quiz Templates
  {
    id: 'builtin-quiz-1',
    name: 'Multiple Choice',
    category: 'quiz',
    description: 'Interactive multiple choice question',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['quiz', 'mcq', 'interactive'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div style="max-width: 800px; margin: 0 auto;">
    <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 0.5rem; padding: 0.5rem 1rem; display: inline-block; margin-bottom: 1rem;">
      <span style="color: #a855f7; font-size: 0.875rem; font-weight: 600;">QUIZ</span>
    </div>
    <h2 style="font-size: 2rem; font-weight: 700; color: #f1f5f9; margin-bottom: 2rem;">What is the correct answer?</h2>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <button class="quiz-option" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 1.25rem; text-align: left; color: #e2e8f0; font-size: 1.125rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#22d3ee'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
        <span style="color: #64748b; margin-right: 1rem;">A.</span> First option
      </button>
      <button class="quiz-option" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 1.25rem; text-align: left; color: #e2e8f0; font-size: 1.125rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#22d3ee'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
        <span style="color: #64748b; margin-right: 1rem;">B.</span> Second option
      </button>
      <button class="quiz-option" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 1.25rem; text-align: left; color: #e2e8f0; font-size: 1.125rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#22d3ee'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
        <span style="color: #64748b; margin-right: 1rem;">C.</span> Third option
      </button>
      <button class="quiz-option" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; padding: 1.25rem; text-align: left; color: #e2e8f0; font-size: 1.125rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#22d3ee'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
        <span style="color: #64748b; margin-right: 1rem;">D.</span> Fourth option
      </button>
    </div>
  </div>
</section>`
  },
  {
    id: 'builtin-quiz-2',
    name: 'True/False',
    category: 'quiz',
    description: 'Simple true or false question',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['quiz', 'true-false', 'simple'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div style="max-width: 700px; text-align: center;">
    <div style="background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3); border-radius: 0.5rem; padding: 0.5rem 1rem; display: inline-block; margin-bottom: 1.5rem;">
      <span style="color: #22d3ee; font-size: 0.875rem; font-weight: 600;">TRUE OR FALSE</span>
    </div>
    <h2 style="font-size: 2rem; font-weight: 700; color: #f1f5f9; margin-bottom: 3rem;">Statement to evaluate goes here?</h2>
    <div style="display: flex; gap: 2rem; justify-content: center;">
      <button style="background: rgba(34,197,94,0.1); border: 2px solid rgba(34,197,94,0.5); border-radius: 1rem; padding: 1.5rem 4rem; color: #22c55e; font-size: 1.5rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(34,197,94,0.2)'" onmouseout="this.style.background='rgba(34,197,94,0.1)'">TRUE</button>
      <button style="background: rgba(239,68,68,0.1); border: 2px solid rgba(239,68,68,0.5); border-radius: 1rem; padding: 1.5rem 4rem; color: #ef4444; font-size: 1.5rem; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">FALSE</button>
    </div>
  </div>
</section>`
  },

  // Case Study
  {
    id: 'builtin-case-1',
    name: 'Patient Case',
    category: 'case-study',
    description: 'Medical case study presentation',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['case', 'medical', 'patient'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div style="max-width: 900px; margin: 0 auto;">
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
      <div style="background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); border-radius: 0.5rem; padding: 0.5rem 1rem;">
        <span style="color: #ef4444; font-size: 0.875rem; font-weight: 600;">CASE STUDY</span>
      </div>
      <span style="color: #64748b;">Patient ID: 001</span>
    </div>
    <h2 style="font-size: 2rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1.5rem;">Case Title</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <div style="background: rgba(255,255,255,0.05); border-radius: 1rem; padding: 1.5rem;">
        <h3 style="color: #22d3ee; font-size: 1rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Presentation</h3>
        <ul style="color: #cbd5e1; list-style: none; padding: 0;">
          <li style="margin-bottom: 0.5rem;">• Chief complaint</li>
          <li style="margin-bottom: 0.5rem;">• History of present illness</li>
          <li style="margin-bottom: 0.5rem;">• Physical examination findings</li>
        </ul>
      </div>
      <div style="background: rgba(255,255,255,0.05); border-radius: 1rem; padding: 1.5rem;">
        <h3 style="color: #a855f7; font-size: 1rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Key Findings</h3>
        <ul style="color: #cbd5e1; list-style: none; padding: 0;">
          <li style="margin-bottom: 0.5rem;">• Lab result 1</li>
          <li style="margin-bottom: 0.5rem;">• Lab result 2</li>
          <li style="margin-bottom: 0.5rem;">• Imaging findings</li>
        </ul>
      </div>
    </div>
    <div style="margin-top: 2rem; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 1rem; padding: 1.5rem;">
      <h3 style="color: #22c55e; font-size: 1rem; margin-bottom: 0.5rem;">Clinical Question</h3>
      <p style="color: #e2e8f0; font-size: 1.125rem;">What is the most likely diagnosis?</p>
    </div>
  </div>
</section>`
  },

  // Comparison
  {
    id: 'builtin-comparison-1',
    name: 'Side by Side',
    category: 'comparison',
    description: 'Compare two options side by side',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['compare', 'versus', 'options'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2.5rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 3rem;">Option A vs Option B</h2>
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: start; max-width: 1000px; margin: 0 auto;">
    <div style="background: rgba(34,211,238,0.1); border: 2px solid rgba(34,211,238,0.3); border-radius: 1rem; padding: 2rem;">
      <h3 style="color: #22d3ee; font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center;">Option A</h3>
      <ul style="color: #cbd5e1; list-style: none; padding: 0;">
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #22c55e;">✓</span> Pro point 1</li>
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #22c55e;">✓</span> Pro point 2</li>
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #ef4444;">✗</span> Con point 1</li>
      </ul>
    </div>
    <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
      <span style="color: #64748b; font-size: 2rem; font-weight: 700;">VS</span>
    </div>
    <div style="background: rgba(168,85,247,0.1); border: 2px solid rgba(168,85,247,0.3); border-radius: 1rem; padding: 2rem;">
      <h3 style="color: #a855f7; font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center;">Option B</h3>
      <ul style="color: #cbd5e1; list-style: none; padding: 0;">
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #22c55e;">✓</span> Pro point 1</li>
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #ef4444;">✗</span> Con point 1</li>
        <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"><span style="color: #ef4444;">✗</span> Con point 2</li>
      </ul>
    </div>
  </div>
</section>`
  },

  // Timeline
  {
    id: 'builtin-timeline-1',
    name: 'Horizontal Timeline',
    category: 'timeline',
    description: 'Show progression over time',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['timeline', 'progression', 'steps'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2.5rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 4rem;">Timeline</h2>
  <div style="position: relative; max-width: 900px; margin: 0 auto;">
    <div style="position: absolute; top: 30px; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #22d3ee, #a855f7, #22c55e);"></div>
    <div style="display: flex; justify-content: space-between; position: relative;">
      <div style="text-align: center; flex: 1;">
        <div style="width: 60px; height: 60px; background: #22d3ee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-weight: 700; color: #0f172a;">1</div>
        <h3 style="color: #22d3ee; font-size: 1rem; margin-bottom: 0.5rem;">Step One</h3>
        <p style="color: #94a3b8; font-size: 0.875rem;">Description</p>
      </div>
      <div style="text-align: center; flex: 1;">
        <div style="width: 60px; height: 60px; background: #a855f7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-weight: 700; color: #0f172a;">2</div>
        <h3 style="color: #a855f7; font-size: 1rem; margin-bottom: 0.5rem;">Step Two</h3>
        <p style="color: #94a3b8; font-size: 0.875rem;">Description</p>
      </div>
      <div style="text-align: center; flex: 1;">
        <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-weight: 700; color: #0f172a;">3</div>
        <h3 style="color: #22c55e; font-size: 1rem; margin-bottom: 0.5rem;">Step Three</h3>
        <p style="color: #94a3b8; font-size: 0.875rem;">Description</p>
      </div>
    </div>
  </div>
</section>`
  },

  // List
  {
    id: 'builtin-list-1',
    name: 'Bullet List',
    category: 'list',
    description: 'Simple bullet point list',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['list', 'bullets', 'points'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2.5rem; font-weight: 700; color: #f1f5f9; margin-bottom: 2rem;">Key Points</h2>
  <ul style="list-style: none; padding: 0; max-width: 700px;">
    <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;">
      <span style="width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></span>
      <p style="color: #e2e8f0; font-size: 1.25rem; line-height: 1.6;">First important point with supporting details and explanation</p>
    </li>
    <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;">
      <span style="width: 8px; height: 8px; background: #a855f7; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></span>
      <p style="color: #e2e8f0; font-size: 1.25rem; line-height: 1.6;">Second point that builds on the previous idea</p>
    </li>
    <li style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem;">
      <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-top: 0.5rem; flex-shrink: 0;"></span>
      <p style="color: #e2e8f0; font-size: 1.25rem; line-height: 1.6;">Third point with conclusion or call to action</p>
    </li>
  </ul>
</section>`
  },

  // Image
  {
    id: 'builtin-image-1',
    name: 'Image with Caption',
    category: 'image',
    description: 'Full-width image with caption',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['image', 'caption', 'visual'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div style="max-width: 800px; text-align: center;">
    <div style="background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 1rem; padding: 4rem 2rem; margin-bottom: 1.5rem;">
      <p style="color: #64748b; font-size: 1.125rem;">Drop image here or paste image URL</p>
      <p style="color: #475569; font-size: 0.875rem; margin-top: 0.5rem;">Recommended: 1920x1080 or 16:9 aspect ratio</p>
    </div>
    <h3 style="color: #f1f5f9; font-size: 1.5rem; margin-bottom: 0.5rem;">Image Title</h3>
    <p style="color: #94a3b8; font-size: 1rem;">Caption describing the image content</p>
  </div>
</section>`
  },

  // Diagram
  {
    id: 'builtin-diagram-1',
    name: 'Flow Chart',
    category: 'diagram',
    description: 'Simple decision flow chart',
    isBuiltIn: true,
    createdAt: 0,
    tags: ['diagram', 'flow', 'decision'],
    html: `<section class="slide-section" style="min-height: 100vh; padding: 4rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <h2 style="font-size: 2rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 3rem;">Decision Flow</h2>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
    <div style="background: #22d3ee; color: #0f172a; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600;">Start</div>
    <div style="width: 2px; height: 30px; background: #475569;"></div>
    <div style="background: rgba(168,85,247,0.2); border: 2px solid #a855f7; color: #e2e8f0; padding: 1rem 2rem; border-radius: 0.5rem; transform: rotate(45deg); width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <span style="transform: rotate(-45deg);">Decision?</span>
    </div>
    <div style="display: flex; gap: 4rem; margin-top: -0.5rem;">
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="color: #22c55e; margin-bottom: 0.5rem;">Yes</span>
        <div style="width: 2px; height: 30px; background: #475569;"></div>
        <div style="background: rgba(34,197,94,0.2); border: 1px solid #22c55e; color: #e2e8f0; padding: 1rem 2rem; border-radius: 0.5rem;">Action A</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="color: #ef4444; margin-bottom: 0.5rem;">No</span>
        <div style="width: 2px; height: 30px; background: #475569;"></div>
        <div style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #e2e8f0; padding: 1rem 2rem; border-radius: 0.5rem;">Action B</div>
      </div>
    </div>
  </div>
</section>`
  }
];

export const useSlideTemplatesStore = create<SlideTemplatesState>()(
  persist(
    (set, get) => ({
      templates: [...BUILT_IN_TEMPLATES],

      addTemplate: (template) => {
        const newTemplate: SlideTemplate = {
          ...template,
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          isBuiltIn: false
        };
        set((state) => ({
          templates: [...state.templates, newTemplate]
        }));
      },

      removeTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(t => t.id !== id || t.isBuiltIn)
        }));
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter(t => t.category === category);
      },

      getAllCategories: () => {
        const categories = new Set(get().templates.map(t => t.category));
        return Array.from(categories);
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().templates.filter(t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }
    }),
    {
      name: 'presentgenius-slide-templates',
      partialize: (state) => ({
        // Only persist user-created templates
        templates: state.templates.filter(t => !t.isBuiltIn)
      }),
      merge: (persisted: any, current) => ({
        ...current,
        templates: [
          ...BUILT_IN_TEMPLATES,
          ...(persisted?.templates || [])
        ]
      })
    }
  )
);
