import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/* ─── Design tokens ─────────────────────────────────────────── */
const BASE     = '#0d1b4b';   // deep navy
const MID      = '#1a3a8f';   // mid royal blue
const ACCENT   = '#2563eb';   // vivid electric blue
const GLOW     = '#3b82f6';   // lighter highlight

const PT = Platform.OS === 'ios'
    ? 54
    : (StatusBar.currentHeight ?? 28) + 10;

/* ─── Props ──────────────────────────────────────────────────── */
interface CustomHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightElement?: React.ReactNode;
}

/* ─── Component ──────────────────────────────────────────────── */
export default function CustomHeader({
    title,
    subtitle,
    showBack = true,
    rightElement,
}: CustomHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={BASE} />

            {/* ── Layer 1: base navy ── */}
            <View style={[StyleSheet.absoluteFillObject, styles.layerBase]} />

            {/* ── Layer 2: diagonal gradient overlay (top-right lighter) ── */}
            <View style={[StyleSheet.absoluteFillObject, styles.layerGrad]} />

            {/* ── Decorative circles ── */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />

            {/* ── Bottom accent line ── */}
            <View style={styles.accentLine} />

            {/* ── Content row ── */}
            <View style={styles.row}>

                {/* Left: back button or spacer */}
                <View style={styles.side}>
                    {showBack ? (
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Center: title (+ optional subtitle) */}
                <View style={styles.center}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {/* Right: custom element or spacer */}
                <View style={styles.side}>
                    {rightElement ?? null}
                </View>
            </View>
        </View>
    );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    root: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.40,
        shadowRadius: 16,
        elevation: 14,
        zIndex: 100,
        overflow: 'hidden',
        /* clip the decorative circles */
    },

    /* ── gradient layers ── */
    layerBase: {
        backgroundColor: BASE,
    },
    layerGrad: {
        /* Simulated angular gradient: transparent at bottom-left → ACCENT at top-right */
        backgroundColor: MID,
        opacity: 0.55,
        borderBottomRightRadius: 120,
        top: 0,
        right: 0,
        left: '30%',
        bottom: 0,
    },

    /* ── decorative circles ── */
    circle1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: GLOW,
        opacity: 0.12,
        top: -50,
        right: -30,
    },
    circle2: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        opacity: 0.06,
        top: -10,
        right: 70,
    },
    circle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: ACCENT,
        opacity: 0.18,
        bottom: -20,
        left: 20,
    },

    /* ── bottom glow line ── */
    accentLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: GLOW,
        opacity: 0.55,
    },

    /* ── content ── */
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: PT,
        paddingBottom: 18,
        paddingHorizontal: 14,
    },
    side: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* ── back button — pill/glass ── */
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.30)',
        alignItems: 'center',
        justifyContent: 'center',
        /* subtle inner shadow on Android not natively possible, 
           but the border gives the glass-pill effect */
    },

    /* ── title / subtitle ── */
    center: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.30)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        letterSpacing: 0.3,
    },
});
