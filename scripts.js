function pokeApi(url, ...args) {
    return fetch(`https://filestore.pythonanywhere.com/${url}`, ...args)
}

function getPokes() {
    pokeApi('/pokes/')
        .then(response => response.json())
        .then(data => {
            const pokeList = document.getElementById('list');
            pokeList.innerHTML = ''; // Clear existing list

            data.data.forEach(poke => {
                const listItem = document.createElement('li');
                listItem.textContent = poke;

                // Create a delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Remove';
                deleteButton.style.marginLeft = '10px';
                deleteButton.onclick = function() {
                    deletePoke(poke);
                };

                listItem.appendChild(deleteButton);
                pokeList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching pokes:', error);
        });
}

// Function to add a new poke
function addPoke() {
    const pokeName = document.getElementById('pokeName').value;

    if (pokeName) {
        pokeApi(`/pokes/add/?name=${encodeURIComponent(pokeName)}`, { method: 'GET' })
            .then(response => {
                if (response.status === 201) {
                    document.getElementById('pokeName').value = ''; // Clear input field
                    getPokes(); // Refresh the list
                } else {
                    alert('Failed to add poke. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error adding poke:', error);
            });
    } else {
        alert('Please enter a poke name.');
    }
}

// Function to delete a poke
function deletePoke(pokeName) {
    pokeApi(`/pokes/delete/?name=${encodeURIComponent(pokeName)}`, { method: 'DELETE' })
        .then(response => {
            if (response.status === 200) {
                getPokes(); // Refresh the list
            } else {
                alert('Failed to delete poke.');
            }
        })
        .catch(error => {
            console.error('Error deleting poke:', error);
        });
}

// Fetch pokes on page load
document.addEventListener('DOMContentLoaded', getPokes);
