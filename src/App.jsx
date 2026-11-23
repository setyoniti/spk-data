import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import InputPage from './pages/InputPage.jsx';
import SearchPage from './pages/SearchPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/input" element={<InputPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
