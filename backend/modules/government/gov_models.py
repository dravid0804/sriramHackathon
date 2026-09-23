"""
EarthLens AI — Government Multi-Tenant Data Models
Defines Pydantic schemas for Organizations, Departments, RBAC, Response Cases, and Operational Intelligence.
"""

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime


class RoleEnum(str, Enum):
    PLATFORM_ADMIN = "Platform Admin"
    ORG_ADMIN = "Organization Admin"
    GOVERNMENT_ANALYST = "Government Analyst"
    FIELD_OFFICER = "Field Officer"
    VIEWER = "Viewer"


class CaseStatusEnum(str, Enum):
    NEW = "New"
    UNDER_INVESTIGATION = "Under Investigation"
    MONITORING = "Monitoring"
    RESPONSE_INITIATED = "Response Initiated"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class PriorityEnum(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MODERATE = "Moderate"
    LOW = "Low"


class Department(BaseModel):
    id: str
    name: str
    code: str
    icon: str
    focus_areas: List[str]
    lead_officer: str
    active_cases: int = 0


class OperationalRegion(BaseModel):
    id: str
    name: str
    type: str  # State, District, Municipality, Ward, Custom
    center_coords: Dict[str, float]  # {"lat": 32.7667, "lon": 22.6367}
    zoom_level: int = 14
    dataset_link: Optional[str] = None
    affected_area_km2: float = 0.0
    active_alerts: int = 0
    active_cases: int = 0


class GovernmentUser(BaseModel):
    id: str
    name: str
    email: str
    role: RoleEnum
    organization_id: str
    department_id: str
    department_name: str
    assigned_region: str
    avatar_initials: str = "GO"


class InvestigationNote(BaseModel):
    id: str
    author_name: str
    author_role: str
    department: str
    content: str
    timestamp: str
    evidence_url: Optional[str] = None


class ResponseCase(BaseModel):
    id: str
    case_code: str
    organization_id: str
    department_id: str
    department_name: str
    region_id: str
    related_dataset_id: str
    title: str
    location_name: str
    coordinates: Dict[str, float]
    change_type: str
    severity: str
    priority: PriorityEnum
    affected_area_km2: float
    confidence_pct: float
    potential_community_impact: Dict[str, Any]
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    status: CaseStatusEnum = CaseStatusEnum.NEW
    created_at: str
    updated_at: str
    notes: List[InvestigationNote] = []
    is_public: bool = False


class GovernmentAlert(BaseModel):
    id: str
    organization_id: str
    department_id: str
    priority: PriorityEnum
    title: str
    region_name: str
    dataset_id: str
    affected_area_km2: float
    potential_settlements: int
    confidence_pct: float
    status: str = "New"
    created_at: str


class TenantOrganization(BaseModel):
    id: str
    name: str
    type: str
    code: str
    logo_icon: str
    badge_label: str
    departments: List[Department]
    regions: List[OperationalRegion]
    users: List[GovernmentUser]
    active_cases_count: int = 0
    active_alerts_count: int = 0
    total_monitored_area_km2: float = 0.0


# API Request/Response Schemas
class CreateCaseRequest(BaseModel):
    organization_id: str
    department_id: str
    region_id: str
    related_dataset_id: str
    title: str
    location_name: str
    coordinates: Dict[str, float]
    change_type: str
    severity: str
    priority: PriorityEnum
    affected_area_km2: float
    confidence_pct: float
    potential_community_impact: Dict[str, Any]
    assigned_officer_name: Optional[str] = None
    initial_note: Optional[str] = None


class UpdateCaseRequest(BaseModel):
    status: Optional[CaseStatusEnum] = None
    assigned_department_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    new_note: Optional[str] = None


class SwitchTenantRequest(BaseModel):
    organization_id: str
    department_id: Optional[str] = None
