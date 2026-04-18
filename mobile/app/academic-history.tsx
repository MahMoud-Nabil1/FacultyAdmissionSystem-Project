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
import CustomHeader from "../src/components/common/CustomHeader";
import ScreenContainer from "../src/components/common/ScreenContainer";

type AcademicHistoryRecord = {
  s_code: string;
  s_name: string;
  c_hours: number;
  degree: number;
  rate: string;
  gpa: number;
};

export default function AcademicHistoryScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<AcademicHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAcademicHistory() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<AcademicHistoryRecord[]>(
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
      <ScreenContainer>
        <CustomHeader title={t("academicHistory.title")} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>
            {t("academicHistory.loading")}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && data.length === 0) {
    return (
      <ScreenContainer>
        <CustomHeader title={t("academicHistory.title")} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <CustomHeader title={t("academicHistory.title")} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Header Row */}
        <View style={styles.headerRow}>
        <Text style={[styles.headerText, styles.codeHeader]}>{t("academicHistory.code")}</Text>
        <Text style={[styles.headerText, styles.nameHeader]}>{t("academicHistory.name")}</Text>
        <Text style={[styles.headerText, styles.creditHeader]}>{t("academicHistory.creditHours")}</Text>
        <Text style={[styles.headerText, styles.degreeHeader]}>{t("academicHistory.degree")}</Text>
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
              key={`${subject.s_code}-${index}`}
            >
              <Text style={[styles.cell, styles.codeCell]} numberOfLines={1}>{subject.s_code}</Text>
              <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>{subject.s_name}</Text>
              <Text style={[styles.cell, styles.creditCell]}>{subject.c_hours}</Text>
              <Text style={[styles.cell, styles.degreeCell]}>{subject.rate} ({subject.degree})</Text>
            </View>
          ))}
        </View>
      )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  degreeHeader: {
    flex: 1.2,
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
  degreeCell: {
    flex: 1.2,
    textAlign: 'center',
    fontWeight: '600',
    color: '#1a73e8',
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