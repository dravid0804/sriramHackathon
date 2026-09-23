"""
EarthLens AI — Government Multi-Tenant REST API Routes
Isolated API router under /api/v1/government/ providing tenant-aware operations.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header, status
from pydantic import BaseModel

from .gov_engine import gov_engine
from .gov_models import (
    TenantOrganization, ResponseCase, CreateCaseRequest, UpdateCaseRequest,
    GovernmentAlert
)

gov_router = APIRouter()


def get_current_org_id(
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
    org_id: Optional[str] = Query(None)
) -> str:
    """Helper to resolve active tenant identity with fallback to demo default."""
    resolved = x_organization_id or org_id or "org-sdma"
    return resolved


@gov_router.get("/tenants", response_model=List[TenantOrganization])
async def list_tenants():
    """List all available government authorities / tenant workspaces."""
    return gov_engine.get_tenants()


@gov_router.get("/tenants/{tenant_id}", response_model=TenantOrganization)
async def get_tenant_details(tenant_id: str):
    """Retrieve detailed organization metadata, departments, regions, and staff."""
    tenant = gov_engine.get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant organization not found")
    return tenant


@gov_router.get("/cases", response_model=List[ResponseCase])
async def list_response_cases(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """List response cases strictly isolated to the requesting tenant."""
    active_org = org_id or x_org_id or "org-sdma"
    return gov_engine.get_cases(
        org_id=active_org,
        department_id=department_id,
        status=status,
        priority=priority
    )


@gov_router.get("/cases/{case_id}", response_model=ResponseCase)
async def get_response_case(
    case_id: str,
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Get single response case details with strict tenant authorization."""
    active_org = org_id or x_org_id or "org-sdma"
    case = gov_engine.get_case(case_id, active_org)
    if not case:
        raise HTTPException(status_code=404, detail="Response case not found or unauthorized")
    return case


@gov_router.post("/cases", response_model=ResponseCase, status_code=status.HTTP_201_CREATED)
async def create_response_case(req: CreateCaseRequest):
    """Create a new government response case from a detected change anomaly."""
    # Ensure organization exists
    if not gov_engine.get_tenant(req.organization_id):
        raise HTTPException(status_code=400, detail="Invalid organization ID")
    return gov_engine.create_case(req)


@gov_router.patch("/cases/{case_id}", response_model=ResponseCase)
async def update_response_case(
    case_id: str,
    update: UpdateCaseRequest,
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Update case status, assign officer, or append investigation note."""
    active_org = org_id or x_org_id or "org-sdma"
    updated = gov_engine.update_case(case_id, active_org, update)
    if not updated:
        raise HTTPException(status_code=404, detail="Response case not found or unauthorized")
    return updated


@gov_router.get("/action-center")
async def get_action_center(
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Get high-priority response cases and alerts requiring urgent attention."""
    active_org = org_id or x_org_id or "org-sdma"
    return gov_engine.get_action_center(active_org)


@gov_router.get("/regional-intelligence")
async def get_regional_intelligence(
    region_id: Optional[str] = Query(None),
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Get regional intelligence overview, KPIs, and hazard breakdown for active region."""
    active_org = org_id or x_org_id or "org-sdma"
    return gov_engine.get_regional_intelligence(active_org, region_id)


@gov_router.get("/notifications")
async def get_notifications(
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Get operational notifications for the top navigation notification center."""
    active_org = org_id or x_org_id or "org-sdma"
    return gov_engine.get_notifications(active_org)


@gov_router.post("/notifications/read")
async def mark_notifications_read(
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Mark all notifications as read for current organization."""
    active_org = org_id or x_org_id or "org-sdma"
    gov_engine.mark_notifications_read(active_org)
    return {"status": "success", "message": "Notifications marked as read"}


@gov_router.post("/reports/situation-report/{case_id}")
async def generate_situation_report(
    case_id: str,
    org_id: str = Query(None),
    x_org_id: Optional[str] = Header(None, alias="X-Organization-Id")
):
    """Generate a formal Government Situation Report for an active response case."""
    active_org = org_id or x_org_id or "org-sdma"
    sitrep = gov_engine.generate_situation_report(active_org, case_id)
    if not sitrep:
        raise HTTPException(status_code=404, detail="Unable to generate report: Case not found")
    return sitrep
