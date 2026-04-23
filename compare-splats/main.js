import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SplatMesh } from '@sparkjs/core';

async function init() {
    const containerA = document.getElementById('container-a');
    const containerB = document.getElementById('container-b');

    // 1. Setup Renderers
    const rendererA = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true
    });
    rendererA.setSize(containerA.clientWidth, containerA.clientHeight);
    rendererA.setPixelRatio(window.devicePixelRatio);
    containerA.appendChild(rendererA.domElement);

    const rendererB = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true
    });
    rendererB.setSize(containerB.clientWidth, containerB.clientHeight);
    rendererB.setPixelRatio(window.devicePixelRatio);
    containerB.appendChild(rendererB.domElement);

    // 2. Setup Scenes
    const sceneA = new THREE.Scene();
    sceneA.background = new THREE.Color(0x222222);

    const sceneB = new THREE.Scene();
    sceneB.background = new THREE.Color(0x222222);

    // 3. Setup Cameras
    const fov = 65;
    const aspect = containerA.clientWidth / containerA.clientHeight;
    const near = 0.1;
    const far = 1000;

    const cameraA = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraA.position.set(0, 0, 5);

    const cameraB = new THREE.PerspectiveCamera(fov, aspect, near, far);
    cameraB.position.set(0, 0, 5);

    // 4. Setup Controls (Only on Viewer A, Viewer B will mirror)
    const controls = new OrbitControls(cameraA, rendererA.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Migliora la velocità e l'estensione dello zoom (evita il blocco troppo rapido)
    controls.zoomSpeed = 2.0;
    controls.panSpeed = 1.5;
    controls.minDistance = 0.01; // Permette di avvicinarsi molto di più al target
    controls.maxDistance = 500;

    // 5. Load SplatMeshes (Spark 0.1.x API uses constructor with url property)
    const splatA = new SplatMesh({ url: '/file-a' });
    // Capovolge il modello di 180 gradi (Math.PI) lungo l'asse X per renderlo dritto
    splatA.rotation.x = Math.PI;
    sceneA.add(splatA);
    console.log("Ground Truth Splat Loading...");

    const splatB = new SplatMesh({ url: '/file-b' });
    splatB.rotation.x = Math.PI;
    sceneB.add(splatB);
    console.log("Processed Splat Loading...");

    let pendingPsnrResolve = null;

    // 6. Animation Loop & Sync Logic
    function animate() {
        requestAnimationFrame(animate);

        // Update main controls
        controls.update();

        // SYNC LOGIC THE MIRRORING:
        // Copy exact transform properties from Camera A to Camera B
        cameraB.position.copy(cameraA.position);
        cameraB.quaternion.copy(cameraA.quaternion);
        cameraB.zoom = cameraA.zoom;
        cameraB.fov = cameraA.fov;

        // This is necessary if zooming via FOV change in PerspectiveCamera
        cameraB.updateProjectionMatrix();

        rendererA.render(sceneA, cameraA);
        rendererB.render(sceneB, cameraB);
    }

    // Handle Resize
    window.addEventListener('resize', () => {
        const width = containerA.clientWidth;
        const height = containerA.clientHeight;

        rendererA.setSize(width, height);
        rendererB.setSize(containerB.clientWidth, containerB.clientHeight);

        cameraA.aspect = width / height;
        cameraA.updateProjectionMatrix();

        cameraB.aspect = containerB.clientWidth / containerB.clientHeight;
        cameraB.updateProjectionMatrix();
    });

    const psnrBtn = document.getElementById('psnr-btn');
    if (psnrBtn) {
        psnrBtn.addEventListener('click', async () => {
            psnrBtn.disabled = true;
            psnrBtn.innerText = "Settling View...";

            // Delay to allow SplatMesh WebWorkers to finish sorting the splats 
            // after the camera has moved.
            await new Promise(resolve => setTimeout(resolve, 800));

            psnrBtn.innerText = "Capturing...";

            // Force a render immediately before capturing to base64
            rendererA.clear();
            rendererA.render(sceneA, cameraA);
            const imageA = rendererA.domElement.toDataURL('image/png');

            rendererB.clear();
            rendererB.render(sceneB, cameraB);
            const imageB = rendererB.domElement.toDataURL('image/png');

            // Show initial loading UI for Octave
            let metricsDisplay = document.getElementById('metrics-display');
            if (!metricsDisplay) {
                metricsDisplay = document.createElement('div');
                metricsDisplay.id = 'metrics-display';
                metricsDisplay.style.position = 'absolute';
                metricsDisplay.style.top = '20px';
                metricsDisplay.style.left = '50%';
                metricsDisplay.style.transform = 'translateX(-50%)';
                metricsDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
                metricsDisplay.style.color = '#fff';
                metricsDisplay.style.padding = '15px 30px';
                metricsDisplay.style.borderRadius = '15px';
                metricsDisplay.style.fontWeight = 'bold';
                metricsDisplay.style.fontSize = '18px';
                metricsDisplay.style.zIndex = '100';
                metricsDisplay.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
                metricsDisplay.style.border = '1px solid rgba(255,255,255,0.1)';
                metricsDisplay.style.backdropFilter = 'blur(10px)';
                metricsDisplay.style.textAlign = 'center';
                metricsDisplay.style.fontFamily = 'Inter, sans-serif';
                document.body.appendChild(metricsDisplay);
            }

            metricsDisplay.innerHTML = `
                <div style="font-size: 24px; color: #4CAF50; margin-bottom: 5px;">Quality Metrics</div>
                <div id="octave-loading" style="font-size: 16px; color: #ccc; font-style: italic;">
                    Calcolo in corso tramite server (Octave)...
                </div>
            `;

            console.log("Sending to server for Octave calculation...");
            try {
                const response = await fetch('/calculate-psnr', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageA, imageB })
                });

                const result = await response.json();

                if (response.ok) {
                    // Update UI with Octave results prominently
                    metricsDisplay.innerHTML = `
                        <div style="font-size: 24px; color: #4CAF50; margin-bottom: 10px;">Quality Metrics</div>
                        <div style="display: flex; gap: 25px; justify-content: center;">
                            <span>PSNR: <span style="color: #FFC107">${result.psnr} dB</span></span>
                            <span>SSIM: <span style="color: #03A9F4">${result.ssim}</span></span>
                            <span>MSE: <span style="color: #FF5722">${result.mse}</span></span>
                        </div>
                    `;
                    console.log("Octave Metrics Result:", result);
                }
            } catch (e) {
                console.error("Fetch error:", e);
                const octaveLoading = document.getElementById('octave-loading');
                if (octaveLoading) octaveLoading.innerHTML = `<span style="color: #f44336">Errore comunicazione col server</span>`;
            } finally {
                psnrBtn.innerText = "Calculate Metrics";
                psnrBtn.disabled = false;
            }
        });
    }

    // 8. Screenshot Download Logic
    const screenshotBtn = document.getElementById('screenshot-btn');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', () => {
            const downloadImage = (canvas, filename) => {
                const link = document.createElement('a');
                link.download = filename;
                link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
                link.click();
            };

            // Force a render to ensure buffers are up to date before capturing
            rendererA.render(sceneA, cameraA);
            downloadImage(rendererA.domElement, 'screenshot_A_GroundTruth.png');

            rendererB.render(sceneB, cameraB);
            downloadImage(rendererB.domElement, 'screenshot_B_Processed.png');

            console.log("Screenshots downloaded.");
        });
    }

    animate();
}

init().catch(console.error);
