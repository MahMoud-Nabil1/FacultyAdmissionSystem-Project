import React, { useEffect, useState } from "react";

type Item = {
  s_code: string;
  c_hours: number;
  degree: number;
  rate: string;
  gpa: number;
};

function AcademicHistory(): JSX.Element {
  const [data, setData] = useState<Item[]>([]);

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
    <div>
      <h2>Academic History</h2>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>S_code</th>
            <th>C_hours</th>
            <th>Degree</th>
            <th>Rate</th>
            <th>GPA</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.s_code}>
              <td>{item.s_code}</td>
              <td>{item.c_hours}</td>
              <td>{item.degree}</td>
              <td>{item.rate}</td>
              <td>{item.gpa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AcademicHistory;