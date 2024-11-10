document.addEventListener('DOMContentLoaded', function () {
    // Fetch types from the API to cache them when the app is online
    fetchTypes();
});

function fetchTypes() {
    fetch('https://pokeapi.co/api/v2/type')
        .then(response => response.json())
        .then(data => {
            // Here, we can cache individual types dynamically
            const types = data.results;
            types.forEach(type => {
                fetch(`https://pokeapi.co/api/v2/type/${type.name}`).then(res => {
                    return res.json();
                }).then(typeData => {
                    caches.open('pokemon-damage-calculator-v2').then(cache => {
                        cache.put(`https://pokeapi.co/api/v2/type/${type.name}`, new Response(JSON.stringify(typeData)));
                    });
                });
            });
        })
        .catch(err => {
            console.error('Failed to fetch types:', err);
        });
}


// script.js

// Load types into the dropdowns
async function loadTypes() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/type');
        const data = await response.json();
        const typeList = data.results.map(type => type.name);

        // Populate the attack type dropdown
        const attackTypeSelect = document.getElementById('attack-type');
        typeList.forEach(type => {
            let option = new Option(type.charAt(0).toUpperCase() + type.slice(1), type);
            attackTypeSelect.add(option);
        });
    } catch (error) {
        console.error("Failed to load types from PokeAPI", error);
    }
}

// Add a new target type dropdown
function addTargetType() {
    const targetTypesContainer = document.getElementById('target-types-container');
    const select = document.createElement('select');
    select.className = 'target-type';
    
    // Populate each target type dropdown with all available types
    document.querySelectorAll('#attack-type option').forEach(option => {
        select.add(new Option(option.text, option.value));
    });

    targetTypesContainer.appendChild(select);
}

// Calculate damage based on effectiveness
async function calculateDamage() {
    const attackType = document.getElementById('attack-type').value;
    const baseDamage = parseFloat(document.getElementById('base-damage').value);

    // Get all selected target types
    const targetTypeElements = document.querySelectorAll('.target-type');
    const targetTypes = Array.from(targetTypeElements).map(select => select.value);

    try {
        // Fetch effectiveness for the selected attack type
        const response = await fetch(`https://pokeapi.co/api/v2/type/${attackType}`);
        const data = await response.json();

        // Function to find effectiveness against a target type
        const getMultiplier = (targetType) => {
            if (data.damage_relations.double_damage_to.some(type => type.name === targetType)) return 2;
            if (data.damage_relations.half_damage_to.some(type => type.name === targetType)) return 0.5;
            if (data.damage_relations.no_damage_to.some(type => type.name === targetType)) return 0;
            return 1; // Neutral damage if no specific relation exists
        };

        // Calculate total multiplier across all target types
        const totalMultiplier = targetTypes.reduce((multiplier, targetType) => {
            return multiplier * getMultiplier(targetType);
        }, 1);

        const finalDamage = baseDamage * totalMultiplier;

        // Display result
        document.getElementById('result').innerHTML = `
            <h2>Result</h2>
            <p>Attack Type: ${attackType}</p>
            <p>Target Types: ${targetTypes.join(', ')}</p>
            <p>Base Damage: ${baseDamage}</p>
            <p>Effectiveness Multiplier: ${totalMultiplier}x</p>
            <p>Final Damage: ${finalDamage}</p>
        `;
    } catch (error) {
        console.error("Error calculating damage", error);
    }
}

// Initialize types on page load
document.addEventListener('DOMContentLoaded', loadTypes);
