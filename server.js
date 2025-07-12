const express = require('express');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');
const selfsigned = require('selfsigned');

const xlsx = require('xlsx');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key';
const USERS_FILE = 'users.json';
const ECO_DATA_FILE = `탄소발자국(저탄소제품) 인증현황('17.12월말).xlsx`;

// --- 친환경 데이터 로드 (엑셀 파일) ---
let ecoProducts = [];
let ecoCompanies = [];

try {
    const workbook = xlsx.readFile(ECO_DATA_FILE);
    const sheetName = '인증제품현황';
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error(`시트 '${sheetName}'을(를) 찾을 수 없습니다.`);
    }
    const data = xlsx.utils.sheet_to_json(worksheet);

    ecoProducts = data.map(row => row['제품명']).filter(Boolean); // '제품명' 열
    ecoCompanies = data.map(row => row['기업명']).filter(Boolean); // '기업명' 열

    console.log(`엑셀에서 ${ecoProducts.length}개의 제품과 ${ecoCompanies.length}개의 기업 정보를 불러왔습니다.`);

} catch (error) {
    console.error("친환경 데이터 파일을 읽는 중 오류가 발생했습니다:", error);
    process.exit(1); // 파일 로드 실패 시 서버 종료
}


// --- 사용자 데이터 관리 ---
let users = {};
if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
} else {
    // 초기 사용자 데이터 (파일이 없을 경우)
    users = {
        "user1": { password: "pass1", name: "김그린" },
        "user2": { password: "pass2", name: "박에코" }
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 현재 디렉토리의 파일들을 static으로 제공

// --- 친환경 데이터 제공 API ---
app.get('/eco-data', (req, res) => {
    res.json({ products: ecoProducts, companies: ecoCompanies });
});

// --- 회원가입 엔드포인트 ---
app.post('/signup', (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    if (users[username]) {
        return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다.' });
    }

    users[username] = { name, password };
    saveUsers();

    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' });
});

// --- 로그인 엔드포인트 ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (user && user.password === password) {
        const token = jwt.sign({ username: username, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: '사용자 이름 또는 비밀번호가 잘못되었습니다.' });
    }
});


// 친환경 데이터 로드 (이제 클라이언트에서 처리)
// const ecoData = JSON.parse(fs.readFileSync('eco-data.json', 'utf-8'));

// 포인트 계산 알고리즘
function calculatePoints(item, price) {
    let points = 0;
    const isEcoProduct = ecoData.products.some(p => item.includes(p.name));
    const isEcoCompany = ecoData.companies.some(c => item.includes(c.name));

    if (isEcoProduct || isEcoCompany) {
        // 기본적으로 가격의 1%를 포인트로 지급
        points = Math.floor(price * 0.01);

        // 추가 보너스 (카테고리별 가중치)
        if (isEcoProduct) points += 10; // 친환경 제품 구매 시 10포인트 추가
        if (isEcoCompany) points += 20; // 인증된 친환경 기업 제품 구매 시 20포인트 추가
    }
    return points;
}



// HTTPS 서버 생성
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

https.createServer({ key: pems.private, cert: pems.cert }, app)
    .listen(port, () => {
        console.log(`서버가 https://localhost:${port} 에서 실행 중입니다.`);
    });
