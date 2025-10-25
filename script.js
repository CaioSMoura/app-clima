// A CHAVE API é usada em múltiplas funções. Substitua pela sua chave REAL
const API_KEY = '254d44399ad6eeb74eb0c5bfe0717c7e'; 


// --- 1. FUNÇÕES DE UTILIDADE E GEOLOCALIZAÇÃO ---

// Lida com a tecla ENTER no input
function handleKey(event) {
    if (event.key === 'Enter') {
        buscarClima();
    }
}

// Inicia a busca por localização assim que a página carrega
window.onload = buscarClimaPorLocalizacao;

// Função principal de Geolocalização
function buscarClimaPorLocalizacao() {
    const mensagemStatusDiv = document.getElementById('mensagem-status');
    const inputCidade = document.getElementById('city');
    
    // Se o input de cidade não estiver vazio, o usuário já buscou algo, não force a geolocalização.
    if (inputCidade.value) {
        return;
    }
    
    // Verifica se o navegador suporta
    if (!navigator.geolocation) {
        mensagemStatusDiv.innerHTML = '⚠️ Seu navegador não suporta Geolocalização.';
        return;
    }

    mensagemStatusDiv.innerHTML = '<span class="loading">Buscando sua localização... 🌍</span>';

    // Tenta obter a posição.
    navigator.geolocation.getCurrentPosition(sucessoLocalizacao, erroLocalizacao, {
        timeout: 5000 // Tempo máximo de espera: 5 segundos
    });
}

// Chamada de SUCESSO ao obter a localização (Coordenadas)
function sucessoLocalizacao(posicao) {
    const lat = posicao.coords.latitude;
    const lon = posicao.coords.longitude;
    
    buscarClimaPorCoordenadas(lat, lon, API_KEY);
}

// Chamada de ERRO ao obter a localização
function erroLocalizacao(erro) {
    const mensagemStatusDiv = document.getElementById('mensagem-status');
    
    if (erro.code === erro.PERMISSION_DENIED) {
        mensagemStatusDiv.innerHTML = '⚠️ Permissão de localização negada. Digite uma cidade acima.';
    } else {
        mensagemStatusDiv.innerHTML = '⚠️ Não foi possível obter sua localização. Digite uma cidade acima.';
    }
}


// --- 2. FUNÇÕES PRINCIPAIS DE BUSCA ---

// Busca o clima (Clima Atual + Previsão Estendida) por NOME DA CIDADE (input do usuário)
async function buscarClima() {
    const inputCidade = document.getElementById('city');
    const cidade = inputCidade.value;

    const resultadoDiv = document.getElementById('resultado');
    const mensagemStatusDiv = document.getElementById('mensagem-status');
    
    if (!cidade) {
        mensagemStatusDiv.innerHTML = '⚠️ Por favor, digite o nome de uma cidade.';
        resultadoDiv.style.display = 'none';
        return;
    }
    
    resultadoDiv.style.display = 'none';
    mensagemStatusDiv.innerHTML = '<span class="loading">Buscando dados... ⏳</span>';
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${API_KEY}&lang=pt_br&units=metric`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.cod === '404' || dados.cod === 401 || !resposta.ok) {
            mensagemStatusDiv.innerHTML = '<h2>❌ Cidade não encontrada ou houve um erro na busca.</h2>';
            return;
        }

        exibirDadosNoHTML(dados);
        mensagemStatusDiv.innerHTML = '';
        resultadoDiv.style.display = 'block';

        // Chamada da função de previsão estendida por CIDADE
        buscarPrevisaoEstendida(cidade, API_KEY);

    } catch (erro) {
        console.error('Erro na requisição da API:', erro);
        mensagemStatusDiv.innerHTML = '<h2>🛑 Erro ao buscar o clima. Verifique a conexão.</h2>';
        resultadoDiv.style.display = 'none';
    }
}

// Busca o clima (Clima Atual + Previsão Estendida) por COORDENADAS (Geolocalização)
async function buscarClimaPorCoordenadas(lat, lon) {
    const resultadoDiv = document.getElementById('resultado');
    const mensagemStatusDiv = document.getElementById('mensagem-status');
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=pt_br&units=metric`;
    
    mensagemStatusDiv.innerHTML = '<span class="loading">Localização obtida. Buscando o clima... ⏳</span>';

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.cod === '404' || dados.cod === 401 || !resposta.ok) {
            mensagemStatusDiv.innerHTML = '<h2>❌ Erro ao buscar o clima por coordenadas.</h2>';
            return;
        }

        exibirDadosNoHTML(dados);
        mensagemStatusDiv.innerHTML = '';
        resultadoDiv.style.display = 'block';

        // Chamada da função de previsão estendida por COORDENADAS
        buscarPrevisaoEstendidaPorCoordenadas(lat, lon, API_KEY);

    } catch (erro) {
        console.error('Erro na requisição da API por coordenadas:', erro);
        mensagemStatusDiv.innerHTML = '<h2>🛑 Erro de rede. Tente novamente.</h2>';
        resultadoDiv.style.display = 'none';
    }
}


