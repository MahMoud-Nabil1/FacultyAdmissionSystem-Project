import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AdminAnalysis from '../src/components/Dashboards/AdminAnalysis/AdminAnalysis';
import CustomHeader from '../src/components/common/CustomHeader';
import ScreenContainer from '../src/components/common/ScreenContainer';
import { useLanguage } from '../src/context/LanguageContext';

export default function ReportsScreen() {
    const { t } = useLanguage();
    return (
        <ScreenContainer>
            <CustomHeader title={t('reports.title')} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <AdminAnalysis />
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    }
});
