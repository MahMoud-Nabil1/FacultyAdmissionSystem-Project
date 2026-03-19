import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

/** Extra space above home indicator so the control clears the tab bar */
const TAB_BAR_OFFSET = 62;

type Props = {
    /** Pin to bottom-left of the screen (safe area + tab bar when applicable) */
    floating?: boolean;
    style?: ViewStyle;
};

export default function LanguageSwitcher({ floating = false, style }: Props) {
    const { locale, toggleLocale } = useLanguage();
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const inTabs = segments[0] === '(tabs)';
    const label = locale === 'ar' ? 'EN' : 'AR';

    const bottomOffset =
        Math.max(insets.bottom, 10) + (inTabs ? TAB_BAR_OFFSET : 12);

    const button = (
        <TouchableOpacity
            style={[styles.fab, style]}
            onPress={toggleLocale}
            accessibilityRole="button"
            accessibilityLabel="Change language"
            accessibilityHint="Switch between Arabic and English"
        >
            <Text style={styles.fabText}>{label}</Text>
        </TouchableOpacity>
    );

    if (floating) {
        return (
            <View
                pointerEvents="box-none"
                style={[styles.floatingWrap, { bottom: bottomOffset, left: 16 }]}
            >
                {button}
            </View>
        );
    }

    return button;
}

const styles = StyleSheet.create({
    floatingWrap: {
        position: 'absolute',
        zIndex: 9999,
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.12)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 10,
    },
    fabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: 0.3,
    },
});
