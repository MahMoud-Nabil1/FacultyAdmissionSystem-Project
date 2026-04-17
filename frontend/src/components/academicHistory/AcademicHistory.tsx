import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./AcademicHistory.css";

type Item = {
  s_code: string;
  s_name: string;
  c_hours: number;
  degree: number;
  rate: string;
  gpa: number;
};

function AcademicHistory() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    
    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/students/my-academic-history", {
      headers: {
        Authorization: "Bearer " + token
      }
    })
      .then(async (res) => {
        if (res.status === 401) {
          // Token expired or invalid
          sessionStorage.removeItem("token");
          throw new Error("Session expired. Please log in again.");
        }
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((d) => {
        console.log("API DATA:", d);
        setData(Array.isArray(d) ? d : []);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching academic history:", err);
        setError(err.message || "Failed to load data");
        setData([]);
        
        // Redirect to login if session expired
        if (err.message.includes("log in again")) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-container academicHistoryPage" dir={isRtl ? "rtl" : "ltr"}>
      <div className="academicHistoryHeader">
        <h2 className="academicHistoryTitle">{t("academicHistory.title")}</h2>
      </div>

      <div className="academicHistoryTableCard">
        <div className="academicHistoryTableHeader">
          <span className="academicHistoryCount">{data.length}</span>
        </div>

        {loading ? (
          <div className="academicHistoryLoading">
            <p>{t("common.loading") || "Loading..."}</p>
          </div>
        ) : error ? (
          <div className="academicHistoryError">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="academicHistoryTableWrapper desktop-view">
              <table className="academicHistoryTable">
                <thead>
                  <tr>
                    {isRtl ? (
                      <>
                        <th>{t("academicHistory.subjectCode")}</th>
                        <th>{t("academicHistory.subjectName")}</th>
                        <th>{t("academicHistory.creditHours")}</th>
                        <th>{t("academicHistory.degree")}</th>
                        <th>{t("academicHistory.grade")}</th>
                        <th>{t("academicHistory.gpa")}</th>
                      </>
                    ) : (
                      <>
                        <th>{t("academicHistory.gpa")}</th>
                        <th>{t("academicHistory.grade")}</th>
                        <th>{t("academicHistory.degree")}</th>
                        <th>{t("academicHistory.creditHours")}</th>
                        <th>{t("academicHistory.subjectName")}</th>
                        <th>{t("academicHistory.subjectCode")}</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {data.length > 0 ? (
                    data.map((item: Item) => (
                      <tr key={item.s_code}>
                        {isRtl ? (
                          <>
                            <td className="academicHistoryCodeCell">{item.s_code}</td>
                            <td>{item.s_name}</td>
                            <td>{item.c_hours}</td>
                            <td>{item.degree}</td>
                            <td>
                              <span className="academicHistoryRateBadge">{item.rate}</span>
                            </td>
                            <td>{item.gpa}</td>
                          </>
                        ) : (
                          <>
                            <td>{item.gpa}</td>
                            <td>
                              <span className="academicHistoryRateBadge">{item.rate}</span>
                            </td>
                            <td>{item.degree}</td>
                            <td>{item.c_hours}</td>
                            <td>{item.s_name}</td>
                            <td className="academicHistoryCodeCell">{item.s_code}</td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="academicHistoryEmpty">
                        {t("academicHistory.noRecords") || "No academic history records found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="academicHistoryCardWrapper mobile-view">
              {data.length > 0 ? (
                data.map((item: Item) => (
                  <div key={item.s_code} className="academicHistoryCard">
                    <div className="academicHistoryCardHeader">
                      <span className="academicHistoryCardCode">{item.s_code}</span>
                      <span className="academicHistoryCardGrade">
                        <span className="academicHistoryRateBadge">{item.rate}</span>
                      </span>
                    </div>
                    <div className="academicHistoryCardBody">
                      <div className="academicHistoryCardRow">
                        <span className="academicHistoryCardLabel">{t("academicHistory.subjectName")}</span>
                        <span className="academicHistoryCardValue">{item.s_name}</span>
                      </div>
                      <div className="academicHistoryCardRow">
                        <span className="academicHistoryCardLabel">{t("academicHistory.degree")}</span>
                        <span className="academicHistoryCardValue">{item.degree}</span>
                      </div>
                      <div className="academicHistoryCardRow">
                        <span className="academicHistoryCardLabel">{t("academicHistory.creditHours")}</span>
                        <span className="academicHistoryCardValue">{item.c_hours}</span>
                      </div>
                      <div className="academicHistoryCardRow">
                        <span className="academicHistoryCardLabel">{t("academicHistory.gpa")}</span>
                        <span className="academicHistoryCardValue academicHistoryCardGPA">{item.gpa}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="academicHistoryEmpty">
                  {t("academicHistory.noRecords") || "No academic history records found"}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AcademicHistory;
