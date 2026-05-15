import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicMap } from '../components/public-map/PublicMap';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export default function PublicMapPage() {
  return (
    <div data-testid="public-map-page" style={{ overflowX: 'hidden' }}>
      <QueryClientProvider client={queryClient}>
        <PublicMap />
      </QueryClientProvider>
    </div>
  );
}
