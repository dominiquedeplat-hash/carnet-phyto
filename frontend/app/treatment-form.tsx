import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getFields,
  getProducts,
  getTreatments,
  saveTreatment,
} from '../src/storage';
import {
  Field,
  Product,
  Treatment,
  TreatmentProduct,
  TreatmentReason,
} from '../src/types';
import { colors, radius, sizes, spacing, typography } from '../src/theme';
import { formatDateTime, formatNumber, parseFrenchNumber } from '../src/format';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import SegmentedPicker from '../src/components/SegmentedPicker';

const REASON_OPTIONS: { value: TreatmentReason; label: string }[] = [
  { value: 'Désherbage', label: 'Désherbage' },
  { value: 'Rattrapage', label: 'Rattrapage' },
  { value: 'Maladie fongique', label: 'Fongique' },
  { value: 'Insecticides', label: 'Insecticide' },
  { value: 'Autre', label: 'Autre' },
];

const WATER_OPTIONS = [
  { value: '80', label: '80 L/ha' },
  { value: '100', label: '100 L/ha' },
  { value: '150', label: '150 L/ha' },
  { value: '200', label: '200 L/ha' },
];

export default function TreatmentForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [fields, setFields] = useState<Field[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [reason, setReason] = useState<TreatmentReason>('Désherbage');
  const [waterVolume, setWaterVolume] = useState('100');
  const [customWater, setCustomWater] = useState(false);
  const [customWaterValue, setCustomWaterValue] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedProducts, setSelectedProducts] = useState<TreatmentProduct[]>([]);
  // Raw text inputs for doses — kept separately so the user can type "0," without
  // the field being reset (parseFrenchNumber("0,") === 0 which wiped the input).
  const [doseTexts, setDoseTexts] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [fieldPickerVisible, setFieldPickerVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadInitial = useCallback(async () => {
    const [f, p] = await Promise.all([getFields(), getProducts()]);
    setFields(f);
    setProducts(p);

    if (isEdit && params.id) {
      const all = await getTreatments();
      const t = all.find((x) => x.id === params.id);
      if (t) {
        setFieldId(t.fieldId);
        setDate(new Date(t.date));
        setReason(t.reason);
        const wv = String(t.waterVolumePerHa);
        if (WATER_OPTIONS.some((o) => o.value === wv)) {
          setWaterVolume(wv);
          setCustomWater(false);
        } else {
          setCustomWater(true);
          setCustomWaterValue(wv.replace('.', ','));
        }
        setNotes(t.notes ?? '');
        setSelectedProducts(t.products);
        setDoseTexts(
          t.products.map((p) =>
            p.dosePerHa === 0 ? '' : String(p.dosePerHa).replace('.', ',')
          )
        );
      }
    }
    setLoaded(true);
  }, [isEdit, params.id]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === fieldId),
    [fields, fieldId]
  );

  const availableProducts = products.filter(
    (p) => !selectedProducts.some((sp) => sp.productId === p.id)
  );

  const waterPerHa = customWater
    ? parseFrenchNumber(customWaterValue)
    : parseFrenchNumber(waterVolume);

  const totalWater = selectedField ? waterPerHa * selectedField.area : 0;

  const addProduct = (p: Product) => {
    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        unit: p.unit,
        dosePerHa: 0,
      },
    ]);
    setDoseTexts((prev) => [...prev, '']);
    setPickerVisible(false);
  };

  const updateDose = (index: number, doseText: string) => {
    // Keep only digits, comma and dot. Normalize multiple separators.
    let cleaned = doseText.replace(/[^0-9.,]/g, '').replace(/\./g, ',');
    const firstComma = cleaned.indexOf(',');
    if (firstComma !== -1) {
      cleaned =
        cleaned.slice(0, firstComma + 1) +
        cleaned.slice(firstComma + 1).replace(/,/g, '');
    }
    setDoseTexts((prev) => prev.map((t, i) => (i === index ? cleaned : t)));
    setSelectedProducts((prev) =>
      prev.map((sp, i) =>
        i === index ? { ...sp, dosePerHa: parseFrenchNumber(cleaned) } : sp
      )
    );
  };

  const removeProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    setDoseTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!selectedField) e.field = 'Sélectionnez un champ';
    if (selectedProducts.length === 0) e.products = 'Ajoutez au moins un produit';
    if (selectedProducts.some((p) => !p.dosePerHa || p.dosePerHa <= 0))
      e.dose = 'Dose invalide pour un produit';
    if (!waterPerHa || waterPerHa <= 0) e.water = 'Volume de bouillie invalide';

    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstError = Object.values(e)[0];
      Alert.alert('Formulaire incomplet', firstError);
      return;
    }

    if (!selectedField) return;

    await saveTreatment({
      id: isEdit ? params.id : undefined,
      fieldId: selectedField.id,
      fieldName: selectedField.name,
      fieldArea: selectedField.area,
      crop: selectedField.crop,
      date: date.toISOString(),
      products: selectedProducts,
      waterVolumePerHa: waterPerHa,
      reason,
      notes: notes.trim() || undefined,
    });

    router.back();
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <View />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="treatment-close-btn"
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? 'Modifier' : 'Nouveau traitement'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Field picker */}
          <Text style={styles.label}>Champ</Text>
          <TouchableOpacity
            testID="treatment-field-btn"
            activeOpacity={0.85}
            style={[styles.selector, !!errors.field && styles.selectorError]}
            onPress={() => {
              if (fields.length === 0) {
                Alert.alert(
                  'Aucun champ',
                  'Ajoutez d\'abord un champ dans l\'onglet Champs.'
                );
                return;
              }
              setFieldPickerVisible(true);
            }}
          >
            <Ionicons name="leaf" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              {selectedField ? (
                <>
                  <Text style={styles.selectorText}>{selectedField.name}</Text>
                  <Text style={styles.selectorSub}>
                    {selectedField.crop} · {formatNumber(selectedField.area)} ha
                  </Text>
                </>
              ) : (
                <Text style={styles.selectorPlaceholder}>Sélectionner un champ</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Date & time */}
          <Text style={styles.label}>Date et heure</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <TouchableOpacity
              testID="treatment-date-btn"
              style={[styles.selector, { flex: 1 }]}
              onPress={() => setShowDate(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorText}>
                {date.toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="treatment-time-btn"
              style={[styles.selector, { flex: 1 }]}
              onPress={() => setShowTime(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorText}>
                {date.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDate(Platform.OS === 'ios');
                if (selected) {
                  const d = new Date(date);
                  d.setFullYear(selected.getFullYear());
                  d.setMonth(selected.getMonth());
                  d.setDate(selected.getDate());
                  setDate(d);
                }
              }}
            />
          )}
          {showTime && (
            <DateTimePicker
              value={date}
              mode="time"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowTime(Platform.OS === 'ios');
                if (selected) {
                  const d = new Date(date);
                  d.setHours(selected.getHours());
                  d.setMinutes(selected.getMinutes());
                  setDate(d);
                }
              }}
            />
          )}

          {/* Reason */}
          <SegmentedPicker
            label="Raison du passage"
            value={reason}
            onChange={setReason}
            options={REASON_OPTIONS}
            testID="treatment-reason-picker"
          />

          {/* Water volume */}
          <Text style={styles.label}>Volume de bouillie (eau + produits)</Text>
          <View style={styles.waterRow}>
            {WATER_OPTIONS.map((o) => {
              const active = !customWater && waterVolume === o.value;
              return (
                <TouchableOpacity
                  key={o.value}
                  testID={`water-${o.value}`}
                  style={[styles.waterPill, active && styles.waterPillActive]}
                  onPress={() => {
                    setCustomWater(false);
                    setWaterVolume(o.value);
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.waterPillText,
                      active && { color: colors.textInverse },
                    ]}
                  >
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              testID="water-custom"
              style={[styles.waterPill, customWater && styles.waterPillActive]}
              onPress={() => setCustomWater(true)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.waterPillText,
                  customWater && { color: colors.textInverse },
                ]}
              >
                Autre
              </Text>
            </TouchableOpacity>
          </View>
          {customWater && (
            <Input
              testID="water-custom-input"
              placeholder="Ex : 120"
              value={customWaterValue}
              onChangeText={setCustomWaterValue}
              keyboardType="decimal-pad"
              suffix="L/ha"
            />
          )}

          {selectedField && waterPerHa > 0 && (
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.infoText}>
                Total bouillie : {formatNumber(totalWater)} L pour{' '}
                {formatNumber(selectedField.area)} ha
              </Text>
            </View>
          )}

          {/* Products */}
          <View style={styles.productsHeader}>
            <Text style={styles.label}>Produits utilisés</Text>
            <TouchableOpacity
              testID="treatment-add-product-btn"
              style={styles.addProductBtn}
              onPress={() => {
                if (products.length === 0) {
                  Alert.alert(
                    'Aucun produit',
                    'Ajoutez d\'abord un produit dans l\'onglet Produits.'
                  );
                  return;
                }
                if (availableProducts.length === 0) {
                  Alert.alert('Info', 'Tous les produits sont déjà ajoutés.');
                  return;
                }
                setPickerVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addProductText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {selectedProducts.length === 0 && (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>
                Aucun produit sélectionné
              </Text>
            </View>
          )}

          {selectedProducts.map((sp, idx) => {
            const product = products.find((p) => p.id === sp.productId);
            const totalQty = sp.dosePerHa * (selectedField?.area ?? 0);
            const insufficientStock =
              product && totalQty > product.stock;
            return (
              <View
                key={sp.productId}
                testID={`selected-product-${sp.productId}`}
                style={styles.productCard}
              >
                <View style={styles.productCardHeader}>
                  <Text style={styles.productCardName} numberOfLines={1}>
                    {sp.productName}
                  </Text>
                  <TouchableOpacity
                    testID={`remove-product-${sp.productId}`}
                    onPress={() => removeProduct(idx)}
                    hitSlop={12}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.doseRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      testID={`dose-${sp.productId}`}
                      label={`Dose (${sp.unit}/ha)`}
                      placeholder="Ex : 0,5"
                      value={doseTexts[idx] ?? ''}
                      onChangeText={(v) => updateDose(idx, v)}
                      keyboardType="decimal-pad"
                      suffix={`${sp.unit}/ha`}
                    />
                  </View>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text
                      style={[
                        styles.totalValue,
                        insufficientStock && { color: colors.destructive },
                      ]}
                    >
                      {formatNumber(totalQty)} {sp.unit}
                    </Text>
                    {product && (
                      <Text style={styles.totalStock}>
                        Stock : {formatNumber(product.stock)} {product.unit}
                      </Text>
                    )}
                  </View>
                </View>
                {insufficientStock && (
                  <View style={styles.warnBox}>
                    <Ionicons
                      name="warning"
                      size={14}
                      color={colors.destructive}
                    />
                    <Text style={styles.warnText}>
                      Stock insuffisant ! ({formatNumber(totalQty - product!.stock)}{' '}
                      {sp.unit} manquant)
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Notes */}
          <Input
            testID="treatment-notes-input"
            label="Notes (optionnel)"
            placeholder="Conditions météo, observations..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            testID="treatment-submit-btn"
            title={isEdit ? 'Mettre à jour' : 'Enregistrer le traitement'}
            onPress={submit}
            icon={
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.textInverse}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* Product picker */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Choisir un produit</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {availableProducts.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`picker-product-${p.id}`}
                style={styles.pickerItem}
                onPress={() => addProduct(p)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{p.name}</Text>
                  <Text style={styles.pickerSub}>
                    {p.category} · Stock : {formatNumber(p.stock)} {p.unit}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Field picker */}
      <Modal
        visible={fieldPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFieldPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFieldPickerVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Choisir un champ</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {fields.map((f) => (
              <TouchableOpacity
                key={f.id}
                testID={`picker-field-${f.id}`}
                style={styles.pickerItem}
                onPress={() => {
                  setFieldId(f.id);
                  setFieldPickerVisible(false);
                }}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{f.name}</Text>
                  <Text style={styles.pickerSub}>
                    {f.crop} · {formatNumber(f.area)} ha
                  </Text>
                </View>
                {fieldId === f.id && (
                  <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: { padding: 4, width: 32 },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  content: { padding: spacing.md, paddingBottom: 40 },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touch,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
  },
  selectorError: { borderColor: colors.destructive },
  selectorText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  selectorSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectorPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
  },
  waterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  waterPill: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  waterPillText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 14,
  },
  infoText: {
    ...typography.bodyBold,
    color: colors.primaryActive,
    flex: 1,
    fontSize: 14,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    gap: 4,
  },
  addProductText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 14,
  },
  emptyProducts: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyProductsText: {
    ...typography.body,
    color: colors.textMuted,
  },
  productCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 10,
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productCardName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  doseRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  totalBox: {
    width: 120,
    padding: 10,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.md,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  totalLabel: {
    ...typography.tiny,
    color: colors.textMuted,
  },
  totalValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
    marginVertical: 2,
  },
  totalStock: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
  },
  warnText: {
    ...typography.small,
    color: colors.destructive,
    fontSize: 13,
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
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
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.lg,
    marginBottom: 8,
    minHeight: sizes.listItem,
  },
  pickerName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  pickerSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
