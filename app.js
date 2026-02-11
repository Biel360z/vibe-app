const tg = window.Telegram.WebApp;
tg.expand();

const BASE_URL = "https://gbrking.pythonanywhere.com";

// 1. Inicializa dados do usuário na Home
document.getElementById('user-name').innerText = tg.initDataUnsafe?.user?.first_name || "Membro";

// 2. Sistema de Navegação
function navTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));

    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    
    const targetTab = document.getElementById('tab-' + page);
    if (targetTab) targetTab.classList.add('active');

    // LÓGICA DE CARREGAMENTO
    if (page === 'perfil') {
        loadProfile();
    } else if (page === 'ranking') {
        loadFeedAds(); // AGORA CHAMA O FEED NO LUGAR DO RANKING
    } else if (page !== 'home') {
        loadData(page); // Outros rankings (global, grupos, etc)
    }
}

// 3. Novo: Carregar Feed de Anúncios (Substituindo o Ranking de mensagens)
async function loadFeedAds() {
    const container = document.getElementById('ranking-list');
    if (!container) return;

    container.innerHTML = '<div class="skeleton">Carregando novidades...</div>';

    try {
        const res = await fetch(`${BASE_URL}/feed_ads`);
        const data = await res.json();
        
        if (!data.ads || data.ads.length === 0) {
            container.innerHTML = '<p class="empty">Nenhum destaque hoje.</p>';
            return;
        }

        container.innerHTML = data.ads.map(ad => {
            // Gera as 5 estrelas baseadas na média
            const avg = Math.round(ad.avg_rating || 0);
            const starsHtml = [1, 2, 3, 4, 5].map(num => `
                <span onclick="sendRating(${ad.id}, ${num}, event)" 
                      style="cursor:pointer; color: ${num <= avg ? '#ffcc00' : '#444'}; font-size: 24px; transition: 0.2s;">
                    ★
                </span>
            `).join('');

            return `
                <div class="feed-ad-card" onclick="tg.openLink('${ad.link}')" style="margin-bottom: 20px; background: #1a1a1a; border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <img src="${ad.image_url}" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 15px;">
                        <span style="background: #ffcc00; color: #000; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: bold; text-transform: uppercase;">Destaque</span>
                        <h3 style="margin: 10px 0 5px 0; color: #fff; font-size: 18px;">${ad.title}</h3>
                        <p style="margin: 0; color: #aaa; font-size: 14px;">${ad.description}</p>
                        
                        <div class="rating-section" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                ${starsHtml}
                                <small style="color: #666; margin-left: 5px;">(${ad.total_votes || 0})</small>
                            </div>
                            <button style="background: #ffcc00; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px;">Visitar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) { 
        container.innerHTML = '<p class="empty">Erro ao carregar o feed.</p>';
    }
}

// 4. Função para enviar o voto (estrela)
async function sendRating(adId, score, event) {
    event.stopPropagation(); // Não abre o link ao votar
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) return;
    
    try {
        const res = await fetch(`${BASE_URL}/rate_ad`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ad_id: adId, user_id: userId, rating: score })
        });
        const data = await res.json();
        if(data.success) {
            tg.HapticFeedback.notificationOccurred('success');
            loadFeedAds(); // Atualiza as estrelas na hora
        }
    } catch (e) { console.error("Erro ao votar:", e); }
}

// 5. Carregar Rankings Tradicionais (Global, Grupos, Duplas)
async function loadData(type) {
    const container = document.getElementById(type + '-list');
    if (!container) return;
    container.innerHTML = '<div class="skeleton">Carregando...</div>';

    try {
        const res = await fetch(`${BASE_URL}/${type}`);
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

// 6. Perfil e Histórico (Gráfico)
async function loadProfile() {
    const user = tg.initDataUnsafe?.user;
    if (!user) return;

    document.getElementById('p-name').innerText = user.first_name + (user.last_name ? " " + user.last_name : "");
    document.getElementById('p-id').innerText = `ID: ${user.id}`;
    
    const pImg = document.getElementById('p-img');
    if (user.photo_url) {
        pImg.innerHTML = `<img src="${user.photo_url}" class="avatar-large-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }

    try {
        const res = await fetch(`${BASE_URL}/user_stats/${user.id}`);
        const stats = await res.json();
        
        const profileCard = document.querySelector('.profile-card');
        const oldGrid = document.querySelector('.stats-grid');
        if (oldGrid) oldGrid.remove();

        const statsHtml = `
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; opacity: 0.7;">🔥 PONTOS</span>
                    <b style="font-size: 16px; color: #ffcc00;">${stats.points}</b>
                </div>
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; opacity: 0.7;">🏘️ GRUPOS</span>
                    <b style="font-size: 16px; color: #ffcc00;">${stats.groups}</b>
                </div>
                <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 10px; opacity: 0.7;">🌍 GLOBAL</span>
                    <b style="font-size: 16px; color: #ffcc00;">#${stats.rank}</b>
                </div>
            </div>
        `;
        profileCard.insertAdjacentHTML('beforeend', statsHtml);
        loadHistory(user.id);
    } catch (e) { console.error("Erro stats", e); }
}

async function loadHistory(userId) {
    try {
        const res = await fetch(`${BASE_URL}/user_history/${userId}`);
        const data = await res.json();
        if (data.history && data.history.length > 0) renderChart(data.history);
    } catch (e) { console.error("Erro histórico", e); }
}

function renderChart(historyData) {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.myChart) window.myChart.destroy();
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
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// 7. Carregar Ads da Home (Carrossel)
async function loadAds() {
    const container = document.getElementById('ads-container');
    if(!container) return;
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
        }
    } catch (e) { console.error("Erro Ads Home", e); }
}

loadAds();
