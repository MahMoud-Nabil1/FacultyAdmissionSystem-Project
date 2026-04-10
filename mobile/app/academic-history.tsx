import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLanguage } from "../src/context/LanguageContext";
import { apiGet } from "../src/services/api";

type CompletedSubject = {
  _id: string;
  code: string;
  name: string;
  level: string;
  creditHours: number;
};

export default function AcademicHistoryScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<CompletedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAcademicHistory() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<CompletedSubject[]>(
          "/students/my-academic-history"
        );
        setData(response.data);
      } catch (err: any) {
        const errorMessage = err.message || t("academicHistory.fetchFailed");
        setError(errorMessage);
        Alert.alert(t("common.error"), errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchAcademicHistory();
  }, [t]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {t("academicHistory.loading")}
        </Text>
      </View>
    );
  }

  if (error && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t("academicHistory.title")}</Text>

      <View style={styles.row}>
        <Text style={styles.header}>{t("academicHistory.code")}</Text>
        <Text style={styles.header}>{t("academicHistory.name")}</Text>
        <Text style={styles.header}>{t("academicHistory.creditHours")}</Text>
        <Text style={styles.header}>{t("academicHistory.level")}</Text>
      </View>

      {data.length === 0 ? (
        <Text style={styles.emptyText}>
          {t("academicHistory.noData")}
        </Text>
      ) : (
        data.map((subject) => (
          <View style={styles.row} key={subject._id}>
            <Text style={styles.cell}>{subject.code}</Text>
            <Text style={[styles.cell, styles.nameCell]}>{subject.name}</Text>
            <Text style={styles.cell}>{subject.creditHours}</Text>
            <Text style={styles.cell}>{subject.level}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  nameCell: {
    flex: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 30,
  },
});