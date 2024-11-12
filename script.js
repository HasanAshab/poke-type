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

    // Append the select and remove button to the container
    targetTypeContainer.appendChild(targetTypeSelect);
    targetTypeContainer.appendChild(removeButton);

    // Add the new container to the target types section
    document.getElementById('target-type-selects').appendChild(targetTypeContainer);
}

// Calculate damage based on effectiveness
async function calculateDamage() {
    const attackType = document.getElementById('attack-type').value;
    const baseDamage = parseFloat(document.getElementById('base-damage').value);

    // Get all selected target types
    const targetTypeElements = document.querySelectorAll('.target-type-select');
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
        let totalMultiplier = targetTypes.reduce((multiplier, targetType) => {
            return multiplier * getMultiplier(targetType);
        }, 1);
        if (totalMultiplier > 2) {
            totalMultiplier = 2
        }

        const finalDamage = baseDamage * totalMultiplier;
        // Display result
        document.getElementById('result').innerHTML = `
            <h2>Its ${getEffectiveness(totalMultiplier)}</h2>
            <p>Damage: ${finalDamage}</p>
        `;
    } catch (error) {
        console.error("Error calculating damage", error);
    }
}

function getEffectiveness(totalMultiplier) {
    if (totalMultiplier === 0) {
        return "Immune";
    } else if (totalMultiplier < 0.5) {
        return "Ultra Ineffective";
    } else if (totalMultiplier < 1) {
        return "Not Very Effective";
    } else if (totalMultiplier === 1) {
        return "Effective";
    } else if (totalMultiplier > 1 && totalMultiplier <= 2) {
        return "Super Effective";
    } else if (totalMultiplier > 2) {
        return "Ultra Effective";
    }
}

function getClosestLevel(level) {
    // Round down to the nearest multiple of 5
    return Math.floor(level / 5) * 5;
}

function calculateTotalHP() {
    const baseHP = parseFloat(document.getElementById('base-hp').value);
    const level = parseInt(document.getElementById('pokemon-level').value);

    if (isNaN(baseHP) || isNaN(level)) {
        document.getElementById('hp-result').textContent = "Please enter valid Base HP and Level.";
        return;
    }

    const closestLevel = getClosestLevel(level);
    const levelHealth = (0.10 * baseHP) * closestLevel;
    const totalHP = baseHP + levelHealth;

    document.getElementById('hp-result').textContent = `Total HP: ${totalHP}`;
}


// Initialize types on page load
document.addEventListener('DOMContentLoaded', loadTypes);
