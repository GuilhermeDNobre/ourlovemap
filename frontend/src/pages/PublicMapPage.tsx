import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicMap } from '../components/public-map/PublicMap';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export default function PublicMapPage() {
  return (
    <div data-testid="public-map-page" style={{ overflowX: 'hidden' }}>
      <ThemeToggle className="fixed right-4 top-4 z-[80]" tone="onDark" />
      <QueryClientProvider client={queryClient}>
        <PublicMap />
      </QueryClientProvider>
    </div>
  );
}
