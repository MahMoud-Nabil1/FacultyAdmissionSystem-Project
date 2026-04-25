import React, { useEffect, useState } from "react";

type Student = {
  name: string;
  studentId: number;
  gpa: number;
};

const ReporterPanel = () => {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_BASE_URL || `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`}/student`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h2>Reporter Dashboard</h2>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Student ID</th>
            <th>GPA</th>
          </tr>
        </thead>

        <tbody>
          {students.map((s, i) => (
            <tr key={i}>
              <td>{s.name}</td>
              <td>{s.studentId}</td>
              <td>{s.gpa}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReporterPanel;