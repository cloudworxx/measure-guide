# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt der [Semantischen Versionierung](https://semver.org/spec/v2.0.0.html).

## [Unveröffentlicht]

### Behoben
- TextTool verwendet jetzt die konfigurierte Textfarbe aus dem Modal anstatt der Footer-Bar-Farbe
- Footer-Bar zeigt wieder "Farbe" für Strich-/Messungsfarben (nicht Textfarbe)
- Text-Modal verwendet jetzt echten Placeholder "Text eingeben..." anstatt vordefiniertem Text
- Textentitäten verwenden jetzt konsequent die im Modal eingestellte Textfarbe
- Klare Trennung: Footer-Farbe nur für Striche/Messungen, Textfarbe nur im Text-Modal
- Zeichen-Tools (draw-line, draw-rect, draw-circle) funktionieren jetzt korrekt
- Strichbreiten-Kontrolle für ausgewählte Elemente hinzugefügt

### Hinzugefügt
- Live-Änderung von Farbe und Strichbreite für ausgewählte Elemente
- Strichbreiten-Kontrolle wird bei Elementauswahl automatisch angezeigt
- Draw-Tools (Zeichnen ohne Messungen) für Linien, Rechtecke und Kreise
- Interaktive Bearbeitung von Element-Eigenschaften über die Toolbar

### Geändert
- Text-Modal kompakter und benutzerfreundlicher gestaltet (max-w-md statt max-w-lg)
- Verbesserte Textfarbenverwaltung: Vollständig getrennte Textfarbe von Strich-/Rahmenfarbe
- README.md erweitert und aktualisiert mit detaillierten Build-Anweisungen
- CHANGELOG.md erstellt und alle bisherigen Änderungen dokumentiert
- Text-Eingabefeld kleiner und effizienter (h-24 statt h-32)
- Textfarben-Kontrolle nur im Modal, nicht in der Footer-Toolbar

### Entfernt
- Textfarben-Vorschau in der Footer-Toolbar für klarere Tool-Trennung

## [0.1.0] - 2025-01-29

### Hinzugefügt
- Erste Version der MeasureGuide Tauri-Anwendung
- Kalibrierungssystem mit Zwei-Punkt-Kalibrierung
- Messwerkzeuge: Linien, Rechtecke, Kreise
- Zeichenwerkzeuge für Annotationen ohne Messungen
- Text-Annotationen mit vollständiger Formatierung
- Click-to-Click Linien-System mit Shift-Snapping
- Undo/Redo-System mit History (bis zu 100 Schritte)
- PNG und PDF Export-Funktionalität
- Projekt Speichern/Laden als .megu-Dateien
- Zoom und Pan mit Mausrad-Support
- Responsive UI mit Tailwind CSS
- Tastenkürzel für alle wichtigen Funktionen
- Einheiten-Support: mm, cm, m
- Pixel-genaue Koordinaten mit Konva Matrix-Transformation

### Technisch
- React 19 mit TypeScript
- Tauri 2.0 Framework
- Konva/React-Konva für Canvas-Rendering
- Custom Hooks: useViewport, useHistory, useWindowSize
- Modulare Komponentenarchitektur
- PDF-Export mit jsPDF
- Cross-platform Desktop-Unterstützung (Windows, macOS, Linux)

### UI/UX
- Moderne Toolbar mit Icons und Dropdown-Menüs
- Live-Preview beim Zeichnen
- Automatischer Tool-Wechsel nach Kalibrierung
- Intelligent grouped draw tools
- Context-sensitive Cursors
- Visual feedback bei Selektion
- Professional measurement labels
