// --- 인증 확인 ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html'; // 토큰 없으면 로그인 페이지로
        return;
    }

    // TODO: 서버에 토큰 유효성 검증 요청 (보안 강화)
    // 여기서는 간단히 토큰 존재 여부만 확인합니다.
});

const pointsDisplay = document.getElementById('points-display');
const treeCanvas = document.getElementById('tree-canvas');
const ctx = treeCanvas.getContext('2d');

let currentPoints = 0;

// --- 초기 나무 그리기 (고급, 프랙탈) ---
function drawTree(growth) {
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    // 하늘 그라데이션
    const sky = ctx.createLinearGradient(0, 0, 0, treeCanvas.height);
    sky.addColorStop(0, '#e6f7ff'); // 밝은 하늘색
    sky.addColorStop(1, '#ffffff'); // 흰색
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, treeCanvas.width, treeCanvas.height);

    // 땅
    ctx.fillStyle = '#a58e7c'; // 부드러운 흙색
    ctx.fillRect(0, 380, 300, 20);

    const startX = treeCanvas.width / 2;
    const startY = 380;
    const len = 60 + growth * 1.5;
    const angle = 0; // 수정: 초기 각도를 0으로 설정하여 나무가 바로 서 있도록 합니다.
    const branchWidth = 8 + growth / 10;
    const maxDepth = Math.min(Math.floor(growth / 10) + 1, 7); // 성장에 따라 최대 깊이 증가, 최대 7

    drawBranch(startX, startY, len, angle, branchWidth, 0, maxDepth);
}

function drawBranch(startX, startY, len, angle, branchWidth, currentDepth, maxDepth) {
    if (currentDepth > maxDepth || len < 5) return;

    ctx.beginPath();
    ctx.save();

    ctx.strokeStyle = '#593c1f'; // 고동색
    ctx.lineWidth = branchWidth;
    ctx.lineCap = 'round';
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();

    const newLen = len * (0.75 + Math.random() * 0.1); // 75-85% 길이
    const newBranchWidth = branchWidth * 0.7;

    // 오른쪽 가지
    const angle1 = (Math.random() * 20 + 20) * Math.PI / 180; // 20-40도
    drawBranch(0, -len, newLen, angle1, newBranchWidth, currentDepth + 1, maxDepth);

    // 왼쪽 가지
    const angle2 = -(Math.random() * 20 + 20) * Math.PI / 180; // -20 ~ -40도
    drawBranch(0, -len, newLen, angle2, newBranchWidth, currentDepth + 1, maxDepth);

    // 잎사귀 (가지 끝에)
    if (len < 15 && currentDepth > 1) {
        ctx.fillStyle = `rgba(52, 152, 70, ${Math.random() * 0.5 + 0.5})`; // 싱그러운 초록색
        ctx.beginPath();
        ctx.arc(0, -len, 7 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// --- 포인트 및 뷰 관리 ---
function updatePoints(newPoints) {
    currentPoints = newPoints;
    pointsDisplay.textContent = currentPoints;
    const growth = Math.floor(currentPoints / 10); // 10포인트당 1 성장
    drawTree(growth);
}

function showView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId + '-view').classList.add('active');

    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`.nav-button[onclick="showView('${viewId}')"]`).classList.add('active');
}


// --- Data & UI ---

const sampleTransactions = [
    { item: 'Cafe Latte (Tumbler Discount)', points: 10 },
    { item: 'Local grocery shopping (used bag)', points: 15 },
    { item: 'Bus fare', points: 5 },
    { item: 'Upcycled notebook purchase', points: 25 },
];

const shopItems = [
    { name: 'Eco-friendly Tumbler', points: 1000, icon: '🥤' },
    { name: 'Upcycled Pouch', points: 1500, icon: '♻️' },
    { name: 'Donate a Tree', points: 2000, icon: '🌳' }
];

const sustainabilityTips = [
    { text: 'Use a tumbler to reduce disposable cups', points: 10 },
    { text: 'Use a shopping bag to reduce plastic bags', points: 15 },
    { text: 'Use public transportation', points: 20 }
];

function loadTransactions() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = ''; // Clear list
    if (sampleTransactions.length === 0) {
        transactionList.innerHTML = '<li>No activity yet.</li>';
        return;
    }
    let totalPoints = 0;
    sampleTransactions.slice().reverse().forEach(t => {
        const li = document.createElement('li');
        const pointColor = t.points > 0 ? 'var(--success-color)' : 'var(--error-color)';
        const sign = t.points > 0 ? '+' : '';
        li.innerHTML = `<span>${t.item}</span><span style="color: ${pointColor}; font-weight: 500;">${sign}${t.points}P</span>`;
        transactionList.appendChild(li);
        totalPoints += t.points;
    });
    updatePoints(totalPoints);
}

