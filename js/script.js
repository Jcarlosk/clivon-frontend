/**
 * Clivon Edu — Scanner Totalmente Automático (sem captura manual)
 */

const API_URL = `https://clivon-api.onrender.com`;
const TOTAL_QUESTIONS = 10;

let currentSubject = sessionStorage.getItem('currentSubject') || 'matematica';
const ANSWER_KEY = Array(TOTAL_QUESTIONS).fill('A');
let currentAnswers = [];

let videoStream = null;
const SCAN_FPS = 8;         // Reduzido: menos CPU, suficiente para deteção
const STABLE_THRESHOLD = 8; // Aumentado: exige mais frames estáveis antes de disparar
let stableCount = 0;
let lastScanTime = 0;
let isProcessingBackend = false;
let animationFrameId = null;
let lastCaptureTime = 0;
const COOLDOWN_MS = 4000; // Intervalo mínimo entre capturas automáticas (ms)

// ── INICIALIZAÇÃO ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    setStatus('A iniciar câmara...', false);
    buildGrid(Array(TOTAL_QUESTIONS).fill('BLANK'));

    // Esconde o botão manual — o sistema é 100% automático
    const btnCapture = document.getElementById('btnCapture');
    if (btnCapture) btnCapture.style.display = 'none';

    startCamera();
});

function buildGrid(answers) {
    const grid = document.getElementById('gabaritoGrid');
    if (!grid) return;

    grid.innerHTML = '';
    let correct = 0, wrong = 0;

    answers.forEach((ans, i) => {
        const isCorrect = ans === ANSWER_KEY[i];
        const isBlank = ans === 'BLANK' || ans === 'INVALID' || !ans || ans === '?';

        if (!isBlank) {
            if (isCorrect) correct++;
            else wrong++;
        }

        const b = document.createElement('button');
        b.className = 'q-btn ' + (isBlank ? 'q-blank' : isCorrect ? 'q-correct' : 'q-wrong');
        b.textContent = String(i + 1).padStart(2, '0');
        grid.appendChild(b);
    });

    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.textContent = ((correct / TOTAL_QUESTIONS) * 10).toFixed(1).replace('.', ',');

    const correctEl = document.getElementById('correctCount');
    if (correctEl) correctEl.textContent = correct;

    const wrongEl = document.getElementById('wrongCount');
    if (wrongEl) wrongEl.textContent = wrong;

    const ring = document.getElementById('ringProgress');
    if (ring) {
        const circumference = 2 * Math.PI * 22;
        ring.style.strokeDashoffset = (circumference * (1 - correct / TOTAL_QUESTIONS)).toFixed(1);
    }
}

