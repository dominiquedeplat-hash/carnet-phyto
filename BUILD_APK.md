# Carnet Phyto — Construire l'APK Android avec EAS Build

Application Expo **hors-ligne** pour le suivi des pulvérisations phytosanitaires.

## Construire un APK Android installable

### Prérequis
- Node.js 20+ installé
- Un compte Expo gratuit : https://expo.dev/signup
- Ce dépôt cloné localement

### 1. Installer les dépendances
```bash
cd frontend
npm install -g eas-cli
yarn install
```

### 2. Se connecter à Expo
```bash
eas login
```

### 3. Lier le projet Expo (première fois uniquement)
```bash
eas init
```
Répondez **yes** pour créer un nouveau projet. L'ID EAS sera automatiquement ajouté à `app.json`.

### 4. Lancer le build APK
```bash
eas build --platform android --profile preview
```

Le build se lance sur les serveurs Expo (gratuits — file d'attente plus longue aux heures de pointe). Compter **10 à 25 minutes**. À la fin, EAS affiche un lien de téléchargement (ex : `https://expo.dev/artifacts/eas/....apk`).

### 5. Installer sur votre téléphone Android
1. Téléchargez le `.apk` (depuis le lien EAS ou transférez-le via USB/email/cloud)
2. Sur votre téléphone : **Paramètres → Sécurité → Autoriser l'installation de sources inconnues** (pour votre navigateur ou gestionnaire de fichiers)
3. Ouvrez le fichier `.apk` et appuyez sur **Installer**
4. Lancez **Carnet Phyto** depuis votre menu d'applications

L'app fonctionne ensuite **100 % hors-ligne** — toutes les données restent sur votre téléphone.

### Mettre à jour l'APK plus tard
Lorsque vous modifiez le code :
1. Incrémentez `versionCode` dans `app.json` (ex : 1 → 2)
2. Relancez `eas build --platform android --profile preview`
3. Réinstallez le nouvel APK (écrasera la version précédente sans perdre les données locales)