// --- 3. FUNÇÕES DE EXIBIÇÃO DE DADOS ---

// Atualiza o HTML com os dados do clima atual (Reutilizada por todas as buscas)
function exibirDadosNoHTML(dados) {
    const temp = Math.round(dados.main.temp);
    const sensacao = Math.round(dados.main.feels_like);
    const umidade = dados.main.humidity;
    const vento = dados.wind.speed;
    const pressao = dados.main.pressure;
    const descricao = dados.weather[0].description;
    const iconCode = dados.weather[0].icon;

    // Converte a primeira letra da descrição para maiúscula
    const descricaoFormatada = descricao.charAt(0).toUpperCase() + descricao.slice(1);

    document.getElementById('cidade-nome').textContent = `${dados.name}, ${dados.sys.country}`;
    document.getElementById('temperatura').textContent = `${temp}°C`;
    document.getElementById('clima-descricao').textContent = descricaoFormatada;
    
    document.getElementById('sensacao-termica').textContent = `${sensacao}°C`;
    document.getElementById('detalhe-umidade').textContent = `${umidade}%`;
    document.getElementById('detalhe-vento').textContent = `${vento} m/s`;
    document.getElementById('detalhe-pressao').textContent = `${pressao} hPa`;
    
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('icone-clima').src = iconUrl;
    document.getElementById('icone-clima').alt = descricaoFormatada;
}

// Função utilitária para criar os cartões de previsão (Reutilizada por todas as buscas estendidas)
function criarCartoesDePrevisao(dados) {
    const container = document.getElementById('previsao-estendida');
    container.innerHTML = '';
    
    const previsoesPorDia = {};
    
    dados.list.forEach(item => {
        const dataHora = new Date(item.dt * 1000);
        const dataString = dataHora.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const hora = dataHora.getHours();

        // Filtra para pegar o horário representativo do dia (12h-15h)
        if (!previsoesPorDia[dataString] && hora >= 12 && hora <= 15) {
            previsoesPorDia[dataString] = {
                dia: dataString,
                temp: Math.round(item.main.temp),
                descricao: item.weather[0].description,
                icon: item.weather[0].icon,
            };
        }
    });

    // Cria os cartões no DOM
    Object.values(previsoesPorDia).forEach(previsao => {
        const cardHTML = `
            <div class="forecast-card">
                <p class="forecast-day">${previsao.dia}</p>
                <img src="https://openweathermap.org/img/wn/${previsao.icon}.png" alt="${previsao.descricao}">
                <p class="forecast-temp">${previsao.temp}°C</p>
                <p>${previsao.descricao}</p>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}


// --- 4. FUNÇÕES DE PREVISÃO ESTENDIDA (5 dias) ---

// Busca a previsão estendida por NOME DA CIDADE
async function buscarPrevisaoEstendida(cidade) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${API_KEY}&lang=pt_br&units=metric`;
    const container = document.getElementById('previsao-estendida');

    try {
        const resposta = await fetch(forecastUrl);
        const dados = await resposta.json();

        if (dados.cod !== '200') {
            container.innerHTML = '<p>Não foi possível carregar a previsão estendida.</p>';
            return;
        }

        criarCartoesDePrevisao(dados); // Usa a função reutilizável

    } catch (erro) {
        console.error('Erro na requisição da previsão estendida:', erro);
        container.innerHTML = '<p>Erro de rede ao carregar a previsão estendida.</p>';
    }
}

// Busca a previsão estendida por COORDENADAS
async function buscarPrevisaoEstendidaPorCoordenadas(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&lang=pt_br&units=metric`;
    const container = document.getElementById('previsao-estendida');

    try {
        const resposta = await fetch(forecastUrl);
        const dados = await resposta.json();

        if (dados.cod !== '200') {
            container.innerHTML = '<p>Não foi possível carregar a previsão estendida.</p>';
            return;
        }

        criarCartoesDePrevisao(dados); // Usa a função reutilizável

    } catch (erro) {
        console.error('Erro na requisição da previsão estendida por coordenadas:', erro);
        container.innerHTML = '<p>Erro de rede ao carregar a previsão estendida.</p>';
    }
}