import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Modal, Pressable,
    KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../common/CustomHeader';
import ScreenContainer from '../../common/ScreenContainer';
import { getAllPlaces, createPlace, updatePlace, deletePlace } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';

interface Place {
    _id: string;
    name: string;
    type: 'hall' | 'room' | 'lab' | 'lecture_hall';
    capacity: number;
    building?: string;
    floor?: number;
    isActive: boolean;
}

const PLACE_TYPES = ['hall', 'room', 'lab', 'lecture_hall'] as const;

const EMPTY = { name: '', type: 'hall' as const, capacity: '', building: '', floor: '' };

export default function PlacesScreen() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const readOnly = user?.role === 'academic_guide' || user?.role === 'academic_guide_coordinator';
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllPlaces();
            setPlaces((data as any) ?? []);
        } catch (e: any) { Alert.alert(t('common.error'), e.message); }
        finally { setLoading(false); }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const openAdd = () => {
        setEditingId(null);
        setForm(EMPTY);
        setShowForm(true);
        setError('');
    };

    const openEdit = (p: Place) => {
        setEditingId(p._id);
        setForm({
            name: p.name,
            type: p.type,
            capacity: String(p.capacity),
            building: p.building || '',
            floor: p.floor ? String(p.floor) : '',
        });
        setShowForm(true);
        setError('');
    };

    const closeModal = () => {
        setShowForm(false);
        setError('');
        setForm(EMPTY);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        setError('');
        if (!form.name.trim()) { setError(t('places.nameRequired')); return; }
        if (!form.capacity || Number(form.capacity) < 1) { setError(t('places.capacityRequired')); return; }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                capacity: Number(form.capacity),
                building: form.building.trim() || undefined,
                floor: form.floor ? Number(form.floor) : undefined,
            };
            if (editingId) { await updatePlace(editingId, payload); }
            else { await createPlace(payload); }
            setForm(EMPTY);
            setShowForm(false);
            setEditingId(null);
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = (p: Place) => {
        Alert.alert(t('places.deleteTitle'), t('places.deleteMessage', { name: p.name }), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: async () => { try { await deletePlace(p._id); await load(); } catch (e: any) { Alert.alert(t('common.error'), e.message); } } },
        ]);
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            hall: t('places.types.hall'),
            room: t('places.types.room'),
            lab: t('places.types.lab'),
            lecture_hall: t('places.types.lecture_hall'),
        };
        return labels[type] || type;
    };

    return (
        <ScreenContainer>
            <CustomHeader title={t('places.title')} />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} tintColor="#1a73e8" />
                }
            >

            {!readOnly && (
                <TouchableOpacity
                    style={[styles.btn, showForm && styles.btnOutline]}
                    onPress={() => { if (showForm) return closeModal(); openAdd(); }}
                >
                    <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={18} color={showForm ? '#ef4444' : '#fff'} />
                    <Text style={[styles.btnText, showForm && styles.btnTextOutline]}>
                        {showForm ? t('common.cancel') : t('places.addPlace')}
                    </Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={showForm}
                animationType="fade"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={closeModal}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.close')}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                        style={styles.modalKeyboard}
                    >
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingId ? t('places.editPlace') : t('places.addPlace')}
                                </Text>
                                <TouchableOpacity onPress={closeModal} style={styles.modalClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Ionicons name="close" size={26} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalFormBody}>
                                {!!error && <Text style={styles.error}>{error}</Text>}

                                <TextInput
                                    style={styles.input}
                                    placeholder={t('places.placeholders.name')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.name}
                                    onChangeText={v => setForm(p => ({ ...p, name: v }))}
                                />

                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={form.type}
                                        onValueChange={(v) => setForm(p => ({ ...p, type: v }))}
                                        style={styles.picker}
                                        mode="dropdown"
                                    >
                                        {PLACE_TYPES.map(type => (
                                            <Picker.Item key={type} label={getTypeLabel(type)} value={type} />
                                        ))}
                                    </Picker>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder={t('places.placeholders.capacity')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.capacity}
                                    onChangeText={v => setForm(p => ({ ...p, capacity: v }))}
                                    keyboardType="number-pad"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder={t('places.placeholders.building')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.building}
                                    onChangeText={v => setForm(p => ({ ...p, building: v }))}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder={t('places.placeholders.floor')}
                                    placeholderTextColor="#9ca3af"
                                    value={form.floor}
                                    onChangeText={v => setForm(p => ({ ...p, floor: v }))}
                                    keyboardType="number-pad"
                                />

                                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitText}>{t('common.save')}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator color="#1a73e8" style={{ marginTop: 32 }} />
            ) : places.length === 0 ? (
                <Text style={styles.empty}>{t('places.empty')}</Text>
            ) : (
                places.map(p => (
                    <View key={p._id} style={styles.row}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{getTypeLabel(p.type)}</Text>
                        </View>
                        <View style={styles.rowInfo}>
                            <Text style={styles.rowName}>{p.name}</Text>
                            <Text style={styles.rowSub}>
                                {t('places.capacity')}: {p.capacity}
                                {p.building && ` • ${p.building}`}
                                {p.floor && ` • ${t('places.floor')} ${p.floor}`}
                            </Text>
                        </View>
                        {!readOnly && (
                            <>
                                <TouchableOpacity onPress={() => openEdit(p)} style={styles.actionBtn}>
                                    <Ionicons name="create-outline" size={20} color="#1a73e8" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(p)} style={styles.actionBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ))
            )}
        </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '800', color: '#1a73e8', marginBottom: 16, textAlign: 'center' },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, justifyContent: 'center', marginBottom: 16 },
    btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1a73e8' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    btnTextOutline: { color: '#1a73e8' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, color: '#111', backgroundColor: '#fafafa', marginBottom: 10 },
    pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#fafafa', overflow: 'hidden', marginBottom: 10 },
    picker: { height: 50, width: '100%' },
    submitBtn: { backgroundColor: '#1a73e8', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: '#ef4444', textAlign: 'center', marginBottom: 8 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
    },
    modalKeyboard: { width: '100%', maxWidth: 420, alignSelf: 'center', flexShrink: 1 },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#1a73e8',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a73e8' },
    modalClose: { padding: 4 },
    modalFormBody: { padding: 18 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    badge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#4f46e5', textTransform: 'uppercase' },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 2 },
    rowSub: { fontSize: 13, color: '#6b7280' },
    actionBtn: { padding: 8 },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 4 },
});