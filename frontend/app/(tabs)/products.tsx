import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import {
  deleteProduct,
  getProducts,
  saveProduct,
} from '../../src/storage';
import { Product, ProductCategory, Unit } from '../../src/types';
import { colors, radius, sizes, spacing, typography } from '../../src/theme';
import { formatNumber, parseFrenchNumber } from '../../src/format';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';
import SegmentedPicker from '../../src/components/SegmentedPicker';

const CATEGORY_OPTIONS: { value: ProductCategory; label: string; color: string }[] = [
  { value: 'Herbicide', label: 'Herbicide', color: colors.catHerbicide },
  { value: 'Fongicide', label: 'Fongicide', color: colors.catFongicide },
  { value: 'Insecticide', label: 'Insecticide', color: colors.catInsecticide },
  { value: 'Autre', label: 'Autre', color: colors.catAutre },
];

const categoryColor = (c: ProductCategory) =>
  CATEGORY_OPTIONS.find((o) => o.value === c)?.color ?? colors.catAutre;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Herbicide');
  const [unit, setUnit] = useState<Unit>('L');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('');
  const [amm, setAmm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setProducts(await getProducts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCategory('Herbicide');
    setUnit('L');
    setStock('');
    setThreshold('');
    setAmm('');
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setCategory(p.category);
    setUnit(p.unit);
    setStock(String(p.stock).replace('.', ','));
    setThreshold(String(p.lowStockThreshold).replace('.', ','));
    setAmm(p.amm ?? '');
    setErrors({});
    setShowForm(true);
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Requis';
    const s = parseFrenchNumber(stock);
    if (isNaN(s) || s < 0) e.stock = 'Invalide';
    const th = parseFrenchNumber(threshold);
    if (isNaN(th) || th < 0) e.threshold = 'Invalide';
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    await saveProduct({
      id: editing?.id,
      name: name.trim(),
      category,
      unit,
      stock: s,
      lowStockThreshold: th,
      amm: amm.trim() || undefined,
    });
    setShowForm(false);
    await load();
  };

  const openEphy = (ammNum: string) => {
    const cleaned = ammNum.replace(/\s/g, '');
    // E-Phy n'a pas d'URL de recherche directe par numéro AMM (formulaire JS).
    // On passe par DuckDuckGo avec un filtre `site:ephy.anses.fr` : le 1er
    // résultat est la fiche officielle du produit. DuckDuckGo est utilisé
    // plutôt que Google car il ne déclenche pas de CAPTCHA et est plus rapide.
    const query = `site:ephy.anses.fr ${cleaned}`;
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', "Impossible d'ouvrir la recherche e-Phy.");
    });
  };

  const confirmDelete = (p: Product) => {
    Alert.alert(
      'Supprimer ce produit ?',
      `"${p.name}" sera retiré du catalogue.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(p.id);
            await load();
          },
        },
      ]
    );
  };

  // Build grouped sections: ordered categories, then alphabetical names inside
  const CATEGORY_ORDER: ProductCategory[] = ['Herbicide', 'Fongicide', 'Insecticide', 'Autre'];
  const sections = useMemo(() => {
    const groups: Record<ProductCategory, Product[]> = {
      Herbicide: [],
      Fongicide: [],
      Insecticide: [],
      Autre: [],
    };
    for (const p of products) {
      groups[p.category].push(p);
    }
    return CATEGORY_ORDER
      .map((cat) => ({
        title: cat,
        color: categoryColor(cat),
        data: groups[cat].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [products]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Produits phyto</Text>
        <TouchableOpacity
          testID="add-product-btn"
          style={styles.addBtn}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="flask-outline"
            title="Aucun produit"
            subtitle="Ajoutez vos produits phytosanitaires pour gérer votre stock."
          />
        }
        renderSectionHeader={({ section }) => (
          <View
            testID={`section-${section.title}`}
            style={[
              styles.sectionHeader,
              { backgroundColor: section.color + '15', borderColor: section.color + '40' },
            ]}
          >
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>
              {section.data.length} produit{section.data.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const low = item.stock <= item.lowStockThreshold;
          return (
            <TouchableOpacity
              testID={`product-${item.id}`}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() => openEdit(item)}
              onLongPress={() => confirmDelete(item)}
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: categoryColor(item.category) + '22' },
                ]}
              >
                <Ionicons
                  name="flask"
                  size={22}
                  color={categoryColor(item.category)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardMeta}>
                  <View
                    style={[
                      styles.catBadge,
                      { backgroundColor: categoryColor(item.category) + '22' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.catBadgeText,
                        { color: categoryColor(item.category) },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  {low && (
                    <View style={styles.lowBadge}>
                      <Ionicons name="alert-circle" size={12} color={colors.lowStock} />
                      <Text style={styles.lowText}>Stock bas</Text>
                    </View>
                  )}
                </View>
                {item.amm ? (
                  <TouchableOpacity
                    testID={`product-amm-${item.id}`}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEphy(item.amm!);
                    }}
                    style={styles.ammRow}
                    hitSlop={6}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ammLabel}>AMM </Text>
                    <Text style={styles.ammLink}>{item.amm}</Text>
                    <Ionicons name="open-outline" size={13} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardStock, low && { color: colors.lowStock }]}>
                  {formatNumber(item.stock)}
                </Text>
                <Text style={styles.cardUnit}>{item.unit}</Text>
              </View>
              <TouchableOpacity
                testID={`product-delete-${item.id}`}
                onPress={() => confirmDelete(item)}
                hitSlop={12}
                style={styles.trashBtn}
              >
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

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
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                testID="product-name-input"
                label="Nom commercial"
                placeholder="Ex : Roundup Flex"
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoFocus
              />
              <Input
                testID="product-amm-input"
                label="N° AMM (optionnel)"
                placeholder="Ex : 2090024"
                value={amm}
                onChangeText={setAmm}
                keyboardType="number-pad"
              />
              <SegmentedPicker
                label="Catégorie"
                value={category}
                onChange={setCategory}
                options={CATEGORY_OPTIONS}
                testID="product-category-picker"
              />
              <SegmentedPicker
                label="Unité"
                value={unit}
                onChange={setUnit}
                options={[
                  { value: 'L', label: 'Litres (L)' },
                  { value: 'kg', label: 'Kilos (kg)' },
                ]}
                testID="product-unit-picker"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    testID="product-stock-input"
                    label="Stock actuel"
                    placeholder="0"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="decimal-pad"
                    suffix={unit}
                    error={errors.stock}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    testID="product-threshold-input"
                    label="Seuil alerte"
                    placeholder="0"
                    value={threshold}
                    onChangeText={setThreshold}
                    keyboardType="decimal-pad"
                    suffix={unit}
                    error={errors.threshold}
                  />
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                testID="product-cancel-btn"
                title="Annuler"
                variant="secondary"
                onPress={() => setShowForm(false)}
                style={{ flex: 1 }}
              />
              <Button
                testID="product-save-btn"
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    ...typography.tiny,
    color: colors.textMuted,
    fontSize: 11,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  catBadgeText: {
    ...typography.tiny,
  },
  lowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 2,
  },
  lowText: {
    ...typography.tiny,
    color: colors.lowStock,
    fontSize: 11,
  },
  ammRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  ammLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontSize: 11,
  },
  ammLink: {
    ...typography.tiny,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  cardRight: { alignItems: 'flex-end' },
  cardStock: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 20,
  },
  cardUnit: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  trashBtn: { padding: 4 },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
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
