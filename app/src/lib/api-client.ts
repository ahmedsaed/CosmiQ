import type {
  Notebook,
  CreateNotebookData,
  UpdateNotebookData,
  Source,
  CreateSourceData,
  UpdateSourceData,
  Note,
  CreateNoteData,
  UpdateNoteData,
  Model,
  CreateModelData,
  DefaultModels,
  Transformation,
  CreateTransformationData,
  UpdateTransformationData,
  SearchRequest,
  SearchResponse,
  AskRequest,
  AskResponse,
  AskStreamChunk,
  Settings,
  UpdateSettingsData,
  SourceInsight,
  EpisodeProfile,
  CreateEpisodeProfileData,
  SpeakerProfile,
  CreateSpeakerProfileData,
  APIError,
  PodcastJob,
  PodcastEpisode,
} from '@/types/api';

class APIClient {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    // Get environment variables - these are injected at build time by Next.js
    this.baseURL = this.getEnvVar('NEXT_PUBLIC_API_URL') || 'http://localhost:5055';
    const password = this.getEnvVar('NEXT_PUBLIC_API_PASSWORD');
    
    this.headers = {
      'Content-Type': 'application/json',
      ...(password ? { Authorization: `Bearer ${password}` } : {}),
    };
  }

  private getEnvVar(key: string): string | undefined {
    // In the browser, Next.js exposes NEXT_PUBLIC_ vars
    if (typeof window !== 'undefined') {
      return (window as any)[key];
    }
    // On server, use process.env
    return (globalThis as any).process?.env?.[key];
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error: APIError = await response.json().catch(() => ({
          detail: response.statusText,
          status: response.status,
        }));
        throw new Error(error.detail || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Notebooks
  async getNotebooks(params?: {
    archived?: boolean;
    order_by?: string;
  }): Promise<Notebook[]> {
    const queryParams = new URLSearchParams();
    if (params?.archived !== undefined) queryParams.append('archived', String(params.archived));
    if (params?.order_by) queryParams.append('order_by', params.order_by);
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request<Notebook[]>(`/api/notebooks${query}`);
  }

  async createNotebook(data: CreateNotebookData): Promise<Notebook> {
    return this.request<Notebook>('/api/notebooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotebook(id: string): Promise<Notebook> {
    return this.request<Notebook>(`/api/notebooks/${id}`);
  }

  async updateNotebook(id: string, data: UpdateNotebookData): Promise<Notebook> {
    return this.request<Notebook>(`/api/notebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNotebook(id: string): Promise<void> {
    return this.request<void>(`/api/notebooks/${id}`, {
      method: 'DELETE',
    });
  }

  // Sources
  async getSources(params?: { notebook_id?: string }): Promise<Source[]> {
    const query = params?.notebook_id ? `?notebook_id=${params.notebook_id}` : '';
    return this.request<Source[]>(`/api/sources${query}`);
  }

  async createSource(data: CreateSourceData): Promise<Source> {
    return this.request<Source>('/api/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSource(id: string): Promise<Source> {
    return this.request<Source>(`/api/sources/${id}`);
  }

  async updateSource(id: string, data: UpdateSourceData): Promise<Source> {
    return this.request<Source>(`/api/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSource(id: string): Promise<void> {
    return this.request<void>(`/api/sources/${id}`, {
      method: 'DELETE',
    });
  }

  async getSourceInsights(sourceId: string): Promise<SourceInsight[]> {
    return this.request<SourceInsight[]>(`/api/sources/${sourceId}/insights`);
  }

  async createSourceInsight(
    sourceId: string,
    transformationId: string,
    modelId?: string
  ): Promise<SourceInsight> {
    return this.request<SourceInsight>(`/api/sources/${sourceId}/insights`, {
      method: 'POST',
      body: JSON.stringify({ transformation_id: transformationId, model_id: modelId }),
    });
  }

  // Notes
  async getNotes(params?: { notebook_id?: string }): Promise<Note[]> {
    const query = params?.notebook_id ? `?notebook_id=${params.notebook_id}` : '';
    return this.request<Note[]>(`/api/notes${query}`);
  }

  async createNote(data: CreateNoteData): Promise<Note> {
    return this.request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNote(id: string): Promise<Note> {
    return this.request<Note>(`/api/notes/${id}`);
  }

  async updateNote(id: string, data: UpdateNoteData): Promise<Note> {
    return this.request<Note>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<void> {
    return this.request<void>(`/api/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Search & Ask
  async search(data: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async askSimple(data: AskRequest): Promise<AskResponse> {
    return this.request<AskResponse>('/api/search/ask/simple', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async *askStreaming(data: AskRequest): AsyncGenerator<AskStreamChunk> {
    const url = `${this.baseURL}/api/search/ask`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Ask request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data as AskStreamChunk;
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Models
  async getModels(params?: { type?: string }): Promise<Model[]> {
    const query = params?.type ? `?type=${params.type}` : '';
    return this.request<Model[]>(`/api/models${query}`);
  }

  async createModel(data: CreateModelData): Promise<Model> {
    return this.request<Model>('/api/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteModel(id: string): Promise<void> {
    return this.request<void>(`/api/models/${id}`, {
      method: 'DELETE',
    });
  }

  async getDefaultModels(): Promise<DefaultModels> {
    return this.request<DefaultModels>('/api/models/defaults');
  }

  async updateDefaultModels(data: Partial<DefaultModels>): Promise<DefaultModels> {
    return this.request<DefaultModels>('/api/models/defaults', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Transformations
  async getTransformations(): Promise<Transformation[]> {
    return this.request<Transformation[]>('/api/transformations');
  }

  async createTransformation(data: CreateTransformationData): Promise<Transformation> {
    return this.request<Transformation>('/api/transformations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransformation(id: string): Promise<Transformation> {
    return this.request<Transformation>(`/api/transformations/${id}`);
  }

  async updateTransformation(
    id: string,
    data: UpdateTransformationData
  ): Promise<Transformation> {
    return this.request<Transformation>(`/api/transformations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransformation(id: string): Promise<void> {
    return this.request<void>(`/api/transformations/${id}`, {
      method: 'DELETE',
    });
  }

  async executeTransformation(
    transformationId: string,
    inputText: string,
    modelId: string
  ): Promise<{ output: string }> {
    return this.request<{ output: string }>('/api/transformations/execute', {
      method: 'POST',
      body: JSON.stringify({
        transformation_id: transformationId,
        input_text: inputText,
        model_id: modelId,
      }),
    });
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/api/settings');
  }

  async updateSettings(data: UpdateSettingsData): Promise<Settings> {
    return this.request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Episode Profiles
  async getEpisodeProfiles(): Promise<EpisodeProfile[]> {
    return this.request<EpisodeProfile[]>('/api/episode-profiles');
  }

  async createEpisodeProfile(data: CreateEpisodeProfileData): Promise<EpisodeProfile> {
    return this.request<EpisodeProfile>('/api/episode-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEpisodeProfile(
    id: string,
    data: Partial<CreateEpisodeProfileData>
  ): Promise<EpisodeProfile> {
    return this.request<EpisodeProfile>(`/api/episode-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEpisodeProfile(id: string): Promise<void> {
    return this.request<void>(`/api/episode-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Speaker Profiles
  async getSpeakerProfiles(): Promise<SpeakerProfile[]> {
    return this.request<SpeakerProfile[]>('/api/speaker-profiles');
  }

  async createSpeakerProfile(data: CreateSpeakerProfileData): Promise<SpeakerProfile> {
    return this.request<SpeakerProfile>('/api/speaker-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSpeakerProfile(
    id: string,
    data: Partial<CreateSpeakerProfileData>
  ): Promise<SpeakerProfile> {
    return this.request<SpeakerProfile>(`/api/speaker-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSpeakerProfile(id: string): Promise<void> {
    return this.request<void>(`/api/speaker-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== NEW METHODS FOR PHASE 3 ==========

  // Search (new improved API)
  async searchNotebook(
    query: string,
    options?: {
      searchType?: 'text' | 'vector';
      limit?: number;
      searchSources?: boolean;
      searchNotes?: boolean;
      minimumScore?: number;
      notebookId?: string;
    }
  ): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        type: options?.searchType || 'text',
        limit: options?.limit || 100,
        search_sources: options?.searchSources !== false,
        search_notes: options?.searchNotes !== false,
        minimum_score: options?.minimumScore || 0.2,
        notebook_id: options?.notebookId,
      }),
    });
  }

  // Ask (simple, non-streaming) - new API
  async askQuestion(
    question: string,
    strategyModel: string,
    answerModel: string,
    finalAnswerModel: string
  ): Promise<AskResponse> {
    return this.request<AskResponse>('/api/search/ask/simple', {
      method: 'POST',
      body: JSON.stringify({
        question,
        strategy_model: strategyModel,
        answer_model: answerModel,
        final_answer_model: finalAnswerModel,
      }),
    });
  }

  // Ask (streaming)
  async askStream(
    question: string,
    strategyModel: string,
    answerModel: string,
    finalAnswerModel: string,
    onChunk: (data: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/search/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          strategy_model: strategyModel,
          answer_model: answerModel,
          final_answer_model: finalAnswerModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
              if (data.type === 'complete' || data.type === 'error') {
                onComplete();
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Podcasts
  async generatePodcast(
    episodeProfile: string,
    speakerProfile: string,
    episodeName: string,
    notebookId?: string,
    content?: string,
    briefingSuffix?: string
  ): Promise<PodcastJob> {
    return this.request<PodcastJob>('/api/podcasts/generate', {
      method: 'POST',
      body: JSON.stringify({
        episode_profile: episodeProfile,
        speaker_profile: speakerProfile,
        episode_name: episodeName,
        notebook_id: notebookId,
        content,
        briefing_suffix: briefingSuffix,
      }),
    });
  }

  async getPodcastJobStatus(jobId: string): Promise<any> {
    return this.request<any>(`/api/podcasts/jobs/${jobId}`);
  }

  async getPodcastEpisodes(notebookId?: string): Promise<PodcastEpisode[]> {
    const params = notebookId ? `?notebook_id=${notebookId}` : '';
    return this.request<PodcastEpisode[]>(`/api/podcasts/episodes${params}`);
  }

  async getPodcastEpisode(episodeId: string): Promise<PodcastEpisode> {
    return this.request<PodcastEpisode>(`/api/podcasts/episodes/${episodeId}`);
  }

  async deletePodcastEpisode(episodeId: string): Promise<void> {
    return this.request<void>(`/api/podcasts/episodes/${episodeId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new APIClient();
