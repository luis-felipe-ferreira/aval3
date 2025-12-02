
export async function getAllCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,population,region,capital');
        
        if (!response.ok) throw new Error('Erro ao carregar países');
        return await response.json();
    } catch (error) {
        console.error('Erro em getAllCountries:', error);
        throw error;
    }
}

export async function getCountriesByRegion(region) {
    try {
        let url;
        if (region === 'all' || !region) {
            url = 'https://restcountries.com/v3.1/all?fields=name,flags,population,region,capital';
        } else {
            url = `https://restcountries.com/v3.1/region/${region}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao filtrar região');
        return await response.json();
    } catch (error) {
        console.error('Erro em getCountriesByRegion:', error);
        throw error;
    }
}

export async function getCountryByName(name) {
    if (!name) return null;
    try {
        const response = await fetch(`https://restcountries.com/v3.1/name/${name}?fullText=true`);
        if (!response.ok) throw new Error('País não encontrado');
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('Erro em getCountryByName:', error);
        throw error;
    }
}

export async function getCountryByCode(code) {
    if (!code) return null;
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
        const data = await response.json();
        return data[0];
    } catch (error) {
        return null;
    }
}
