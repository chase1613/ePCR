import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../components/layout/Sidebar";
import "./Reviews.css";
import uFuzzy from '@leeoniya/ufuzzy'

const API          = import.meta.env.VITE_API_URL;
const PILLARS_URL  = `${API}/pillars`;
const PILLAR_TYPES = ["Core Function", "Strategic Function", "Support Function"];
const PAGE_SIZE    = 10;

const TYPE_CONFIG = {
  "Core Function": {
    bg: "#E6F1FB", color: "#0C447C", border: "#C2D9F0",
    icon: <i className="fa-solid fa-gear" />,
  },
  "Strategic Function": {
    bg: "#E1F5EE", color: "#085041", border: "#9FE1CB",
    icon: <i className="fa-solid fa-brain" />,
  },
  "Support Function": {
    bg: "#FAEEDA", color: "#633806", border: "#F5CFA0",
    icon: <i className="fa-solid fa-hand-holding-hand" />,
  },
};

const emptyForm = { name: "", type: "Core Function", description: "", division: "" };

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange, color }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button className="pagination__btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination__btn ${current === p ? "pagination__btn--active" : ""}`}
          style={current === p ? { background: color, color: "#fff", borderColor: color } : {}}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="pagination__btn" disabled={current === total} onClick={() => onChange(current + 1)}>›</button>
    </div>
  );
}

  const uf = new uFuzzy({ intraIns: 1 })

