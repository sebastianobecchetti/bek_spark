# Role: 3DGS Visualization Engineer (Spark & Three.js Expert)

## Context
L'utente vuole confrontare due modelli 3D Gaussian Splatting (Originale vs Compresso) su un Samsung Book 3 360. A causa di limitazioni hardware (GPU Intel Iris Xe), il tool deve essere basato su Web (Three.js + Spark) per sfruttare WebGL/WebGPU in modo leggero.

## Objective
Creare un tool CLI chiamato `compare-splats` che automatizza l'intero workflow di visualizzazione sincronizzata "Side-by-Side".

## Tool Specifications

### 1. CLI Input (Server-side)
L'agente deve implementare un file `server.js` utilizzando **Express**:
- Deve accettare due argomenti: `file_a.ply/spz` e `file_b.ply/spz`.
- Deve mappare questi file locali sulle rotte HTTP: `/file-a` e `/file-b`.
- Deve servire staticamente i file `index.html` e `main.js` dalla directory corrente.
- Deve aprire automaticamente il browser all'indirizzo `http://localhost:3000`.

### 2. Frontend Architecture (Client-side)
L'agente deve generare un file `index.html` e un `main.js` basati sulla seguente tecnologia:
- **Import Maps**: Utilizzare Three.js (v0.178.0) e Spark (v0.1.10) tramite i CDN ufficiali (cdnjs e sparkjs.dev).
- **Layout**: Split-screen 50/50 con etichette "GROUND TRUTH" e "PROCESSED".
- **Engine**: Utilizzare `SplatMesh` di Spark integrato in una scena `THREE.Scene`.

### 3. Sync Logic (The Mirroring)
È fondamentale che le due visuali siano identiche per un confronto qualitativo:
- Implementare `OrbitControls` per la navigazione.
- **Sincronizzazione**: Ogni evento di cambiamento (rotazione, zoom, pan) applicato al Viewer A deve essere clonato istantaneamente sulla Camera del Viewer B.
- **Parametri**: Sincronizzare `position`, `quaternion` e `zoom`.

### 4. File Structure to Generate
L'agente deve assicurarsi che esistano i seguenti file nella cartella `/home/sebastiano/Documents/spark/compare-splats`:
1. `package.json` (con express e open).
2. `server.js` (il server CLI).
3. `index.html` (il layout).
4. `main.js` (la logica Spark + Sync).

## Instructions for Antigravity Agent
1. **Verifica**: Controlla se le porte 3000 sono libere.
2. **Generazione**: Scrivi i file seguendo i template discussi (usando la sintassi `SplatMesh` con CDN).
3. **Esecuzione**: Avvia il server e conferma all'utente che il sistema di mirroring è attivo.