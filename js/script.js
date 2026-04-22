/**
 * Clivon Edu — Scanner Automático + Fallback Manual
 */

const SERVER_IP = "10.0.0.114"; 
const API_URL = `https://clivon-api.onrender.com`;
const TOTAL_QUESTIONS = 10; 

let currentSubject = sessionStorage.getItem('currentSubject') || 'matematica';
const ANSWER_KEY = Array(TOTAL_QUESTIONS).fill('A'); 
let currentAnswers = [];

let videoStream = null;
const SCAN_FPS = 15; 
const STABLE_THRESHOLD = 5; 
let stableCount = 0;
let lastScanTime = 0;
let isProcessingBackend = false;
let animationFrameId = null;

// ── INICIALIZAÇÃO ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    setStatus('A iniciar câmara...', false);
    buildGrid(Array(TOTAL_QUESTIONS).fill('BLANK'));
    
    // Garante que o botão manual funcione como Plano B
    const btnCapture = document.getElementById('btnCapture');
    if (btnCapture) {
        // Remove listeners antigos clocando clone
        const newBtn = btnCapture.cloneNode(true);
        btnCapture.parentNode.replaceChild(newBtn, btnCapture);
        newBtn.addEventListener('click', () => {
            if (!isProcessingBackend) captureAndSend();
        });
    }

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
                width: { ideal: 1280 },
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
        
        // MANTÉM O BOTÃO MANUAL VISÍVEL COMO PLANO B
        const btnCapture = document.getElementById('btnCapture');
        if (btnCapture) btnCapture.style.display = 'flex'; 
        
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';
        
        setStatus('Aponte para a folha (ou clique no botão)', true);
        
        isProcessingBackend = false;
        stableCount = 0;
        animationFrameId = requestAnimationFrame(autoScanLoop);
        
    } catch (err) {
        console.error("Erro Câmara:", err);
        showToast('Erro ao abrir câmara. Verifique as permissões.', true);
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
    if (isProcessingBackend) return;
    if (timestamp - lastScanTime < 1000 / SCAN_FPS) return;
    lastScanTime = timestamp;
    detectDocument();
}

function detectDocument() {
    const video = document.getElementById('cameraFeed');
    if (!video || video.readyState < 2) return;

    const procWidth = 320; 
    const procHeight = (video.videoHeight / video.videoWidth) * procWidth;
    
    // Verifica se a altura é válida (às vezes demora um frame para carregar no iOS/Android)
    if (isNaN(procHeight) || procHeight === 0) return;

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = procWidth;
    offscreenCanvas.height = procHeight;
    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    ctx.drawImage(video, 0, 0, procWidth, procHeight);
    const frameData = ctx.getImageData(0, 0, procWidth, procHeight).data;

    let brightPixels = 0;
    const totalPixels = procWidth * procHeight;
    
    for (let i = 0; i < frameData.length; i += 16) {
        const r = frameData[i], g = frameData[i+1], b = frameData[i+2];
        const brightness = (r + g + b) / 3;
        // REDUZIDO DE 160 PARA 120 (Muito mais sensível a folhas brancas em ambientes escuros)
        if (brightness > 120) brightPixels++; 
    }

    // REDUZIDO DE 0.3 PARA 0.15 (A folha só precisa ocupar 15% da tela agora)
    const paperRatio = brightPixels / (totalPixels / 4);
    const crosshair = document.getElementById('crosshair');

    if (paperRatio > 0.15) {
        stableCount++;
        if (crosshair) crosshair.style.borderColor = '#4ade80';
        setStatus('A detetar folha... Segure firme!', true);

        if (stableCount >= STABLE_THRESHOLD) {
            stableCount = 0;
            captureAndSend(); 
        }
    } else {
        stableCount = Math.max(0, stableCount - 1);
        if (crosshair) crosshair.style.borderColor = '#ffffff';
        if (stableCount === 0) setStatus('Aponte para a folha (ou capture manualmente)', true);
    }
}

function captureAndSend() {
    if (isProcessingBackend) return;
    isProcessingBackend = true; 
    setStatus('A analisar a imagem...', false);
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    
    const btnCapture = document.getElementById('btnCapture');
    if (btnCapture) btnCapture.style.display = 'none';

    const video = document.getElementById('cameraFeed');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 1280;
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
    }, 'image/jpeg', 0.95); // Aumentada a qualidade do JPEG para 0.95
}

// ── BACKEND ───────────────────────────────────────────────
async function processImageBlob(blob) {
    try {
        const formData = new FormData();
        formData.append('file', blob, 'scan.jpg'); 

        const subjectParam = encodeURIComponent(currentSubject.toLowerCase());
        const targetUrl = `${API_URL}?subject=${subjectParam}`;

        const res = await fetch(targetUrl, { method: 'POST', body: formData });

        if (!res.ok) throw new Error('Falha no processamento');

        const data = await res.json();

        currentAnswers = data.answers || Array(TOTAL_QUESTIONS).fill('?');
        buildGrid(currentAnswers);
        
        const nameInput = document.getElementById('studentName');
        if (nameInput && data.student_name) nameInput.value = data.student_name;
        
        setStatus('Concluído com sucesso!', true);
        showToast('Correção finalizada!');

    } catch (err) {
        console.error("Erro API:", err);
        setStatus('Erro na conexão. A retomar...', false);
        showToast('Erro: Falha na correção.', true);
        
        setTimeout(() => { resetScan(); }, 3000);
    } finally {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
}

// ── UTILS ───────────────────────────────────────────────
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