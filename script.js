document.addEventListener('DOMContentLoaded', function () {
    loadTypes();
    loadPokemons();
});

// IndexedDB setup and utility functions
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PokemonTypeDB', 2);
        
        // If the database is new or has been upgraded, create object stores
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('types')) {
                db.createObjectStore('types', { keyPath: 'name' });
            }
            if (!db.objectStoreNames.contains('pokemons')) {
                db.createObjectStore('pokemons', { keyPath: 'name' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Failed to open IndexedDB');
    });
}
function storeTypeData(db, typeData) {
    const transaction = db.transaction('types', 'readwrite');
    const store = transaction.objectStore('types');
    store.put(typeData);
    return transaction.complete;
}

function storePokemonData(db, pokemonData) {
    const transaction = db.transaction('pokemons', 'readwrite');
    const store = transaction.objectStore('pokemons');
    store.put(pokemonData);
    return transaction.complete;
}

function getTypeData(db, typeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('types', 'readonly');
        const store = transaction.objectStore('types');
        const request = store.get(typeName);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Failed to retrieve type: ${typeName}`);
    });
}

function getPokemonData(db, pokemonName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('pokemons', 'readonly');
        const store = transaction.objectStore('pokemons');
        const request = store.get(pokemonName.toLowerCase());
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Failed to retrieve Pokémon: ${pokemonName}`);
    });
}

// Fetch and store compressed type data from PokeAPI
async function fetchAndStoreTypes() {
    const db = await openDB();
    try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        const types = data.results;

        for (const type of types) {
            const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${type.name}`);
            const typeData = await typeResponse.json();

            const compressedData = {
                name: type.name,
                damage_relations: typeData.damage_relations,
            };

            await storeTypeData(db, compressedData);
        }
        alert("Type data has been fetched and stored in IndexedDB.");
    } catch (error) {
        console.error("Failed to fetch and store types:", error);
    }
}

// Fetch and store compressed Pokémon data from PokeAPI
async function fetchAndStorePokemons() {
    const db = await openDB();
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        const pokemons = data.results;

        for (const pokemon of pokemons) {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();

            const compressedData = {
                name: pokemon.name,
                types: pokemonData.types.map(typeInfo => typeInfo.type.name),
            };

            await storePokemonData(db, compressedData);
        }
        alert("Pokémon data has been fetched and stored in IndexedDB.");
    } catch (error) {
        console.error("Failed to fetch and store Pokémon data:", error);
    }
}

function fetchAndStoreData() {
    return Promise.all([
        fetchAndStoreTypes(),
        fetchAndStorePokemons()
    ])
}

// Load types from IndexedDB and populate dropdowns
async function loadTypes() {
    const db = await openDB();
    const transaction = db.transaction('types', 'readonly');
    const store = transaction.objectStore('types');
    const typeList = [];

    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            typeList.push(cursor.value.name);
            cursor.continue();
        } else {
            const attackTypeSelect = document.getElementById('attack-type');
            typeList.forEach(type => {
                let option = new Option(type.charAt(0).toUpperCase() + type.slice(1), type);
                attackTypeSelect.add(option);
            });
        }
    };
}

// Load Pokémon data from IndexedDB to enable searching
async function loadPokemons() {
    const db = await openDB();
    const transaction = db.transaction('pokemons', 'readonly');
    const store = transaction.objectStore('pokemons');
    const pokemonList = [];

    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            pokemonList.push(cursor.value.name);
            cursor.continue();
        }
    };
}


function addTargetType() {
    const targetTypeContainer = document.createElement('div');
    targetTypeContainer.className = 'target-type-container';

    const targetTypeSelect = document.createElement('select');
    targetTypeSelect.className = 'target-type-select';

    // Populate the new select with options
    const attackTypeSelect = document.getElementById('attack-type');
    for (const option of attackTypeSelect.options) {
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        targetTypeSelect.appendChild(newOption);
    }
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => targetTypeContainer.remove();
    removeButton.className = 'remove-button';

    targetTypeContainer.appendChild(targetTypeSelect);
    targetTypeContainer.appendChild(removeButton);

    document.getElementById('target-type-selects').appendChild(targetTypeContainer);
}

// Search and display Pokémon types based on partial name matching
async function searchPokemon() {
    const db = await openDB();
    const searchQuery = document.getElementById('pokemon-search').value.toLowerCase();
    
    // If the search query is empty, return immediately
    if (!searchQuery) {
        document.getElementById('pokemon-result').textContent = "Please enter a Pokémon name.";
        return;
    }

    try {
        const transaction = db.transaction('pokemons', 'readonly');
        const store = transaction.objectStore('pokemons');
        const pokemonList = [];

        // Retrieve all Pokémon and filter by the search query
        store.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const pokemon = cursor.value;
                if (pokemon.name.includes(searchQuery)) {
                    pokemonList.push(pokemon); // Add matching Pokémon to the list
                }
                cursor.continue();
            } else {
                // Display results after all matches are found
                displayPokemonResults(pokemonList);
            }
        };
    } catch (error) {
        console.error("Error searching for Pokémon", error);
    }
}

// Display the list of Pokémon that match the search
function displayPokemonResults(pokemonList) {
    const resultContainer = document.getElementById('pokemon-result');
    resultContainer.innerHTML = ""; // Clear previous results

    if (pokemonList.length === 0) {
        resultContainer.textContent = "No matching Pokémon found.";
        return;
    }

    pokemonList.forEach(pokemon => {
        const pokemonElement = document.createElement('div');
        pokemonElement.innerHTML = `
            <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
            <p>Types: ${pokemon.types.join(', ')}</p>
        `;
        resultContainer.appendChild(pokemonElement);
    });
}
