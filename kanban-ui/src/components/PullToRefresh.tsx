import { useState, useRef, useCallback, type ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);

  const THRESHOLD = 60; // Distance needed to trigger refresh
  const MAX_PULL = 100; // Maximum pull distance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    
    // Only start pull if at top of page
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance - pull gets harder the further you go
      const distance = Math.min(diff * 0.4, MAX_PULL);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current && !refreshing) {
      setPullDistance(0);
      return;
    }
    pulling.current = false;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(50); // Hold position during refresh
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else if (!refreshing) {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = pullDistance * 4; // Spin as you pull

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator - fixed position above content */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
          style={{
            top: pullDistance - 40,
            opacity: refreshing ? 1 : progress,
            transition: refreshing ? 'none' : 'opacity 0.1s',
          }}
        >
          <div
            className={`w-10 h-10 rounded-full bg-gray-800 border-2 border-pink-500/50 flex items-center justify-center shadow-lg`}
            style={{
              transform: refreshing ? undefined : `rotate(${rotation}deg)`,
              animation: refreshing ? 'spin 0.8s linear infinite' : undefined,
            }}
          >
            {refreshing ? (
              <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content wrapper - maintains full height */}
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
