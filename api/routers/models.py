import os
from typing import Dict, List, Optional

from esperanto import AIFactory
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from api.models import DefaultModelsResponse, ModelCreate, ModelResponse
from open_notebook.domain.models import DefaultModels, Model
from open_notebook.exceptions import InvalidInputError

router = APIRouter()


def check_available_providers():
    """Check which AI providers are available based on environment variables."""
    provider_status = {}
    
    # Check each provider's required environment variables
    provider_status["ollama"] = os.environ.get("OLLAMA_API_BASE") is not None
    provider_status["openai"] = os.environ.get("OPENAI_API_KEY") is not None
    provider_status["groq"] = os.environ.get("GROQ_API_KEY") is not None
    provider_status["xai"] = os.environ.get("XAI_API_KEY") is not None
    provider_status["vertex"] = (
        os.environ.get("VERTEX_PROJECT") is not None
        and os.environ.get("VERTEX_LOCATION") is not None
        and os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") is not None
    )
    provider_status["google"] = (
        os.environ.get("GOOGLE_API_KEY") is not None
        or os.environ.get("GEMINI_API_KEY") is not None
    )
    provider_status["openrouter"] = os.environ.get("OPENROUTER_API_KEY") is not None
    provider_status["anthropic"] = os.environ.get("ANTHROPIC_API_KEY") is not None
    provider_status["elevenlabs"] = os.environ.get("ELEVENLABS_API_KEY") is not None
    provider_status["voyage"] = os.environ.get("VOYAGE_API_KEY") is not None
    provider_status["azure"] = (
        os.environ.get("AZURE_OPENAI_API_KEY") is not None
        and os.environ.get("AZURE_OPENAI_ENDPOINT") is not None
        and os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME") is not None
        and os.environ.get("AZURE_OPENAI_API_VERSION") is not None
    )
    provider_status["mistral"] = os.environ.get("MISTRAL_API_KEY") is not None
    provider_status["deepseek"] = os.environ.get("DEEPSEEK_API_KEY") is not None
    provider_status["openai-compatible"] = (
        os.environ.get("OPENAI_COMPATIBLE_BASE_URL") is not None
    )
    
    return provider_status


@router.get("/models/providers")
async def get_available_providers():
    """Get available AI providers and their supported model types."""
    try:
        # Get providers that Esperanto supports for each model type
        esperanto_providers = AIFactory.get_available_providers()
        
        # Check which providers have API keys configured
        provider_status = check_available_providers()
        configured_providers = [k for k, v in provider_status.items() if v]
        
        # Filter providers by what's configured and remove perplexity
        result: Dict[str, List[str]] = {}
        for model_type, providers in esperanto_providers.items():
            available = [
                p for p in providers 
                if p in configured_providers and p != "perplexity"
            ]
            available.sort()
            result[model_type] = available
        
        return {
            "providers_by_type": result,
            "configured_providers": configured_providers,
            "all_providers": list(provider_status.keys())
        }
    except Exception as e:
        logger.error(f"Error fetching available providers: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching available providers: {str(e)}"
        )


@router.get("/models", response_model=List[ModelResponse])
async def get_models(
    type: Optional[str] = Query(None, description="Filter by model type")
):
    """Get all configured models with optional type filtering."""
    try:
        if type:
            models = await Model.get_models_by_type(type)
        else:
            models = await Model.get_all()
        
        return [
            ModelResponse(
                id=model.id,
                name=model.name,
                provider=model.provider,
                type=model.type,
                created=str(model.created),
                updated=str(model.updated),
            )
            for model in models
        ]
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching models: {str(e)}")


@router.post("/models", response_model=ModelResponse)
async def create_model(model_data: ModelCreate):
    """Create a new model configuration."""
    try:
        # Validate model type
        valid_types = ["language", "embedding", "text_to_speech", "speech_to_text"]
        if model_data.type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid model type. Must be one of: {valid_types}"
            )
        
        new_model = Model(
            name=model_data.name,
            provider=model_data.provider,
            type=model_data.type,
        )
        await new_model.save()
        
        return ModelResponse(
            id=new_model.id,
            name=new_model.name,
            provider=new_model.provider,
            type=new_model.type,
            created=str(new_model.created),
            updated=str(new_model.updated),
        )
    except InvalidInputError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating model: {str(e)}")


@router.delete("/models/{model_id}")
async def delete_model(model_id: str):
    """Delete a model configuration."""
    try:
        model = await Model.get(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        await model.delete()
        
        return {"message": "Model deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting model {model_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting model: {str(e)}")


@router.get("/models/defaults", response_model=DefaultModelsResponse)
async def get_default_models():
    """Get default model assignments."""
    try:
        defaults = await DefaultModels.get_instance()
        
        return DefaultModelsResponse(
            default_chat_model=defaults.default_chat_model,
            default_transformation_model=defaults.default_transformation_model,
            large_context_model=defaults.large_context_model,
            default_text_to_speech_model=defaults.default_text_to_speech_model,
            default_speech_to_text_model=defaults.default_speech_to_text_model,
            default_embedding_model=defaults.default_embedding_model,
            default_tools_model=defaults.default_tools_model,
        )
    except Exception as e:
        logger.error(f"Error fetching default models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching default models: {str(e)}")


@router.put("/models/defaults", response_model=DefaultModelsResponse)
async def update_default_models(defaults_data: DefaultModelsResponse):
    """Update default model assignments."""
    try:
        defaults = await DefaultModels.get_instance()
        
        # Update only provided fields
        if defaults_data.default_chat_model is not None:
            defaults.default_chat_model = defaults_data.default_chat_model
        if defaults_data.default_transformation_model is not None:
            defaults.default_transformation_model = defaults_data.default_transformation_model
        if defaults_data.large_context_model is not None:
            defaults.large_context_model = defaults_data.large_context_model
        if defaults_data.default_text_to_speech_model is not None:
            defaults.default_text_to_speech_model = defaults_data.default_text_to_speech_model
        if defaults_data.default_speech_to_text_model is not None:
            defaults.default_speech_to_text_model = defaults_data.default_speech_to_text_model
        if defaults_data.default_embedding_model is not None:
            defaults.default_embedding_model = defaults_data.default_embedding_model
        if defaults_data.default_tools_model is not None:
            defaults.default_tools_model = defaults_data.default_tools_model
        
        await defaults.update()
        
        # Refresh the model manager cache
        from open_notebook.domain.models import model_manager
        await model_manager.refresh_defaults()
        
        return DefaultModelsResponse(
            default_chat_model=defaults.default_chat_model,
            default_transformation_model=defaults.default_transformation_model,
            large_context_model=defaults.large_context_model,
            default_text_to_speech_model=defaults.default_text_to_speech_model,
            default_speech_to_text_model=defaults.default_speech_to_text_model,
            default_embedding_model=defaults.default_embedding_model,
            default_tools_model=defaults.default_tools_model,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating default models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating default models: {str(e)}")