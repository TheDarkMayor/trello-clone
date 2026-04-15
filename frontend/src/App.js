import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardsHome from './components/BoardsHome';
import Board from './components/Board';
import Login from './components/Login';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<BoardsHome />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}
