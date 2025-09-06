document.addEventListener('DOMContentLoaded', async () => {
    const dateDropdownContainer = document.getElementById('date-dropdown-container');
    const selectedDate = document.getElementById('selected-date');
    const dateOptions = document.getElementById('date-options');
    const customSelectTrigger = dateDropdownContainer.querySelector('.custom-select__trigger');

    async function getJsonFiles() {
        try {
            const response = await fetch('file_manifest.json');
            const files = await response.json();
            return files;
        } catch (error) {
            console.error('Could not load file manifest:', error);
            return []; // Return empty array on error
        }
    }

    const jsonFiles = await getJsonFiles();
    jsonFiles.sort().reverse(); // Sort by date, newest first

    // --- Populate Custom Dropdown ---
    jsonFiles.forEach(file => {
        const option = document.createElement('div');
        option.classList.add('custom-option');
        option.textContent = file.replace('netflix_top10_', ''); // Make it cleaner
        option.dataset.value = file;
        dateOptions.appendChild(option);

        option.addEventListener('click', () => {
            selectedDate.textContent = option.textContent;
            dateDropdownContainer.classList.remove('open');
            // Remove 'selected' class from all options
            dateOptions.querySelectorAll('.custom-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // Add 'selected' class to the clicked option
            option.classList.add('selected');
            fetchAndDisplayData(option.dataset.value);
        });
    });

    // --- Custom Dropdown Logic ---
    customSelectTrigger.addEventListener('click', () => {
        dateDropdownContainer.classList.toggle('open');
    });

    window.addEventListener('click', (e) => {
        if (!dateDropdownContainer.contains(e.target)) {
            dateDropdownContainer.classList.remove('open');
        }
    });


    // --- Initial Load ---
    if (jsonFiles.length > 1) { // Check if there is a second option
        const secondOption = dateOptions.querySelectorAll('.custom-option')[1];
        if (secondOption) {
            selectedDate.textContent = secondOption.textContent;
            secondOption.classList.add('selected');
            fetchAndDisplayData(secondOption.dataset.value);
        }
    } else if (jsonFiles.length > 0) { // Fallback to the first option if only one exists
        const firstOption = dateOptions.querySelector('.custom-option');
        if (firstOption) {
            selectedDate.textContent = firstOption.textContent;
            firstOption.classList.add('selected');
            fetchAndDisplayData(firstOption.dataset.value);
        }
    }
});

async function fetchAndDisplayData(fileName) {
    try {
        const response = await fetch(`HTML_Json/${fileName}.json`);
        const jsonData = await response.json();
        
        const groupedData = groupAndSortData(jsonData);
        
        renderShelves(groupedData);

    } catch (error) {
        console.error('Error fetching or processing data:', error);
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = '<p style="color: red; text-align: center;">Could not load movie data.</p>';
    }
}

function groupAndSortData(data) {
    const grouped = data.reduce((acc, item) => {
        const group = item.groupfile || 'Uncategorized';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(item);
        return acc;
    }, {});

    for (const group in grouped) {
        grouped[group].sort((a, b) => parseInt(a.weeklyRank, 10) - parseInt(b.weeklyRank, 10));
        grouped[group] = grouped[group].slice(0, 10);
    }

    
    const shelfOrder = ['電影', '非英語電影', '節目', '非英語節目'];
    const sortedShelves = [];

    shelfOrder.forEach(groupTitle => {
        if (grouped[groupTitle]) {
            sortedShelves.push([groupTitle, grouped[groupTitle]]);
            delete grouped[groupTitle];
        }
    });

    for (const groupTitle in grouped) {
        sortedShelves.push([groupTitle, grouped[groupTitle]]);
    }

    return sortedShelves;
}

function renderShelves(sortedShelves) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = ''; // Clear previous content

    const displayTitles = {
        'films': '電影',
        'films-non-english': '非英語電影',
        'tv': '節目',
        'tv-non-english': '非英語節目'
    };

    sortedShelves.forEach(([groupTitle, movies]) => {
        const section = document.createElement('section');
        section.className = 'anime-section';

        const title = document.createElement('h1');
        title.className = 'section-title';
        title.textContent = displayTitles[groupTitle] || groupTitle.charAt(0).toUpperCase() + groupTitle.slice(1).replace(/_/g, ' ');

        const shelf = document.createElement('div');
        shelf.className = 'anime-shelf';

        movies.forEach(movie => {
            const animeItem = document.createElement('div');
            animeItem.className = 'anime-item';
            // *** 主要修改點：新增連結功能 ***

            // 1. 創建 <a> 標籤
            const link = document.createElement('a');
            link.href = `https://www.netflix.com/title/${movie.videoId}`;
            link.target = "_blank"; // 在新分頁打開
            link.style.textDecoration = 'none'; // 移除連結預設的底線


            const posterContainer = document.createElement('div');
            posterContainer.className = 'poster-container';

            const img = document.createElement('img');
            img.src = movie.bigImage || 'card.jpg';
            img.alt = movie.title;

            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'title-overlay';

            const animeTitle = document.createElement('p');
            animeTitle.className = 'anime-title';
            detail_3=movie.releaseYear
            animeTitle.textContent = `${movie.title} (${detail_3})`;

            const animeDetails = document.createElement('p');
            animeDetails.className = 'anime-details';
            const weeklyViews = parseInt(movie.weeklyViews);
            const cumulativeWeeksInTop10 = parseInt(movie.cumulativeWeeksInTop10);
            detail_1=""
            detail_2=""
            
            if (weeklyViews === 0) {
                const weeklyHoursViewedMillions = (parseInt(movie.weeklyHoursViewed) / 1000000).toFixed(1);
                detail_1=`觀賞時數 ${weeklyHoursViewedMillions}M 小時`
            } else{
                const weeklyViewsMillions = (weeklyViews / 1000000).toFixed(1);
                detail_1=`觀看次數 ${weeklyViewsMillions}M`
            }
            if (cumulativeWeeksInTop10===0){
                detail_2=`片長 ${movie.runtime_hmm}`
            }
            else{
                detail_2=`進榜週數 ${movie.cumulativeWeeksInTop10}`
            }
            animeDetails.textContent = `${detail_1} | ${detail_2}`;
            

            const rankNumber = document.createElement('div');
            rankNumber.className = 'rank-number';
            rankNumber.textContent = movie.weeklyRank;

            titleOverlay.appendChild(animeTitle);
            titleOverlay.appendChild(animeDetails);
            
            posterContainer.appendChild(rankNumber);
            posterContainer.appendChild(img);
            posterContainer.appendChild(titleOverlay);
            // 3. 將整個海報容器 (posterContainer) 放入 <a> 標籤內
            link.appendChild(posterContainer);

            // 4. 最後將帶有連結的整個組件放入 animeItem
            animeItem.appendChild(link);

            // animeItem.appendChild(posterContainer);
            shelf.appendChild(animeItem);
        });

        section.appendChild(title);
        section.appendChild(shelf);
        appContainer.appendChild(section);
    });
}
