import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const RegisterSubjects = () => {
    return (
        <View style={styles.container}>
            {/* زرار الرجوع عشان تعرف تخرج من الصفحة */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-forward" size={30} color="#1a73e8" />
            </TouchableOpacity>

            <View style={styles.centerContent}>
                <Ionicons name="construct-outline" size={80} color="#ccc" />
                <Text style={styles.mainText}>Working on the component</Text>
                <Text style={styles.subText}>قريباً سيتم تفعيل نظام تسجيل المواد مياو </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        marginTop: 50,
        marginHorizontal: 20,
        alignSelf: 'flex-end', // عشان يظبط مع اتجاه اليمين
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
    },
    subText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    }
});

export default RegisterSubjects;