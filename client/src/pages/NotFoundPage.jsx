import { Link } from 'react-router-dom';
import HangerRender from '../components/HangerRender';

export default function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <HangerRender variant="shirt" material="Plastic" className="h-32 w-44" />
      <h1 className="mt-8 font-display text-5xl font-bold text-fg">404</h1>
      <p className="mt-2 text-muted">This page got lost on the rail.</p>
      <Link to="/" className="btn-outline mt-7">
        Back to Home
      </Link>
    </div>
  );
}
