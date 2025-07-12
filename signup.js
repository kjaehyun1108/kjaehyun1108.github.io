document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const messageElement = document.getElementById('signup-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('https://localhost:3000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password })
            });

            const data = await response.json();

            if (response.ok) {
                messageElement.textContent = '회원가입 성공! 로그인 페이지로 이동합니다.';
                messageElement.style.color = 'green';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                messageElement.textContent = data.message;
                messageElement.style.color = 'red';
            }
        } catch (error) {
            console.error('회원가입 오류:', error);
            messageElement.textContent = '서버에 연결할 수 없습니다.';
        }
    });
});
