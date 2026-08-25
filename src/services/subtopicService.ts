import { supabase } from '../supabaseClient';
import type { Subtopic, AreaType } from '../types';

function normalizeArea(rawArea: string): AreaType {
  const lowerArea = (rawArea || '').toLowerCase().trim();
  if (lowerArea === 'career' || lowerArea.includes('career')) return 'career';
  if (lowerArea === 'computer' || lowerArea.includes('comp')) return 'computer';
  if (lowerArea === 'ai_tech' || lowerArea.includes('ai') || lowerArea.includes('tech')) return 'ai_tech';
  if (lowerArea === 'personal' || lowerArea.includes('person')) return 'personal';
  return (rawArea as AreaType) || 'career';
}

/**
 * Fetches all subtopic rows from Supabase subtopics table.
 */
export async function fetchSubtopicsFromDb(): Promise<Subtopic[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subtopics')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching subtopics from DB:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    area: normalizeArea(row.area),
    name: row.name,
    created_at: row.created_at
  }));
}

/**
 * Creates a new subtopic in Supabase subtopics table.
 */
export async function createSubtopicInDb(area: AreaType, name: string): Promise<Subtopic> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const trimmedName = name.trim();
  const { data, error } = await supabase
    .from('subtopics')
    .insert([{
      area,
      name: trimmedName
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    area: data.area as AreaType,
    name: data.name,
    created_at: data.created_at
  };
}

/**
 * Renames a single subtopic in Supabase (Single-point update).
 */
export async function renameSubtopicInDb(subtopicId: string, newName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const trimmedName = newName.trim();
  const { error } = await supabase
    .from('subtopics')
    .update({ name: trimmedName })
    .eq('id', subtopicId);

  if (error) throw error;
}

/**
 * Deletes a subtopic from Supabase.
 */
export async function deleteSubtopicInDb(subtopicId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const { error } = await supabase
    .from('subtopics')
    .delete()
    .eq('id', subtopicId);

  if (error) throw error;
}
