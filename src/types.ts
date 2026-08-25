export type AreaType = 'career' | 'computer' | 'ai_tech' | 'personal';
export type ResourceType = 'website' | 'video' | 'article' | 'book' | 'tool' | 'photo' | 'idea' | 'doc';

export interface Subtopic {
  id: string;
  area: AreaType;
  name: string;
  created_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  url?: string;
  file_path?: string; // Will store base64 string or Object URL for mocked local photo upload
  area: AreaType;     // Broad category segment: career, computer, ai_tech, personal
  topic: string;      // Derived subtopic name: e.g. React, Resume, Startups, Travel, Fashion
  subtopic_id?: string; // Relational foreign key referencing subtopics.id
  type: ResourceType; // Media format
  tags: string[];
  notes?: string;
  description?: string;
  created_at: string;
  ai_confidence?: 'high' | 'medium' | 'low';
}
