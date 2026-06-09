import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  fetchFunction: (page: number) => Promise<any[]>;
  initialPage?: number;
  pageSize?: number;
}

export function useInfiniteScroll({
  fetchFunction,
  initialPage = 1,
  pageSize = 20,
}: UseInfiniteScrollOptions) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(page);
      
      if (newItems.length === 0 || newItems.length < pageSize) {
        setHasMore(false);
      }

      setItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
      console.error('Error loading more items:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, loading, hasMore, pageSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loading]);

  // Load initial page
  useEffect(() => {
    loadMore();
  }, []); // Only run once on mount

  return {
    items,
    loading,
    hasMore,
    error,
    observerTarget,
    loadMore,
  };
}
