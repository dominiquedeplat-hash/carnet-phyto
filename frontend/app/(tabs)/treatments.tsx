import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  deleteTreatment,
  getTreatments,
} from '../../src/storage';
import { Treatment } from '../../src/types';
import { colors, radius, sizes, spacing, typography } from '../../src/theme';
import { formatDateTime, formatNumber } from '../../src/format';
import EmptyState from '../../src/components/EmptyState';

export default function TreatmentsScreen() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const load = useCallback(async () => {
    setTreatments(await getTreatments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (t: Treatment) => {
    Alert.alert(
      'Supprimer ce traitement ?',
      'Les produits utilisés seront recrédités dans le stock.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTreatment(t.id);
            await load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Traitements</Text>
        <TouchableOpacity
          testID="add-treatment-btn"
          style={styles.addBtn}
          onPress={() => router.push('/treatment-form')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={treatments}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="water-outline"
            title="Aucun traitement"
            subtitle="Enregistrez votre première pulvérisation."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`treatment-${item.id}`}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/treatment-form', params: { id: item.id } })
            }
            onLongPress={() => confirmDelete(item)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardField} numberOfLines={1}>
                  {item.fieldName}
                </Text>
                <Text style={styles.cardSub}>
                  {item.crop} · {formatNumber(item.fieldArea)} ha
                </Text>
              </View>
              <TouchableOpacity
                testID={`treatment-delete-${item.id}`}
                onPress={() => confirmDelete(item)}
                hitSlop={12}
                style={styles.trashBtn}
              >
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardDateRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cardDate}>{formatDateTime(item.date)}</Text>
            </View>

            <View style={styles.reasonRow}>
              <View style={styles.reasonBadge}>
                <Text style={styles.reasonText}>{item.reason}</Text>
              </View>
              <View style={styles.waterBadge}>
                <Ionicons name="water-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.waterText}>
                  {formatNumber(item.waterVolumePerHa)} L/ha
                </Text>
              </View>
            </View>

            {item.products.length > 0 && (
              <View style={styles.productsList}>
                {item.products.map((p, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <View style={styles.productDot} />
                    <Text style={styles.productName} numberOfLines={1}>
                      {p.productName}
                    </Text>
                    <Text style={styles.productDose}>
                      {formatNumber(p.dosePerHa)} {p.unit}/ha
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
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
  title: { ...typography.h1, color: colors.textPrimary },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.md, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: sizes.listItem,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardField: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
  },
  cardSub: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trashBtn: { padding: 4 },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  cardDate: {
    ...typography.small,
    color: colors.textSecondary,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  reasonBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  reasonText: {
    ...typography.tiny,
    color: colors.primary,
    fontSize: 12,
  },
  waterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  waterText: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontSize: 12,
  },
  productsList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    gap: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  productName: {
    ...typography.small,
    color: colors.textPrimary,
    flex: 1,
  },
  productDose: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
