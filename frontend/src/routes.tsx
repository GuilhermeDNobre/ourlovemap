import { createBrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import PublicMapPage from './pages/PublicMapPage';
import WizardPage from './pages/WizardPage';

export const routeConfig = [
  { path: '/', element: <Landing /> },
  { path: '/criar', element: <WizardPage /> },
  { path: '/acesso', element: <PublicMapPage /> },
];

const router = createBrowserRouter(routeConfig);

export default router;
