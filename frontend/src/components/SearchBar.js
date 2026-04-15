import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { searchCards } from '../api';

export default function SearchBar({ boardId, labels, members, onFilterChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPosition, setFilterPosition] = useState(null);
  const [searchPosition, setSearchPosition] = useState(null);
  const [filters, setFilters] = useState({ label_ids: [], member_ids: [], due: '' });
  const filterRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchDropdownRef = useRef(null);

  const hasFilters = filters.label_ids.length > 0 || filters.member_ids.length > 0 || filters.due;

  const doSearch = useCallback(async (value) => {
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const { data } = await searchCards({ q: value, board_id: boardId });
    setResults(data);
    setShowResults(true);
  }, [boardId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timeoutId);
  }, [query, doSearch]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => {
      const clickedFilterTrigger = filterRef.current?.contains(e.target);
      const clickedFilterDropdown = filterDropdownRef.current?.contains(e.target);
      if (!clickedFilterTrigger && !clickedFilterDropdown) setShowFilter(false);
      const clickedSearch = searchRef.current?.contains(e.target);
      const clickedSearchDropdown = searchDropdownRef.current?.contains(e.target);
      if (!clickedSearch && !clickedSearchDropdown) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateFilterPosition = useCallback(() => {
    if (!filterRef.current) return;
    const rect = filterRef.current.getBoundingClientRect();
    setFilterPosition({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  const updateSearchPosition = useCallback(() => {
    if (!searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    setSearchPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  }, []);

  useEffect(() => {
    if (!showFilter) return undefined;
    updateFilterPosition();
    const handleViewportChange = () => updateFilterPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [showFilter, updateFilterPosition]);

  useEffect(() => {
    if (!showResults) return undefined;
    updateSearchPosition();
    const handleViewportChange = () => updateSearchPosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [showResults, updateSearchPosition]);

  const toggleLabel = (id) => {
    setFilters((prev) => ({
      ...prev,
      label_ids: prev.label_ids.includes(id)
        ? prev.label_ids.filter((value) => value !== id)
        : [...prev.label_ids, id],
    }));
  };

  const toggleMember = (id) => {
    setFilters((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(id)
        ? prev.member_ids.filter((value) => value !== id)
        : [...prev.member_ids, id],
    }));
  };

  const clearFilters = () => setFilters({ label_ids: [], member_ids: [], due: '' });

  return (
    <div className="board-search">
      <div className="search-bar" ref={searchRef}>
        <div className="search-shell">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.75"/>
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query && setShowResults(true)}
            placeholder="Search cards…"
            aria-label="Search cards"
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

      </div>

      {showResults && searchPosition && createPortal(
        <>
          <div className="filter-backdrop" onClick={() => setShowResults(false)} />
          <div
            ref={searchDropdownRef}
            className="search-results-dropdown"
            style={{ position: 'fixed', top: searchPosition.top, left: searchPosition.left, width: searchPosition.width, zIndex: 1000 }}
          >
            {results.length > 0 ? results.map((card) => (
              <div key={card.id} className="search-result-item">
                <div className="sr-title">{card.title}</div>
                <div className="sr-list">in {card.list_title}</div>
              </div>
            )) : (
              <div className="search-result-item">
                <div className="sr-list">No cards found</div>
              </div>
            )}
          </div>
        </>,
        document.body,
      )}

      <div className="filter-bar popover-wrapper" ref={filterRef}>
        <button
          type="button"
          className={`filter-btn ${hasFilters ? 'active' : ''}`}
          onClick={() => setShowFilter((value) => !value)}
        >
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15" style={{flexShrink:0}}>
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          Filter {hasFilters && `(${filters.label_ids.length + filters.member_ids.length + (filters.due ? 1 : 0)})`}
        </button>

        {hasFilters && (
          <button type="button" className="filter-btn filter-clear-btn" onClick={clearFilters}>
            Clear
          </button>
        )}

      </div>

      {showFilter && filterPosition && createPortal(
        <>
          <div className="filter-backdrop" onClick={() => setShowFilter(false)} />
          <div
            ref={filterDropdownRef}
            className="filter-dropdown filter-dropdown-fixed"
            style={{ top: filterPosition.top, right: filterPosition.right }}
          >
            <h4>Labels</h4>
            {labels.map((label) => (
              <label key={label.id} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.label_ids.includes(label.id)}
                  onChange={() => toggleLabel(label.id)}
                />
                <span className="filter-color-dot" style={{ background: label.color }} />
                {label.name || label.color}
              </label>
            ))}

            <div className="divider" />

            <h4>Members</h4>
            {members.map((member) => (
              <label key={member.id} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.member_ids.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                />
                <span className="avatar sm" style={{ background: member.avatar_color }}>{member.initials}</span>
                {member.name}
              </label>
            ))}

            <div className="divider" />

            <h4>Due Date</h4>
            {['', 'overdue', 'today', 'week'].map((due) => (
              <label key={due} className="filter-option">
                <input
                  type="radio"
                  name="due"
                  checked={filters.due === due}
                  onChange={() => setFilters((prev) => ({ ...prev, due }))}
                />
                {due === '' ? 'Any' : due === 'overdue' ? 'Overdue' : due === 'today' ? 'Due today' : 'Due this week'}
              </label>
            ))}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
