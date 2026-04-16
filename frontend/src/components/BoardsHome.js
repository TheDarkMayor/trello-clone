import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBoards, createBoard } from '../api';
import DashboardBackdrop from './DashboardBackdrop';

const BG_OPTIONS = [
  { name: 'Indigo Aurora', value: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 55%, #06b6d4 100%)' },
  { name: 'Blue Orbit', value: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #22d3ee 100%)' },
  { name: 'Pink Pulse', value: 'linear-gradient(135deg, #7c3aed 0%, #db2777 55%, #fb7185 100%)' },
  { name: 'Sunset Relay', value: 'linear-gradient(135deg, #ea580c 0%, #f97316 45%, #facc15 100%)' },
  { name: 'Forest Signal', value: 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #2dd4bf 100%)' },
  { name: 'Midnight Glass', value: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #0f766e 100%)' },
];

export default function BoardsHome() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [bg, setBg] = useState(BG_OPTIONS[0].value);

  useEffect(() => {
    getBoards().then((r) => setBoards(r.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await createBoard({ title: title.trim(), background: bg });
    setBoards((prev) => [data, ...prev]);
    setTitle('');
    setCreating(false);
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" className="logo">TaskFlow</Link>
        <span className="header-chip">Boards</span>
        <div className="spacer" />
        <button type="button" className="header-action" onClick={() => navigate('/login')}>
          Sign out
        </button>
      </header>

      <div className="boards-page">
        <DashboardBackdrop variant="home" />
        <div className="boards-intro">
          <span className="boards-kicker">Workspace overview</span>
          <h1 className="boards-title">Your boards</h1>

        </div>

        <div className="boards-grid">
          {boards.map((board) => (
            <Link
              key={board.id}
              to={`/board/${board.id}`}
              className="board-tile"
              style={{ '--board-background': board.background }}
            >
              <span className="board-tile-title">{board.title}</span>
            </Link>
          ))}

          {creating ? (
            <form className="board-tile new-board new-board-form" onSubmit={handleCreate}>
              <input
                className="board-input"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Board title"
              />

              <div className="board-color-grid">
                {BG_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`board-color-option ${bg === option.value ? 'active' : ''}`}
                    onClick={() => setBg(option.value)}
                    style={{ '--board-background': option.value }}
                    title={option.name}
                  />
                ))}
              </div>

              <div className="tile-actions">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" className="btn-icon" onClick={() => setCreating(false)}>x</button>
              </div>
            </form>
          ) : (
            <button className="board-tile new-board" onClick={() => setCreating(true)}>
              + Create new board
            </button>
          )}
        </div>
      </div>
    </>
  );
}
