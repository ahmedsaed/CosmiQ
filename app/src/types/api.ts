// Core domain types matching the backend API

export interface Notebook {
  id: string;
  name: string;
  description: string;
  archived: boolean;
  created: string;
  updated: string;
}

export interface CreateNotebookData {
  name: string;
  description?: string;
}

export interface UpdateNotebookData {
  name?: string;
  description?: string;
  archived?: boolean;
}

export interface Source {
  id: string;
  title: string | null;
  topics: string[] | null;
  asset: {
    type: string;
    url?: string;
    file_path?: string;
    [key: string]: any;
  } | null;
  full_text: string | null;
  notebook_id: string;
  embedding: number[] | null;
  insights?: SourceInsight[];
  created: string;
  updated: string;
}

export interface CreateSourceData {
  notebook_id: string;
  type: 'file' | 'url' | 'text' | 'youtube';
  url?: string;
  file_path?: string;
  content?: string;
  title?: string;
  transformations?: string[];
  embed?: boolean;
  delete_source?: boolean;
}

export interface UpdateSourceData {
  title?: string;
  topics?: string[];
  full_text?: string;
}

export interface Note {
  id: string;
  title: string | null;
  content: string | null;
  note_type: 'human' | 'ai';
  notebook_id: string;
  embedding: number[] | null;
  created: string;
  updated: string;
}

export interface CreateNoteData {
  content: string;
  title?: string;
  note_type?: 'human' | 'ai';
  notebook_id?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  note_type?: 'human' | 'ai';
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  type: 'language' | 'embedding' | 'text_to_speech' | 'speech_to_text';
  created: string;
  updated: string;
}

export interface CreateModelData {
  name: string;
  provider: string;
  type: 'language' | 'embedding' | 'text_to_speech' | 'speech_to_text';
}

export interface AvailableProvidersResponse {
  providers_by_type: {
    language: string[];
    embedding: string[];
    text_to_speech: string[];
    speech_to_text: string[];
  };
  configured_providers: string[];
  all_providers: string[];
}

export interface DefaultModels {
  default_chat_model: string | null;
  default_transformation_model: string | null;
  default_embedding_model: string | null;
  default_text_to_speech_model: string | null;
  default_speech_to_text_model: string | null;
  default_tools_model: string | null;
  large_context_model: string | null;
}

export interface Transformation {
  id: string;
  name: string;
  title: string;
  description: string;
  prompt: string;
  apply_default: boolean;
  created: string;
  updated: string;
}

export interface CreateTransformationData {
  name: string;
  title: string;
  description: string;
  prompt: string;
  apply_default?: boolean;
}

export interface UpdateTransformationData {
  name?: string;
  title?: string;
  description?: string;
  prompt?: string;
  apply_default?: boolean;
}

export interface SearchRequest {
  query: string;
  type: 'text' | 'vector';
  limit?: number;
  search_sources?: boolean;
  search_notes?: boolean;
  minimum_score?: number;
}

export interface SearchResultOld {
  id: string;
  parent_id: string;
  title: string;
  relevance?: number;
  similarity?: number;
  score?: number;
  matches?: string[];
  final_score?: number;
}

export interface SearchResponseOld {
  results: SearchResultOld[];
  total_count: number;
  search_type: 'text' | 'vector';
}

export interface AskRequest {
  question: string;
  strategy_model: string;
  answer_model: string;
  final_answer_model: string;
}

export interface AskResponse {
  answer: string;
  question: string;
}

export interface AskStreamChunk {
  type: 'strategy' | 'answer' | 'final_answer' | 'complete' | 'error';
  reasoning?: string;
  searches?: Array<{ term: string; instructions: string }>;
  content?: string;
  final_answer?: string;
  message?: string;
}

export interface Settings {
  default_content_processing_engine_doc: 'auto' | 'docling' | 'simple';
  default_content_processing_engine_url: 'auto' | 'firecrawl' | 'jina' | 'simple';
  default_embedding_option: 'ask' | 'always' | 'never';
  auto_delete_files: 'yes' | 'no';
  youtube_preferred_languages: string[];
}

export interface UpdateSettingsData {
  default_content_processing_engine_doc?: 'auto' | 'docling' | 'simple';
  default_content_processing_engine_url?: 'auto' | 'firecrawl' | 'jina' | 'simple';
  default_embedding_option?: 'ask' | 'always' | 'never';
  auto_delete_files?: 'yes' | 'no';
  youtube_preferred_languages?: string[];
}

export interface SourceInsight {
  id: string;
  source_id: string;
  transformation_id?: string;
  insight_type: string;
  title?: string; // Optional fallback
  content: string;
  created: string;
  updated: string;
}

export interface EpisodeProfile {
  id: string;
  name: string;
  description: string;
  speaker_config: string;
  outline_provider: string;
  outline_model: string;
  transcript_provider: string;
  transcript_model: string;
  default_briefing: string;
  num_segments: number;
  created: string;
  updated: string;
}

export interface CreateEpisodeProfileData {
  name: string;
  description?: string;
  speaker_config?: string;
  outline_provider?: string;
  outline_model?: string;
  transcript_provider?: string;
  transcript_model?: string;
  default_briefing?: string;
  num_segments?: number;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  description: string;
  speakers: Array<{
    name: string;
    voice_id: string;
    backstory: string;
    personality: string;
  }>;
  tts_provider: string;
  tts_model: string;
  created: string;
  updated: string;
}

export interface CreateSpeakerProfileData {
  name: string;
  voice_profile: string;
  voice_provider?: string;
}

export interface Settings {
  OPENAI_API_KEY: string | null;
  ANTHROPIC_API_KEY: string | null;
  GROQ_API_KEY: string | null;
  GEMINI_API_KEY: string | null;
  DEEPGRAM_API_KEY: string | null;
  ELEVENLABS_API_KEY: string | null;
}

// Settings Data is just a plain object
export type UpdateSettingsDataOld = {
  [key: string]: string | null;
};

// Search types (new simplified version)
export interface SearchResult {
  id: string;
  title: string | null;
  content: string | null;
  type: 'source' | 'note';
  score: number;
  notebook_id: string;
  created: string;
  // Backend may return these
  parent_id?: string;
  relevance?: number;
  similarity?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query?: string;
  search_type?: 'text' | 'vector';
  total: number;
  total_count?: number; // Backend returns this
}

// Ask types (simplified)
export interface AskResponse {
  answer: string;
  sources_used: SearchResult[];
  question: string;
}

// Podcast types
export interface PodcastJob {
  job_id: string;
  status: string;
  message: string;
  episode_profile: string;
  episode_name: string;
}

export interface PodcastEpisode {
  id: string;
  name: string;
  episode_profile: { name: string; [key: string]: any };
  speaker_profile: { name: string; [key: string]: any };
  briefing: string;
  audio_file?: string | null;
  transcript?: any | null;
  outline?: any | null;
  created?: string;
  job_status?: string;
}

export interface APIError {
  detail: string;
  status?: number;
}