function loadShopItems() {
    const shopGrid = document.getElementById('shop-items');
    shopGrid.innerHTML = '';
    shopItems.forEach(item => {
        const shopCard = document.createElement('div');
        shopCard.className = 'shop-card';
        shopCard.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">${item.icon}</div>
            <p>${item.name}</p>
            <span>${item.points.toLocaleString()}P</span>
            <button onclick="redeemItem('${item.name}', ${item.points})">Redeem</button>
        `;
        shopGrid.appendChild(shopCard);
    });
}

function loadTips() {
    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    sustainabilityTips.forEach(tip => {
        const li = document.createElement('li');
        li.dataset.points = tip.points;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `${tip.text}`;
        
        const button = document.createElement('button');
        button.textContent = `Practice (+${tip.points}P)`;
        button.onclick = () => practiceTip(button);
        
        li.appendChild(textSpan);
        li.appendChild(button);
        tipsList.appendChild(li);
    });
}

function redeemItem(name, points) {
    if (currentPoints >= points) {
        // Add to transactions
        sampleTransactions.push({ item: `Redeemed: ${name}`, points: -points });
        loadTransactions();
        showFeedback(`Redeemed ${name} for ${points}P!`);
    } else {
        showFeedback("Not enough points!");
    }
}

function practiceTip(button) {
    const li = button.parentElement;
    const points = parseInt(li.dataset.points);
    const text = li.querySelector('span').textContent;

    // Add new transaction
    const newTransaction = {
        item: `Practiced: ${text}`,
        points: points
    };
    sampleTransactions.push(newTransaction);

    // Update points and reload transactions
    loadTransactions();

    // Visual feedback
    showFeedback(`+${points}P Earned!`);

    // Disable button to prevent re-clicking
    button.disabled = true;
    button.textContent = 'Done';
    button.style.backgroundColor = '#ccc';
    button.style.cursor = 'not-allowed';
}

function showFeedback(message) {
    const feedbackContainer = document.getElementById('feedback-container');
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    
    feedbackContainer.appendChild(feedback);

    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.remove();
    }, 2500);
}


// --- 친환경 데이터 (서버에서 로드) ---
let ecoData = { products: [], companies: [] };

async function loadEcoData() {
    try {
        const response = await fetch('/eco-data');
        ecoData = await response.json();
        console.log(`Loaded ${ecoData.products.length} products and ${ecoData.companies.length} companies from server.`);
    } catch (error) {
        console.error("Failed to load eco data:", error);
        alert("Could not load eco data. Please check server status.");
    }
}


// --- 포인트 계산 알고리즘 (클라이언트 측) ---
function calculatePoints(item, price) {
    let points = 0;
    const isEcoProduct = ecoData.products.some(p => item.includes(p));
    const isEcoCompany = ecoData.companies.some(c => item.includes(c));

    if (isEcoProduct || isEcoCompany) {
        points = Math.floor(price * 0.01);
        if (isEcoProduct) points += 10;
        if (isEcoCompany) points += 20;
    }
    return points;
}


let html5QrCode = null;

// --- QR 코드 스캐너 관리 ---
function startScanner() {
    showView('scanner');
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
            console.error(`Could not start QR scanner.`, err);
            alert("Could not find camera or permission denied. Please refresh or check browser settings.");
        });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            showView('dashboard');
        }).catch(err => {
            console.error("Failed to stop QR scanner.", err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    stopScanner();
    try {
        const data = JSON.parse(decodedText);
        if (data.item) {
            if (data.price) {
                processPurchase(data.item, data.price);
            } else {
                const priceInput = prompt(`Enter price for '${data.item}':`);
                if (priceInput) {
                    const price = parseFloat(priceInput);
                    if (!isNaN(price) && price > 0) {
                        processPurchase(data.item, price);
                    } else {
                        alert("Invalid price entered.");
                    }
                }
            }
        } else {
            alert("Invalid QR code format: 'item' is missing.");
        }
    } catch (e) {
        console.error("Error processing QR code data:", e);
        alert("Invalid QR code data.");
    }
}

function processPurchase(item, price) {
    const points = calculatePoints(item, price);
    if (points > 0) {
        sampleTransactions.push({ item: `QR Scan: ${item}`, points: points });
        loadTransactions();
        showFeedback(`Congratulations! You earned ${points}P for your eco-friendly purchase.`);
    } else {
        showFeedback('This product is not eligible for points.');
    }
}

function onScanFailure(error) {
    // Ignore scan failure (it happens continuously).
}

// --- 초기화 ---
window.onload = () => {
    showView('dashboard');
    loadTransactions();
    loadEcoData();
    loadShopItems();
    loadTips();
};

