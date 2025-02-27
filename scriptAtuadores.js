const dispositivos = {};
let conectado = false;

const savedUrl = localStorage.getItem("gatewayUrl");

// Função para validar a URL do gateway
function validarURL(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

// Função para mostrar/ocultar o indicador de carregamento
function mostrarCarregamento(mostrar) {
    const loading = document.getElementById("loading-indicator");
    if (loading) {
        loading.style.display = mostrar ? "block" : "none";
    }
}

// Função para habilitar os botões de comando
function habilitarComandos() {
    const devices = document.querySelectorAll('.device');
    devices.forEach(device => {
        const powerButton = device.querySelector('.btn-power');
        const sourceButton = device.querySelector('.btn-source');
        const platformButton = device.querySelector('.btn-platform');

        if (powerButton) powerButton.disabled = false;
        if (sourceButton) sourceButton.disabled = false;
        if (platformButton) platformButton.disabled = false;
    });
}

// Função para gerar o template HTML de um dispositivo
function gerarTemplate(tipo, state) {
    if (tipo === 'Air_Conditioner_1') {
        return `
        <div class="device" id="${tipo}">
            <h2 class="title-card">Ar Condicionado</h2>
            <img src="./images/ar-condicionado.png" alt="" />
            <div class="segment-container">
                <h3 class="title-card">Controle de Temperatura</h3>
                <div class="button-group">
                    <button onclick="enviarComandoAr('increase', 1)">Aumentar +1°</button>
                    <button onclick="enviarComandoAr('decrease', 1)">Diminuir -1°</button>
                </div>
            </div>
        </div>
        `;
    }

    if (tipo === 'Lamp_1') {
        return `
        <div class="device" id="${tipo}">
            <h2 class="title-card">Lampada</h2>
            <img src="./images/lampada-inteligente.png" alt="" />
            <div class="segment-container">
                <h3 class="title-card">Controle da Lampada</h3>
                <div class="button-group">
                    <button onclick="enviarComandoLamp('poweron', -1)">Ligar</button>
                    <button onclick="enviarComandoLamp('poweroff', -1)">Desligar</button>
                </div>
            </div>
        </div>
        `;
    }

    return `
    <div class="device" id="${tipo}">
        <h2 class="title-card">Televisão</h2>
        <img src="./images/smart-tv.png" alt="" />
        <div class="segment-container">
            <h3 class="title-card">Energia</h3>
            <div class="button-group">
                <button onclick="enviarComandoTV('power', 1)">Ligar</button>
                <button onclick="enviarComandoTV('power', 0)">Desligar</button>
            </div>
        </div>
        <div class="segment-container">
            <h3 class="title-card">Serviço</h3>
            <div class="button-group">
                <button onclick="enviarComandoTV('source', 1)">Streaming</button>
                <button onclick="enviarComandoTV('source', 2)">Cabo</button>
            </div>
        </div>
        <div class="segment-container">
            <h3 class="title-card">Plataforma</h3>
            <div class="button-group">
                <button onclick="enviarComandoTV('platform', 1)">Netflix</button>
                <button onclick="enviarComandoTV('platform', 2)">Disney+</button>
                <button onclick="enviarComandoTV('platform', 3)">Prime</button>
            </div>
        </div>
        <div class="segment-container">
            <h3 class="title-card">Canal</h3>
            <div class="button-group">
                <button onclick="enviarComandoTV('channel', 4)">Globo</button>
                <button onclick="enviarComandoTV('channel', 5)">SBT</button>
                <button onclick="enviarComandoTV('channel', 6)">Record</button>
            </div>
        </div>
    </div>
    `;
}

// Função para atualizar ou criar um dispositivo no DOM
function atualizarOuCriarDispositivo(dispositivo) {
    const { device_name, state, error } = dispositivo;
    const container = document.querySelector("#devices-container");
    const existing = container.querySelector(`#${device_name}`);

    if (!existing) {
        const device = document.createElement("div");
        device.innerHTML = gerarTemplate(device_name, state);
        container.appendChild(device);
    } else {
        existing.innerHTML = gerarTemplate(device_name, state); // Atualiza o dispositivo existente
    }
}

// Função para atualizar um único dispositivo
async function atualizarDispositivo(device_name) {
    try {
        const response = await fetch(`${savedUrl}/atuadores/${device_name}`);
        const dispositivo = await response.json();
        atualizarOuCriarDispositivo(dispositivo);
    } catch (error) {
        console.error("Erro ao atualizar dispositivo:", error);
    }
}

// Função para conectar ao gateway
async function conectarGateway() {
    if (!validarURL(savedUrl)) {
        alert("URL do Gateway inválida. Verifique as configurações.");
        return;
    }

    mostrarCarregamento(true); // Mostra o indicador de carregamento

    try {
        const response = await fetch(`${savedUrl}/atuadores`);
        const dispositivos = await response.json();

        document.querySelector("#devices-container").innerHTML = '';

        dispositivos.forEach(dispositivo => {
            if (dispositivo.device_name === 'Air_Conditioner_1') {
                dispositivo.state = null;
            }
            atualizarOuCriarDispositivo(dispositivo);
        });

        habilitarComandos();
        conectado = true;
    } catch (error) {
        console.error("Erro ao conectar:", error);
        alert("Falha ao conectar ao Gateway. Verifique a URL e tente novamente.");
    } finally {
        mostrarCarregamento(false); // Oculta o indicador de carregamento
    }
}

// Função para enviar comando à TV
async function enviarComandoTV(order, value) {
    if (!conectado) {
        alert("Você precisa conectar ao Gateway primeiro!");
        return;
    }

    mostrarCarregamento(true); // Mostra o indicador de carregamento

    const comando = { order, value };

    try {
        const response = await fetch(`${savedUrl}/comando`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comando)
        });

        const data = await response.json();
        if (data.sucesso) {
            atualizarDispositivo("TV_1"); // Atualiza apenas a TV
        } else {
            alert(`Erro: ${data.mensagem}`);
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
        alert("Erro de conexão. Tente novamente mais tarde.");
    } finally {
        mostrarCarregamento(false); // Oculta o indicador de carregamento
    }
}

