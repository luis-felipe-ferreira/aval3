import * as api from './api.js';

const countriesGrid = document.getElementById('countries-grid');
const searchInput = document.getElementById('search-input');
const regionFilter = document.getElementById('region-filter');
const loader = document.getElementById('loader');

const isDetailsPage = window.location.pathname.includes('details.html');

function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        });
    }
}

function updateThemeIcon(isDark) {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = isDark 
            ? '<i class="fa-solid fa-sun"></i> Modo Claro' 
            : '<i class="fa-regular fa-moon"></i> Modo Escuro';
    }
}

setupTheme();

if (!isDetailsPage && countriesGrid) {
    initHomePage();
}

async function initHomePage() {
    toggleLoader(true);
    try {
        const countries = await api.getAllCountries();
        renderCountries(countries);
    } catch (error) {
        showError('Falha ao carregar países. Verifique sua conexão.');
    } finally {
        toggleLoader(false);
    }

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const name = card.dataset.name.toLowerCase();
            card.style.display = name.includes(term) ? 'block' : 'none';
        });
    });

    regionFilter.addEventListener('change', async (e) => {
        toggleLoader(true);
        countriesGrid.innerHTML = '';
        try {
            const countries = await api.getCountriesByRegion(e.target.value);
            renderCountries(countries);
        } catch (error) {
            showError('Erro ao filtrar região.');
        } finally {
            toggleLoader(false);
        }
    });
}

function renderCountries(countries) {
    countriesGrid.innerHTML = '';
    countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    
    countries.forEach(country => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.name = country.name.common;
        card.innerHTML = `
            <img src="${country.flags.svg}" alt="Bandeira ${country.name.common}" loading="lazy">
            <div class="card-body">
                <h3>${country.name.common}</h3>
                <p><strong>População:</strong> ${country.population.toLocaleString('pt-BR')}</p>
                <p><strong>Região:</strong> ${country.region}</p>
                <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `details.html?name=${country.name.common}`;
        });
        countriesGrid.appendChild(card);
    });
}

if (isDetailsPage) {
    initDetailsPage();
}

async function initDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    const countryName = params.get('name');

    if (!countryName) {
        window.location.href = 'index.html';
        return;
    }

    toggleLoader(true);
    try {
        const country = await api.getCountryByName(countryName);
        renderDetails(country);
        setupFavorites(country);
        setupMap(country);
    } catch (error) {
        document.getElementById('details-content').innerHTML = '<p>País não encontrado.</p>';
    } finally {
        toggleLoader(false);
    }
}

function renderDetails(country) {
    document.getElementById('details-content').classList.remove('hidden');
    document.getElementById('map-container').classList.remove('hidden');

    document.getElementById('country-flag').src = country.flags.svg;
    document.getElementById('country-name').textContent = country.name.common;
    document.getElementById('official-name').textContent = country.name.official;
    document.getElementById('population').textContent = country.population.toLocaleString('pt-BR');
    document.getElementById('region').textContent = country.region;
    document.getElementById('subregion').textContent = country.subregion || 'N/A';
    document.getElementById('capital').textContent = country.capital ? country.capital[0] : 'N/A';
    document.getElementById('tld').textContent = country.tld ? country.tld.join(', ') : 'N/A';

    const currencies = country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A';
    document.getElementById('currencies').textContent = currencies;
    
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    document.getElementById('languages').textContent = languages;

    const bordersContainer = document.getElementById('borders');
    if (country.borders && country.borders.length > 0) {
        country.borders.forEach(async code => {
            const neighbor = await api.getCountryByCode(code);
            if (neighbor) {
                const btn = document.createElement('button');
                btn.textContent = neighbor.name.common;
                btn.addEventListener('click', () => window.location.href = `details.html?name=${neighbor.name.common}`);
                bordersContainer.appendChild(btn);
            }
        });
    } else {
        bordersContainer.textContent = 'Não possui fronteiras terrestres.';
    }
}

function setupFavorites(country) {
    const btnFav = document.getElementById('btn-favorite');
    const favs = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFav = favs.some(f => f.name === country.name.common);

    updateFavBtn(btnFav, isFav);

    btnFav.addEventListener('click', () => {
        let currentFavs = JSON.parse(localStorage.getItem('favorites')) || [];
        const exists = currentFavs.some(f => f.name === country.name.common);

        if (exists) {
            currentFavs = currentFavs.filter(f => f.name !== country.name.common);
            updateFavBtn(btnFav, false);
        } else {
            currentFavs.push({ name: country.name.common });
            updateFavBtn(btnFav, true);
        }
        localStorage.setItem('favorites', JSON.stringify(currentFavs));
    });
}

function updateFavBtn(btn, isFav) {
    if (isFav) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fa-solid fa-heart"></i> Remover Favorito';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> Adicionar Favorito';
    }
}

function setupMap(country) {
    const [lat, lng] = country.latlng;
    const map = L.map('map').setView([lat, lng], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(country.name.common).openPopup();
}

function toggleLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}
function showError(msg) {
    const errorDiv = document.getElementById('error-msg');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('hidden');
    }
}
