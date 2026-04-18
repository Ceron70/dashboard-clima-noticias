// ============================================
// CONFIGURACIÓN
// ============================================
const WEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
const NEWS_API_KEY = 'pub_93b6d1055d644301b08f457230a8a23f';
const BACKEND_URL = 'http://localhost:3000';

// ============================================
// ELEMENTOS DOM
// ============================================
const cityNameEl = document.getElementById('cityName');
const temperatureEl = document.getElementById('temperature');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const descriptionEl = document.getElementById('description');
const weatherIconEl = document.getElementById('weatherIcon');
const newsListEl = document.getElementById('newsList');

// ============================================
// FUNCIÓN: GUARDAR BÚSQUEDA EN POSTGRESQL
// ============================================
async function guardarBusquedaEnDB(ciudad, temperatura, humedad, pais) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/busquedas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ciudad, temperatura, humedad, pais })
        });
        const data = await response.json();
        if (data.success) {
            console.log('✅ Búsqueda guardada en PostgreSQL');
        }
    } catch (error) {
        console.error('❌ Error al guardar:', error);
    }
}

// ============================================
// FUNCIÓN: OBTENER CLIMA
// ============================================
async function getWeather(city) {
    cityNameEl.textContent = 'Cargando...';
    temperatureEl.textContent = '--';
    newsListEl.innerHTML = '<p>📰 Cargando noticias...</p>';
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message);
        
        cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
        temperatureEl.textContent = Math.round(data.main.temp);
        feelsLikeEl.textContent = Math.round(data.main.feels_like);
        humidityEl.textContent = data.main.humidity;
        windEl.textContent = Math.round(data.wind.speed);
        descriptionEl.textContent = data.weather[0].description;
        
        const iconCode = data.weather[0].icon;
        weatherIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" style="width: 60px;">`;
        
        // Guardar en PostgreSQL
        await guardarBusquedaEnDB(data.name, Math.round(data.main.temp), data.main.humidity, data.sys.country);
        
        // Cargar noticias del país
        await getNews(data.sys.country);
        
    } catch (error) {
        console.error('Error en clima:', error);
        cityNameEl.textContent = 'Error';
        temperatureEl.textContent = '--';
        newsListEl.innerHTML = `<p>❌ Error al cargar el clima: ${error.message}</p>`;
    }
}

// ============================================
// FUNCIÓN: OBTENER NOTICIAS CON NEWSDATA.IO
// ============================================
async function getNews(countryCode) {
    newsListEl.innerHTML = '<p>📰 Cargando noticias...</p>';
    
    try {
        // Intentar noticias del país específico
        const url = `https://newsdata.io/api/1/news?country=${countryCode.toLowerCase()}&apikey=${NEWS_API_KEY}&language=es&size=6`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const articles = data.results.map(article => ({
                title: article.title,
                description: article.description,
                image: article.image_url,
                url: article.link
            }));
            renderNews(articles);
            return;
        }
        
        // Si no hay, buscar noticias generales en español
        const urlGeneral = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&language=es&size=6`;
        const responseGeneral = await fetch(urlGeneral);
        const dataGeneral = await responseGeneral.json();
        
        if (dataGeneral.results && dataGeneral.results.length > 0) {
            const articles = dataGeneral.results.map(article => ({
                title: article.title,
                description: article.description,
                image: article.image_url,
                url: article.link
            }));
            renderNews(articles);
        } else {
            newsListEl.innerHTML = `
                <div style="text-align: center; padding: 20px; background: white; border-radius: 15px;">
                    <p>📭 No hay noticias disponibles</p>
                    <p style="font-size: 0.8rem;">Intenta más tarde</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error en noticias:', error);
        newsListEl.innerHTML = `
            <div style="text-align: center; padding: 20px; background: white; border-radius: 15px;">
                <p>⚠️ Error al cargar noticias: ${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// FUNCIÓN: RENDERIZAR NOTICIAS
// ============================================
function renderNews(articles) {
    if (!articles || articles.length === 0) {
        newsListEl.innerHTML = '<p>📭 No hay noticias disponibles</p>';
        return;
    }
    
    newsListEl.innerHTML = articles.map(article => `
        <div class="news-card">
            ${article.image ? `<img src="${article.image}" class="news-image" onerror="this.style.display='none'">` : ''}
            <div class="news-content">
                <h3>${article.title || 'Sin título'}</h3>
                <p>${article.description ? article.description.substring(0, 100) + '...' : 'Lee más en el enlace'}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Leer más →</a>
            </div>
        </div>
    `).join('');
}

// ============================================
// EVENTOS
// ============================================
document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
        getWeather(city);
    } else {
        alert('Por favor, escribe el nombre de una ciudad');
    }
});

document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = document.getElementById('cityInput').value.trim();
        if (city) {
            getWeather(city);
        }
    }
});

// ============================================
// INICIALIZACIÓN
// ============================================
window.addEventListener('load', () => {
    getWeather('Santiago');
});