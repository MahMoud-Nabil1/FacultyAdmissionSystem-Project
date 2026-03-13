import React from "react";
import { useTranslation } from "react-i18next";
import { PAGE_SIZE } from "../../services/constants";

const Pagination = ({ page, setPage, total }) => {
    const { t } = useTranslation();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    
    return (
        <div className="pagination">
            <button 
                disabled={page === 0} 
                onClick={() => setPage(page - 1)}
                aria-label={t("pagination.previous")}
            >
                ←
            </button>

            <span>
                {t("pagination.page", { current: page + 1, total: totalPages })}
            </span>

            <button
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage(page + 1)}
                aria-label={t("pagination.next")}
            >
                →
            </button>
        </div>
    );
};

export default Pagination;