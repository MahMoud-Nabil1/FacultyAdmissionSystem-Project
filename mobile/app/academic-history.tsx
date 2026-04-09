import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

type Item = {
  s_code: string;
  c_hours: number;
  degree: number;
  rate: string;
  gpa: number;
};

export default function AcademicHistoryScreen() {
  const [data, setData] = useState<Item[]>([]);

  useEffect(() => {
    fetch("http://192.168.1.5:5000/api/student/my-academic-history", {
      headers: {
        Authorization: "Bearer " + "PUT_YOUR_TOKEN_HERE",
      },
    })
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.log(err));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Academic History</Text>

      <View style={styles.row}>
        <Text style={styles.header}>Code</Text>
        <Text style={styles.header}>Hours</Text>
        <Text style={styles.header}>Degree</Text>
        <Text style={styles.header}>Rate</Text>
        <Text style={styles.header}>GPA</Text>
      </View>

      {data.map((item, index) => (
        <View style={styles.row} key={index}>
          <Text style={styles.cell}>{item.s_code}</Text>
          <Text style={styles.cell}>{item.c_hours}</Text>
          <Text style={styles.cell}>{item.degree}</Text>
          <Text style={styles.cell}>{item.rate}</Text>
          <Text style={styles.cell}>{item.gpa}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  header: {
    flex: 1,
    fontWeight: "bold",
  },
  cell: {
    flex: 1,
  },
});