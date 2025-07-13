// --- 인증 확인 ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html'; // 토큰 없으면 로그인 페이지로
        return;
    }
});

// --- DOM 요소 ---
const pointsDisplay = document.getElementById('points-display');
const waterDisplay = document.getElementById('water-display');
const waterTreeButton = document.getElementById('water-tree-button');
const treeCanvas = document.getElementById('tree-canvas');
const ctx = treeCanvas.getContext('2d');

// --- 상태 변수 ---
let currentPoints = 0;
let currentWater = 0;
let treeGrowthLevel = 0;
let redeemedCoupons = [];
let sampleTransactions = [];

// --- 상태 저장 및 불러오기 (localStorage) ---
function saveState() {
    const appState = {
        currentPoints,
        currentWater,
        treeGrowthLevel,
        redeemedCoupons,
        sampleTransactions
    };
    localStorage.setItem('greenTreeAppState', JSON.stringify(appState));
}

function loadState() {
    const savedState = localStorage.getItem('greenTreeAppState');
    if (savedState) {
        const appState = JSON.parse(savedState);
        currentPoints = appState.currentPoints || 0;
        currentWater = appState.currentWater || 0;
        treeGrowthLevel = appState.treeGrowthLevel || 0;
        redeemedCoupons = appState.redeemedCoupons || [];
        sampleTransactions = appState.sampleTransactions || [];
    } else {
        // 기본값 설정 (첫 방문 시)
        sampleTransactions = [
            { item: 'Cafe Latte (Tumbler Discount)', points: 10 },
            { item: 'Local grocery shopping (used bag)', points: 15 },
            { item: 'Bus fare', points: 5 },
            { item: 'Upcycled notebook purchase', points: 25 },
        ];
    }
}

// --- 나무 그리기 (프랙탈) ---
function drawTree(growth) {
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
    const sky = ctx.createLinearGradient(0, 0, 0, treeCanvas.height);
    sky.addColorStop(0, '#e6f7ff');
    sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, treeCanvas.width, treeCanvas.height);
    ctx.fillStyle = '#a58e7c';
    ctx.fillRect(0, 380, 300, 20);

    if (growth >= 1000) {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, treeCanvas.width, treeCanvas.height);
        }
        img.src = 'tree_end.png';
        return; // 다 자란 나무 이미지를 표시하고 프랙탈 그리기는 생략
    }

    const startX = treeCanvas.width / 2;
    const startY = 380;
    const len = 60 + growth * 0.15;
    const branchWidth = 8 + growth / 100;
    const maxDepth = Math.min(Math.floor(growth / 100) + 1, 7);

    drawBranch(startX, startY, len, 0, branchWidth, 0, maxDepth);
}

function drawBranch(startX, startY, len, angle, branchWidth, currentDepth, maxDepth) {
    if (currentDepth > maxDepth || len < 5) return;
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = '#593c1f';
    ctx.lineWidth = branchWidth;
    ctx.lineCap = 'round';
    ctx.translate(startX, startY);
    ctx.rotate(angle);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();

    const newLen = len * (0.75 + Math.random() * 0.1);
    const newBranchWidth = branchWidth * 0.7;
    drawBranch(0, -len, newLen, (Math.random() * 20 + 20) * Math.PI / 180, newBranchWidth, currentDepth + 1, maxDepth);
    drawBranch(0, -len, newLen, -(Math.random() * 20 + 20) * Math.PI / 180, newBranchWidth, currentDepth + 1, maxDepth);

    if (len < 15 && currentDepth > 1) {
        ctx.fillStyle = `rgba(52, 152, 70, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(0, -len, 7 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// --- UI 및 상태 업데이트 ---
function updateUI() {
    pointsDisplay.textContent = currentPoints;
    waterDisplay.textContent = currentWater;
    drawTree(treeGrowthLevel);

    if (currentWater >= 100) {
        waterTreeButton.disabled = false;
    } else {
        waterTreeButton.disabled = true;
    }
}

function showView(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId + '-view').classList.add('active');
    document.querySelectorAll('.nav-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.nav-button[onclick="showView('${viewId}')"]`).classList.add('active');
}

// --- 데이터 ---
const shopItems = [
    { name: 'Eco-friendly Tumbler', points: 1000, icon: '🥤' },
    { name: 'Upcycled Pouch', points: 1500, icon: '♻️' },
    { name: 'Donate a Tree', points: 2000, icon: '🌳' }
];
const sustainabilityTips = [
    { text: 'Use a tumbler to reduce disposable cups', points: 10000 },
    { text: 'Use a shopping bag to reduce plastic bags', points: 15 },
    { text: 'Use public transportation', points: 20 }
];

