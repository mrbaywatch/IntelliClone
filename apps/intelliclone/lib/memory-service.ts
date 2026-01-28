import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type MemoryCategory = 'personal' | 'work' | 'preferences' | 'goals' | 'context' | 'other';

export interface Memory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  created_at: string;
}

/**
 * Get all memories for a user
 */
export async function getUserMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabaseAdmin
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .order('category')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }

  return data || [];
}

/**
 * Get memories by category
 */
export async function getMemoriesByCategory(userId: string, category: MemoryCategory): Promise<Memory[]> {
  const { data, error } = await supabaseAdmin
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching memories by category:', error);
    return [];
  }

  return data || [];
}

/**
 * Save or update a memory
 */
export async function saveMemory(
  userId: string,
  key: string,
  value: string,
  category: MemoryCategory = 'other',
  confidence: number = 1.0,
  source: string = 'conversation'
): Promise<Memory | null> {
  const { data, error } = await supabaseAdmin
    .from('user_memories')
    .upsert(
      {
        user_id: userId,
        key,
        value,
        category,
        confidence,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving memory:', error);
    return null;
  }

  return data;
}

/**
 * Delete a memory
 */
export async function deleteMemory(userId: string, key: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('user_memories')
    .delete()
    .eq('user_id', userId)
    .eq('key', key);

  if (error) {
    console.error('Error deleting memory:', error);
    return false;
  }

  return true;
}

/**
 * Format memories for injection into system prompt
 */
export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'You have not learned anything about this user yet.';
  }

  const grouped: Record<string, Memory[]> = {};
  for (const memory of memories) {
    if (!grouped[memory.category]) {
      grouped[memory.category] = [];
    }
    grouped[memory.category].push(memory);
  }

  const sections: string[] = [];

  const categoryLabels: Record<string, string> = {
    personal: 'Personal Info',
    work: 'Work & Career',
    preferences: 'Preferences',
    goals: 'Goals & Aspirations',
    context: 'Current Context',
    other: 'Other Facts',
  };

  for (const [category, mems] of Object.entries(grouped)) {
    const label = categoryLabels[category] || category;
    const facts = mems.map(m => `- ${m.key}: ${m.value}`).join('\n');
    sections.push(`**${label}:**\n${facts}`);
  }

  return sections.join('\n\n');
}

/**
 * Extract memories from a conversation using AI
 */
export async function extractMemoriesFromConversation(
  userMessage: string,
  assistantResponse: string,
  existingMemories: Memory[]
): Promise<Array<{ key: string; value: string; category: MemoryCategory }>> {
  const existingFacts = existingMemories.map(m => `${m.key}: ${m.value}`).join('\n');

  const extractionPrompt = `Analyze this conversation and extract any NEW facts about the user that should be remembered.

EXISTING FACTS (don't repeat these):
${existingFacts || 'None yet'}

CONVERSATION:
User: ${userMessage}
Assistant: ${assistantResponse}

Extract NEW facts in JSON format. Only include facts explicitly stated or strongly implied by the user.
Categories: personal, work, preferences, goals, context, other

Respond with ONLY valid JSON array, or empty array [] if no new facts:
[{"key": "name", "value": "John", "category": "personal"}]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You extract facts from conversations. Respond ONLY with valid JSON.' },
          { role: 'user', content: extractionPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('Memory extraction failed');
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Parse JSON, handling potential markdown code blocks
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const extracted = JSON.parse(jsonStr);
    
    return Array.isArray(extracted) ? extracted : [];
  } catch (error) {
    console.error('Error extracting memories:', error);
    return [];
  }
}

// ============ CONVERSATION FUNCTIONS ============

/**
 * Create a new conversation
 */
export async function createConversation(userId: string, title: string = 'New Chat'): Promise<Conversation | null> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}

/**
 * Get user's conversations
 */
export async function getUserConversations(userId: string, limit: number = 50): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string, limit: number = 100): Promise<Message[]> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message | null> {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    return null;
  }

  return data;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}
