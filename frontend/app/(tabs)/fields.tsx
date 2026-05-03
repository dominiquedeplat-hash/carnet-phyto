import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  deleteField,
  getFields,
  saveField,
} from '../../src/storage';
import { Field } from '../../src/types';
import { colors, radius, sizes, spacing, typography } from '../../src/theme';
import { formatNumber, parseFrenchNumber } from '../../src/format';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [crop, setCrop] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setFields(await getFields());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setArea('');
    setCrop('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (f: Field) => {
    setEditing(f);
    setName(f.name);
    setArea(String(f.area).replace('.', ','));
    setCrop(f.crop);
    setErrors({});
    setShowForm(true);
  };

  const submit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Requis';
    const a = parseFrenchNumber(area);
    if (!a || a <= 0) newErrors.area = 'Surface invalide';
    if (!crop.trim()) newErrors.crop = 'Requis';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    await saveField({
      id: editing?.id,
      name: name.trim(),
      area: a,
      crop: crop.trim(),
    });
    setShowForm(false);
    await load();
  };

  const confirmDelete = (f: Field) => {
    Alert.alert(
      'Supprimer le champ ?',
      `"${f.name}" sera supprimé définitivement. Les traitements existants resteront enregistrés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteField(f.id);
            await load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes champs</Text>
        <TouchableOpacity
          testID="add-field-btn"
          style={styles.addBtn}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title="Aucun champ"
            subtitle="Ajoutez votre premier champ pour commencer."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`field-${item.id}`}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => openEdit(item)}
            onLongPress={() => confirmDelete(item)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="leaf" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardSub}>{item.crop}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardArea}>{formatNumber(item.area)}</Text>
              <Text style={styles.cardAreaUnit}>ha</Text>
            </View>
            <TouchableOpacity
              testID={`field-delete-${item.id}`}
              onPress={() => confirmDelete(item)}
              hitSlop={12}
              style={styles.trashBtn}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Form modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrap}
        >
          <View style={styles.modalBackdrop} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editing ? 'Modifier le champ' : 'Nouveau champ'}
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                testID="field-name-input"
                label="Nom du champ"
                placeholder="Ex : Grande pièce"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoFocus
              />
              <Input
                testID="field-area-input"
                label="Surface"
                placeholder="Ex : 5,2"
                value={area}
                onChangeText={setArea}
                keyboardType="decimal-pad"
                suffix="ha"
                error={errors.area}
              />
              <Input
                testID="field-crop-input"
                label="Culture"
                placeholder="Ex : Blé tendre"
                value={crop}
                onChangeText={setCrop}
                error={errors.crop}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                testID="field-cancel-btn"
                title="Annuler"
                variant="secondary"
                onPress={() => setShowForm(false)}
                style={{ flex: 1 }}
              />
              <Button
                testID="field-save-btn"
                title="Enregistrer"
                onPress={submit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.md, paddingTop: 0, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: sizes.listItem,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  cardSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardArea: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 20,
  },
  cardAreaUnit: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  trashBtn: {
    padding: 4,
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
});
