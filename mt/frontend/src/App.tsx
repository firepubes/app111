import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalLayout } from './components/GlobalLayout';
import MailApp from './pages/MailApp';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Support from './pages/Support';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <GlobalLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mail" element={<MailApp />} />
          <Route path="/app" element={<MailApp />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/how-to-support" element={<Support />} />
        </Routes>
      </GlobalLayout>
    </BrowserRouter>
  );
}
