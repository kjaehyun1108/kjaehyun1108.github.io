document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('login-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token); // 토큰 저장
                window.location.href = 'main.html'; // 메인 페이지로 이동
            } else {
                messageElement.textContent = data.message;
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            messageElement.textContent = '서버에 연결할 수 없습니다.';
        }
    });
});
