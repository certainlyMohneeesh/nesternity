'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamic import to avoid SSR issues with react-window
const DynamicFixedSizeList = dynamic(
  () => import('react-window').then((mod) => mod.FixedSizeList),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted animate-pulse rounded" />,
  }
);

export function VirtualizedList(
  props: ComponentProps<typeof DynamicFixedSizeList>
) {
  return <DynamicFixedSizeList {...props} />;
}
