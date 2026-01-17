# Workdays v2

App React Native + Expo per tracciare i giorni lavorativi, calcolare guadagni e tasse da pagare.

## Struttura del Progetto

### Schermate Principali

- **Month Recap** (`app/(tabs)/index.tsx`) - Schermata principale per il recap mensile dei giorni lavorativi
- **Year Recap** (`app/(tabs)/yearScreen.tsx`) - Riepilogo annuale dei guadagni e delle tasse
- **Settings** (`app/(tabs)/settingsScreen.tsx`) - Impostazioni con possibilità di esportare/importare backup JSON

### Utilities

- `utils/storage.ts` - Gestione dello storage persistente in memoria
- `utils/finance.ts` - Calcoli finanziari per guadagni e tasse
- `utils/exportBackup.ts` - Esportazione dei dati in formato JSON
- `utils/restoreBackup.ts` - Importazione dei backup JSON

### Context & State Management

- `contexts/GlobalStateProvider.tsx` - Provider per la gestione dello stato globale dell'applicazione

### Componenti UI

- `components/ThemedText.tsx` - Componente testo con supporto per i temi
- `components/ThemedView.tsx` - Componente view con supporto per i temi
- `components/HapticTab.tsx` - Tab con feedback tattile
- `components/ui/` - Componenti UI riutilizzabili

## Setup e Avvio

### Installazione

```bash
npm install
```

### Avvio su Android

```bash
npm run android
```

### Avvio su iOS

```bash
npm run ios
```

### Avvio web

```bash
npm run web
```

## Dipendenze Principali

- React Native 0.81.5
- Expo SDK 54
- Expo Router 6 (navigazione basata su file system)
- React Native Async Storage (storage persistente)
- Date-fns (gestione date)
- React Native Calendars (UI calendario)

## Note

- Il progetto è stato creato partendo da parti del progetto esistente "workdays - exporouter"
- Non include lo screen dei savings (rimosso intenzionalmente)
- Configurato per Android come target principale
