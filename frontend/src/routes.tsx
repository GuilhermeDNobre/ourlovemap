import { createBrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import PublicMapPage from './pages/PublicMapPage';
import WizardPage from './pages/WizardPage';
import PaymentConfirmedPage from './pages/PaymentConfirmedPage';

export const routeConfig = [
  { path: '/', element: <Landing /> },
  { path: '/criar', element: <WizardPage /> },
  { path: '/pagamento-confirmado', element: <PaymentConfirmedPage /> },
  { path: '/acesso', element: <PublicMapPage /> },
  { path: '/:slug', element: <PublicMapPage /> },
];

const router = createBrowserRouter(routeConfig);

export default router;
