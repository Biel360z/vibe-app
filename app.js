const tg = window.Telegram.WebApp;
tg.expand();

const BASE_URL = "https://gbrking.pythonanywhere.com";

// Inicia nome do usuário
document.getElementById('user-name').innerText = tg.initDataUnsafe?.user?.first_name || "Membro";

function navTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));

    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    
    const targetTab = document.getElementById('tab-' + page);
    if (targetTab) targetTab.classList.add('active');

    if (page === 'perfil') {
        loadProfile();
    } else if (page === 'ranking') {
        loadFeedAds(); // Chama o feed de anúncios agora
    } else if (page !== 'home') {
        loadData(page);
    }
}

async function loadFeedAds() {
    const container = document.getElementById('ranking-list');
    if (!container) return;
    container.innerHTML = '<div class="skeleton">Carregando feed...</div>';

    try {
        const res = await fetch(`${BASE_URL}/feed_ads`);
        const data = await res.json();
        
        if (!data.ads || data.ads.length === 0) {
            container.innerHTML = '<p class="empty">Nenhum anúncio disponível.</p>';
            return;
        }

        container.innerHTML = data.ads.map(ad => {
            // Lógica de Imagem: Prioridade (Ad Image > Group Image > Default)
            let imgPath = ad.image_url;
            if (!imgPath && ad.group_photo) {
                imgPath = `${BASE_URL}${ad.group_photo}`;
            } else if (!imgPath) {
                imgPath = `${BASE_URL}/static/avatars/default_group.png`;
            } else if (!imgPath.startsWith('http')) {
                imgPath = `${BASE_URL}/static/avatars/${imgPath}`;
            }

            const avg = Math.round(ad.avg_rating || 0);
            const starsHtml = [1, 2, 3, 4, 5].map(num => `
                <span onclick="sendRating(${ad.id}, ${num}, event)" 
                      style="cursor:pointer; color: ${num <= avg ? '#ffcc00' : '#444'}; font-size: 24px;">★</span>
            `).join('');

            return `
                <div class="feed-ad-card" onclick="tg.openLink('${ad.link}')" style="margin-bottom: 20px; background: #1a1a1a; border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <img src="${imgPath}" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 15px;">
                        <span style="background: #ffcc00; color: #000; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: bold;">DESTAQUE</span>
                        <h3 style="margin: 10px 0 5px 0; color: #fff;">${ad.title}</h3>
                        <p style="color: #aaa; font-size: 14px;">${ad.description}</p>
                        <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                            <div>${starsHtml} <small style="color:#666">(${ad.total_votes || 0})</small></div>
                            <button style="background:#ffcc00; border:none; padding:8px 12px; border-radius:8px; font-weight:bold;">Acessar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) { container.innerHTML = '<p class="empty">Erro ao carregar feed.</p>'; }
}

async function sendRating(adId, score, event) {
    event.stopPropagation();
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) return;
    try {
        const res = await fetch(`${BASE_URL}/rate_ad`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ad_id: adId, user_id: userId, rating: score })
        });
        if (res.ok) {
            tg.HapticFeedback.notificationOccurred('success');
            loadFeedAds();
        }
    } catch (e) { console.error(e); }
}

// Funções de Perfil e Rankings (Mantidas)
async function loadData(type) {
    const container = document.getElementById(type + '-list');
    if (!container) return;
    container.innerHTML = '<div class="skeleton">Carregando...</div>';
    try {
        const res = await fetch(`${BASE_URL}/${type}`);
        const data = await res.json();
        const list = data[type] || [];
        container.innerHTML = list.length ? "" : '<p class="empty">Nada aqui.</p>';
        list.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            const avatar = item.photo_url ? `<img src="${BASE_URL}${item.photo_url}" class="user-avatar-img">` : `<div class="user-avatar">👤</div>`;
            div.innerHTML = `<div class="rank-num">${i+1}</div>${avatar}<div class="user-info"><b>${item.name}</b></div><div class="user-points">${item.points}</div>`;
            container.appendChild(div);
        });
    } catch (e) { container.innerHTML = '<p class="empty">Erro.</p>'; }
}

async function loadProfile() {
    const user = tg.initDataUnsafe?.user;
    if (!user) return;
    document.getElementById('p-name').innerText = user.first_name + (user.last_name ? " " + user.last_name : "");
    const res = await fetch(`${BASE_URL}/user_stats/${user.id}`);
    const stats = await res.json();
    const oldGrid = document.querySelector('.stats-grid');
    if (oldGrid) oldGrid.remove();
    const statsHtml = `<div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
        <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
            <span style="font-size: 10px; opacity: 0.7;">🔥 PONTOS</span><br><b style="color: #ffcc00;">${stats.points}</b>
        </div>
        <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
            <span style="font-size: 10px; opacity: 0.7;">🏘️ GRUPOS</span><br><b style="color: #ffcc00;">${stats.groups}</b>
        </div>
        <div class="stat-box" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; text-align: center;">
            <span style="font-size: 10px; opacity: 0.7;">🌍 GLOBAL</span><br><b style="color: #ffcc00;">#${stats.rank}</b>
        </div>
    </div>`;
    document.querySelector('.profile-card').insertAdjacentHTML('beforeend', statsHtml);
    loadHistory(user.id);
}

async function loadHistory(userId) {
    const res = await fetch(`${BASE_URL}/user_history/${userId}`);
    const data = await res.json();
    if (data.history && data.history.length > 0) renderChart(data.history);
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
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

async function loadAds() {
    const container = document.getElementById('ads-container');
    if(!container) return;
    try {
        const res = await fetch(`${BASE_URL}/ads`);
        const data = await res.json();
        if (data.ads) {
            container.innerHTML = data.ads.map(ad => `
                <div class="ad-card" onclick="tg.openLink('${ad.link}')">
                    <img src="${ad.image_url}" class="ad-img">
                    <div class="ad-info">
                        <span class="ad-tag">Patrocinado</span>
                        <div class="ad-title">${ad.title}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {}
}
loadAds();
