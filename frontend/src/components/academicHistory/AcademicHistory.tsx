import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./AcademicHistory.css";

type Item = {
  s_code: string;
  c_hours: number;
  degree: number;
  rate: string;
  gpa: number;
};

function AcademicHistory() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState([] as Item[]);
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    fetch("http://localhost:5000/api/student/my-academic-history", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((d) => {
        console.log("API DATA:", d);
        setData(d);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
      <div className="dashboard-container academicHistoryPage" dir={isRtl ? "rtl" : "ltr"}>
      <div className="academicHistoryHeader">
        <h2 className="academicHistoryTitle">{t("academicHistory.title")}</h2>
      </div>

      <div className="academicHistoryTableCard">
        <div className="academicHistoryTableHeader">
          <h3 className="academicHistorySectionTitle">{t("academicHistory.title")}</h3>
          <span className="academicHistoryCount">{data.length}</span>
        </div>

        <div className="academicHistoryTableWrapper">
          <table className="academicHistoryTable">
            <thead>
              <tr>
                {isRtl ? (
                  <>
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
                        <td className="academicHistoryCodeCell">{item.s_code}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="academicHistoryEmpty">
                    {t("academicHistory.title")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AcademicHistory;
