const tg = window.Telegram.WebApp;
tg.expand();

const BASE_URL = "https://gbrking.pythonanywhere.com";

// 1. Inicializa dados do usuário na Home
document.getElementById('user-name').innerText = tg.initDataUnsafe?.user?.first_name || "Membro";

// 2. Sistema de Navegação
function navTo(page) {
    // Esconde todas as páginas e remove active das abas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));

    // Ativa a página e a aba correta
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    
    const targetTab = document.getElementById('tab-' + page);
    if (targetTab) targetTab.classList.add('active');

    // LÓGICA DE CARREGAMENTO
    if (page === 'perfil') {
        loadProfile(); // Se for perfil, carrega stats e gráfico
    } else if (page !== 'home') {
        loadData(page); // Se for ranking, carrega lista
    }
}

// 3. Carregar Rankings
async function loadData(type) {
    const container = document.getElementById(type + '-list');
    if (!container) return;
    
    container.innerHTML = '<div class="skeleton">Carregando...</div>';

    try {
        let endpoint = `/${type}`;
        if (type === 'ranking') {
            const chatId = tg.initDataUnsafe?.chat?.id || new URLSearchParams(window.location.search).get('chat_id');
            if (chatId) endpoint += `?chat_id=${chatId}`;
        }

        const res = await fetch(`${BASE_URL}${endpoint}`);
        const data = await res.json();
        const list = data[type] || [];

        container.innerHTML = list.length ? "" : '<p class="empty">Nada por aqui ainda...</p>';

        list.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            
            const isGroup = (type === 'grupos');
            const avatar = isGroup ? `<div class="user-avatar">👥</div>` : 
                          (item.photo_url ? `<img src="${BASE_URL}${item.photo_url}" class="user-avatar-img">` : 
                          `<div class="user-avatar">${item.name[0]}</div>`);

            div.innerHTML = `
                <div class="rank-num">${i+1}</div>
                ${avatar}
                <div class="user-info"><b>${item.name}</b><small>${type === 'duplas' ? 'Interações' : 'Mensagens'}</small></div>
                <div class="user-points">${item.points}</div>
            `;
            container.appendChild(div);
        });
    } catch (e) { container.innerHTML = '<p class="empty">Erro ao carregar dados.</p>'; }
}

// 4. Carregar Perfil Real
async function loadProfile() {
    const user = tg.initDataUnsafe?.user;
    if (!user) return;

    // Preenche Nome e ID básicos
    document.getElementById('p-name').innerText = user.first_name + (user.last_name ? " " + user.last_name : "");
    document.getElementById('p-id').innerText = `ID: ${user.id}`;
    
    // Foto de Perfil
    const pImg = document.getElementById('p-img');
    if (user.photo_url) {
        pImg.innerHTML = `<img src="${user.photo_url}" class="avatar-large-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    try {
        // Busca estatísticas
        const res = await fetch(`${BASE_URL}/user_stats/${user.id}`);
        const stats = await res.json();
        
        // Atualiza ou cria a grade de estatísticas
        const profileCard = document.querySelector('.profile-card');
        const oldGrid = document.querySelector('.stats-grid');
        if (oldGrid) oldGrid.remove();

        const statsHtml = `
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; display: block; opacity: 0.7;">🔥 PONTOS</span>
                    <b style="font-size: 16px; color: #ffcc00;">${stats.points}</b>
                </div>
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; display: block; opacity: 0.7;">🏘️ GRUPOS</span>
                    <b style="font-size: 16px; color: #ffcc00;">${stats.groups}</b>
                </div>
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; display: block; opacity: 0.7;">🌍 GLOBAL</span>
                    <b style="font-size: 16px; color: #ffcc00;">#${stats.rank}</b>
                </div>
            </div>
        `;
        profileCard.insertAdjacentHTML('beforeend', statsHtml);
        
        // CHAMA O GRÁFICO DEPOIS DE CARREGAR OS DADOS
        loadHistory(user.id);

    } catch (e) { console.error("Erro ao carregar stats", e); }
}

// 5. Funções do Gráfico (Chart.js)
async function loadHistory(userId) {
    try {
        const res = await fetch(`${BASE_URL}/user_history/${userId}`);
        const data = await res.json();
        
        if (data.history && data.history.length > 0) {
            renderChart(data.history);
        }
    } catch (e) { console.error("Erro ao carregar histórico", e); }
}

function renderChart(historyData) {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return; // Segurança caso o canvas não exista no HTML
    
    const ctx = canvas.getContext('2d');
    
    if (window.myChart) window.myChart.destroy(); // Limpa gráfico anterior

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historyData.map(d => d.data),
            datasets: [{
                data: historyData.map(d => d.pts),
                borderColor: '#ffcc00',
                backgroundColor: 'rgba(255, 204, 0, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#ffcc00'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#aaa', font: { size: 10 } }
                },
                x: { 
                    grid: { display: false },
                    ticks: { color: '#aaa', font: { size: 10 } }
                }
            }
        }
    });
}

// 6. Carregar Anúncios
async function loadAds() {
    const container = document.getElementById('ads-container');
    try {
        const res = await fetch(`${BASE_URL}/ads`);
        const data = await res.json();
        if (data.ads && data.ads.length > 0) {
            container.innerHTML = data.ads.map(ad => `
                <div class="ad-card" onclick="tg.openLink('${ad.link}')">
                    <img src="${ad.image_url}" class="ad-img">
                    <div class="ad-info">
                        <span class="ad-tag">Patrocinado</span>
                        <div class="ad-title">${ad.title}</div>
                        <div class="ad-desc">${ad.description}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.closest('.section-block').style.display = 'none';
        }
    } catch (e) { 
        if(container && container.closest('.section-block')) {
            container.closest('.section-block').style.display = 'none';
        }
    }
}

loadAds();
