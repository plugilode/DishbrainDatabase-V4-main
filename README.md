# AI Expert DB

Eine moderne Webanwendung zur Verwaltung und Entdeckung von KI-Unternehmen und Experten in Deutschland. Gebaut mit Next.js, React und Tailwind CSS.

## Features

- 🏢 **Firmenverwaltung**
  - Hinzufügen und Verwalten von KI-Unternehmen
  - Automatische Datenanreicherung
  - Firmenlogo-Integration
  - Social Media Verknüpfung

- 👥 **Expertenverwaltung**
  - Expertenprofile erstellen und verwalten
  - Kategorisierung nach Fachgebieten
  - Akademische Metriken
  - Publikationsverfolgung

## Erste Schritte

1. Repository klonen:
```bash
git clone [repository-url]
cd ai-expert-db
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen einrichten:
```bash
# .env.local erstellen
GEMINI_API_KEY=dein_gemini_api_key
CLEARBIT_API_KEY=dein_clearbit_api_key  # Optional für Firmenlogos
```

4. Entwicklungsserver starten:
```bash
npm run dev
```

5. Browser öffnen: [http://localhost:3000](http://localhost:3000)

## Fehlerbehandlung

### 403 Forbidden Errors
Wenn Sie 403 Fehler bei Firmenlogos sehen:
1. Prüfen Sie die CLEARBIT_API_KEY in .env.local
2. Alternativ wird ein Platzhalterlogo verwendet

### API Endpunkte

```javascript
// Firma erstellen
POST /api/companies
{
  "name": "Firma Name",
  "website": "https://firma.de",
  // Optional
  "industry": "AI",
  "description": "..."
}

// Experte erstellen
POST /api/experts
{
  "name": "Max Mustermann",
  "expertise": ["AI", "Machine Learning"],
  // Optional
  "publications": 42,
  "hIndex": 12
}
```

## Projektstruktur

```
src/
├── app/              # Next.js App Router
├── components/       # React Komponenten
├── data/            # JSON Datenspeicherung
│   ├── companies/   # Firmendaten
│   └── experts/     # Expertendaten
└── utils/           # Hilfsfunktionen
```

## Technologie-Stack

- ⚡ Next.js 13+ mit App Router
- ⚛️ React 18
- 🎨 Tailwind CSS
- 🎭 Framer Motion für Animationen
- 🍞 React Hot Toast für Benachrichtigungen

## Entwicklung

- Code-Formatierung: Prettier
- Linting: ESLint
- Git Hooks: Husky

## Lizenz

MIT

## Support

Bei Fragen oder Problemen:
1. Issues auf GitHub erstellen
2. Pull Requests sind willkommen
3. Dokumentation in `/docs` prüfen