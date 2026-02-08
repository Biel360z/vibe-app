const tg = window.Telegram.WebApp;
tg.expand();

const BASE_URL = "https://gbrking.pythonanywhere.com"; 

function getAvatarColor(name) {
    const colors = ['#ff5152', '#549df9', '#3af283', '#ffae3d', '#cc7af9', '#4de4f0'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

async function loadData(type) {
    const container = document.getElementById(type + '-list');
    container.innerHTML = '<div class="skeleton-row"></div><div class="skeleton-row"></div>';

    try {
        let endpoint = `/${type}`;
        if (type === 'ranking') {
            const chatId = tg.initDataUnsafe?.chat?.id || new URLSearchParams(window.location.search).get('chat_id') || 0;
            endpoint += `?chat_id=${chatId}`;
        }

        const res = await fetch(`${BASE_URL}${endpoint}`);
        const data = await res.json();
        const list = data[type] || [];

        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = '<p class="empty-msg">Nenhum dado encontrado.</p>';
            return;
        }

        list.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            
            // Lógica de Foto Real vs Inicial
            const avatarContent = item.photo_url 
                ? `<img src="${BASE_URL}${item.photo_url}" class="user-avatar-img" onerror="this.style.display='none'">` 
                : `<div class="user-avatar" style="background:${getAvatarColor(item.name)}">${item.name[0].toUpperCase()}</div>`;

            div.innerHTML = `
                <div class="rank-num">${i+1}</div>
                ${avatarContent}
                <div class="user-info"><b>${item.name}</b><small>${type === 'duplas' ? 'Conexão' : 'Pontos'}</small></div>
                <div class="user-points">${item.points}</div>
            `;
            container.appendChild(div);
        });
    } catch (e) { container.innerHTML = '<p class="empty-msg">Erro de conexão.</p>'; }
}

// Navegação e Ads simplificados para o exemplo
function navTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    loadData(pageId);
}

loadData('ranking'); // Início padrão