// --- 데이터 로딩 및 처리 ---
function loadTransactions() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    if (sampleTransactions.length === 0) {
        transactionList.innerHTML = '<li>No activity yet.</li>';
    }

    let totalPoints = 0;
    let totalWater = 0;
    sampleTransactions.forEach(t => {
        if (t.points > 0) {
            totalWater += t.points;
        }
        totalPoints += t.points;
    });
    
    currentPoints = totalPoints;
    currentWater = totalWater - (treeGrowthLevel / 10);

    sampleTransactions.slice().reverse().forEach(t => {
        const li = document.createElement('li');
        const pointColor = t.points > 0 ? 'var(--success-color)' : 'var(--error-color)';
        const sign = t.points > 0 ? '+' : '';
        li.innerHTML = `<span>${t.item}</span><span style="color: ${pointColor}; font-weight: 500;">${sign}${t.points}P</span>`;
        transactionList.appendChild(li);
    });

    updateUI();
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
            <button onclick='redeemItem("${item.name}", ${item.points})'>Redeem</button>
        `;
        shopGrid.appendChild(shopCard);
    });
}

function loadCoupons() {
    const couponList = document.getElementById('coupon-list');
    couponList.innerHTML = '';
    if (redeemedCoupons.length === 0) {
        couponList.innerHTML = '<p>You have no coupons yet. Redeem items from the shop!</p>';
        return;
    }

    redeemedCoupons.forEach(coupon => {
        const couponCard = document.createElement('div');
        couponCard.className = 'coupon-card';
        couponCard.innerHTML = `
            <div class="icon">${coupon.icon}</div>
            <div class="name">${coupon.name}</div>
            <div class="points">Used ${coupon.points.toLocaleString()}P</div>
            <div class="redeemed-date">Redeemed on: ${coupon.redeemedDate}</div>
        `;
        couponList.appendChild(couponCard);
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

// --- 사용자 액션 ---
function waterTree() {
    if (currentWater >= 100) {
        currentWater -= 100;
        treeGrowthLevel += 100;
        showFeedback('Your tree is growing!');
        updateUI();
        saveState(); // 상태 저장
    } else {
        showFeedback('Not enough water!');
    }
}

function redeemItem(name, points) {
    if (currentPoints >= points) {
        const itemToRedeem = shopItems.find(item => item.name === name);
        
        if (itemToRedeem) {
            sampleTransactions.push({ item: `Redeemed: ${name}`, points: -points });
            
            const newCoupon = {
                ...itemToRedeem,
                redeemedDate: new Date().toLocaleDateString()
            };
            redeemedCoupons.push(newCoupon);

            loadTransactions();
            loadCoupons();
            showFeedback(`Redeemed ${name} for ${points}P!`);
            saveState(); // 상태 저장
        } else {
            showFeedback('Item not found!');
        }
    } else {
        showFeedback("Not enough points!");
    }
}

function practiceTip(button) {
    const li = button.parentElement;
    const points = parseInt(li.dataset.points);
    const text = li.querySelector('span').textContent;
    sampleTransactions.push({ item: `Practiced: ${text}`, points: points });
    loadTransactions();
    showFeedback(`+${points}P Earned! You also got ${points} water.`);
    button.disabled = true;
    button.textContent = 'Done';
    saveState(); // 상태 저장
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

// --- QR 코드 및 제품 상세 로직 ---
let products = [];
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

const qrModal = document.getElementById('qr-code-modal');
const openModalButton = document.getElementById('open-qr-modal-button');
const closeModalButton = document.getElementById('close-modal-button');
const productModal = document.getElementById('product-details-modal');
const closeProductModalButton = document.getElementById('close-product-modal-button');

function openQrModal() { qrModal.classList.add('active'); }
function closeQrModal() {
    qrModal.classList.remove('active');
    document.getElementById('qr-result').textContent = '';
    document.getElementById('qr-code-input').value = '';
}

function openProductModal(product) {
    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.productName;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-pros').textContent = product.pros;
    document.getElementById('product-cons').textContent = product.cons;
    productModal.classList.add('active');
}

function closeProductModal() {
    productModal.classList.remove('active');
}

openModalButton.addEventListener('click', openQrModal);
closeModalButton.addEventListener('click', closeQrModal);
qrModal.addEventListener('click', (event) => {
    if (event.target === qrModal) closeQrModal();
});

closeProductModalButton.addEventListener('click', closeProductModal);
productModal.addEventListener('click', (event) => {
    if (event.target === productModal) closeProductModal();
});

document.getElementById('qr-submit-button').addEventListener('click', () => {
    const qrCodeInput = document.getElementById('qr-code-input').value;
    const resultElement = document.getElementById('qr-result');
    if (!qrCodeInput) {
        resultElement.textContent = 'Please enter a QR code.';
        return;
    }
    const product = products.find(p => p.qrCode === qrCodeInput);
    if (product) {
        const points = product.score;
        sampleTransactions.push({ item: `QR Scan: ${product.productName}`, points: points });
        loadTransactions();
        showFeedback(`+${points}P for ${product.productName}! You also got ${points} water.`);
        resultElement.textContent = `Found: ${product.productName}, Score: ${points}`;
        saveState();
        setTimeout(() => {
            closeQrModal();
            openProductModal(product);
        }, 1000);
    } else {
        resultElement.textContent = 'Product not found.';
        showFeedback('This QR code is not valid.');
    }
    document.getElementById('qr-code-input').value = '';
});

// 별점 평가 로직
const stars = document.querySelectorAll('.stars span');
stars.forEach(star => {
    star.addEventListener('click', () => {
        const rating = star.dataset.value;
        showFeedback(`You rated this product ${rating} stars. Thank you!`);
        // 여기에 평점 데이터를 서버로 보내는 로직을 추가할 수 있습니다.
        setTimeout(closeProductModal, 1500);
    });

    star.addEventListener('mouseover', () => {
        stars.forEach(s => s.classList.remove('active'));
        for (let i = 0; i < star.dataset.value; i++) {
            stars[i].classList.add('active');
        }
    });

    star.addEventListener('mouseout', () => {
        stars.forEach(s => s.classList.remove('active'));
    });
});


// --- 초기화 ---
window.onload = () => {
    loadState(); // 저장된 상태 불러오기
    showView('dashboard');
    loadTransactions();
    loadShopItems();
    loadTips();
    loadProducts();
    loadCoupons();
    waterTreeButton.addEventListener('click', waterTree);
};

// --- 개발자용 리셋 기능 ---
function resetState() {
    localStorage.removeItem('greenTreeAppState');
    location.reload();
}

document.getElementById('dev-reset-button').addEventListener('click', () => {
    if (confirm('WARNING: This will reset all your points, water, and coupons. Are you sure?')) {
        resetState();
    }
});
