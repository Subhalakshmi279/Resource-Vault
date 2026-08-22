import type { Resource } from './types';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'mock-10',
    title: 'Claude Prompting Guide',
    url: 'https://docs.anthropic.com/en/docs/about-claude',
    area: 'ai_tech',
    topic: 'Claude',
    type: 'website',
    tags: ['claude', 'anthropic', 'prompting', 'ai'],
    notes: "Anthropic's official guide to prompting Claude models effectively.",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  },
  {
    id: 'mock-11',
    title: 'Claude API Documentation',
    url: 'https://docs.anthropic.com/en/api/getting-started',
    area: 'ai_tech',
    topic: 'Claude',
    type: 'doc',
    tags: ['claude', 'api', 'anthropic', 'ai'],
    notes: 'Anthropic Claude API reference and SDK quickstart guides.',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() // 1.5 hours ago
  },
  {
    id: 'mock-1',
    title: 'React 19 Official Documentation',
    url: 'https://react.dev',
    area: 'computer',
    topic: 'React',
    type: 'doc',
    tags: ['react', 'frontend', 'javascript'],
    notes: 'Reference guide for React 19 features including Actions, useActionState, useFormStatus, and Server Components.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id: 'mock-2',
    title: 'Advanced CSS Grid Layout & Subgrid Guide',
    url: 'https://css-tricks.com/layouts',
    area: 'computer',
    topic: 'CSS',
    type: 'article',
    tags: ['css', 'grid', 'responsive', 'layout'],
    notes: 'A masterclass explaining CSS grid template areas, subgrid, and modern aspect-ratio layouts.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  },
  {
    id: 'mock-3',
    title: 'Software Engineer ATS-Friendly Resume Template',
    url: 'https://career-blueprints.com/em-resume',
    area: 'career',
    topic: 'Resume',
    type: 'doc',
    tags: ['career', 'resume', 'interview-prep'],
    notes: 'Curated set of resume blueprints that successfully pass ATS screening at tier-1 tech firms.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id: 'mock-4',
    title: 'Data Structures and Algorithms Roadmap',
    url: 'https://roadmap.sh/computer-science',
    area: 'computer',
    topic: 'DSA',
    type: 'website',
    tags: ['dsa', 'algorithms', 'cs', 'interview-prep'],
    notes: 'Excellent computer science reference for studying big-O notation, trees, graphs, and dynamic programming.',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString() // 1.5 days ago
  },
  {
    id: 'mock-5',
    title: 'Quantize and Fine-Tune LLMs locally on consumer hardware',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    area: 'ai_tech',
    topic: 'LLM',
    type: 'video',
    tags: ['ai', 'llm', 'machine-learning', 'python'],
    notes: 'Video tutorial detailing how to quantize Llama 3 models and run parameter-efficient fine-tuning locally.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  },
  {
    id: 'mock-12',
    title: 'Facial Massage Routine',
    area: 'personal',
    topic: 'Beauty',
    type: 'idea',
    tags: ['beauty', 'skincare', 'wellness'],
    notes: 'Daily lymphatic drainage massage routine for stress relief and skin health.',
    created_at: new Date(Date.now() - 3600000 * 50).toISOString() // 2.1 days ago
  },
  {
    id: 'mock-6',
    title: 'Minimalist Ergonomic Workspace Setup',
    area: 'personal',
    topic: 'Home Setup',
    type: 'photo',
    file_path: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=60',
    tags: ['desksetup', 'minimalism', 'ergonomics', 'wfh'],
    notes: 'Inspiration visual for my desktop upgrade. Love the matte black desk mat and pegboard arrangement.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString() // 3 days ago
  },
  {
    id: 'mock-7',
    title: '10-Day Japan Travel Itinerary: Tokyo, Kyoto, Osaka',
    area: 'personal',
    topic: 'Travel',
    type: 'idea',
    tags: ['travel', 'japan', 'vacation', 'itinerary'],
    notes: 'Draft itinerary tracking rail pass paths, local hotels, and food spots for cherry blossom season.',
    created_at: new Date(Date.now() - 3600000 * 120).toISOString() // 5 days ago
  },
  {
    id: 'mock-8',
    title: 'Capsule Wardrobe checklist for minimalist fashion',
    url: 'https://minimal-wardrobe.io/guide',
    area: 'personal',
    topic: 'Fashion',
    type: 'article',
    tags: ['fashion', 'minimalism', 'capsule-wardrobe'],
    notes: 'Guide to scaling down clothing selections to 30 high-quality matching essential items.',
    created_at: new Date(Date.now() - 3600000 * 240).toISOString() // 10 days ago
  },
  {
    id: 'mock-9',
    title: 'HIIT Full Body Home Workout video',
    url: 'https://youtube.com/watch?v=mockhiit',
    area: 'personal',
    topic: 'Fitness',
    type: 'video',
    tags: ['fitness', 'workout', 'hiit', 'cardio'],
    notes: 'Quick 15-minute workout requiring no equipment. Ideal for early morning bodyweight conditioning.',
    created_at: new Date(Date.now() - 3600000 * 300).toISOString() // 12 days ago
  }
];
