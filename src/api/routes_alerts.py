from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, Any
from .dependencies import repository

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
def list_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    items, total = repository.get_alerts(page=page, limit=limit, severity=severity, status=status, search=search)
    pages = (total + limit - 1) // limit if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.get("/{alert_id}")
def get_alert_detail(alert_id: str):
    alert = repository.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}")
def update_alert(
    alert_id: str,
    payload: Dict[str, Any] = Body(...)
):
    status = payload.get("status")
    notes = payload.get("analyst_notes")
    if not status:
        raise HTTPException(status_code=400, detail="Missing required 'status' field")
    
    updated = repository.update_alert_status(alert_id, status, notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found or update failed")
    
    return {"status": "success", "alert_id": alert_id, "new_status": status}
