import React from "react";
import { PAGE_SIZE } from "./constants";

const Pagination = ({ page, setPage, total }) => (
    <div className="pagination">
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            ←
        </button>

        <span>
            {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>

        <button
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage(page + 1)}
        >
            →
        </button>
    </div>
);

export default Pagination;