// Função para enviar comando ao ar-condicionado
async function enviarComandoAr(order, value) {
    if (!conectado) {
        alert("Conecte ao Gateway primeiro!");
        return;
    }

    mostrarCarregamento(true); // Mostra o indicador de carregamento

    try {
        const response = await fetch(`${savedUrl}/send-command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                device_name: "Air_Conditioner_1",
                order,
                value
            })
        });

        const result = await response.json();
        if (result.error) {
            alert(`Erro: ${result.error}`);
        } else {
            atualizarDispositivo("Air_Conditioner_1"); // Atualiza apenas o ar-condicionado
        }
    } catch (error) {
        console.error("Erro de comunicação:", error);
        alert("Erro de comunicação. Verifique sua conexão e tente novamente.");
    } finally {
        mostrarCarregamento(false); // Oculta o indicador de carregamento
    }
}

// Função para enviar comando à lâmpada
async function enviarComandoLamp(order, value) {
    if (!conectado) {
        alert("Conecte ao Gateway primeiro!");
        return;
    }

    mostrarCarregamento(true); // Mostra o indicador de carregamento

    try {
        const response = await fetch(`${savedUrl}/send-command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                device_name: "Lamp_1",
                order,
                value
            })
        });

        const result = await response.json();
        if (result.error) {
            alert(`Erro: ${result.error}`);
        } else {
            atualizarDispositivo("Lamp_1"); // Atualiza apenas a lâmpada
        }
    } catch (error) {
        console.error("Erro de comunicação:", error);
        alert("Erro de comunicação. Verifique sua conexão e tente novamente.");
    } finally {
        mostrarCarregamento(false); // Oculta o indicador de carregamento
    }
}