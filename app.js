// Inicializa o WebApp do Telegram
const tg = window.Telegram.WebApp;
tg.expand(); // Abre em tela cheia
tg.ready();

// --- CONFIGURAÇÃO ---
// TROQUE ISSO PELO SEU LINK DO PYTHON ANYWHERE
// Exemplo: https://gegebot.pythonanywhere.com
const BASE_URL = "gbrking.pythonanywhere.com"; 

// --- NAVEGAÇÃO ENTRE ABAS ---
function navTo(pageId) {
    // 1. Remove classe ativa de tudo
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // 2. Ativa a página e o botão da navbar
    document.getElementById('page-' + pageId).classList.add('active');
    const tabBtn = document.getElementById('tab-' + pageId);
    if(tabBtn) tabBtn.classList.add('active');

    // 3. Se for página de dados, carrega a API
    if (['ranking', 'duplas', 'global'].includes(pageId)) {
        loadData(pageId);
    }
}

// --- CARREGAR ADS (Mural da Home) ---
async function loadAds() {
    const container = document.getElementById('ads-container');
    try {
        const res = await fetch(`${BASE_URL}/ads`);
        const data = await res.json();
        
        // Se a API retornar lista vazia ou erro
        if (!data.ads || data.ads.length === 0) {
            container.innerHTML = '<div style="padding:10px; color:gray; font-size:12px;">Sem anúncios hoje.</div>';
            return;
        }

        container.innerHTML = ''; // Remove o skeleton loading
        
        data.ads.forEach(ad => {
            const card = document.createElement('div');
            card.className = 'card-ad';
            // Ao clicar, o Telegram pede confirmação para abrir o link
            card.onclick = () => tg.openTelegramLink(ad.link);
            
            card.innerHTML = `
                <div class="ad-icon">${ad.emoji}</div>
                <span>${ad.name}</span>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        console.error("Erro Ads:", e);
        // Deixa o skeleton ou mostra erro silencioso
    }
}

// --- CARREGAR LISTAS (Ranking, Duplas, Global) ---
async function loadData(type) {
    const container = document.getElementById(type + '-list');
    
    // Mostra Skeleton (Carregando)
    container.innerHTML = `
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
    `;

    try {
        // Pega o ID do grupo da URL (?chat_id=123...)
        const params = new URLSearchParams(window.location.search);
        const chatId = params.get('chat_id') || 0; 

        // Define a rota
        let endpoint = `/${type}`;
        if (type === 'ranking') endpoint += `?chat_id=${chatId}`;

        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();
        
        // O Python retorna {ranking: [...]}, {duplas: [...]}, etc.
        const list = data[type] || [];

        if(list.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px; color:gray'>Nenhum dado encontrado.</p>";
        } else {
            renderList(list, container, type);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#ff3b30'>Erro de Conexão.<br>Verifique a API.</p>";
    }
}

// --- RENDERIZAR ITENS NA TELA ---
function renderList(items, container, type) {
    container.innerHTML = ''; 

    items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        // Delay para efeito cascata (um por um)
        div.style.animationDelay = (i * 0.05) + 's';

        // Lógica Visual: Duplas vs Pessoas
        let avatarBg = 'var(--accent)';
        let avatarIcon = item.name[0];
        let subText = `${i+1}º Lugar`;

        if (type === 'duplas') {
            avatarBg = '#ff2d55'; // Rosa
            avatarIcon = '👥';
        } else {
            // Cores para Top 3
            if(i===0) { avatarBg = '#ffcc00'; subText = '👑 Líder'; }
            if(i===1) avatarBg = '#c0c0c0';
            if(i===2) avatarBg = '#cd7f32';
        }

        div.innerHTML = `
            <div class="rank-num">${i+1}</div>
            <div class="user-avatar" style="background:${avatarBg}">${avatarIcon}</div>
            <div class="user-info">
                <b>${item.name}</b>
                <small>${subText}</small>
            </div>
            <div class="user-points">${item.points}</div>
        `;
        container.appendChild(div);
    });
}

// --- INICIALIZAÇÃO ---
// Preenche perfil e carrega Ads ao abrir
if(tg.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    document.getElementById('user-name').innerText = u.first_name;
    document.getElementById('p-name').innerText = u.first_name + (u.last_name ? ' ' + u.last_name : '');
    document.getElementById('p-id').innerText = "ID: " + u.id;
    document.getElementById('p-img').innerText = u.first_name[0];
}

// Carrega os anúncios assim que abre
loadAds();