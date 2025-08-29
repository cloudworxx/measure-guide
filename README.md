# MeasureGuide 📐

**Professionelle Bildmessung und -annotation mit React, Konva und Tauri**

Eine moderne Desktop-Anwendung für präzise Messungen in Bildern mit Kalibrierung, verschiedenen Messwerkzeugen und Export-Funktionen.

![MeasureGuide Screenshot](docs/screenshot.png)

## 🚀 Features

### 📏 **Messwerkzeuge**
- **Kalibrierung**: Zwei-Punkt-Kalibrierung für Maßstab-Bestimmung
- **Linien**: Längenmessung mit Click-to-Click
- **Rechtecke**: Flächenmessung 
- **Kreise**: Radius- und Flächenmessung
- **Text-Annotationen**: Beschriftungen hinzufügen

### 🎯 **Präzision & Bedienung**
- **Shift-Snapping**: Gerade Linien (horizontal/vertikal/45°)
- **Live-Preview**: Echtzeit-Vorschau beim Zeichnen
- **Zoom & Pan**: Mausrad-Zoom mit Cursor-Anchoring
- **Einheiten**: mm, cm, m unterstützt
- **Pixel-genaue Koordinaten**: Konva Matrix-Transformation

### ⚡ **Workflow**
- **Click-to-Click Linien**: Zwei Klicks statt Drag-and-Drop
- **Automatischer Tool-Wechsel**: Nach Kalibrierung → Linien-Tool
- **Undo/Redo**: History-System (bis zu 100 Schritte)
- **Tastenkürzel**: Space (Pan), Shift (Snapping), Ctrl+Z/Y, ESC (Abbrechen)

### 📤 **Export**
- **PNG**: Hochauflösender Bildexport mit Overlays
- **PDF**: Professionelle Dokumentation mit Kalibrierungs-Info
- **Messungen**: Automatische Anzeige aller Werte

## 🛠️ Tech Stack

### **Frontend**
- **React 19** + TypeScript
- **Konva/React-Konva** für 2D Canvas-Rendering
- **Tailwind CSS** für Styling
- **Vite** als Build-Tool

### **Desktop**
- **Tauri 2.0** (Rust-Framework)
- **Plattformen**: Windows, macOS, Linux

### **Libraries**
- **jsPDF**: PDF-Export
- **Custom Hooks**: useViewport, useHistory, useWindowSize

## 📦 Installation & Development

### **Voraussetzungen**
```bash
# Node.js 18+
node --version

# Rust (für Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### **Setup**
```bash
# Repository klonen
git clone https://github.com/your-username/measure-guide.git
cd measure-guide

# Dependencies installieren
npm install

# Development Server starten
npm run tauri dev
```

### **Build für Production**
```bash
# Desktop-App builden
npm run tauri build

# Ausgabe in src-tauri/target/release/bundle/
# - Windows: .msi und .exe
# - macOS: .app und .dmg  
# - Linux: .deb und .AppImage
```

### **Development Commands**
```bash
# Development mit Hot-Reload
npm run tauri dev

# Vite Development Server (nur Web)
npm run dev

# Build Web-Version
npm run build

# Tauri ohne Frontend-Server
npm run tauri dev --no-dev-server
```

## 🎮 Bedienung

### **Kalibrierung**
1. **"Kalibrieren" klicken**
2. **Ersten Punkt setzen** (bekannte Strecke)
3. **Zweiten Punkt setzen** (mit Shift für gerade Linie)
4. **Reale Länge eingeben** (z.B. "2.50")
5. **"Kalibrieren" bestätigen** → Automatisch Linien-Tool aktiv

### **Messen**
1. **Linien-Tool auswählen**
2. **Ersten Punkt klicken**
3. **Shift halten** (optional) für gerade Linien
4. **Zweiten Punkt klicken** → Messung erscheint automatisch

### **Tastenkürzel**
- **Space**: Verschieben (Pan)
- **Shift**: Gerade Linien (Snapping)
- **Ctrl+Z**: Rückgängig
- **Ctrl+Y**: Wiederholen
- **Ctrl+0**: Zoom zurücksetzen
- **ESC**: Aktion abbrechen
- **Delete**: Ausgewähltes Element löschen

## 🏗️ Architektur

### **Modulare Struktur**
```
src/
├── components/          # React-Komponenten
│   ├── Canvas.tsx       # Konva-Canvas mit Rendering
│   ├── Toolbar.tsx      # Bottom-Toolbar mit Tools
│   ├── CalibrationOverlay.tsx  # Kalibrierungs-UI
│   └── MeasurementLabel.tsx    # Messungs-Anzeigen
│
├── hooks/               # Custom React Hooks
│   ├── useViewport.ts   # Zoom, Pan & Transformation
│   ├── useHistory.ts    # Undo/Redo System
│   └── useWindowSize.ts # Responsive Layout
│
├── types/               # TypeScript Definitionen
├── utils/               # Geometrie & Berechnungen
├── services/            # Export & File-Loading
└── MeasureCanvasApp.tsx # Haupt-App
```

### **State Management**
- **React State** für UI
- **useRef** für Canvas-Koordinaten
- **Custom Hooks** für komplexe Logic

## 🔧 Konfiguration

### **Einstellungen anpassen**
```typescript
// Standard-Einheit ändern
const [unit, setUnit] = useState<Units>("m"); // "mm", "cm", "m"

// Zoom-Grenzen
const clamp = (v: number) => Math.min(5, Math.max(0.1, v)); // 10% - 500%

// History-Größe
if (history.current.length > 100) history.current.shift(); // Max 100 Steps
```

## 🐛 Bekannte Issues

### **Koordinaten-Genauigkeit**
- ✅ **Behoben**: Konva Matrix-Transformation für pixel-genaue Koordinaten
- ✅ **Behoben**: Konsistente hoverPos-Verwendung in allen Tools

### **Performance**
- **Große Bilder**: Canvas-Optimierung bei >4K Bildern
- **Viele Objekte**: Virtualisierung bei >100 Elementen geplant

## 🤝 Contributing

### **Development Guidelines**
- **TypeScript strict mode**
- **Komponenten-Tests** mit React Testing Library
- **Modular architecture** - ein Feature pro Komponente
- **Clean Code** - self-documenting functions

### **Pull Requests**
1. Feature Branch erstellen
2. Tests hinzufügen/aktualisieren
3. Code Review anfordern
4. Merge nach Approval

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🙏 Credits

- **React-Konva** für Canvas-Rendering
- **Tauri** für Desktop-Framework
- **Tailwind CSS** für Styling
- **jsPDF** für PDF-Export

---

**Entwickelt mit ❤️ für präzise Bildmessungen**
