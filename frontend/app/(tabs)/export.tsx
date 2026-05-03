import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  getFields,
  getProducts,
  getTreatments,
  clearAll,
} from '../../src/storage';
import { Field, Product, Treatment } from '../../src/types';
import { colors, radius, sizes, spacing, typography } from '../../src/theme';
import { formatDate, formatDateTime, formatNumber } from '../../src/format';

export default function ExportScreen() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [t, f, p] = await Promise.all([
      getTreatments(),
      getFields(),
      getProducts(),
    ]);
    setTreatments(t);
    setFields(f);
    setProducts(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const buildCSV = (): string => {
    const header = [
      'Date',
      'Heure',
      'Champ',
      'Culture',
      'Surface (ha)',
      'Raison',
      'Produit',
      'Dose (unité/ha)',
      'Unité',
      'Quantité totale',
      'Volume bouillie (L/ha)',
      'Bouillie totale (L)',
      'Notes',
    ];
    const rows: string[] = [header.join(';')];
    for (const t of treatments) {
      const d = new Date(t.date);
      const dateStr = d.toLocaleDateString('fr-FR');
      const timeStr = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const totalBouillie = (t.waterVolumePerHa * t.fieldArea).toFixed(2);
      if (t.products.length === 0) {
        rows.push(
          [
            dateStr,
            timeStr,
            csv(t.fieldName),
            csv(t.crop),
            t.fieldArea.toString().replace('.', ','),
            csv(t.reason),
            '',
            '',
            '',
            '',
            t.waterVolumePerHa.toString().replace('.', ','),
            totalBouillie.replace('.', ','),
            csv(t.notes ?? ''),
          ].join(';')
        );
      } else {
        for (const p of t.products) {
          const totalQty = (p.dosePerHa * t.fieldArea).toFixed(3);
          rows.push(
            [
              dateStr,
              timeStr,
              csv(t.fieldName),
              csv(t.crop),
              t.fieldArea.toString().replace('.', ','),
              csv(t.reason),
              csv(p.productName),
              p.dosePerHa.toString().replace('.', ','),
              p.unit,
              totalQty.replace('.', ','),
              t.waterVolumePerHa.toString().replace('.', ','),
              totalBouillie.replace('.', ','),
              csv(t.notes ?? ''),
            ].join(';')
          );
        }
      }
    }
    return rows.join('\n');
  };

  const csv = (s: string) => {
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const buildHTML = (): string => {
    const rows = treatments
      .map((t) => {
        const prods = t.products
          .map(
            (p) =>
              `<tr class="sub"><td></td><td></td><td></td><td></td><td>${escapeHtml(
                p.productName
              )}</td><td>${formatNumber(p.dosePerHa)} ${p.unit}/ha</td><td>${formatNumber(
                p.dosePerHa * t.fieldArea
              )} ${p.unit}</td></tr>`
          )
          .join('');
        return `
          <tr>
            <td><b>${formatDateTime(t.date)}</b></td>
            <td>${escapeHtml(t.fieldName)}<br/><span class="muted">${escapeHtml(
          t.crop
        )}</span></td>
            <td>${formatNumber(t.fieldArea)} ha</td>
            <td>${escapeHtml(t.reason)}</td>
            <td colspan="3">Bouillie : ${formatNumber(
              t.waterVolumePerHa
            )} L/ha (${formatNumber(t.waterVolumePerHa * t.fieldArea)} L)</td>
          </tr>
          ${prods}
          ${
            t.notes
              ? `<tr class="sub"><td colspan="7"><i>Notes : ${escapeHtml(
                  t.notes
                )}</i></td></tr>`
              : ''
          }
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"/>
      <style>
        body { font-family: -apple-system, Roboto, sans-serif; color: #1c1917; padding: 24px; }
        h1 { color: #047857; margin: 0 0 4px; }
        .sub-title { color: #57534e; margin-bottom: 24px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f5f5f4; text-align: left; padding: 8px; border-bottom: 2px solid #047857; font-size: 10px; text-transform: uppercase; }
        td { padding: 8px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
        tr.sub td { background: #fafaf9; font-size: 11px; }
        .muted { color: #78716c; font-size: 10px; }
      </style>
      </head>
      <body>
        <h1>Registre phytosanitaire</h1>
        <div class="sub-title">Édité le ${formatDate(new Date().toISOString())} — ${treatments.length} traitement(s)</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Champ / Culture</th>
              <th>Surface</th>
              <th>Raison</th>
              <th>Produit</th>
              <th>Dose</th>
              <th>Quantité totale</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:40px;color:#78716c">Aucun traitement enregistré</td></tr>'}</tbody>
        </table>
      </body></html>
    `;
  };

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const exportPDF = async () => {
    if (treatments.length === 0) {
      Alert.alert('Aucune donnée', 'Enregistrez au moins un traitement.');
      return;
    }
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHTML() });
      const filename = `registre-phyto-${new Date().toISOString().slice(0, 10)}.pdf`;
      let shareUri = uri;
      try {
        const dest = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        shareUri = dest;
      } catch {}
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Registre phytosanitaire',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF généré', shareUri);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Export PDF impossible');
    } finally {
      setBusy(false);
    }
  };

  const exportCSV = async () => {
    if (treatments.length === 0) {
      Alert.alert('Aucune donnée', 'Enregistrez au moins un traitement.');
      return;
    }
    setBusy(true);
    try {
      const csvStr = '\ufeff' + buildCSV(); // BOM for Excel UTF-8
      const filename = `traitements-${new Date().toISOString().slice(0, 10)}.csv`;
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, csvStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export CSV',
        });
      } else {
        Alert.alert('CSV généré', uri);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Export CSV impossible');
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Tout supprimer ?',
      'Cette action supprimera tous vos champs, produits et traitements. Irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            await load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Export & données</Text>
        <Text style={styles.subtitle}>
          Exportez votre registre phytosanitaire pour le conserver ou le transmettre.
        </Text>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Champs</Text>
            <Text style={styles.statValue}>{fields.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Produits</Text>
            <Text style={styles.statValue}>{products.length}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.statLabel}>Traitements</Text>
            <Text style={styles.statValue}>{treatments.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          testID="export-pdf-btn"
          activeOpacity={0.85}
          style={[styles.bigBtn, styles.primaryBtn]}
          onPress={exportPDF}
          disabled={busy}
        >
          <View style={[styles.btnIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="document-text" size={28} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.btnTitle, { color: colors.textInverse }]}>
              Exporter en PDF
            </Text>
            <Text style={[styles.btnSub, { color: colors.primaryLight }]}>
              Registre imprimable (A4)
            </Text>
          </View>
          <Ionicons name="share-outline" size={22} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="export-csv-btn"
          activeOpacity={0.85}
          style={[styles.bigBtn, styles.secondaryBtn]}
          onPress={exportCSV}
          disabled={busy}
        >
          <View style={[styles.btnIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="grid" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.btnTitle, { color: colors.textPrimary }]}>
              Exporter en CSV
            </Text>
            <Text style={[styles.btnSub, { color: colors.textSecondary }]}>
              Pour Excel / tableur
            </Text>
          </View>
          <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="cloud-offline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Application 100% hors-ligne</Text>
            <Text style={styles.infoText}>
              Toutes vos données sont stockées localement sur votre appareil. Aucune
              connexion internet n'est requise pour utiliser l'application.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="reset-data-btn"
          activeOpacity={0.85}
          style={styles.dangerBtn}
          onPress={confirmReset}
        >
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          <Text style={styles.dangerText}>Tout effacer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  content: { padding: spacing.md, paddingBottom: 40 },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  statsCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 14,
    minHeight: 84,
    marginBottom: 12,
  },
  primaryBtn: { backgroundColor: colors.primary },
  secondaryBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTitle: {
    ...typography.h3,
    fontSize: 17,
    marginBottom: 2,
  },
  btnSub: {
    ...typography.small,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  infoTitle: {
    ...typography.bodyBold,
    color: colors.primaryActive,
    marginBottom: 4,
  },
  infoText: {
    ...typography.small,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
    padding: 14,
    minHeight: sizes.touch,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.destructive,
  },
  dangerText: {
    ...typography.bodyBold,
    color: colors.destructive,
  },
});
