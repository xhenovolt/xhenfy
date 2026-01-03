import { Suspense } from 'react';
import { PortalContent } from '@/components/PortalContent';

export const dynamic = 'force-dynamic';

function PortalLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="text-white text-lg font-medium">Loading Portal...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PortalLoading />}>
      <PortalContent />
    </Suspense>
  );
}
   