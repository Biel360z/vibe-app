const tg = window.Telegram.WebApp;
tg.expand();

// URL DO SEU BACKEND NO PYTHONANYWHERE
const BASE_URL = "https://gbrking.pythonanywhere.com";

function navTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));

    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('tab-' + page).classList.add('active');

    if (page === 'home') loadFeedAds();
    if (page === 'perfil') loadProfile();
}

async function loadFeedAds() {
    const container = document.getElementById('ranking-list');
    container.innerHTML = '<div class="loader">Buscando novidades...</div>';

    try {
        const res = await fetch(`${BASE_URL}/feed_ads`);
        const data = await res.json();
        
        container.innerHTML = data.ads.map(ad => {
            // Lógica de Imagem (Prioridade: Foto enviada > Foto do Grupo)
            let img = ad.image_url || (ad.group_photo ? `${BASE_URL}${ad.group_photo}` : 'https://via.placeholder.com/300x150?text=Sem+Foto');

            return `
                <div class="ad-card" onclick="tg.openLink('${ad.link}')">
                    <img src="${img}" class="ad-img">
                    <div class="ad-content">
                        <h3>${ad.title}</h3>
                        <p>${ad.description}</p>
                        <div class="ad-meta">
                            <span>⭐ ${parseFloat(ad.avg_rating || 0).toFixed(1)}</span>
                            <button>Ver mais</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = '<p>Erro ao conectar com o servidor.</p>';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const user = tg.initDataUnsafe?.user;
    if(user) document.getElementById('user-name').innerText = `Olá, ${user.first_name}`;
    loadFeedAds();
});
