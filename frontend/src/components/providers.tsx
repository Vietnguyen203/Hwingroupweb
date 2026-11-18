"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { RealtimeProvider } from "@/components/notifications/realtime-provider";

/** Provider phía client: TanStack Query cho các lời gọi API từ trình duyệt. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <RealtimeProvider />
      {children}
    </QueryClientProvider>
  );
}
