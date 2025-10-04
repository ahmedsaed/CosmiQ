# Models Tab Enhancement - Dynamic Provider Selection

## Overview
Enhanced the Models Tab in the Settings page to dynamically detect available AI providers and show relevant options based on configured API keys, matching the behavior of the Streamlit app.

## Changes Made

### Backend (API)

#### `/api/routers/models.py`
**Added new endpoint: `GET /api/models/providers`**

Returns available providers based on environment configuration:
- Checks which providers have API keys configured
- Uses Esperanto's `AIFactory.get_available_providers()` to get supported model types
- Filters providers by configured API keys
- Returns providers organized by model type

**Response Structure:**
```json
{
  "providers_by_type": {
    "language": ["openai", "anthropic", "ollama", ...],
    "embedding": ["openai", "voyage", ...],
    "text_to_speech": ["elevenlabs", "openai"],
    "speech_to_text": ["openai", "deepgram"]
  },
  "configured_providers": ["openai", "anthropic", ...],
  "all_providers": ["openai", "anthropic", "groq", ...]
}
```

**Provider Detection:**
Checks environment variables for:
- `ollama` - OLLAMA_API_BASE
- `openai` - OPENAI_API_KEY
- `groq` - GROQ_API_KEY
- `xai` - XAI_API_KEY
- `vertex` - VERTEX_PROJECT, VERTEX_LOCATION, GOOGLE_APPLICATION_CREDENTIALS
- `google` - GOOGLE_API_KEY or GEMINI_API_KEY
- `openrouter` - OPENROUTER_API_KEY
- `anthropic` - ANTHROPIC_API_KEY
- `elevenlabs` - ELEVENLABS_API_KEY
- `voyage` - VOYAGE_API_KEY
- `azure` - AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, etc.
- `mistral` - MISTRAL_API_KEY
- `deepseek` - DEEPSEEK_API_KEY
- `openai-compatible` - OPENAI_COMPATIBLE_BASE_URL

### Frontend (Next.js)

#### `/app/src/types/api.ts`
**Added new type:**
```typescript
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
```

#### `/app/src/lib/api-client.ts`
**Added new method:**
```typescript
async getAvailableProviders(): Promise<AvailableProvidersResponse>
```

#### `/app/src/components/ui/Select.tsx`
**Enhanced Select component:**
- Added explicit `placeholder` prop support
- Fixed TypeScript typing issues
- Maintained consistent styling with other inputs

#### `/app/src/components/settings/ModelsTab.tsx`
**Major enhancements:**

1. **Dynamic Provider Detection:**
   - Fetches available providers on component mount
   - Stores provider information in state

2. **Model Type First Approach:**
   - User selects model type first (Language, Embedding, TTS, STT)
   - Provider dropdown updates based on selected type
   - Shows only providers that support the selected model type

3. **Smart Provider Selection:**
   - If providers are available: Shows dropdown with configured providers
   - If no providers configured: Falls back to text input with warning
   - Warning message guides users to configure API keys in System settings

4. **Improved UX:**
   - Styled Select components with icons (💬, 🔢, 🔊, 🎤)
   - Capitalized provider names in dropdown
   - Better placeholder text and help messages
   - Resets provider selection when model type changes

5. **Better Validation:**
   - Shows warning when no providers are configured for a model type
   - Guides users with helpful tips about model names
   - Azure-specific guidance included

## User Experience Improvements

### Before
- Manual text input for provider and model type
- No validation of provider availability
- Unstyled dropdown for model type
- No guidance on which providers are configured

### After
- Dynamic dropdown showing only configured providers
- Type-first selection flow
- Styled dropdowns with visual indicators
- Clear warnings when providers are missing
- Better organization and visual hierarchy
- Helpful tips and guidance throughout

## Example Flow

1. **User opens Add Model dialog**
   - Sees model type dropdown with icons

2. **User selects "Language Model"**
   - Provider dropdown updates to show only LLM providers (OpenAI, Anthropic, Ollama, etc.)
   - If no providers configured, shows input field with warning

3. **User selects provider (e.g., "OpenAI")**
   - Can now enter model name (e.g., "gpt-4o-mini")

4. **User submits**
   - Model is created with validated provider

## Benefits

1. **User-Friendly:** Users can't accidentally enter invalid providers
2. **Self-Documenting:** Shows which providers are actually available
3. **Configuration Guidance:** Warns when API keys are missing
4. **Type Safety:** Ensures provider supports the selected model type
5. **Consistent:** Matches Streamlit app behavior
6. **Professional:** Styled components with proper visual feedback

## Testing

To test:
1. Navigate to Settings → Models tab
2. Click "Add Model"
3. Select different model types
4. Observe provider dropdown updates
5. Try with different API key configurations
6. Verify warnings appear when no providers are available

## Related Files
- Backend: `/api/routers/models.py`
- Frontend: 
  - `/app/src/components/settings/ModelsTab.tsx`
  - `/app/src/components/ui/Select.tsx`
  - `/app/src/types/api.ts`
  - `/app/src/lib/api-client.ts`