export default function Reviews() {
  const [pillars,        setPillars]        = useState([]);
  const [divisions,      setDivisions]      = useState([]); // distinct divisions from DB
  const [loading,        setLoading]        = useState(true);
  const [divisionFilter, setDivisionFilter] = useState("all"); // which division tab is active
  const [typeFilter,     setTypeFilter]     = useState("all");
  const [search,         setSearch]         = useState("");
  const [showModal,      setShowModal]      = useState(false);
  const [editPillar,     setEditPillar]     = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [formErrors,     setFormErrors]     = useState({});
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [collapsedTypes,    setCollapsedTypes]    = useState({});
  const [showDivModal,      setShowDivModal]      = useState(false);
  const [newDivName,        setNewDivName]        = useState("");
  const [newDivError,       setNewDivError]       = useState("");
  const [divDropOpen,       setDivDropOpen]       = useState(false);
  const [divSearch,         setDivSearch]         = useState("");
  const [showEditDivModal,  setShowEditDivModal]  = useState(false);
  const [editDivOldName,    setEditDivOldName]    = useState("");
  const [editDivNewName,    setEditDivNewName]    = useState("");
  const [editDivError,      setEditDivError]      = useState("");
  const [editDivSaving,     setEditDivSaving]     = useState(false);
  const [selectedPillars, setSelectedPillars] = useState(new Set())
  const [selectMode,      setSelectMode]      = useState(false)
  const [typeDropOpen, setTypeDropOpen] = useState(false);

  // pages keyed by "division|||type" e.g. "Legal|||Core Function"
  const [pages, setPages] = useState({});

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  // ── Fetch divisions (distinct) ────────────────────────────────────────────
  const fetchDivisions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${PILLARS_URL}/divisions`, getAuthHeaders());
      setDivisions(data);
    } catch (err) {
      console.error("fetchDivisions error:", err.message);
    }
  }, []);

  // ── Fetch pillars ─────────────────────────────────────────────────────────
  const fetchPillars = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(PILLARS_URL, getAuthHeaders());
      setPillars(data);
    } catch (err) {
      console.error("fetchPillars error:", err.message);
      showToast("Failed to load pillars.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPillars();
    fetchDivisions();
  }, [fetchPillars, fetchDivisions]);

  // ── Collapse helpers ───────────────────────────────────────────────────────
  const collapseKey = (division, type) => `${division}|||${type}`;

  const toggleCollapse = (division, type) => {
    const key = collapseKey(division, type);
    setCollapsedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCollapsed = (division, type) => !!collapsedTypes[collapseKey(division, type)];

  // ── Page helpers ───────────────────────────────────────────────────────────
  const getPage = (division, type) => pages[collapseKey(division, type)] || 1;

  const setPage = (division, type, page) => {
    setPages((prev) => ({ ...prev, [collapseKey(division, type)]: page }));
  };

  // Reset pages when search/filter changes
  useEffect(() => { setPages({}); }, [search, typeFilter, divisionFilter]);

    // ── Filtered pillars ───────────────────────────────────────────────────────
    const divTypeFiltered = pillars.filter((p) => {
    const matchDiv  = divisionFilter === "all" || p.division === divisionFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchDiv && matchType;
  });

  const filtered = (() => {
    if (!search.trim()) return divTypeFiltered;

    const haystack = divTypeFiltered.map((p) =>
      `${p.name} ${p.description || ""}`
    );

    const [idxs, info, order] = uf.search(haystack, search);
    if (!idxs || idxs.length === 0) return [];

    return (order || idxs).map((i) => divTypeFiltered[idxs[i] ?? i]);
  })();

  // ── Get active divisions (those that have pillars after filtering) ──────────
  const activeDivisions = divisionFilter === "all"
    ? [...new Set(filtered.map((p) => p.division))].sort()
    : [divisionFilter];

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = (presetDivision = null, presetType = null) => {
    setEditPillar(null);
    setForm({
      ...emptyForm,
      division: presetDivision || (divisions[0] || ""),
      type:     presetType    || "Core Function",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPillar(p);
    setForm({ name: p.name, type: p.type, description: p.description || "", division: p.division });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditPillar(null); };

  // ── Validate ───────────────────────────────────────────────────────────────
      const validate = () => {
      const errs = {};
      if (!form.name.trim())        errs.name        = "Required";
      if (!form.division.trim())    errs.division     = "Required";
      if (!form.description.trim()) errs.description  = "Required";

      // ── Duplicate success indicator check ──
      const isDuplicate = pillars.some((p) => {
        const sameDescription = p.description.trim().toLowerCase() === form.description.trim().toLowerCase();
        const notSameRecord   = !editPillar || p.id !== editPillar.id;
        return sameDescription && notSameRecord;
      });

      if (isDuplicate) {
        errs.description = "This success indicator already exists. Please use a unique one.";
      }

      return errs;
    };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setFormErrors(errs);

    try {
      setSubmitting(true);
      const payload = {
        name:        form.name,
        type:        form.type,
        description: form.description,
        division:    form.division,
      };

      if (editPillar) {
        await axios.put(`${PILLARS_URL}/${editPillar.id}`, payload, getAuthHeaders());
        showToast("Performance pillar updated successfully.");
      } else {
        await axios.post(PILLARS_URL, payload, getAuthHeaders());
        showToast("Performance pillar added successfully.");
      }

      await fetchPillars();
      await fetchDivisions();
      closeModal();
    } catch (err) {
      console.error("handleSubmit error:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
  try {
    setDeleting(true)
    await axios.delete(`${PILLARS_URL}/${deleteTarget.id}`, getAuthHeaders())
    showToast(`"${deleteTarget.name}" has been deleted.`, "error")
    await fetchPillars()
    await fetchDivisions()

    // ── Reset page if current page is now empty ──
    setPages((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        const [division, type] = key.split('|||')
        const remaining = pillars
          .filter((p) => p.id !== deleteTarget.id)
          .filter((p) => p.division === division && p.type === type)
        const maxPage = Math.max(1, Math.ceil(remaining.length / PAGE_SIZE))
        if (updated[key] > maxPage) updated[key] = maxPage
      })
      return updated
    })

    setDeleteTarget(null)
  } catch (err) {
    console.error("handleDelete error:", err.response?.data || err.message)
    showToast(err.response?.data?.message || "Failed to delete.", "error")
  } finally {
    setDeleting(false)
  }
}

  // ── Edit Division name (bulk-updates all pillars in that division) ────────
  const handleEditDivision = async () => {
    if (!editDivNewName.trim())                          return setEditDivError("Division name is required.");
    if (editDivNewName.trim() === editDivOldName)        return setEditDivError("New name is the same as the current name.");
    if (divisions.includes(editDivNewName.trim()))       return setEditDivError("A division with this name already exists.");

    try {
      setEditDivSaving(true);
      await axios.patch(
        `${PILLARS_URL}/division-rename`,
        { oldDivision: editDivOldName, newDivision: editDivNewName.trim() },
        getAuthHeaders()
      );
      if (divisionFilter === editDivOldName) setDivisionFilter(editDivNewName.trim());
      showToast(`Division renamed to "${editDivNewName.trim()}".`);
      await fetchPillars();
      await fetchDivisions();
      setShowEditDivModal(false);
    } catch (err) {
      console.error("handleEditDivision error:", err.response?.data || err.message);
      setEditDivError(err.response?.data?.message || "Failed to rename division.");
    } finally {
      setEditDivSaving(false);
    }
  };

    const toggleSelect = (id) => {
    setSelectedPillars((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = (rows) => {
    const allIds = rows.map((p) => p.id)
    const allSelected = allIds.every((id) => selectedPillars.has(id))
    setSelectedPillars((prev) => {
      const next = new Set(prev)
      allIds.forEach((id) => allSelected ? next.delete(id) : next.add(id))
      return next
    })
  }

  const handleMassDelete = async () => {
    if (selectedPillars.size === 0) return
    if (!window.confirm(`Delete ${selectedPillars.size} selected pillar(s)? This cannot be undone.`)) return
    try {
      await Promise.all(
        [...selectedPillars].map((id) =>
          axios.delete(`${PILLARS_URL}/${id}`, getAuthHeaders())
        )
      )
      showToast(`${selectedPillars.size} pillar(s) deleted.`, 'error')
      setSelectedPillars(new Set())
      setSelectMode(false)
      await fetchPillars()
      await fetchDivisions()
    } catch (err) {
      showToast('Failed to delete some pillars.', 'error')
    }
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">

        {/* ── Toast ── */}
        {toast && (
          <div className={`toast toast--${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            {toast.message}
          </div>
        )}

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Performance Pillars</h1>
            <p className="page-sub">Manage pillars by division and function type</p>
          </div>
          <button className="btn-primary" onClick={() => { setNewDivName(""); setNewDivError(""); setShowDivModal(true); }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M3 8h10"/>
            </svg>
            Add Division
          </button>
        </div>

        {/* ── Division Combobox ── */}
        {(() => {
          const divLabel = divisionFilter === "all" ? "All Divisions" : divisionFilter;
          const divCount = divisionFilter === "all"
            ? pillars.length
            : pillars.filter((p) => p.division === divisionFilter).length;

          const filteredDivs = ["all", ...divisions].filter((d) => {
            const label = d === "all" ? "All Divisions" : d;
            return label.toLowerCase().includes(divSearch.toLowerCase());
          });

          return (
            <div className="div-combobox-wrap" style={{ position: "relative" }}>
              {/* Trigger button */}
              <button
                className="div-combobox-trigger"
                onClick={() => { setDivDropOpen((o) => !o); setDivSearch(""); }}
              >
                <div className="div-combobox-trigger__left">
                  <div className="div-combobox-trigger__icon">
                    <i className="fa-solid fa-building" />
                  </div>
                  <div>
                    <div className="div-combobox-trigger__label">Division</div>
                    <div className="div-combobox-trigger__value">
                  <span style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}>
                    {divLabel}
                  </span>
                  <span className="div-combobox-trigger__badge" style={{ flexShrink: 0 }}>
                    {divCount}
                  </span>
                </div>
                  </div>
                </div>
                <svg
                  className={`div-combobox-trigger__chevron ${divDropOpen ? "div-combobox-trigger__chevron--open" : ""}`}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
                >
                  <path d="M4 6l4 4 4-4"/>
                </svg>
              </button>

              {/* Dropdown panel */}
              {divDropOpen && (
                <>
                  {/* Click-away overlay */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 99 }}
                    onClick={() => setDivDropOpen(false)}
                  />
                  <div className="div-combobox-panel">
                    {/* Search input */}
                    <div className="div-combobox-search-wrap">
                      <i className="fa-solid fa-magnifying-glass div-combobox-search-icon" />
                      <input
                        className="div-combobox-search"
                        placeholder="Search divisions..."
                        value={divSearch}
                        autoFocus
                        onChange={(e) => setDivSearch(e.target.value)}
                      />
                      {divSearch && (
                        <button className="div-combobox-clear" onClick={() => setDivSearch("")}>
                          <i className="fa-solid fa-xmark" />
                        </button>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="div-combobox-list">
                      {filteredDivs.length === 0 ? (
                        <div className="div-combobox-empty">No divisions found</div>
                      ) : (
                        filteredDivs.map((d) => {
                          const isAll     = d === "all";
                          const label     = isAll ? "All Divisions" : d;
                          const count     = isAll ? pillars.length : pillars.filter((p) => p.division === d).length;
                          const isActive  = divisionFilter === d;
                          return (
                            <div key={d} className="div-combobox-option-wrap">
                              <button
                                className={`div-combobox-option ${isActive ? "div-combobox-option--active" : ""}`}
                                onClick={() => {
                                  setDivisionFilter(d);
                                  setDivDropOpen(false);
                                  setDivSearch("");
                                }}
                              >
                                <span className="div-combobox-option__label">{label}</span>
                                <span className="div-combobox-option__count">{count}</span>
                                {isActive && (
                                  <i className="fa-solid fa-check div-combobox-option__check" />
                                )}
                              </button>
                              {/* Edit pencil — only for real divisions, not "All" */}
                              {!isAll && (
                                <button
                                  className="div-combobox-option__edit"
                                  title={`Rename "${d}"`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditDivOldName(d);
                                    setEditDivNewName(d);
                                    setEditDivError("");
                                    setDivDropOpen(false);
                                    setShowEditDivModal(true);
                                  }}
                                >
                                  <i className="fa-solid fa-pen" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── Function Type Filter + Search ── */}
        <div className="toolbar">
          <input
            className="search-box"
            placeholder="Search pillars by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Function Types</option>
            {PILLAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="table-card">
            <div className="table-empty">Loading pillars...</div>
          </div>
        ) : filtered.length === 0 ? (
        <div className="table-card">
          <div className="table-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 16px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" width="40" height="40">
              <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
            </svg>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
              {divisionFilter !== 'all'
                ? `No pillars found in "${divisionFilter}".`
                : 'No pillars found.'
              }
            </p>
            {divisionFilter !== 'all' && (
              <button
                className="btn-primary"
                onClick={() => openCreate(divisionFilter)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                  <path d="M8 3v10M3 8h10"/>
                </svg>
                Add to {divisionFilter}
              </button>
            )}
          </div>
        </div>
        ) : (
          activeDivisions.map((division) => {
            const divisionPillars = filtered.filter((p) => p.division === division);
            if (!divisionPillars.length) return null;

            return (
              <div key={division} className="division-group">

                {/* ── Division Header ── */}
                <div className="division-group__header">
                <div className="division-group__icon">
                  <i className="fa-solid fa-building" />
                </div>
                <div>
                  <div className="division-group__title">{division}</div>
                  <div className="division-group__meta">
                    {divisionPillars.length} pillar{divisionPillars.length !== 1 ? "s" : ""}
                    {" · "}
                    {PILLAR_TYPES.filter((t) => divisionPillars.some((p) => p.type === t)).join(", ")}
                  </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {/* ── Mass delete bar ── */}
                  {selectMode && selectedPillars.size > 0 && (
                    <button
                      className="btn-sm btn-danger"
                      onClick={handleMassDelete}
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      <i className="fa-solid fa-trash" style={{ marginRight: 5 }} />
                      Delete {selectedPillars.size} selected
                    </button>
                  )}
                  <button
                    className={`btn-sm ${selectMode ? 'btn-cancel' : ''}`}
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={() => {
                      setSelectMode((v) => !v)
                      setSelectedPillars(new Set())
                    }}
                  >
                    {selectMode ? 'Cancel' : 'Select'}
                  </button>
                  <button
                    className="btn-primary btn-sm-add"
                    onClick={() => openCreate(division)}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 3v10M3 8h10"/>
                    </svg>
                    Add to {division}
                  </button>
                </div>
              </div>

                {/* ── Function Type Sub-groups ── */}
                {PILLAR_TYPES.map((type) => {
                  const typeRows = divisionPillars.filter((p) => p.type === type);
                  if (!typeRows.length) return null;

                  const cfg         = TYPE_CONFIG[type];
                  const collapsed   = isCollapsed(division, type);
                  const currentPage = getPage(division, type);
                  const totalPages  = Math.ceil(typeRows.length / PAGE_SIZE);
                  const startIdx    = (currentPage - 1) * PAGE_SIZE;
                  const pageRows    = typeRows.slice(startIdx, startIdx + PAGE_SIZE);

                  return (
                    <div key={type} className="pillar-group">

                      {/* Sub-group Header */}
                      <div
                        className="pillar-group__header"
                        style={{ borderLeft: `4px solid ${cfg.border}`, background: cfg.bg }}
                        onClick={() => toggleCollapse(division, type)}
                      >
                        <div className="pillar-group__left">
                          <div className="pillar-group__icon" style={{ color: cfg.color, fontSize: 16 }}>
                            {cfg.icon}
                          </div>
                          <div>
                            <div className="pillar-group__title" style={{ color: cfg.color }}>{type}</div>
                            <div className="pillar-group__meta">
                              {typeRows.length} pillar{typeRows.length !== 1 ? "s" : ""}
                              {totalPages > 1 && (
                                <span style={{ marginLeft: 6, color: cfg.color, fontWeight: 500 }}>
                                  · Page {currentPage} of {totalPages}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pillar-group__right">
                          <svg
                            className={`pillar-group__chevron ${collapsed ? "pillar-group__chevron--closed" : ""}`}
                            viewBox="0 0 16 16" fill="none" stroke={cfg.color} strokeWidth="1.5"
                          >
                            <path d="M4 6l4 4 4-4"/>
                          </svg>
                        </div>
                      </div>

                      {/* Pillar Table */}
                      {!collapsed && (
                        <>
                          <div className="pillar-table-wrap">
                            <table className="tbl pillar-tbl" style={{ tableLayout: "fixed", width: "100%" }}>
                              <thead>
                                <tr>
                                  {selectMode && (
                                    <th style={{ width: '4%', textAlign: 'center' }}>
                                      <input
                                        type="checkbox"
                                        onChange={() => toggleSelectAll(pageRows)}
                                        checked={pageRows.length > 0 && pageRows.every((p) => selectedPillars.has(p.id))}
                                      />
                                    </th>
                                  )}
                                  <th style={{ width: selectMode ? '3%' : '4%' }}>#</th>
                                  <th style={{ width: '25%' }}>Major Final Output Name</th>
                                  <th style={{ width: '42%' }}>Success Indicator</th>
                                  <th style={{ width: '13%' }}>Date Added</th>
                                  <th style={{ width: '13%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageRows.map((p, idx) => (
                                  <tr
                                    key={p.id}
                                    className="pillar-tbl__row"
                                    style={{
                                      height: '52px',
                                      background: selectedPillars.has(p.id) ? '#FEF2F2' : undefined,
                                    }}
                                  >
                                    {selectMode && (
                                      <td style={{ textAlign: 'center' }}>
                                        <input
                                          type="checkbox"
                                          checked={selectedPillars.has(p.id)}
                                          onChange={() => toggleSelect(p.id)}
                                        />
                                      </td>
                                    )}
                                    <td className="pillar-tbl__num">{startIdx + idx + 1}</td>
                                    <td><div className="pillar-tbl__name">{p.name}</div></td>
                                    <td className="t-muted pillar-tbl__desc">{p.description}</td>
                                    <td className="t-muted" style={{ fontSize: 11 }}>
                                      {new Date(p.created_at).toLocaleDateString("en-PH", {
                                        month: "short", day: "numeric", year: "numeric",
                                      })}
                                    </td>
                                    <td>
                                      {!selectMode && (
                                        <div className="t-actions">
                                          <button className="btn-sm" onClick={() => openEdit(p)}>Edit</button>
                                          <button className="btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>Delete</button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
                                  <tr key={`filler-${i}`} style={{ height: '52px' }}>
                                    {selectMode && <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>}
                                    <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                                    <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                                    <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                                    <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                                    <td style={{ borderBottom: '1px solid #f0f0f0' }}></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "10px 16px" }}>
                            <span className="pillar-pagination-info" style={{ color: cfg.color }}>
                              Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, typeRows.length)} of {typeRows.length}
                            </span>
                            <div style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                              <div style={{ pointerEvents: "auto" }}>
                                <Pagination
                                  current={currentPage}
                                  total={totalPages}
                                  onChange={(p) => setPage(division, type, p)}
                                  color={cfg.color}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        <div className="table-footer">
          Showing {filtered.length} of {pillars.length} pillars
        </div>

      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editPillar ? "Edit Pillar" : "Add New Pillar"}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>

              {/* Division dropdown */}
              <div className="form-row">
                <label className="form-label">Division</label>
                <select
                  className={`form-select ${formErrors.division ? "input-error" : ""}`}
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                >
                  <option value="" disabled>Select a division</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {formErrors.division && <span className="field-error">{formErrors.division}</span>}
                <span className="field-hint">
                  Division not listed?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setNewDivName(""); setNewDivError(""); setShowDivModal(true); }}
                  >
                    Add new division
                  </button>
                </span>
              </div>

              {/* Function type */}
                  <div className="form-row" style={{ position: "relative" }}>
                    <label className="form-label">Function Type</label>
                    <button
                      type="button"
                      onClick={() => setTypeDropOpen((o) => !o)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: TYPE_CONFIG[form.type].bg,
                          color: TYPE_CONFIG[form.type].color,
                          border: `1px solid ${TYPE_CONFIG[form.type].border}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          {TYPE_CONFIG[form.type].icon}
                          {form.type}
                        </span>
                      </div>
                      <svg viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.8" width="14" height="14">
                        <path d="M4 6l4 4 4-4"/>
                      </svg>
                    </button>

                    {typeDropOpen && (
                      <>
                        <div
                          style={{ position: "fixed", inset: 0, zIndex: 200 }}
                          onClick={() => setTypeDropOpen(false)}
                        />
                        <div style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                          zIndex: 201,
                          overflow: "hidden",
                        }}>
                          {PILLAR_TYPES.map((t) => {
                            const cfg = TYPE_CONFIG[t];
                            const isActive = form.type === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => { setForm({ ...form, type: t }); setTypeDropOpen(false); }}
                                style={{
                                  width: "100%",
                                  padding: "10px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  background: isActive ? cfg.bg : "#fff",
                                  border: "none",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = cfg.bg; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
                              >
                                <span style={{
                                  padding: "3px 12px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: cfg.bg,
                                  color: cfg.color,
                                  border: `1px solid ${cfg.border}`,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}>
                                  {cfg.icon}
                                  {t}
                                </span>
                                {isActive && (
                                  <i className="fa-solid fa-check" style={{ color: cfg.color, fontSize: 12 }} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

              {/* Pillar name */}
              <div className="form-row">
                <label className="form-label">Pillar Name</label>
                <input
                  className={`form-input ${formErrors.name ? "input-error" : ""}`}
                  placeholder="e.g. Recruitment and Selection"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>

              {/* Description */}
              <div className="form-row">
                <label className="form-label">Success Indicator</label>
                <textarea
                  className={`form-input form-textarea ${formErrors.description ? "input-error" : ""}`}
                  placeholder="Describe the success indicator for this pillar..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                {formErrors.description && <span className="field-error">{formErrors.description}</span>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : editPillar ? "Save Changes" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Pillar</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>
            <p className="delete-msg">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Division Modal ── */}
      {showDivModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDivModal(false)}>
          <div className="modal modal--sm modal--div" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="div-modal-icon">
                <i className="fa-solid fa-building" />
              </div>
              <div>
                <h2 className="modal-title" style={{ marginBottom: 2 }}>Add New Division</h2>
              </div>
              <button className="modal-close" style={{ marginLeft: "auto" }} onClick={() => setShowDivModal(false)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <label className="form-label">Division Name</label>
              <input
                className={`form-input ${newDivError ? "input-error" : ""}`}
                placeholder="e.g. Legal Division, Admin Division..."
                value={newDivName}
                autoFocus
                onChange={(e) => { setNewDivName(e.target.value); setNewDivError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!newDivName.trim()) return setNewDivError("Division name is required.");
                    if (divisions.includes(newDivName.trim())) return setNewDivError("This division already exists.");
                    setDivisions((prev) => [...new Set([...prev, newDivName.trim()])].sort());
                    setForm((f) => ({ ...f, division: newDivName.trim() }));
                    showToast(`Division "${newDivName.trim()}" added successfully.`)
                    setShowDivModal(false);
                  }
                }}
              />
              {newDivError && <span className="field-error">{newDivError}</span>}
              {!newDivError && (
                <span className="field-hint" style={{ marginTop: 6 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
                  Once created, you can begin adding pillars to this division.
                </span>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button className="btn-cancel" onClick={() => setShowDivModal(false)}>Cancel</button>
              <button
                className="btn-save"
                onClick={async () => {
                  if (!newDivName.trim()) return setNewDivError("Division name is required.")
                  if (divisions.includes(newDivName.trim())) return setNewDivError("This division already exists.")

                  try {
                    await axios.post(`${PILLARS_URL}/divisions`, 
                      { name: newDivName.trim() }, 
                      getAuthHeaders()
                    )
                    await fetchDivisions() // ← refresh from DB
                    setForm((f) => ({ ...f, division: newDivName.trim() }))
                    showToast(`Division "${newDivName.trim()}" added successfully.`)
                    setShowDivModal(false)
                  } catch (err) {
                    setNewDivError(err.response?.data?.message || 'Failed to add division.')
                  }
                }}
              >
                <i className="fa-solid fa-plus" style={{ marginRight: 6 }} />
                Add Division
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Division Modal ── */}
        {showEditDivModal && (
          <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowEditDivModal(false)}>
            <div className="modal modal--sm modal--div" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ alignItems: 'center' }}>  {/* ← center fix */}
                <div className="div-modal-icon" style={{ background: "#FFF3E0", color: "#E65100" }}>
                  <i className="fa-solid fa-pen" />  {/* ← pen icon not building */}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 className="modal-title" style={{ marginBottom: 2 }}>Rename Division</h2>  {/* ← correct title */}
                  <p className="modal-subtitle">
                    All pillars under <strong>"{editDivOldName}"</strong> will be updated.
                  </p>
                </div>
                <button className="modal-close" style={{ marginLeft: "auto" }} onClick={() => setShowEditDivModal(false)}>  {/* ← correct setter */}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3l10 10M13 3L3 13"/>
                  </svg>
                </button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                <label className="form-label">New Division Name</label>
                <input
                  className={`form-input ${editDivError ? "input-error" : ""}`}
                  value={editDivNewName}
                  autoFocus
                  onChange={(e) => { setEditDivNewName(e.target.value); setEditDivError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEditDivision(); } }}
                />
                {editDivError
                  ? <span className="field-error">{editDivError}</span>
                  : (
                    <span className="field-hint" style={{ marginTop: 6 }}>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
                      This renames the division across all its pillars in the database.
                    </span>
                  )
                }
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
                <button className="btn-cancel" onClick={() => setShowEditDivModal(false)}>Cancel</button>
                <button className="btn-save" onClick={handleEditDivision} disabled={editDivSaving}>
                  {editDivSaving
                    ? "Saving..."
                    : <><i className="fa-solid fa-pen" style={{ marginRight: 6 }} />Save Changes</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}