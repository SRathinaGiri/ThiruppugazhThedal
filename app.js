// --- Wait for the app to be fully loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Data Storage ---
    let allSongs = [];
    let allPlaces = [];
    let allSongPlaces = [];
    let allOtherBooks = {};
    let favorites = []; // NEW: Array to hold favorite song IDs

    // --- Agaram (Alphabetical) Data ---
    const agaramData = {
        "உயிரெழுத்து": ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ"],
        "க": ["க", "கா", "கி", "கீ", "கு", "கூ", "கெ", "கே", "கை", "கொ", "கோ"],
        "ச": ["ச", "சா", "சி", "சீ", "சு", "சூ", "செ", "சே", "சை", "சொ", "சோ"],
        "ஞ": ["ஞா"],
        "த": ["த", "தா", "தி", "தீ", "து", "தெ", "தே", "தை", "தொ", "தோ"],
        "ந": ["ந", "நா", "நி", "நீ", "நூ", "நெ", "நே"],
        "ப": ["ப", "பா", "பி", "பு", "பூ", "பெ", "பே", "பை", "பொ", "போ"],
        "ம": ["ம", "மா", "மி", "மு", "மூ", "மெ", "மே", "மை", "மொ", "மோ"],
        "வ": ["வ", "வா", "வி", "வீ", "வெ", "வே", "வை"]
    };

    // --- Other Books Data ---
    const otherBooksMap = {
        "கந்தர் அனுபூதி": "anuboothi.json",
        "கந்தர் அந்தாதி": "anthathi.json",
        "கந்தர் அலங்காரம்": "alangkaram.json",
        "மயில் விருத்தம்": "mayilvirutham.json",
        "சேவல் விருத்தம்": "sevalvirutham.json",
        "வேல் விருத்தம்": "velvirutham.json",
        "திருவகுப்பு": "vaguppu.json"
    };

    // --- UI Element References ---
    const placesSelect = document.getElementById('places-select');
    const placeSongsSelect = document.getElementById('place-songs-select');
    const agaramGroupSelect = document.getElementById('agaram-group-select');
    const agaramLetterSelect = document.getElementById('agaram-letter-select');
    const agaramSongSelect = document.getElementById('agaram-song-select'); // NEW
    const otherBooksSelect = document.getElementById('other-books-select');
    const otherBookSongSelect = document.getElementById('other-book-song-select');
    const resultsContainer = document.getElementById('results-container');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-filters-button');
    const searchBox = document.getElementById('search-box');
    const songNumberInput = document.getElementById('song-number-input');
    // --- Theme, Panel, and Favorites UI References ---
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const toggleFiltersButton = document.getElementById('toggle-filters-button');
    const overlay = document.getElementById('overlay');
    const favsSelect = document.getElementById('favs-select'); // NEW
    const favCheckboxContainer = document.getElementById('fav-checkbox-container'); // NEW
    const favCheckbox = document.getElementById('fav-checkbox'); // NEW
    const showAboutButton = document.getElementById('show-about-button'); // NEW    

    
    // --- 1. Main Initialization Function ---
    async function initializeApp() {
        console.log("App initializing...");
        registerServiceWorker();
        loadTheme();
        setupEventListeners();
        loadFavorites(); // NEW
        
        await loadAllData();
        
        populatePlacesFilter();
        populateAgaramFilter();
        populateOtherBooksFilter();
        populateFavoritesDropdown(); // NEW
        
        
        clearResults();
    }

    // --- 2. Data Loading ---
    async function loadAllData() {
        console.log("Loading all JSON data...");
        try {
            const fetchJSON = async (url) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                return response.json();
            };

            [allSongs, allPlaces, allSongPlaces] = await Promise.all([
                fetchJSON('songs.json'),
                fetchJSON('places.json'),
                fetchJSON('songplaces.json')
            ]);
            
            for (const [name, file] of Object.entries(otherBooksMap)) {
                allOtherBooks[name] = await fetchJSON(file);
            }
            console.log("All data loaded.");
        } catch (error) {
            console.error("Error loading initial data:", error);
            resultsContainer.innerHTML = "<p> பிழை: செயலித் தரவை ஏற்ற முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.</p>";
        }
    }

    // --- 3. Filter Population ---
    function populatePlacesFilter() {
        allPlaces.sort((a, b) => a.placeid - b.placeid);
        placesSelect.innerHTML = '<option value="">-- தலம் தேர்ந்தெடு --</option>';
        allPlaces.forEach(place => {
            const option = document.createElement('option');
            option.value = place.placeid;
            option.textContent = place.place;
            placesSelect.appendChild(option);
        });
    }

    function populateAgaramFilter() {
        agaramGroupSelect.innerHTML = '<option value="">-- வகை தேர்ந்தெடு --</option>';
        for (const groupName of Object.keys(agaramData)) {
            const option = document.createElement('option');
            option.value = groupName;
            option.textContent = groupName;
            agaramGroupSelect.appendChild(option);
        }
    }

    function populateOtherBooksFilter() {
        otherBooksSelect.innerHTML = '<option value="">-- நூல் தேர்ந்தெடு --</option>';
        for (const bookName of Object.keys(otherBooksMap)) {
            const option = document.createElement('option');
            option.value = bookName;
            option.textContent = bookName;
            otherBooksSelect.appendChild(option);
        }
    }

    // --- 4. Event Listeners ---
    function setupEventListeners() {
        
        // Panel Toggle Logic
        toggleFiltersButton.addEventListener('click', () => document.body.classList.toggle('panel-visible'));
        overlay.addEventListener('click', () => document.body.classList.remove('panel-visible'));
        
        // Theme Toggle
        themeToggleButton.addEventListener('click', toggleTheme);

        // Agaram Linked Dropdowns
        agaramGroupSelect.addEventListener('change', populateAgaramLetterDropdown);
        agaramLetterSelect.addEventListener('change', populateAgaramSongDropdown); // UPDATED
        agaramSongSelect.addEventListener('change', displaySelectedAgaramSong); // NEW
        
        // Places Linked Dropdowns
        placesSelect.addEventListener('change', populatePlaceSongsDropdown);
        placeSongsSelect.addEventListener('change', displaySelectedPlaceSong);
        
        // Other Books Linked Dropdowns
        otherBooksSelect.addEventListener('change', populateOtherBookSongsDropdown);
        otherBookSongSelect.addEventListener('change', displaySelectedOtherBookSong);

        // Search/Reset Buttons
        searchButton.addEventListener('click', () => {
            performSearch();
            closePanel();
        });
        clearButton.addEventListener('click', clearAllFilters);
        showAboutButton.addEventListener('click', () => {
            displayAboutPage();
            closePanel(); // Close panel after clicking
        });        
        
        // Favorites Dropdown & Checkbox
        favsSelect.addEventListener('change', displaySelectedFavorite); // NEW
        favCheckbox.addEventListener('change', handleFavoriteToggle); // NEW
    }
    
    // --- 5. Filter/Render Functions ---

    // --- Places Functions ---
    function populatePlaceSongsDropdown() {
        const placeId = placesSelect.value;
        placeSongsSelect.innerHTML = '<option value="">-- பாடல் தேர்ந்தெடு --</option>';
        resultsContainer.innerHTML = "";
        
        if (placeId) {
            clearAllFilters(false);
            placesSelect.value = placeId;
            
            placeSongsSelect.disabled = false;
            const songIds = allSongPlaces.filter(sp => sp.placeid == placeId).map(sp => sp.songid);
            const placeSongs = allSongs.filter(song => songIds.includes(song.songid));
            placeSongs.sort((a, b) => a.songonly.localeCompare(b.songonly, 'ta')); 
            
            placeSongs.forEach(song => {
                const option = document.createElement('option');
                const preview = song.songonly.split('<br>')[0].substring(0, 100);
                option.value = song.songid;
                option.textContent = preview;
                placeSongsSelect.appendChild(option);
            });
            renderSongs(placeSongs);
        } else {
            placeSongsSelect.disabled = true;
            placeSongsSelect.innerHTML = '<option value="">-- முதலில் தலம் தேர்ந்தெடு --</option>';
            clearResults();
        }
        closePanel();
    }

    function displaySelectedPlaceSong() {
        const songId = placeSongsSelect.value;
        if (songId) {
            const selectedSong = allSongs.find(song => song.songid == songId);
            if (selectedSong) renderSongs([selectedSong]);
        } else {
            populatePlaceSongsDropdown();
        }
        closePanel();
    }
    
    // --- Agaram Functions (UPDATED) ---
    function populateAgaramLetterDropdown() {
        const selectedGroup = agaramGroupSelect.value;
        agaramLetterSelect.innerHTML = '<option value="">-- எழுத்து தேர்ந்தெடு --</option>';
        agaramLetterSelect.disabled = true;
        agaramSongSelect.innerHTML = '<option value="">-- முதலில் எழுத்து தேர்ந்தெடு --</option>';
        agaramSongSelect.disabled = true;
        
        if (selectedGroup && agaramData[selectedGroup]) {
            agaramLetterSelect.disabled = false;
            agaramData[selectedGroup].forEach(letter => {
                const option = document.createElement('option');
                option.value = letter;
                option.textContent = letter;
                agaramLetterSelect.appendChild(option);
            });
        }
        clearResults();
    }

    function populateAgaramSongDropdown() {
        const agaramLetter = agaramLetterSelect.value;
        agaramSongSelect.innerHTML = '<option value="">-- பாடல் தேர்ந்தெடு --</option>';
        resultsContainer.innerHTML = "";

        if (agaramLetter) {
            clearAllFilters(false);
            agaramGroupSelect.value = agaramGroupSelect.value; // Keep group
            agaramLetterSelect.value = agaramLetter; // Keep letter
            
            agaramSongSelect.disabled = false;
            const agaramSongs = allSongs.filter(song => song.songonly && song.songonly.startsWith(agaramLetter));

            agaramSongs.sort((a, b) => a.songonly.localeCompare(b.songonly, 'ta'));
            
            agaramSongs.forEach(song => {
                const option = document.createElement('option');
                const preview = song.songonly.split('<br>')[0].substring(0, 100);
                option.value = song.songid;
                option.textContent = preview;
                agaramSongSelect.appendChild(option);
            });
            renderSongs(agaramsongs);
        } else {
            agaramSongSelect.disabled = true;
            agaramSongSelect.innerHTML = '<option value="">-- முதலில் எழுத்து தேர்ந்தெடு --</option>';
            clearResults();
        }
        closePanel();
    }
    
    function displaySelectedAgaramSong() {
        const songId = agaramSongSelect.value;
        if (songId) {
            const selectedSong = allSongs.find(song => song.songid == songId);
            if (selectedSong) renderSongs([selectedSong]);
        } else {
            populateAgaramSongDropdown();
        }
        closePanel();
    }

    // --- Other Books Functions ---
    function populateOtherBookSongsDropdown() {
        const bookName = otherBooksSelect.value;
        otherBookSongSelect.innerHTML = '<option value="">-- பாடல் தலைப்பு தேர்ந்தெடு --</option>';
        resultsContainer.innerHTML = "";

        if (bookName) {
            clearAllFilters(false);
            otherBooksSelect.value = bookName;
            
            otherBookSongSelect.disabled = false;
            const bookSongs = allOtherBooks[bookName] || [];
            
            bookSongs.forEach((song, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = song.songtitle;
                otherBookSongSelect.appendChild(option);
            });
            renderSongs(bookSongs);
        } else {
            otherBookSongSelect.disabled = true;
            otherBookSongSelect.innerHTML = '<option value="">-- முதலில் நூல் தேர்ந்தெடு --</option>';
            clearResults();
        }
        closePanel();
    }
    
    function displaySelectedOtherBookSong() {
        const bookName = otherBooksSelect.value;
        const songIndex = otherBookSongSelect.value;

        if (bookName && (songIndex !== "")) {
            const selectedSong = allOtherBooks[bookName][songIndex];
            if (selectedSong) renderSongs([selectedSong]);
        } else if (bookName) {
            populateOtherBookSongsDropdown();
        }
        closePanel();
    }

    // --- Main Search Function (UPDATED) ---
    function performSearch() {
        let filteredResults = [];

        // 1. READ VALUES FIRST
        const searchTerm = searchBox.value.trim();
        const songNumber = songNumberInput.value;

        // 2. CLEAR ALL OTHER FILTERS
        clearAllFilters(false); 

        // 3. RESTORE ACTIVE VALUES
        searchBox.value = searchTerm;
        songNumberInput.value = songNumber;
        
        // 4. FILTER PRIORITY
        if (songNumber) {
             filteredResults = allSongs.filter(song => song.songid == songNumber);
        
        } else if (searchTerm) {
            filteredResults = allSongs.filter(song =>
                (song.songonly && song.songonly.includes(searchTerm)) ||
                (song.song && song.song.includes(searchTerm))
            );
        } else {
            clearResults();
            return;
        }
        renderSongs(filteredResults);
    }
    
    // --- Render & Clear Functions (UPDATED) ---
    function renderSongs(songs) {
        resultsContainer.innerHTML = ""; // Clear old results

        // --- UPDATED Checkbox Logic ---
        let showCheckbox = false; // Start assuming we hide it
        if (songs.length === 1 && songs[0] && songs[0].songid && typeof songs[0].songid === 'number' && songs[0].songid > 0) { 
        showCheckbox = true; // Check songs[0] exists
            showCheckbox = true;
            const song = songs[0];
            const songId = song.songid;
            favCheckbox.checked = favorites.includes(songId);
            favCheckbox.dataset.songid = songId;
        }

        // Explicitly add or remove the 'hidden' class
        if (showCheckbox) {
            favCheckboxContainer.classList.remove('hidden');
        } else {
            favCheckboxContainer.classList.add('hidden');
        }
        // --- End of Updated Logic ---


        if (songs.length === 0) {
            resultsContainer.innerHTML = "<p style='padding: 20px; text-align: center;'>முடிவுகள் எதுவும் கிடைக்கவில்லை.</p>";
            return;
        }

        // Render the song cards (this part is unchanged)
        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';

            let title = 'பாடல்';
            if (song.songtitle) {
                title = song.songtitle;
            } else if (song.songonly) {
                title = song.songonly.split('<br>')[0];
            } else if (song.song) { // Add check if song exists
                title = song.song.substring(0, 100) + "...";
            }

            const content = song.song ? song.song.replace(/<br>/g, '\n') : ''; // Add check if song exists

            card.innerHTML = `
                <div class="song-title">${title}</div>
                <pre class="song-content">${content}</pre>
            `;
            resultsContainer.appendChild(card);
        });
    }

    function clearResults() {
        resultsContainer.innerHTML = "<p style='padding: 20px; text-align: center;'>தேடல் வகையை இடது பக்கத்தில் தேர்ந்தெடுக்கவும்.</p>";
        favCheckboxContainer.classList.add('hidden'); // Ensure it's hidden when results are cleared
    }
    
    function clearAllFilters(runClearResults = true) {
        console.log("Clearing all filters.");
        placesSelect.value = "";
        placeSongsSelect.value = "";
        placeSongsSelect.disabled = true;
        agaramGroupSelect.value = "";
        agaramLetterSelect.value = "";
        agaramLetterSelect.disabled = true;
        agaramSongSelect.value = ""; // NEW
        agaramSongSelect.disabled = true; // NEW
        otherBooksSelect.value = "";
        otherBookSongSelect.value = "";
        otherBookSongSelect.disabled = true;
        favsSelect.value = ""; // NEW
        searchBox.value = "";
        songNumberInput.value = "";
        
        if (runClearResults) {
            clearResults();
        }
    }
    
    // --- NEW: Favorites Functions ---
    function loadFavorites() {
        favorites = JSON.parse(localStorage.getItem('thiruppugazhFavorites')) || [];
        console.log(`Loaded ${favorites.length} favorites.`);
    }

    function saveFavorites() {
        localStorage.setItem('thiruppugazhFavorites', JSON.stringify(favorites));
        console.log("Favorites saved.");
        populateFavoritesDropdown(); // Refresh the dropdown
    }
    
    function populateFavoritesDropdown() {
        favsSelect.innerHTML = '<option value="">-- பாடலைத் தேர்ந்தெடு --</option>';
        if (favorites.length === 0) return;
        
        const favSongs = allSongs.filter(song => favorites.includes(song.songid));
        favSongs.sort((a, b) => a.songonly.localeCompare(b.songonly, 'ta'));
        
        favSongs.forEach(song => {
            const option = document.createElement('option');
            const preview = song.songonly.split('<br>')[0].substring(0, 100);
            option.value = song.songid;
            option.textContent = preview;
            favsSelect.appendChild(option);
        });
    }

    function displaySelectedFavorite() {
        const songId = favsSelect.value;
        if (songId) {
            clearAllFilters(false);
            favsSelect.value = songId; // Restore this filter
            const selectedSong = allSongs.find(song => song.songid == songId);
            if (selectedSong) renderSongs([selectedSong]);
        } else {
            clearResults();
        }
        closePanel();
    }
    
    function handleFavoriteToggle() {
        const songId = parseInt(favCheckbox.dataset.songid);
        if (!songId) return;

        if (favCheckbox.checked) {
            // Add to favorites
            if (!favorites.includes(songId)) {
                favorites.push(songId);
            }
        } else {
            // Remove from favorites
            favorites = favorites.filter(id => id !== songId);
        }
        saveFavorites();
    }
    function loadTheme() {
        try {
            const currentTheme = localStorage.getItem('theme') || 'light';
            if (currentTheme === 'dark') {
                document.body.classList.add('dark');
            }
            updateThemeButton(currentTheme);
        } catch (error) {
            console.error("Error inside loadTheme:", error); // Log C: Catch errors
        }
    }


    function toggleTheme() {
        let isDark = document.body.classList.toggle('dark');
        let newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    }

    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeToggleButton.textContent = "பின்னணி நிறம்: வெளிர்";
        } else {
            themeToggleButton.textContent = "பின்னணி நிறம்: அடர்";
        }
    }
    
    // --- Helper function to close panel ---
    function closePanel() {
        // Always close the panel, regardless of screen size
        document.body.classList.remove('panel-visible');
    }
    async function displayAboutPage() {
        clearAllFilters(false); // Clear filters but not results yet
        resultsContainer.innerHTML = "<p>Loading...</p>"; // Show loading message
        favCheckboxContainer.classList.add('hidden'); // Hide fav checkbox

        // Determine which HTML file to load based on the current theme
        const isDark = document.body.classList.contains('dark');
        const aboutFile = isDark ? 'about_dark.html' : 'about_light.html';

        try {
            const response = await fetch(aboutFile);
            if (!response.ok) throw new Error(`Failed to load ${aboutFile}`);
            const htmlContent = await response.text();

            // Inject the fetched HTML content into the results container
            resultsContainer.innerHTML = htmlContent;

            // --- IMPORTANT: Add event listeners for links AFTER loading HTML ---
            // Find all links within the loaded content
            const links = resultsContainer.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (event) => {
                    const url = link.getAttribute('href');
                    // Check if it's an external link (http) or mailto
                    if (url && (url.startsWith('http') || url.startsWith('mailto:'))) {
                        event.preventDefault(); // Stop the default navigation
                        window.open(url, '_blank'); // Open in a new tab/external app
                        console.log(`Opened external link: ${url}`);
                    }
                    // Allow internal links (if any) to navigate normally
                });
            });

        } catch (error) {
            console.error("Error loading About page:", error);
            resultsContainer.innerHTML = "<p> பிழை: தகவல் பக்கத்தை ஏற்ற முடியவில்லை.</p>";
        }
    }    
    
    // --- 6. Service Worker ---
    // --- 6. Service Worker ---
    function registerServiceWorker() {
        console.log(">>> Entering registerServiceWorker function..."); // Log D
        try {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then(() => console.log('Service Worker Registered'))
                    .catch(err => console.error('Service Worker Registration Failed:', err));
            } else {
                console.log("Service Worker not supported in this browser.");
            }
        } catch (error) {
            console.error("Error inside registerServiceWorker:", error); // Log F: Catch errors
        }
        console.log("<<< Exiting registerServiceWorker function."); // Log E
    }

    // --- Start the app! ---
    initializeApp();
});