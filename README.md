# BEK-Spark: 3DGS Comparison Tool

Questo progetto è un tool professionale progettato per confrontare modelli **3D Gaussian Splatting (3DGS)** in modo sincronizzato (Side-by-Side). Permette di visualizzare simultaneamente un modello originale (Ground Truth) e uno processato/compresso, calcolando metriche di qualità come **PSNR**, **SSIM** e **MSE**.

## Struttura del Progetto

- `compare-splats/`: Contiene l'applicazione web (frontend Three.js + Spark e backend Express).
- `psnr_calculator.m`: Script MATLAB/Octave per il calcolo delle metriche.
- `ssim.m`: Funzione di supporto per il calcolo dell'SSIM.

## Requisiti

- **Node.js** (v18+)
- **Octave** (installato e disponibile nel PATH per il calcolo delle metriche)

## Installazione

1. Clona il repository.
2. Installa le dipendenze per l'applicazione di confronto:
   ```bash
   cd compare-splats
   npm install
   ```

## Utilizzo

### Avviare il Tool di Confronto

Per avviare il server e visualizzare i due modelli side-by-side, usa il comando `start` passando i percorsi dei due file `.ply` o `.spz`:

```bash
# Esempio (necessita di file .ply o .spz validi)
node compare-splats/compare-splats.js path/to/original.ply path/to/compressed.ply
```

Il browser si aprirà automaticamente su `http://localhost:3000`.

### Funzionalità principali

- **Mirroring della Camera**: I movimenti della camera nel viewer di sinistra (Ground Truth) vengono replicati istantaneamente nel viewer di destra.
- **Calcolo Metriche**: Cliccando su "Calculate Metrics", il tool cattura uno screenshot di entrambi i viewer e invia i dati al server, che utilizza Octave per calcolare PSNR, SSIM e MSE.
- **Screenshot**: Scarica screenshot ad alta risoluzione di entrambi i modelli.

## Note Tecniche

- Il calcolo delle metriche richiede che Octave sia configurato correttamente. 
- Il file `server.js` contiene un percorso assoluto predefinito per lo script Octave. Assicurati di aggiornarlo se necessario:
  ```javascript
  const scriptPath = 'percorso/al/tuo/psnr_calculator.m';
  ```

---
*Sviluppato per ottimizzare il workflow di compressione 3DGS.*
