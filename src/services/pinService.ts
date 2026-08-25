import { supabase } from '../supabaseClient';

/**
 * Fetches all pinned resource IDs for the Home page.
 */
export async function fetchHomePinsFromDb(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('home_pins')
    .select('resource_id')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((row: any) => row.resource_id);
}

/**
 * Fetches all subtopic pins, mapping subtopics to their pinned resource IDs.
 */
export async function fetchSubtopicPinsFromDb(): Promise<Record<string, string[]>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('subtopic_pins')
    .select('resource_id, subtopic_id, subtopics (id, name)')
    .order('created_at', { ascending: true });

  if (error) {
    // Fallback if schema still relies on legacy subtopic text column
    const fallback = await supabase
      .from('subtopic_pins')
      .select('resource_id, subtopic')
      .order('created_at', { ascending: true });

    if (fallback.error) throw fallback.error;

    const mapping: Record<string, string[]> = {};
    (fallback.data || []).forEach((row: any) => {
      if (row.subtopic) {
        if (!mapping[row.subtopic]) mapping[row.subtopic] = [];
        mapping[row.subtopic].push(row.resource_id);
      }
    });
    return mapping;
  }

  const mapping: Record<string, string[]> = {};
  (data || []).forEach((row: any) => {
    const subtopicObj = row.subtopics as any;
    const topicName = subtopicObj?.name || row.subtopic;
    if (topicName) {
      if (!mapping[topicName]) {
        mapping[topicName] = [];
      }
      mapping[topicName].push(row.resource_id);
    }
  });
  return mapping;
}

/**
 * Pins or unpins a resource to the Home page in the database.
 */
export async function saveHomePinInDb(resourceId: string, pinStatus: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  if (pinStatus) {
    // Insert pin
    const { error } = await supabase
      .from('home_pins')
      .insert([{ resource_id: resourceId }]);
    
    if (error) throw error;
  } else {
    // Remove pin
    const { error } = await supabase
      .from('home_pins')
      .delete()
      .eq('resource_id', resourceId);

    if (error) throw error;
  }
}

/**
 * Pins or unpins a resource to a specific subtopic in the database.
 */
export async function saveSubtopicPinInDb(resourceId: string, subtopic: string, pinStatus: boolean, subtopicId?: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  if (pinStatus) {
    const payload: Record<string, any> = { resource_id: resourceId };
    if (subtopicId) {
      payload.subtopic_id = subtopicId;
    }
    payload.subtopic = subtopic;

    let { error } = await supabase
      .from('subtopic_pins')
      .insert([payload]);

    if (error && error.message?.includes('subtopic')) {
      delete payload.subtopic;
      const retry = await supabase.from('subtopic_pins').insert([payload]);
      if (retry.error) throw retry.error;
    } else if (error) {
      throw error;
    }
  } else {
    let query = supabase
      .from('subtopic_pins')
      .delete()
      .eq('resource_id', resourceId);

    if (subtopicId) {
      query = query.eq('subtopic_id', subtopicId);
    } else {
      query = query.eq('subtopic', subtopic);
    }

    const { error } = await query;
    if (error && error.message?.includes('subtopic') && subtopicId) {
      const retry = await supabase
        .from('subtopic_pins')
        .delete()
        .eq('resource_id', resourceId)
        .eq('subtopic_id', subtopicId);
      if (retry.error) throw retry.error;
    } else if (error) {
      throw error;
    }
  }
}

