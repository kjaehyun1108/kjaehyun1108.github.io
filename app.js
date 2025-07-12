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

// --- 초기 나무 그리기 ---
function drawTree(growth) {
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);

    // 땅
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    ctx.fillRect(0, 380, 300, 20);

    // 나무 줄기 (성장 단계에 따라 두께와 길이 변화)
    const trunkHeight = 50 + growth * 2;
    const trunkWidth = 5 + growth / 10;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(150 - trunkWidth / 2, 380 - trunkHeight, trunkWidth, trunkHeight);

    // 나뭇잎 (성장 단계에 따라 크기와 개수 변화)
    if (growth > 10) {
        const canopyRadius = 20 + growth;
        ctx.fillStyle = '#228B22'; // ForestGreen
        ctx.beginPath();
        ctx.arc(150, 380 - trunkHeight - canopyRadius / 2, canopyRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 새싹 (초기 단계)
    if (growth <= 10) {
        ctx.fillStyle = '#006400'; // DarkGreen
        ctx.beginPath();
        ctx.moveTo(150, 380 - trunkHeight);
        ctx.quadraticCurveTo(160, 370 - trunkHeight, 150, 360 - trunkHeight);
        ctx.quadraticCurveTo(140, 370 - trunkHeight, 150, 380 - trunkHeight);
        ctx.fill();
    }
}

// --- 포인트 및 뷰 관리 ---
function updatePoints(newPoints) {
    currentPoints = newPoints;
    pointsDisplay.textContent = currentPoints;
    const growth = Math.floor(currentPoints / 10); // 10포인트당 1 성장
    drawTree(growth);
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId + '-view').classList.add('active');
}

// --- 샘플 데이터 로드 ---
const sampleTransactions = [
    { item: '카페라떼 (텀블러 할인)', points: 10 },
    { item: '로컬푸드 장보기 (장바구니 사용)', points: 15 },
    { item: '버스 요금', points: 5 },
    { item: '업사이클링 노트 구매', points: 25 },
];

function loadTransactions() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = ''; // 목록 초기화
    let totalPoints = 0;
    sampleTransactions.forEach(t => {
        const li = document.createElement('li');
        li.textContent = `${t.item}: +${t.points}P`;
        transactionList.appendChild(li);
        totalPoints += t.points;
    });
    updatePoints(totalPoints);
}

function practiceTip(button) {
    const li = button.parentElement;
    const points = parseInt(li.dataset.points);

    // 새로운 거래 내역 추가
    const newTransaction = {
        item: li.childNodes[0].textContent.trim(), // "텀블러 사용하여..."
        points: points
    };
    sampleTransactions.push(newTransaction);

    // 포인트 업데이트 및 거래 내역 다시 로드
    loadTransactions();

    // 시각적 피드백
    showFeedback(`+${points}P 획득!`);

    // 버튼 비활성화 (중복 클릭 방지)
    button.disabled = true;
    button.textContent = '완료';
}

function showFeedback(message) {
    const feedbackContainer = document.getElementById('feedback-container');
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    
    feedbackContainer.appendChild(feedback);

    // 애니메이션 효과
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-20px)';
    }, 1500);

    // DOM에서 제거
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}


// --- 친환경 데이터 (서버에서 로드) ---
let ecoData = { products: [], companies: [] };

async function loadEcoData() {
    try {
        const response = await fetch('/eco-data');
        ecoData = await response.json();
        console.log(`서버에서 ${ecoData.products.length}개의 제품과 ${ecoData.companies.length}개의 기업 정보를 불러왔습니다.`);
    } catch (error) {
        console.error("친환경 데이터를 불러오는 데 실패했습니다:", error);
        alert("친환경 데이터를 불러올 수 없습니다. 서버 상태를 확인해주세요.");
    }
}


// --- 포인트 계산 알고리즘 (클라이언트 측) ---
function calculatePoints(item, price) {
    let points = 0;
    const isEcoProduct = ecoData.products.some(p => item.includes(p.name));
    const isEcoCompany = ecoData.companies.some(c => item.includes(c.name));

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
    // 스캐너가 이미 초기화되었다면 다시 생성하지 않습니다.
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
        .catch(err => {
            console.error(`QR 코드 스캐너를 시작할 수 없습니다.`, err);
            alert("카메라를 찾을 수 없거나 권한이 없습니다. 페이지를 새로고침하거나 브라우저 설정을 확인해주세요.");
        });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("QR 코드 스캔이 중지되었습니다.");
            showView('dashboard'); // 스캔 중지 후 대시보드로 이동
        }).catch(err => {
            console.error("QR 코드 스캐너를 중지하는 데 실패했습니다.", err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    console.log(`스캔 성공: ${decodedText}`);
    stopScanner();

    try {
        const data = JSON.parse(decodedText);
        if (data.item) {
            // 가격이 QR코드에 있는지 확인
            if (data.price) {
                processPurchase(data.item, data.price);
            } else {
                // 가격이 없으면 사용자에게 입력받음
                const priceInput = prompt(`'${data.item}'의 가격을 입력해주세요 (숫자만):`);
                if (priceInput) { // 사용자가 취소를 누르지 않았을 경우
                    const price = parseFloat(priceInput);
                    if (!isNaN(price) && price > 0) {
                        processPurchase(data.item, price);
                    } else {
                        alert("유효한 가격(숫자)을 입력해야 합니다.");
                    }
                }
            }
        } else {
            alert("잘못된 QR 코드 형식입니다. 'item' 정보가 반드시 포함되어야 합니다.");
        }
    } catch (e) {
        console.error("QR 코드 데이터 처리 오류:", e);
        alert("유효하지 않은 QR 코드 데이터입니다.");
    }
}

// 구매 처리 로직을 별도 함수로 분리 (코드 중복 방지)
function processPurchase(item, price) {
    const points = calculatePoints(item, price);

    if (points > 0) {
        const newTotalPoints = currentPoints + points;
        updatePoints(newTotalPoints);
        
                const newTransaction = { item: `QR 스캔: ${item}`, points: points };
        sampleTransactions.push(newTransaction);
        loadTransactions();
        showFeedback(`축하합니다! 친환경 소비로 ${points}P를 적립했습니다.`);
    } else {
        showFeedback('아쉽지만, 이 제품은 포인트 적립 대상이 아닙니다.');
    }
}

function onScanFailure(error) {
    // 스캔 실패는 무시 (계속 스캔 시도)
}

// --- 백엔드 API 통신 (이제 사용 안 함) ---
/*
async function verifyPurchase(item, price) {
    try {
        const response = await fetch('https://localhost:3000/verify-purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item, price }),
        });

        const result = await response.json();

        if (result.isEcoFriendly) {
            const newTotalPoints = currentPoints + result.points;
            updatePoints(newTotalPoints);
            
            // 새로운 거래 내역 추가
            const newTransaction = { item: `${item} (QR)`, points: result.points };
            sampleTransactions.push(newTransaction);
            loadTransactions(); // 목록 새로고침
        }

        showFeedback(result.message);

    } catch (error) {
        console.error('API 통신 오류:', error);
        showFeedback('서버와 통신하는 데 실패했습니다.');
    }
}
*/

// --- 초기화 ---
window.onload = () => {
    showView('dashboard');
    loadTransactions();
    loadEcoData(); // 친환경 데이터 로드
};
