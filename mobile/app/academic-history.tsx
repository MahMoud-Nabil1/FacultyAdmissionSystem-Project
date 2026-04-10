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
        <ActivityIndicator size="large" color="#1a73e8" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("academicHistory.title")}</Text>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, styles.codeHeader]}>{t("academicHistory.code")}</Text>
        <Text style={[styles.headerText, styles.nameHeader]}>{t("academicHistory.name")}</Text>
        <Text style={[styles.headerText, styles.creditHeader]}>{t("academicHistory.creditHours")}</Text>
        <Text style={[styles.headerText, styles.levelHeader]}>{t("academicHistory.level")}</Text>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t("academicHistory.noData")}
          </Text>
        </View>
      ) : (
        <View style={styles.tableBody}>
          {data.map((subject, index) => (
            <View 
              style={[
                styles.row, 
                index % 2 === 0 ? styles.rowEven : styles.rowOdd
              ]} 
              key={subject._id}
            >
              <Text style={[styles.cell, styles.codeCell]} numberOfLines={1}>{subject.code}</Text>
              <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>{subject.name}</Text>
              <Text style={[styles.cell, styles.creditCell]}>{subject.creditHours}</Text>
              <Text style={[styles.cell, styles.levelCell]}>{subject.level}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  content: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#f0f4ff',
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: '#1a73e8',
    marginBottom: 20,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontWeight: "700",
    color: '#ffffff',
    fontSize: 13,
  },
  codeHeader: {
    flex: 1.2,
  },
  nameHeader: {
    flex: 2.5,
  },
  creditHeader: {
    flex: 1,
  },
  levelHeader: {
    flex: 1,
  },
  tableBody: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#f8fafc',
  },
  cell: {
    fontSize: 14,
    color: '#374151',
  },
  codeCell: {
    flex: 1.2,
    fontWeight: '600',
    color: '#1a73e8',
  },
  nameCell: {
    flex: 2.5,
    fontWeight: '600',
  },
  creditCell: {
    flex: 1,
    textAlign: 'center',
  },
  levelCell: {
    flex: 1,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  emptyContainer: {
    marginTop: 40,
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyText: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: 'italic',
  },
});