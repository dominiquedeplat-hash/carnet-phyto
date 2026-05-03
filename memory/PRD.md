# Carnet Phyto — PRD

## Overview
Offline-first Android mobile application (React Native / Expo) for French farmers to record pesticide spraying activities and manage phytosanitary product stock.

## Target User
French farmers (agriculteurs) needing to maintain a phytosanitary register for regulatory compliance.

## Key Features (MVP)
1. **Fields management** (Champs) — name, area in hectares, crop
2. **Product catalog** (Produits phyto) — name, category (Herbicide/Fongicide/Insecticide/Autre), unit (L/kg), current stock, low-stock threshold
3. **Treatment recording** (Traitements) — field, date/time, reason (Désherbage / Rattrapage / Maladie fongique / Insecticides / Autre), water volume per ha (80/100/150/200/custom), multiple products with dose (L/ha or kg/ha), optional notes
4. **Automatic stock update** — stock is decremented on treatment save; refunded on treatment deletion; adjusted on edit
5. **Low-stock alerts** — displayed on dashboard when stock ≤ threshold
6. **PDF export** — formatted printable phytosanitary register
7. **CSV export** — for Excel / spreadsheets (semicolon separator, UTF-8 BOM)
8. **100% offline** — all data in AsyncStorage, no backend dependency

## Tech Stack
- Expo SDK 54, React Native, Expo Router (tabs)
- AsyncStorage for persistence
- @react-native-community/datetimepicker for date/time
- expo-print + expo-sharing + expo-file-system for exports
- @expo/vector-icons (Ionicons)

## Data Models
- `Field { id, name, area, crop, createdAt }`
- `Product { id, name, category, unit, stock, lowStockThreshold, createdAt }`
- `Treatment { id, fieldId/Name/Area (snapshot), crop, date, products[{productId, productName, unit, dosePerHa}], waterVolumePerHa, reason, notes, createdAt }`

## Navigation
Bottom tabs: Accueil / Champs / Traitements / Produits / Export
Plus a full-screen modal: `/treatment-form` (create / edit treatment)

## Future Enhancements (not in MVP)
- Cloud sync (user requested "optional later")
- DAR (délai avant récolte) tracking
- Statistics (consumption per field / crop / product)
- Weather conditions & ZNT tracking
- Multiple sprayers / operators
- Barcode scanning for products