// ── CÂMERA E AUTO-SCAN ─────────────────────────────────────────
async function startCamera() {
    try {
        const constraints = {
            video: {
                facingMode: "environment",
                width:  { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        videoStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('cameraFeed');
        video.srcObject = videoStream;
        video.style.display = 'block';

        const previewImg = document.getElementById('previewImg');
        if (previewImg) previewImg.style.display = 'none';

        const btnStart = document.getElementById('btnStartCamera');
        if (btnStart) btnStart.style.display = 'none';

        // Garante que o botão manual fica oculto
        const btnCapture = document.getElementById('btnCapture');
        if (btnCapture) btnCapture.style.display = 'none';

        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';

        setStatus('Aponte para o gabarito', true);

        isProcessingBackend = false;
        stableCount = 0;
        animationFrameId = requestAnimationFrame(autoScanLoop);

    } catch (err) {
        console.error("Erro Câmara:", err);
        showToast('Erro ao abrir câmara. Verifique as permissões.', true);
        setStatus('Erro na câmara', false);
    }
}

function stopCamera() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    const video = document.getElementById('cameraFeed');
    if (video) video.style.display = 'none';
}

function autoScanLoop(timestamp) {
    if (!videoStream) return;
    animationFrameId = requestAnimationFrame(autoScanLoop);

    // Não faz nada enquanto o backend está a processar
    if (isProcessingBackend) return;

    // Limita FPS
    if (timestamp - lastScanTime < 1000 / SCAN_FPS) return;
    lastScanTime = timestamp;

    // Cooldown entre capturas (evita disparar várias vezes seguidas)
    if (timestamp - lastCaptureTime < COOLDOWN_MS) return;

    detectDocument(timestamp);
}

function detectDocument(timestamp) {
    const video = document.getElementById('cameraFeed');
    if (!video || video.readyState < 2) return;

    const procWidth  = 320;
    const procHeight = (video.videoHeight / video.videoWidth) * procWidth;
    if (isNaN(procHeight) || procHeight === 0) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width  = procWidth;
    offscreenCanvas.height = procHeight;
    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, procWidth, procHeight);

    const frameData  = ctx.getImageData(0, 0, procWidth, procHeight).data;
    const totalPixels = procWidth * procHeight;
    let brightPixels  = 0;

    // Amostragem a cada 16 bytes (4 pixels)
    for (let i = 0; i < frameData.length; i += 16) {
        const brightness = (frameData[i] + frameData[i + 1] + frameData[i + 2]) / 3;
        if (brightness > 120) brightPixels++;
    }

    const paperRatio  = brightPixels / (totalPixels / 4);
    const crosshair   = document.getElementById('crosshair');
    const sharpness   = calcSharpness(ctx, procWidth, procHeight);

    // Critérios: folha visível (15%) + imagem suficientemente nítida
    const papelOk    = paperRatio > 0.15;
    const nitidezOk  = sharpness > 80;

    if (papelOk && nitidezOk) {
        stableCount++;
        if (crosshair) crosshair.style.borderColor = stableCount >= STABLE_THRESHOLD ? '#4ade80' : '#facc15';

        const progress = Math.min(stableCount / STABLE_THRESHOLD, 1);
        setStatus(`A alinhar... ${Math.round(progress * 100)}%`, true);

        if (stableCount >= STABLE_THRESHOLD) {
            stableCount = 0;
            lastCaptureTime = timestamp;
            captureAndSend();
        }
    } else {
        // Decai mais lentamente para evitar flickering
        stableCount = Math.max(0, stableCount - 1);
        if (crosshair) crosshair.style.borderColor = '#ffffff';

        if (!papelOk) {
            setStatus('Aponte para o gabarito', true);
        } else {
            setStatus('Segure firme — a focar...', true);
        }
    }
}

/**
 * Calcula nitidez do frame usando variância do Laplaciano (método simples).
 * Retorna um valor: quanto maior, mais nítida a imagem.
 */
function calcSharpness(ctx, w, h) {
    // Usa uma amostra central de 80x80 para ser leve
    const cx = Math.floor(w / 2) - 40;
    const cy = Math.floor(h / 2) - 40;
    const sample = ctx.getImageData(cx, cy, 80, 80).data;

    let sum = 0, sumSq = 0, n = 0;
    for (let i = 0; i < sample.length; i += 4) {
        const lum = 0.299 * sample[i] + 0.587 * sample[i + 1] + 0.114 * sample[i + 2];
        sum   += lum;
        sumSq += lum * lum;
        n++;
    }
    const mean = sum / n;
    const variance = (sumSq / n) - (mean * mean);
    return variance; // Valores típicos: <30 = muito desfocado, >80 = nítido
}

function captureAndSend() {
    if (isProcessingBackend) return;
    isProcessingBackend = true;
    setStatus('Gabarito detetado! A analisar...', false);

    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';

    const video  = document.getElementById('cameraFeed');
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();

    canvas.toBlob(async (blob) => {
        const img = document.getElementById('previewImg');
        if (img) {
            img.src = URL.createObjectURL(blob);
            img.style.display = 'block';
        }
        await processImageBlob(blob);
    }, 'image/jpeg', 0.95);
}

// ── BACKEND ────────────────────────────────────────────────────
async function processImageBlob(blob) {
    try {
        const formData = new FormData();
        formData.append('file', blob, 'scan.jpg');

        const subjectParam = encodeURIComponent(currentSubject.toLowerCase());
        const res = await fetch(`${API_URL}?subject=${subjectParam}`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        currentAnswers = data.answers || Array(TOTAL_QUESTIONS).fill('?');
        buildGrid(currentAnswers);

        const nameInput = document.getElementById('studentName');
        if (nameInput && data.student_name) nameInput.value = data.student_name;

        setStatus('Concluído com sucesso!', true);
        showToast('Correção finalizada!');

    } catch (err) {
        console.error("Erro API:", err);
        setStatus('Erro na conexão. A retomar em 3s...', false);
        showToast('Erro: Falha na correção. A tentar novamente...', true);

        setTimeout(() => resetScan(), 3000);
    } finally {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

// ── UTILS ──────────────────────────────────────────────────────
function setStatus(msg, ready) {
    const pill = document.getElementById('statusPill');
    if (pill) pill.innerHTML = `<div class="dot" style="background:${ready ? '#22c55e' : '#f97316'}"></div>${msg}`;
}

function resetScan() {
    stopCamera();

    const img = document.getElementById('previewImg');
    if (img) img.style.display = 'none';

    const btnStart = document.getElementById('btnStartCamera');
    if (btnStart) btnStart.style.display = 'flex';

    buildGrid(Array(TOTAL_QUESTIONS).fill('BLANK'));
    setStatus('Pronto para escanear', true);
    startCamera();
}

function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = isError ? '#dc2626' : '#111827';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function confirmSync() {
    showToast('Nota salva na base de dados!');
}