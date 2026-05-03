import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  getFields,
  getProducts,
  getTreatments,
} from '../../src/storage';
import { Field, Product, Treatment } from '../../src/types';
import { colors, radius, sizes, spacing, typography, shadows } from '../../src/theme';
import { formatDateTime, formatNumber } from '../../src/format';
import EmptyState from '../../src/components/EmptyState';

export default function Dashboard() {
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [f, p, t] = await Promise.all([
      getFields(),
      getProducts(),
      getTreatments(),
    ]);
    setFields(f);
    setProducts(p);
    setTreatments(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lowStockProducts = products.filter(
    (p) => p.stock <= p.lowStockThreshold
  );
  const recentTreatments = treatments.slice(0, 3);

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</Text>
            <Text style={styles.title}>Carnet Phyto</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Ionicons name="cloud-offline" size={14} color={colors.primary} />
            <Text style={styles.offlineText}>Hors-ligne</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          testID="dashboard-new-treatment-btn"
          activeOpacity={0.88}
          style={styles.cta}
          onPress={() => router.push('/treatment-form')}
        >
          <View style={styles.ctaIcon}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Nouveau traitement</Text>
            <Text style={styles.ctaSubtitle}>Enregistrer une pulvérisation</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Champs</Text>
            <Text style={styles.metricValue}>{fields.length}</Text>
            <Text style={styles.metricUnit}>
              {formatNumber(fields.reduce((s, f) => s + f.area, 0))} ha
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Produits</Text>
            <Text style={styles.metricValue}>{products.length}</Text>
            <Text style={styles.metricUnit}>en stock</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Traitements</Text>
            <Text style={styles.metricValue}>{treatments.length}</Text>
            <Text style={styles.metricUnit}>enregistrés</Text>
          </View>
        </View>

        {/* Low stock alerts */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="alert-circle" size={22} color={colors.lowStock} />
              <Text style={styles.alertTitle}>
                Stock bas ({lowStockProducts.length})
              </Text>
            </View>
            {lowStockProducts.map((p) => (
              <View key={p.id} style={styles.alertRow}>
                <Text style={styles.alertName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.alertStock}>
                  {formatNumber(p.stock)} {p.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent treatments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Traitements récents</Text>
            {treatments.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/treatments')}>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTreatments.length === 0 ? (
            <EmptyState
              icon="water-outline"
              title="Aucun traitement enregistré"
              subtitle="Commencez par ajouter vos champs et produits, puis enregistrez votre premier traitement."
            />
          ) : (
            recentTreatments.map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`recent-treatment-${t.id}`}
                activeOpacity={0.8}
                style={styles.treatmentCard}
                onPress={() => router.push({ pathname: '/treatment-form', params: { id: t.id } })}
              >
                <View style={styles.treatmentTop}>
                  <Text style={styles.treatmentField} numberOfLines={1}>
                    {t.fieldName}
                  </Text>
                  <Text style={styles.treatmentArea}>{formatNumber(t.fieldArea)} ha</Text>
                </View>
                <Text style={styles.treatmentDate}>{formatDateTime(t.date)}</Text>
                <View style={styles.treatmentReasonRow}>
                  <View style={styles.reasonBadge}>
                    <Text style={styles.reasonText}>{t.reason}</Text>
                  </View>
                  <Text style={styles.productCount}>
                    {t.products.length} produit{t.products.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  date: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  offlineText: {
    ...typography.tiny,
    color: colors.primary,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.lg,
    minHeight: 80,
    ...shadows.md,
  },
  ctaIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    ...typography.h3,
    color: colors.textInverse,
    marginBottom: 2,
  },
  ctaSubtitle: {
    ...typography.small,
    color: colors.primaryLight,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    ...typography.metric,
    color: colors.textPrimary,
    fontSize: 28,
  },
  metricUnit: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.lowStock,
    marginBottom: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertTitle: {
    ...typography.h3,
    color: colors.lowStock,
    fontSize: 16,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5DFAF',
  },
  alertName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  alertStock: {
    ...typography.bodyBold,
    color: colors.lowStock,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  treatmentCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
    minHeight: sizes.listItem,
  },
  treatmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  treatmentField: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 17,
    flex: 1,
    marginRight: 10,
  },
  treatmentArea: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  treatmentDate: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  treatmentReasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  productCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
