"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.push(`/non-translated/movies?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const rangeWithDots = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        rangeWithDots.push(i);
      }
    } else {
      // Always show first page
      rangeWithDots.push(1);

      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          rangeWithDots.push(i);
        }
        rangeWithDots.push('...');
        rangeWithDots.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        rangeWithDots.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          rangeWithDots.push(i);
        }
      } else {
        // In the middle
        rangeWithDots.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          rangeWithDots.push(i);
        }
        rangeWithDots.push('...');
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  return (
    <div className="flex justify-center items-center mt-12 gap-2">
      <Button
        variant="outline"
        className="border-gray-600 text-gray-300 hover:bg-gray-800"
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex gap-1">
        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">...</span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              className={currentPage === page
                ? "bg-orange-500 hover:bg-orange-600"
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }
              onClick={() => navigateToPage(page as number)}
            >
              {page}
            </Button>
          )
        ))}
      </div>

      <Button
        variant="outline"
        className="border-gray-600 text-gray-300 hover:bg-gray-800"
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}