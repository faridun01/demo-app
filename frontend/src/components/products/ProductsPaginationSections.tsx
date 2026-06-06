import PaginationControls from '../common/PaginationControls';

interface ProductsPaginationSectionsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ProductsPaginationSections({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ProductsPaginationSectionsProps) {
  const paginationProps = {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
  };

  return (
    <>
      <PaginationControls {...paginationProps} className="border-t-0 pt-0 md:hidden" />
      <div className="hidden md:block">
        <PaginationControls {...paginationProps} className="border-t-0" />
      </div>
    </>
  );
}
