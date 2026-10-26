import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { propertyService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import {
  Project,
  Unit,
  UnitType,
  UnitStatus,
  UNIT_TYPE_LABELS,
  UNIT_STATUS_COLORS,
  formatCurrency
} from '../types';
import { MdApartment, MdAdd, MdLocationOn, MdBookmarkAdded, MdFilterList, MdSquareFoot, MdLayers } from 'react-icons/md';

const PROJECT_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
];

const UNIT_TYPE_IMAGES: Record<string, string> = {
  STUDIO:     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
  ONE_BHK:    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
  TWO_BHK:    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  THREE_BHK:  'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80',
  FOUR_BHK:   'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80',
  PENTHOUSE:  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
  VILLA:      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
  PLOT:       'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80',
  COMMERCIAL: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
};
import { Pagination } from '../components/Pagination';

const UNITS_LIMIT = 12;

export const PropertiesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsPage, setUnitsPage] = useState(1);
  const [totalUnitsCount, setTotalUnitsCount] = useState(0);
  const unitsTotalPages = Math.ceil(totalUnitsCount / UNITS_LIMIT);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', location: '', description: '' });

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [buildingsForProject, setBuildingsForProject] = useState<any[]>([]);
  const [newUnit, setNewUnit] = useState({
    unitNumber: '',
    buildingId: '',
    type: UnitType.TWO_BHK,
    floor: 1,
    area: 1050,
    price: 7500000,
  });
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: '', floors: 10 });
  const [buildingError, setBuildingError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await propertyService.listProjects();
      setProjects(res.projects);
      if (res.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.projects[0].id);
      }
    } catch {
      setLoading(false);
    }
  }, [selectedProjectId]);

  const fetchUnits = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const filters: any = { projectId: selectedProjectId, page: String(unitsPage), limit: String(UNITS_LIMIT) };
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;
      const res = await propertyService.listUnits(filters);
      setUnits(res.units);
      setTotalUnitsCount((res as any).pagination?.total ?? res.units.length);
    } catch (err) {
      console.error(err);
    }
  }, [selectedProjectId, statusFilter, typeFilter, unitsPage]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await propertyService.createProject(newProject);
      setProjects([res.project, ...projects]);
      setSelectedProjectId(res.project.id);
      setShowProjectModal(false);
      setNewProject({ name: '', location: '', description: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleOpenUnitModal = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await propertyService.listBuildings(selectedProjectId);
      setBuildingsForProject(res.buildings);
      setNewUnit(prev => ({ ...prev, buildingId: res.buildings.length > 0 ? res.buildings[0].id : '' }));
      setShowBuildingForm(res.buildings.length === 0);
      setBuildingError(null);
      setNewBuilding({ name: '', floors: 10 });
      setShowUnitModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBuilding = async () => {
    if (!newBuilding.name.trim()) { setBuildingError('Building name is required'); return; }
    try {
      setBuildingError(null);
      const res = await propertyService.createBuilding({ ...newBuilding, projectId: selectedProjectId, floors: Number(newBuilding.floors) });
      const updated = [...buildingsForProject, res.building];
      setBuildingsForProject(updated);
      setNewUnit(prev => ({ ...prev, buildingId: res.building.id }));
      setShowBuildingForm(false);
      setNewBuilding({ name: '', floors: 10 });
    } catch (err: any) {
      setBuildingError(err.response?.data?.error || 'Failed to create building');
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await propertyService.createUnit({
        ...newUnit,
        floor: Number(newUnit.floor),
        area: Number(newUnit.area),
        price: Number(newUnit.price),
      });
      setShowUnitModal(false);
      fetchUnits();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create unit');
    }
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Real Estate Projects & Inventory</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Explore masterplans, tower inventory, unit configurations and live availability
          </p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <>
              <button className="btn-secondary" onClick={() => setShowProjectModal(true)}>
                <MdAdd /> New Project
              </button>
              <button className="btn-primary" onClick={handleOpenUnitModal}>
                <MdAdd /> Add Unit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Projects Horizontal Selector */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        {projects.map((proj, idx) => {
          const isSelected = proj.id === selectedProjectId;
          const imgUrl = PROJECT_IMAGES[idx % PROJECT_IMAGES.length];
          return (
            <div
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              style={{
                minWidth: '260px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: isSelected ? '2px solid #0D9488' : '2px solid transparent',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 8px 24px rgba(13,148,136,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                background: '#fff',
                flexShrink: 0,
              }}
            >
              {/* Project image */}
              <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
                <img
                  src={imgUrl}
                  alt={proj.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.65) 0%, transparent 55%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: '8px', left: '10px', right: '10px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                }}>
                  <strong style={{ color: '#fff', fontSize: '0.95rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)', lineHeight: 1.2 }}>
                    {proj.name}
                  </strong>
                  {isSelected && (
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: '#0D9488', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                      Selected
                    </span>
                  )}
                </div>
              </div>
              {/* Project meta */}
              <div style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontSize: '0.78rem', marginBottom: '0.6rem' }}>
                  <MdLocationOn size={13} style={{ color: '#0D9488', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.location}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#ECFDF5', color: '#059669', border: '1px solid #D1FAE5' }}>
                    {proj.availableUnits || 0} Available
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#EFF6FF', color: '#172554', border: '1px solid #DBEAFE' }}>
                    {proj.bookedUnits || 0} Booked
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                    {proj.totalUnits || 0} Total
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar for Units */}
      <div className="filters-bar">
        <div className="filter-select">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses (Available, Booked, Sold)</option>
            {Object.values(UnitStatus).map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Unit Types</option>
            {Object.values(UnitType).map(t => (
              <option key={t} value={t}>{UNIT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {(statusFilter || typeFilter) && (
          <button
            className="btn-ghost btn-sm"
            onClick={() => { setStatusFilter(''); setTypeFilter(''); }}
          >
            <MdFilterList /> Reset Unit Filters
          </button>
        )}
      </div>

      {/* Units Inventory Grid */}
      <div className="data-card">
        <div className="card-header">
          <h3>
            <MdApartment style={{ color: '#6366f1' }} />
            {currentProject?.name || 'Project'} — Unit Inventory
          </h3>
          <span className="text-muted text-xs">
            Showing {units.length} of {totalUnitsCount} units
          </span>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading project units...</p>
            </div>
          ) : units.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No units match current filter</h3>
              <p>Adjust your availability or configuration filters above.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {units.map((unit) => {
                const isAvailable = unit.status === UnitStatus.AVAILABLE;
                const statusColor = UNIT_STATUS_COLORS[unit.status] || '#6b7280';
                const imgUrl = UNIT_TYPE_IMAGES[unit.type] || UNIT_TYPE_IMAGES.TWO_BHK;
                return (
                  <div
                    key={unit.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Unit image */}
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                      <img
                        src={imgUrl}
                        alt={UNIT_TYPE_LABELS[unit.type]}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 50%)',
                      }} />
                      {/* Status badge on image */}
                      <span
                        className={`status-badge ${unit.status.toLowerCase()}`}
                        style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.68rem' }}
                      >
                        {unit.status}
                      </span>
                      {/* Unit number on image */}
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                          Unit {unit.unitNumber}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>
                          {unit.building?.name} · Floor {unit.floor}
                        </div>
                      </div>
                      {/* Color accent bar */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: statusColor }} />
                    </div>

                    {/* Unit details */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#172554', fontSize: '0.9rem' }}>
                          {UNIT_TYPE_LABELS[unit.type]}
                        </span>
                        <span style={{ color: '#0D9488', fontWeight: 800, fontSize: '1rem' }}>
                          {formatCurrency(unit.price)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#475569', background: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          <MdSquareFoot size={13} style={{ color: '#0D9488' }} />
                          {unit.area} sq.ft
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#475569', background: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          <MdLayers size={13} style={{ color: '#6366F1' }} />
                          Floor {unit.floor}
                        </span>
                      </div>

                      {isAvailable ? (
                        <button
                          className="btn-primary btn-sm"
                          style={{ width: '100%', marginTop: 'auto' }}
                          onClick={() => navigate(`/bookings?unitId=${unit.id}`)}
                        >
                          <MdBookmarkAdded /> Book This Unit
                        </button>
                      ) : (
                        <button
                          className="btn-secondary btn-sm"
                          disabled
                          style={{ width: '100%', marginTop: 'auto', opacity: 0.55 }}
                        >
                          Unit {unit.status}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Pagination page={unitsPage} totalPages={unitsTotalPages} total={totalUnitsCount} limit={UNITS_LIMIT} onPageChange={setUnitsPage} />
      </div>

      {/* Create Project Modal */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)} centered>
        <form onSubmit={handleCreateProject}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group">
              <label>Project Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Skyline Residency"
              />
            </div>
            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                className="form-control"
                required
                value={newProject.location}
                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                placeholder="e.g. Whitefield, Bengaluru"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project highlights, clubhouse amenities, etc."
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">Create Project</button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Create Unit Modal */}
      <Modal show={showUnitModal} onHide={() => setShowUnitModal(false)} centered>
        <form onSubmit={handleCreateUnit}>
          <Modal.Header closeButton>
            <Modal.Title>Add Unit to Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ margin: 0 }}>Building / Tower *</label>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => { setShowBuildingForm(v => !v); setBuildingError(null); }}
                >
                  {showBuildingForm ? '✕ Cancel' : '+ New Building'}
                </button>
              </div>

              {showBuildingForm ? (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.85rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Building name e.g. Tower A"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Floors"
                      value={newBuilding.floors}
                      onChange={(e) => setNewBuilding({ ...newBuilding, floors: Number(e.target.value) })}
                    />
                  </div>
                  {buildingError && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{buildingError}</div>
                  )}
                  <button type="button" className="btn-primary btn-sm" onClick={handleCreateBuilding}>
                    Create Building
                  </button>
                </div>
              ) : (
                <select
                  className="form-select"
                  required
                  value={newUnit.buildingId}
                  onChange={(e) => setNewUnit({ ...newUnit, buildingId: e.target.value })}
                >
                  {buildingsForProject.length === 0 ? (
                    <option value="" disabled>No buildings — create one above</option>
                  ) : (
                    buildingsForProject.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.floors} Floors)</option>
                    ))
                  )}
                </select>
              )}
            </div>
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Unit Number *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. A-402"
                  value={newUnit.unitNumber}
                  onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Floor *</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={newUnit.floor}
                  onChange={(e) => setNewUnit({ ...newUnit, floor: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Unit Type *</label>
                <select
                  className="form-select"
                  value={newUnit.type}
                  onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value as UnitType })}
                >
                  {Object.values(UnitType).map(t => (
                    <option key={t} value={t}>{UNIT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Carpet Area (sq.ft) *</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={newUnit.area}
                  onChange={(e) => setNewUnit({ ...newUnit, area: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Price (INR) *</label>
              <input
                type="number"
                className="form-control"
                required
                value={newUnit.price}
                onChange={(e) => setNewUnit({ ...newUnit, price: Number(e.target.value) })}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-secondary" onClick={() => setShowUnitModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">Add Unit</button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};
