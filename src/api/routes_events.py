from fastapi import APIRouter, Query
from typing import Optional
from .dependencies import repository

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("")
def list_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    key_path: Optional[str] = Query(None),
    operation: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    items, total = repository.get_events(
        limit=limit,
        offset=offset,
        key_path=key_path,
        operation=operation,
        source=source,
        search=search
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    }
