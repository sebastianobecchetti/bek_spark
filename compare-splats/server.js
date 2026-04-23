import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startServer(pathA, pathB) {
    const app = express();
    const port = 3000;

    // Middleware per gestire le stringhe Base64 delle immagini (fino a 50MB per sicurezza)
    app.use(express.json({ limit: '50mb' }));

    // Resolve absolute paths
    const absolutePathA = path.resolve(process.cwd(), pathA);
    const absolutePathB = path.resolve(process.cwd(), pathB);

    // Validate files exist
    if (!fs.existsSync(absolutePathA)) {
        console.error(`Error: File A not found at ${absolutePathA}`);
        process.exit(1);
    }
    if (!fs.existsSync(absolutePathB)) {
        console.error(`Error: File B not found at ${absolutePathB}`);
        process.exit(1);
    }

    // Define static routes for the two files
    app.get('/file-a', (req, res) => {
        res.sendFile(absolutePathA);
    });

    app.get('/file-b', (req, res) => {
        res.sendFile(absolutePathB);
    });

    // Serve static files (index.html, main.js) from the current directory
    // In the new architecture without Vite, these files are just in the root
    app.use(express.static(__dirname));

    // Endpoint per il calcolo del PSNR
    app.post('/calculate-psnr', (req, res) => {
        const { imageA, imageB } = req.body;

        if (!imageA || !imageB) {
            return res.status(400).json({ error: 'Mancano le immagini Base64 nel payload.' });
        }

        // Rimuovi l'header "data:image/png;base64," e scrivi i buffer su disco
        const base64DataA = imageA.replace(/^data:image\/png;base64,/, "");
        const base64DataB = imageB.replace(/^data:image\/png;base64,/, "");

        const pathTmpA = '/tmp/vista_ground.png';
        const pathTmpB = '/tmp/vista_compressa.png';

        try {
            fs.writeFileSync(pathTmpA, base64DataA, 'base64');
            fs.writeFileSync(pathTmpB, base64DataB, 'base64');
        } catch (err) {
            console.error("Errore nel salvataggio dei PNG temporanei:", err);
            return res.status(500).json({ error: 'Errore nel salvataggio dei file temporanei.' });
        }

        // Esecuzione script Octave
        const scriptPath = '/home/sebastiano/Documents/spark/psnr_calculator.m';
        const command = `octave --no-gui --quiet ${scriptPath} ${pathTmpA} ${pathTmpB}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Errore Octave: ${error.message}`);
                return res.status(500).json({ error: 'Errore di calcolo Octave', details: stderr });
            }

            const output = stdout.trim();
            console.log("Risultati Octave:\n" + output);

            // Parsing dei valori dall'output di Octave
            const metrics = {};
            output.split('\n').forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (key && value) {
                    // Rimuove " dB" dal PSNR se presente
                    metrics[key.toLowerCase()] = value.replace(' dB', '');
                }
            });

            // Risposta al frontend
            res.json(metrics);
        });
    });

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
        console.log(`Serving File A (Ground Truth): ${absolutePathA}`);
        console.log(`Serving File B (Processed): ${absolutePathB}`);
    });
}
