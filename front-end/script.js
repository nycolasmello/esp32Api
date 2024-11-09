    // Função para verificar o estado de login ao carregar a página
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            showMainContent();
        } else {
            showLoginForm();
        }
    }

    // Mostra o conteúdo principal
    function showMainContent() {
        loginContainer.style.display = 'none';
        mainContent.style.display = 'block';
    }

    // Mostra o formulário de login
    function showLoginForm() {
        loginContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }

    // Funcionalidade de Login
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const mainContent = document.getElementById('mainContent');
    const logoutButton = document.getElementById('logoutButton');
    const notification = document.getElementById('notification');
    const openButton = document.getElementById('openButton');
    const closeButton = document.getElementById('closeButton');

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById('login').value;
        const passwordInput = document.getElementById('password').value;

        // Enviar as credenciais ao backend
        fetch('https://esp32api-production.up.railway.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ login: usernameInput, password: passwordInput })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Armazena o estado de login no localStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    showMainContent();
                } else {
                    showNotification('Usuário ou senha incorretos!', 'error');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showNotification('Erro ao conectar ao servidor', 'error');
            });
    });

    // Botão de Logout
    logoutButton.addEventListener('click', function () {
        // Remove o estado de login do localStorage
        localStorage.removeItem('isLoggedIn');
        showLoginForm();
    });

    // Verifica o estado de login ao carregar a página
    window.addEventListener('load', function () {
        checkLoginStatus();
    });

    openButton.addEventListener('click', function () {
        fetch('https://esp32api-production.up.railway.app/event/open', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                showNotification('Portão abrindo...', 'success');
            } else {
                showNotification('Erro ao abrir o portão!', 'error');
            }
        }).catch(error => {
            showNotification('Falha na conexão!', 'error');
            console.error('Erro:', error);
        });
    });

    closeButton.addEventListener('click', function () {
        fetch('https://esp32api-production.up.railway.app/event/close', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                showNotification('Portão fechando...', 'success');
            } else {
                showNotification('Erro ao fechar o portão!', 'error');
            }
        }).catch(error => {
            showNotification('Falha na conexão!', 'error');
            console.error('Erro:', error);
        });
    });

    // Atualizar o valor exibido do slider e da caixa de entrada
    const valueInput = document.getElementById('valueInput');
    const valueSlider = document.getElementById('valueSlider');
    const valueDisplay = document.getElementById('valueDisplay');

    function updateValue(newValue) {
        valueInput.value = newValue;
        valueSlider.value = newValue;
        valueDisplay.textContent = newValue;
    }

    valueInput.addEventListener('input', function () {
        let inputValue = this.value;
        if (inputValue < 5) inputValue = 5;
        if (inputValue > 180) inputValue = 180;
        updateValue(inputValue);
    });

    valueSlider.addEventListener('input', function () {
        updateValue(this.value);
    });

    valueInput.addEventListener('change', sendValueToBackend);
    valueSlider.addEventListener('change', sendValueToBackend);

    function sendValueToBackend() {
        const value = valueInput.value;

        fetch('https://esp32api-production.up.railway.app/slider', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: value })
        })
            .then(response => {
                if (response.ok) {
                    showNotification('Tempo salvo com sucesso!', 'success');
                } else {
                    showNotification('Erro ao salvar o tempo!', 'error');
                }
            })
            .catch(error => {
                showNotification('Falha na conexão ao salvar o valor!', 'error');
                console.error('Erro:', error);
            });
    }

    // Atualizar o estado do portão periodicamente
    function updateGateState() {
        fetch('https://esp32api-production.up.railway.app/gate_state')
            .then(response => response.json())
            .then(data => {
                const gateStateDisplay = document.getElementById('gateStateDisplay');
                gateStateDisplay.textContent = data.state;
            })
            .catch(error => {
                console.error('Erro ao obter o estado do portão:', error);
            });
    }

    // Chamar a função ao carregar a página e em intervalos regulares
    window.addEventListener('load', function () {
        updateGateState();

        // Carregar o valor atual ao carregar a página
        fetch('https://esp32api-production.up.railway.app/slider', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.value) {
                    updateValue(data.value);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar o valor:', error);
            });
    });

    // Atualizar o estado do portão a cada 5 segundos
    setInterval(updateGateState, 5000);

    // Função para exibir notificações
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = ''; // Reseta as classes
        notification.classList.add(type);

        notification.style.display = 'block';

        // Remove a notificação após 3 segundos
        setTimeout(function () {
            notification.style.display = 'none';
        }, 3000);
    }