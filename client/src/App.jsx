import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProductPage from './pages/ProductPage';
import WholesalePage from './pages/WholesalePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      {/* Admin panel — standalone (its own chrome, no public header/footer) */}
      <Route path="/admin" element={<AdminPage />} />

      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="hangers" element={<CataloguePage />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="wholesale" element={<WholesalePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
