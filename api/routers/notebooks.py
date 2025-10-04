from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from api.models import ErrorResponse, NotebookCreate, NotebookResponse, NotebookUpdate
from open_notebook.domain.notebook import Notebook
from open_notebook.exceptions import DatabaseOperationError, InvalidInputError

from api.utils.pdf_fetcher import fetch_pdf_links
from open_notebook.graphs.source import source_graph
import asyncio

router = APIRouter()


@router.get("/notebooks", response_model=List[NotebookResponse])
async def get_notebooks(
    archived: Optional[bool] = Query(None, description="Filter by archived status"),
    order_by: str = Query("updated desc", description="Order by field and direction"),
):
    """Get all notebooks with optional filtering and ordering."""
    try:
        notebooks = await Notebook.get_all(order_by=order_by)
        
        # Filter by archived status if specified
        if archived is not None:
            notebooks = [nb for nb in notebooks if nb.archived == archived]
        
        return [
            NotebookResponse(
                id=nb.id,
                name=nb.name,
                description=nb.description,
                archived=nb.archived or False,
                created=str(nb.created),
                updated=str(nb.updated),
            )
            for nb in notebooks
        ]
    except Exception as e:
        logger.error(f"Error fetching notebooks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching notebooks: {str(e)}")

@router.post("/notebooks", response_model=NotebookResponse)
async def create_notebook(notebook: NotebookCreate):
    """Create a new notebook."""
    try:
        new_notebook = Notebook(
            name=notebook.name,
            description=notebook.description,
        )
        await new_notebook.save()
        
        # ===== AUTO-POPULATE SOURCES =====
        pdf_links = await fetch_pdf_links(limit=10)

        if pdf_links:
            logger.info(f"Auto-populating {len(pdf_links)} sources for notebook {new_notebook.id}")
            
            for pdf_info in pdf_links:
                try:
                    content_state = {"url": pdf_info['url']}
                    
                    result = await source_graph.ainvoke({
                        "content_state": content_state,
                        "notebook_id": new_notebook.id,
                        "apply_transformations": [],
                        "embed": True,
                    })
                    
                    if pdf_info['title'] and result["source"]:
                        source = result["source"]
                        source.title = pdf_info['title']
                        await source.save()
                    
                    logger.info(f"Created source {len([s for s in pdf_links if s == pdf_info]) + 1}/{len(pdf_links)}: {pdf_info['title']}")
                except Exception as e:
                    logger.error(f"Failed to create source for {pdf_info['url']}: {str(e)}")
            
            logger.info(f"Finished auto-populating sources for notebook {new_notebook.id}")
        
        # ===== END AUTO-POPULATE =====
        
        return NotebookResponse(
            id=new_notebook.id,
            name=new_notebook.name,
            description=new_notebook.description,
            archived=new_notebook.archived or False,
            created=str(new_notebook.created),
            updated=str(new_notebook.updated),
        )
    except InvalidInputError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating notebook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating notebook: {str(e)}")


@router.get("/notebooks/{notebook_id}", response_model=NotebookResponse)
async def get_notebook(notebook_id: str):
    """Get a specific notebook by ID."""
    try:
        notebook = await Notebook.get(notebook_id)
        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")
        
        return NotebookResponse(
            id=notebook.id,
            name=notebook.name,
            description=notebook.description,
            archived=notebook.archived or False,
            created=str(notebook.created),
            updated=str(notebook.updated),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notebook {notebook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching notebook: {str(e)}")


@router.put("/notebooks/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(notebook_id: str, notebook_update: NotebookUpdate):
    """Update a notebook."""
    try:
        notebook = await Notebook.get(notebook_id)
        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")
        
        # Update only provided fields
        if notebook_update.name is not None:
            notebook.name = notebook_update.name
        if notebook_update.description is not None:
            notebook.description = notebook_update.description
        if notebook_update.archived is not None:
            notebook.archived = notebook_update.archived
        
        await notebook.save()
        
        return NotebookResponse(
            id=notebook.id,
            name=notebook.name,
            description=notebook.description,
            archived=notebook.archived or False,
            created=str(notebook.created),
            updated=str(notebook.updated),
        )
    except HTTPException:
        raise
    except InvalidInputError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating notebook {notebook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating notebook: {str(e)}")


@router.delete("/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str):
    """Delete a notebook."""
    try:
        notebook = await Notebook.get(notebook_id)
        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")
        
        await notebook.delete()
        
        return {"message": "Notebook deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notebook {notebook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting notebook: {str(e)}")