"""
EarthLens AI — Government Multi-Tenant Engine
Handles tenant-isolated storage, role-based operations, response case lifecycle, and operational intelligence.
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

from .gov_models import (
    TenantOrganization, Department, OperationalRegion, GovernmentUser,
    ResponseCase, InvestigationNote, GovernmentAlert, RoleEnum,
    CaseStatusEnum, PriorityEnum, CreateCaseRequest, UpdateCaseRequest
)


class GovernmentEngine:
    def __init__(self):
        self.organizations: Dict[str, TenantOrganization] = {}
        self.cases: Dict[str, ResponseCase] = {}
        self.alerts: Dict[str, GovernmentAlert] = {}
        self.notifications: List[Dict[str, Any]] = []
        self._init_demo_data()

    def _init_demo_data(self):
        """Pre-populate realistic demo government authorities and operational data."""
        # 1. State Disaster Management Authority (SDMA)
        sdma_depts = [
            Department(
                id="dept-sdma-dm",
                name="Disaster Management & Emergency Response",
                code="DM-OPS",
                icon="🚨",
                focus_areas=["Flash Floods", "Dam Breach", "Evacuation Corridors"],
                lead_officer="Dr. Rajesh Sekhar",
                active_cases=3
            ),
            Department(
                id="dept-sdma-water",
                name="Water Resources & Hydrology Directorate",
                code="HYDRO",
                icon="🌊",
                focus_areas=["Reservoir Safety", "Coastal Inundation", "Wadi Hydrology"],
                lead_officer="Eng. Fatima Al-Mansoor",
                active_cases=2
            ),
            Department(
                id="dept-sdma-infra",
                name="Civil Infrastructure & Lifeline Transit",
                code="INFRA",
                icon="🏥",
                focus_areas=["Hospitals Access", "Bridge Structural Health", "School Shelters"],
                lead_officer="Col. A. Ramanathan",
                active_cases=1
            )
        ]

        sdma_regions = [
            OperationalRegion(
                id="reg-derna-01",
                name="Derna Coastal District & Wadi Basin",
                type="District",
                center_coords={"lat": 32.7667, "lon": 22.6367},
                zoom_level=14,
                dataset_link="derna_flooding",
                affected_area_km2=14.2,
                active_alerts=2,
                active_cases=2
            ),
            OperationalRegion(
                id="reg-madurai-01",
                name="Madurai Vaigai River Basin",
                type="District",
                center_coords={"lat": 9.9252, "lon": 78.1198},
                zoom_level=14,
                dataset_link="madurai_urban",
                affected_area_km2=8.4,
                active_alerts=1,
                active_cases=1
            ),
            OperationalRegion(
                id="reg-california-01",
                name="Sierra Foothills Wildland Interface",
                type="County",
                center_coords={"lat": 39.7596, "lon": -121.6219},
                zoom_level=13,
                dataset_link="california_wildfire",
                affected_area_km2=22.8,
                active_alerts=1,
                active_cases=1
            )
        ]

        sdma_users = [
            GovernmentUser(
                id="user-sdma-01",
                name="Dravid R.",
                email="dravid.analyst@sdma.gov.in",
                role=RoleEnum.GOVERNMENT_ANALYST,
                organization_id="org-sdma",
                department_id="dept-sdma-dm",
                department_name="Disaster Management & Emergency Response",
                assigned_region="Derna Coastal District & Wadi Basin",
                avatar_initials="DR"
            ),
            GovernmentUser(
                id="user-sdma-02",
                name="Dr. Rajesh Sekhar",
                email="r.sekhar@sdma.gov.in",
                role=RoleEnum.ORG_ADMIN,
                organization_id="org-sdma",
                department_id="dept-sdma-dm",
                department_name="Disaster Management & Emergency Response",
                assigned_region="All Jurisdictions",
                avatar_initials="RS"
            ),
            GovernmentUser(
                id="user-sdma-03",
                name="Officer K. Sundaram",
                email="k.sundaram@sdma.gov.in",
                role=RoleEnum.FIELD_OFFICER,
                organization_id="org-sdma",
                department_id="dept-sdma-infra",
                department_name="Civil Infrastructure & Lifeline Transit",
                assigned_region="Madurai Vaigai River Basin",
                avatar_initials="KS"
            )
        ]

        self.organizations["org-sdma"] = TenantOrganization(
            id="org-sdma",
            name="State Disaster Management Authority",
            type="Government Authority",
            code="SDMA",
            logo_icon="🏛️",
            badge_label="Government Authority · Civil Defense",
            departments=sdma_depts,
            regions=sdma_regions,
            users=sdma_users,
            active_cases_count=4,
            active_alerts_count=4,
            total_monitored_area_km2=45.4
        )

        # 2. Environmental Monitoring Authority (EMA)
        ema_depts = [
            Department(
                id="dept-ema-forest",
                name="Forestry & Canopy Protection",
                code="FOREST",
                icon="🌲",
                focus_areas=["Illegal Deforestation", "Canopy Loss", "Buffer Encroachment"],
                lead_officer="Dr. Carlos Silva",
                active_cases=3
            ),
            Department(
                id="dept-ema-climate",
                name="Climate Risk & Land Degradation",
                code="CLIM",
                icon="🌡️",
                focus_areas=["Soil Erosion", "Desertification", "Burn Scars"],
                lead_officer="Maria Santos",
                active_cases=2
            )
        ]

        ema_regions = [
            OperationalRegion(
                id="reg-amazon-01",
                name="Rondônia Indigenous Arc & Forest Reserve",
                type="Reserve",
                center_coords={"lat": -10.8256, "lon": -62.9512},
                zoom_level=12,
                dataset_link="amazon_deforestation",
                affected_area_km2=32.6,
                active_alerts=2,
                active_cases=3
            ),
            OperationalRegion(
                id="reg-california-01",
                name="Sierra Nevada Forest Watershed",
                type="State Park",
                center_coords={"lat": 39.7596, "lon": -121.6219},
                zoom_level=13,
                dataset_link="california_wildfire",
                affected_area_km2=22.8,
                active_alerts=1,
                active_cases=1
            )
        ]

        ema_users = [
            GovernmentUser(
                id="user-ema-01",
                name="Elena Vance",
                email="e.vance@ema.gov.org",
                role=RoleEnum.GOVERNMENT_ANALYST,
                organization_id="org-ema",
                department_id="dept-ema-forest",
                department_name="Forestry & Canopy Protection",
                assigned_region="Rondônia Indigenous Arc & Forest Reserve",
                avatar_initials="EV"
            )
        ]

        self.organizations["org-ema"] = TenantOrganization(
            id="org-ema",
            name="Environmental Monitoring Authority",
            type="Environmental Monitoring Authority",
            code="EMA",
            logo_icon="🌿",
            badge_label="Environmental Authority · Ecosystem Watch",
            departments=ema_depts,
            regions=ema_regions,
            users=ema_users,
            active_cases_count=4,
            active_alerts_count=3,
            total_monitored_area_km2=55.4
        )

        # 3. Municipal Planning Authority (MPA)
        mpa_depts = [
            Department(
                id="dept-mpa-urban",
                name="Urban Expansion & Master Planning",
                code="URBAN",
                icon="🏙️",
                focus_areas=["Peri-Urban Growth", "Encroachment", "Zoning Violations"],
                lead_officer="Eng. Vignesh Kumar",
                active_cases=2
            ),
            Department(
                id="dept-mpa-water",
                name="Waterbody & Tank Restoration Cell",
                code="TANKS",
                icon="💧",
                focus_areas=["Wetland Encroachment", "Catchment Preservation", "Canal Clearances"],
                lead_officer="Mrs. Ananya Krishnan",
                active_cases=2
            )
        ]

        mpa_regions = [
            OperationalRegion(
                id="reg-madurai-01",
                name="Madurai Metropolitan Master Plan Area",
                type="Municipality",
                center_coords={"lat": 9.9252, "lon": 78.1198},
                zoom_level=14,
                dataset_link="madurai_urban",
                affected_area_km2=18.4,
                active_alerts=1,
                active_cases=2
            )
        ]

        mpa_users = [
            GovernmentUser(
                id="user-mpa-01",
                name="Arun Pandian",
                email="arun.planner@madurai.gov.in",
                role=RoleEnum.GOVERNMENT_ANALYST,
                organization_id="org-mpa",
                department_id="dept-mpa-urban",
                department_name="Urban Expansion & Master Planning",
                assigned_region="Madurai Metropolitan Master Plan Area",
                avatar_initials="AP"
            )
        ]

        self.organizations["org-mpa"] = TenantOrganization(
            id="org-mpa",
            name="Municipal Planning Authority",
            type="Municipal Planning Authority",
            code="MPA",
            logo_icon="📐",
            badge_label="Municipal Authority · Cadastral Planning",
            departments=mpa_depts,
            regions=mpa_regions,
            users=mpa_users,
            active_cases_count=2,
            active_alerts_count=1,
            total_monitored_area_km2=18.4
        )

        # Pre-seed realistic government response cases
        self._seed_initial_cases()
        self._seed_initial_alerts()
        self._seed_initial_notifications()

    def _seed_initial_cases(self):
        c1 = ResponseCase(
            id="case-sdma-001",
            case_code="RC-2026-081",
            organization_id="org-sdma",
            department_id="dept-sdma-dm",
            department_name="Disaster Management & Emergency Response",
            region_id="reg-derna-01",
            related_dataset_id="derna_flooding",
            title="Wadi Derna Torrential Breach & Urban Inundation Corridor",
            location_name="Derna Coastal District, Libya",
            coordinates={"lat": 32.7667, "lon": 22.6367},
            change_type="Flooding",
            severity="CRITICAL",
            priority=PriorityEnum.CRITICAL,
            affected_area_km2=14.2,
            confidence_pct=94.0,
            potential_community_impact={
                "settlements_nearby": 6,
                "schools_nearby": 3,
                "hospitals_nearby": 1,
                "roads_affected": 6,
                "agricultural_km2": 3.6,
                "vulnerability_tier": "HIGH_VULNERABILITY"
            },
            assigned_officer_id="user-sdma-01",
            assigned_officer_name="Dravid R. (Lead Analyst)",
            status=CaseStatusEnum.UNDER_INVESTIGATION,
            created_at="2026-09-23T06:30:00Z",
            updated_at="2026-09-23T08:15:00Z",
            notes=[
                InvestigationNote(
                    id="note-1",
                    author_name="Dravid R.",
                    author_role="Government Analyst",
                    department="Disaster Management",
                    content="Satellite imagery indicates catastrophic reservoir breach with rapid overland inundation across central wadi corridor. Central Hospital within 1.2km is placed under precautionary alert.",
                    timestamp="2026-09-23T07:00:00Z"
                ),
                InvestigationNote(
                    id="note-2",
                    author_name="Dr. Rajesh Sekhar",
                    author_role="Organization Admin",
                    department="Disaster Management",
                    content="Mobilizing civil defense evacuation boats to Sector 4 wadi shoreline. Coordinated with Red Crescent.",
                    timestamp="2026-09-23T08:15:00Z"
                )
            ],
            is_public=False
        )

        c2 = ResponseCase(
            id="case-sdma-002",
            case_code="RC-2026-082",
            organization_id="org-sdma",
            department_id="dept-sdma-infra",
            department_name="Civil Infrastructure & Lifeline Transit",
            region_id="reg-derna-01",
            related_dataset_id="derna_flooding",
            title="Derna Coastal Bypass Bridge Submergence",
            location_name="Coastal Highway Bridge North, Derna",
            coordinates={"lat": 32.7712, "lon": 22.6420},
            change_type="Flooding",
            severity="HIGH",
            priority=PriorityEnum.HIGH,
            affected_area_km2=3.8,
            confidence_pct=92.5,
            potential_community_impact={
                "settlements_nearby": 2,
                "schools_nearby": 1,
                "hospitals_nearby": 0,
                "roads_affected": 3,
                "agricultural_km2": 0.5,
                "vulnerability_tier": "CRITICAL_TRANSIT_CUTOFF"
            },
            assigned_officer_id="user-sdma-03",
            assigned_officer_name="Officer K. Sundaram",
            status=CaseStatusEnum.RESPONSE_INITIATED,
            created_at="2026-09-23T07:10:00Z",
            updated_at="2026-09-23T09:00:00Z",
            notes=[
                InvestigationNote(
                    id="note-3",
                    author_name="Officer K. Sundaram",
                    author_role="Field Officer",
                    department="Infrastructure Transit",
                    content="Traffic diverted to South ring road. Structural engineering survey team en route to inspect bridge abutments.",
                    timestamp="2026-09-23T09:00:00Z"
                )
            ]
        )

        c3 = ResponseCase(
            id="case-ema-001",
            case_code="RC-2026-049",
            organization_id="org-ema",
            department_id="dept-ema-forest",
            department_name="Forestry & Canopy Protection",
            region_id="reg-amazon-01",
            related_dataset_id="amazon_deforestation",
            title="Fishbone Logging Corridor Encroachment on Indigenous Perimeter",
            location_name="Rondônia Indigenous Arc, Brazil",
            coordinates={"lat": -10.8256, "lon": -62.9512},
            change_type="Deforestation",
            severity="CRITICAL",
            priority=PriorityEnum.CRITICAL,
            affected_area_km2=8.1,
            confidence_pct=91.0,
            potential_community_impact={
                "settlements_nearby": 3,
                "schools_nearby": 1,
                "hospitals_nearby": 1,
                "roads_affected": 4,
                "agricultural_km2": 12.0,
                "vulnerability_tier": "INDIGENOUS_BUFFER_VIOLATION"
            },
            assigned_officer_id="user-ema-01",
            assigned_officer_name="Elena Vance",
            status=CaseStatusEnum.UNDER_INVESTIGATION,
            created_at="2026-09-22T19:00:00Z",
            updated_at="2026-09-23T05:00:00Z",
            notes=[
                InvestigationNote(
                    id="note-4",
                    author_name="Elena Vance",
                    author_role="Government Analyst",
                    department="Forestry Protection",
                    content="Thermal & optical differencing detects 8.1 km² illegal clearing scar expanding north toward Nova Esperança hamlet.",
                    timestamp="2026-09-22T19:30:00Z"
                )
            ]
        )

        c4 = ResponseCase(
            id="case-mpa-001",
            case_code="RC-2026-015",
            organization_id="org-mpa",
            department_id="dept-mpa-urban",
            department_name="Urban Expansion & Master Planning",
            region_id="reg-madurai-01",
            related_dataset_id="madurai_urban",
            title="Unpermitted Concrete Encroachment on Vaigai Wetland Periphery",
            location_name="Madurai South Peri-Urban Belt, India",
            coordinates={"lat": 9.9252, "lon": 78.1198},
            change_type="Urban Expansion",
            severity="MODERATE",
            priority=PriorityEnum.HIGH,
            affected_area_km2=5.2,
            confidence_pct=88.5,
            potential_community_impact={
                "settlements_nearby": 4,
                "schools_nearby": 2,
                "hospitals_nearby": 1,
                "roads_affected": 5,
                "agricultural_km2": 4.1,
                "vulnerability_tier": "CATCHMENT_ENLARGEMENT"
            },
            assigned_officer_id="user-mpa-01",
            assigned_officer_name="Arun Pandian",
            status=CaseStatusEnum.NEW,
            created_at="2026-09-21T12:00:00Z",
            updated_at="2026-09-21T12:00:00Z",
            notes=[]
        )

        for case in [c1, c2, c3, c4]:
            self.cases[case.id] = case

    def _seed_initial_alerts(self):
        alerts_data = [
            GovernmentAlert(
                id="gov-alt-01",
                organization_id="org-sdma",
                department_id="dept-sdma-dm",
                priority=PriorityEnum.CRITICAL,
                title="Rapid Flood Inundation & Dam Overtopping Alert",
                region_name="Derna Coastal District, Libya",
                dataset_id="derna_flooding",
                affected_area_km2=14.2,
                potential_settlements=6,
                confidence_pct=94.0,
                status="Active",
                created_at="2026-09-23T06:15:00Z"
            ),
            GovernmentAlert(
                id="gov-alt-02",
                organization_id="org-sdma",
                department_id="dept-sdma-infra",
                priority=PriorityEnum.HIGH,
                title="Critical Lifeline Transit Breach Detected",
                region_name="Derna Coastal District, Libya",
                dataset_id="derna_flooding",
                affected_area_km2=3.8,
                potential_settlements=2,
                confidence_pct=92.5,
                status="Active",
                created_at="2026-09-23T07:10:00Z"
            ),
            GovernmentAlert(
                id="gov-alt-03",
                organization_id="org-ema",
                department_id="dept-ema-forest",
                priority=PriorityEnum.CRITICAL,
                title="Illegal Forest Clearing Penetration",
                region_name="Rondônia Indigenous Arc, Brazil",
                dataset_id="amazon_deforestation",
                affected_area_km2=8.1,
                potential_settlements=3,
                confidence_pct=91.0,
                status="Active",
                created_at="2026-09-22T18:40:00Z"
            ),
            GovernmentAlert(
                id="gov-alt-04",
                organization_id="org-mpa",
                department_id="dept-mpa-urban",
                priority=PriorityEnum.HIGH,
                title="Catchment Basin Urban Encroachment",
                region_name="Madurai South Peri-Urban Belt, India",
                dataset_id="madurai_urban",
                affected_area_km2=5.2,
                potential_settlements=4,
                confidence_pct=88.5,
                status="Active",
                created_at="2026-09-21T11:20:00Z"
            )
        ]
        for a in alerts_data:
            self.alerts[a.id] = a

    def _seed_initial_notifications(self):
        self.notifications = [
            {
                "id": "notif-01",
                "organization_id": "org-sdma",
                "type": "NEW_CRITICAL_CHANGE",
                "title": "New High-Priority Anomaly Detected",
                "message": "Satellite pass Sentinel-2 detected 14.2 km² rapid inundation surge in Derna wadi corridor.",
                "timestamp": "2026-09-23T06:15:00Z",
                "read": False,
                "case_link": "case-sdma-001"
            },
            {
                "id": "notif-02",
                "organization_id": "org-sdma",
                "type": "CASE_ASSIGNMENT",
                "title": "Response Case RC-2026-081 Assigned",
                "message": "Assigned to Dravid R. (Disaster Management & Emergency Response).",
                "timestamp": "2026-09-23T06:30:00Z",
                "read": False,
                "case_link": "case-sdma-001"
            },
            {
                "id": "notif-03",
                "organization_id": "org-sdma",
                "type": "FIELD_UPDATE",
                "title": "Investigation Note Appended",
                "message": "Dr. Rajesh Sekhar added an operational evacuation update to Case RC-2026-081.",
                "timestamp": "2026-09-23T08:15:00Z",
                "read": True,
                "case_link": "case-sdma-001"
            }
        ]

    # Organization & Tenant Management
    def get_tenants(self) -> List[TenantOrganization]:
        return list(self.organizations.values())

    def get_tenant(self, org_id: str) -> Optional[TenantOrganization]:
        return self.organizations.get(org_id)

    # Response Cases CRUD (Strict Tenant Isolation)
    def get_cases(
        self,
        org_id: str,
        department_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[ResponseCase]:
        tenant_cases = [c for c in self.cases.values() if c.organization_id == org_id]
        if department_id:
            tenant_cases = [c for c in tenant_cases if c.department_id == department_id]
        if status:
            tenant_cases = [c for c in tenant_cases if c.status.value.lower() == status.lower()]
        if priority:
            tenant_cases = [c for c in tenant_cases if c.priority.value.lower() == priority.lower()]
        return sorted(tenant_cases, key=lambda c: c.created_at, reverse=True)

    def get_case(self, case_id: str, org_id: str) -> Optional[ResponseCase]:
        case = self.cases.get(case_id)
        if case and case.organization_id == org_id:
            return case
        return None

    def create_case(self, req: CreateCaseRequest) -> ResponseCase:
        org = self.get_tenant(req.organization_id)
        dept_name = "Government Operational Unit"
        if org:
            for d in org.departments:
                if d.id == req.department_id:
                    dept_name = d.name
                    break

        case_id = f"case-{uuid.uuid4().hex[:8]}"
        seq_num = len(self.cases) + 85
        case_code = f"RC-2026-{seq_num:03d}"
        now_iso = datetime.utcnow().isoformat() + "Z"

        notes = []
        if req.initial_note:
            notes.append(
                InvestigationNote(
                    id=f"note-{uuid.uuid4().hex[:6]}",
                    author_name=req.assigned_officer_name or "Government Analyst",
                    author_role="Government Analyst",
                    department=dept_name,
                    content=req.initial_note,
                    timestamp=now_iso
                )
            )

        new_case = ResponseCase(
            id=case_id,
            case_code=case_code,
            organization_id=req.organization_id,
            department_id=req.department_id,
            department_name=dept_name,
            region_id=req.region_id,
            related_dataset_id=req.related_dataset_id,
            title=req.title,
            location_name=req.location_name,
            coordinates=req.coordinates,
            change_type=req.change_type,
            severity=req.severity,
            priority=req.priority,
            affected_area_km2=req.affected_area_km2,
            confidence_pct=req.confidence_pct,
            potential_community_impact=req.potential_community_impact,
            assigned_officer_name=req.assigned_officer_name or "Unassigned",
            status=CaseStatusEnum.NEW,
            created_at=now_iso,
            updated_at=now_iso,
            notes=notes
        )

        self.cases[case_id] = new_case

        # Push operational notification
        self.notifications.insert(0, {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "organization_id": req.organization_id,
            "type": "NEW_CASE_CREATED",
            "title": f"Response Case {case_code} Created",
            "message": f"{req.title} logged and assigned to {dept_name}.",
            "timestamp": now_iso,
            "read": False,
            "case_link": case_id
        })

        return new_case

    def update_case(self, case_id: str, org_id: str, update: UpdateCaseRequest) -> Optional[ResponseCase]:
        case = self.get_case(case_id, org_id)
        if not case:
            return None

        now_iso = datetime.utcnow().isoformat() + "Z"
        case.updated_at = now_iso

        if update.status:
            case.status = update.status
        if update.priority:
            case.priority = update.priority
        if update.assigned_officer_name:
            case.assigned_officer_name = update.assigned_officer_name
        if update.assigned_department_id:
            case.department_id = update.assigned_department_id
            org = self.get_tenant(org_id)
            if org:
                for d in org.departments:
                    if d.id == update.assigned_department_id:
                        case.department_name = d.name
                        break

        if update.new_note:
            case.notes.append(
                InvestigationNote(
                    id=f"note-{uuid.uuid4().hex[:6]}",
                    author_name="Government Officer",
                    author_role="Investigator",
                    department=case.department_name,
                    content=update.new_note,
                    timestamp=now_iso
                )
            )

        return case

    # Action Center: Urgent items requiring immediate investigation
    def get_action_center(self, org_id: str) -> Dict[str, Any]:
        cases = self.get_cases(org_id)
        urgent_cases = [c for c in cases if c.priority in [PriorityEnum.CRITICAL, PriorityEnum.HIGH] and c.status != CaseStatusEnum.RESOLVED]
        alerts = [a for a in self.alerts.values() if a.organization_id == org_id]

        return {
            "organization_id": org_id,
            "urgent_cases_count": len(urgent_cases),
            "urgent_cases": urgent_cases,
            "active_alerts": alerts,
            "response_readiness_pct": 94.2
        }

    # Regional Intelligence Aggregator
    def get_regional_intelligence(self, org_id: str, region_id: Optional[str] = None) -> Dict[str, Any]:
        org = self.get_tenant(org_id)
        if not org:
            return {}

        regions = org.regions
        selected_region = regions[0] if regions else None
        if region_id:
            for r in regions:
                if r.id == region_id:
                    selected_region = r
                    break

        cases = self.get_cases(org_id)
        total_affected = sum(c.affected_area_km2 for c in cases) or (selected_region.affected_area_km2 if selected_region else 14.2)
        total_settlements = sum(c.potential_community_impact.get("settlements_nearby", 0) for c in cases) or 8
        total_schools = sum(c.potential_community_impact.get("schools_nearby", 0) for c in cases) or 3
        total_hospitals = sum(c.potential_community_impact.get("hospitals_nearby", 0) for c in cases) or 1

        return {
            "organization": {
                "id": org.id,
                "name": org.name,
                "badge": org.badge_label,
                "logo": org.logo_icon
            },
            "selected_region": selected_region.dict() if selected_region else None,
            "regions_list": [r.dict() for r in regions],
            "departments_list": [d.dict() for d in org.departments],
            "metrics": {
                "active_alerts": len([a for a in self.alerts.values() if a.organization_id == org_id]),
                "high_priority_changes": len([c for c in cases if c.priority == PriorityEnum.CRITICAL]),
                "total_affected_area_km2": round(total_affected, 1),
                "communities_potentially_affected": total_settlements,
                "critical_infrastructure_at_risk": total_schools + total_hospitals + 2
            },
            "category_distribution": [
                {"category": "Flooding", "area_km2": 14.2, "percentage": 48},
                {"category": "Urban Expansion", "area_km2": 8.4, "percentage": 28},
                {"category": "Deforestation", "area_km2": 5.2, "percentage": 17},
                {"category": "Wildfire Scars", "area_km2": 2.1, "percentage": 7}
            ]
        }

    # Notification Center
    def get_notifications(self, org_id: str) -> List[Dict[str, Any]]:
        return [n for n in self.notifications if n["organization_id"] == org_id]

    def mark_notifications_read(self, org_id: str) -> bool:
        for n in self.notifications:
            if n["organization_id"] == org_id:
                n["read"] = True
        return True

    # Government Situation Report Compiler
    def generate_situation_report(self, org_id: str, case_id: str) -> Dict[str, Any]:
        case = self.get_case(case_id, org_id)
        org = self.get_tenant(org_id)
        if not case or not org:
            return {}

        now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        return {
            "report_id": f"SITREP-{case.case_code}-{datetime.utcnow().strftime('%Y%m%d')}",
            "generated_at": now_iso,
            "organization_name": org.name,
            "department_name": case.department_name,
            "case_code": case.case_code,
            "title": case.title,
            "location_name": case.location_name,
            "coordinates": case.coordinates,
            "change_type": case.change_type,
            "severity": case.severity,
            "priority": case.priority.value,
            "affected_area_km2": case.affected_area_km2,
            "confidence_pct": case.confidence_pct,
            "potential_community_impact": case.potential_community_impact,
            "status": case.status.value,
            "assigned_officer": case.assigned_officer_name,
            "notes": [n.dict() for n in case.notes],
            "disclaimer": "Designated as POTENTIALLY AFFECTED via spaceborne multispectral differential analysis. Field ground verification mandatory prior to physical asset dispatch."
        }


# Singleton Engine Instance
gov_engine = GovernmentEngine()
