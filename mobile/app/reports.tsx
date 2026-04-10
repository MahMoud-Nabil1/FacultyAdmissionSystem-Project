import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminAnalysis from '../src/components/Dashboards/AdminAnalysis/AdminAnalysis';

export default function ReportsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>

                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-forward" size={24} color="#111827" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <AdminAnalysis />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scrollContent: {
        flexGrow: 1,
    }
});
