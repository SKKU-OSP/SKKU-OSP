import { useState } from 'react';

function PageJump({ gridRef }) {
  const [page, setPage] = useState(1);

  const goToPage = (pNum) => {
    if (0 < pNum && pNum <= gridRef.current.api.paginationGetTotalPages())
      gridRef.current.api.paginationGoToPage(pNum - 1);
  };

  return (
    <div className="d-flex justify-content-end gap-1 my-1">
      <input
        placeholder="Page"
        type="number"
        min="1"
        value={page}
        onChange={(e) => setPage(e.target.value)}
        onKeyDown={(e) => {
          console.log(e.key);
          if (e.key == 13 || e.keyCode == 13) goToPage(Number(page));
        }}
      />
      <button className="btn btn-sm btn-primary" onClick={() => goToPage(Number(page))}>
        이동
      </button>
    </div>
  );
}

export default PageJump;
