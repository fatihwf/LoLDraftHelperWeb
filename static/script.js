let championList = [];
let blueBans = [];
let redBans = [];
let bluePicks = [];
let redPicks = [];
let selectionOrder = [
    'blue', 'red', 'red', 'blue', 'blue', 'red',
    'Red Ban4', 'Blue Ban4', 'Red Ban5', 'Blue Ban5',
    'red', 'blue', 'blue', 'red'
];
let currentSelection = 0;
let pickCounter = {
    'blue': 0,
    'red': 0
};

document.addEventListener('DOMContentLoaded', function() {
    // Sunucudan şampiyon listesini al
    fetch('/get_champion_list')
    .then(response => response.json())
    .then(data => {
        championList = data.championList;
        
        // İlk ban giriş alanlarına otomatik tamamlama uygula
        autocomplete(document.getElementById('blue-ban1'), championList);
        autocomplete(document.getElementById('blue-ban2'), championList);
        autocomplete(document.getElementById('blue-ban3'), championList);
        autocomplete(document.getElementById('red-ban1'), championList);
        autocomplete(document.getElementById('red-ban2'), championList);
        autocomplete(document.getElementById('red-ban3'), championList);
    });
});

function startDraft() {
    blueBans.push(document.getElementById('blue-ban1').value.toLowerCase());
    blueBans.push(document.getElementById('blue-ban2').value.toLowerCase());
    blueBans.push(document.getElementById('blue-ban3').value.toLowerCase());
    redBans.push(document.getElementById('red-ban1').value.toLowerCase());
    redBans.push(document.getElementById('red-ban2').value.toLowerCase());
    redBans.push(document.getElementById('red-ban3').value.toLowerCase());

    document.getElementById('draft-stage').style.display = 'none';
    document.getElementById('selection-stage').style.display = 'block';
    updateSelectionStatus();
    nextSelection();
}

function updateSelectionStatus() {
    const blueBansHTML = blueBans.map(champ => `<span>${champ}</span>`).join(', ');
    const redBansHTML = redBans.map(champ => `<span>${champ}</span>`).join(', ');
    const bluePicksHTML = bluePicks.map(champ => `<span>${champ}</span>`).join(', ');
    const redPicksHTML = redPicks.map(champ => `<span>${champ}</span>`).join(', ');

    document.getElementById('selection-status').innerHTML = `
        <div class="flex-item blue-background">
            <h3>Blue Bans:</h3>
            ${blueBansHTML}
        </div>
        <div class="flex-item red-background">
            <h3>Red Bans:</h3>
            ${redBansHTML}
        </div>
        <div class="flex-item blue-background">
            <h3>Blue Picks:</h3>
            ${bluePicksHTML}
        </div>
        <div class="flex-item red-background">
            <h3>Red Picks:</h3>
            ${redPicksHTML}
        </div>
    `;
}

function nextSelection() {
    if (currentSelection >= selectionOrder.length) {
        summarize();
        return;
    }

    let side = selectionOrder[currentSelection];

    document.getElementById('selection-prompts').innerHTML = `
        <div class="loading">Loading...</div>
    `;

    // currentSelection'ı burada artırıyoruz
    currentSelection++;

    setTimeout(() => {
        if (side.includes('Ban')) {
            promptBanSelection(side);
        } else {
            fetchPrediction(side.toLowerCase());
        }
    }, 300);
}

function promptBanSelection(side) {
    let promptText = side + ':';
    document.getElementById('selection-prompts').innerHTML = `
        <div class="autocomplete">
            <label for="selection">${promptText}</label>
            <input type="text" id="selection" autocomplete="off">
        </div>
    `;

    // Otomatik tamamlama fonksiyonunu çağır
    autocomplete(document.getElementById('selection'), championList);

    // Enter tuşuna basıldığında butonu tıklamayı tetikler
    document.getElementById('selection').addEventListener('keyup', function (event) {
        if (event.key === 'Enter') {
            document.getElementById('next-selection-button').click();
        }
    });

    document.getElementById('next-selection-button').onclick = () => {
        let selection = document.getElementById('selection').value.toLowerCase();
        if (side.toLowerCase().includes('blue')) {
            blueBans.push(selection);
        } else {
            redBans.push(selection);
        }
        updateSelectionStatus();
        nextSelection();
    };
}

function fetchPrediction(side) {
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            blue_bans: blueBans,
            red_bans: redBans,
            blue_picked: bluePicks,
            red_picked: redPicks,
            side: side
        })
    })
    .then(response => response.json())
    .then(data => {
        pickCounter[side]++;
        let pickCount = pickCounter[side];
        let sideCap = side.charAt(0).toUpperCase() + side.slice(1);

        // Burada skorları ve şampiyonları ayarlıyoruz
        let general = data.general.join('<br>');
        let synergy = data.synergy.join('<br>');
        let counter = data.counter.join('<br>');

        document.getElementById('selection-prompts').innerHTML = `
            <div class="autocomplete">
                <label for="selection">${sideCap} ${pickCount}. Pick:</label>
                <input type="text" id="selection" autocomplete="off">
            </div>
            <div>
                <strong>General Recommendation:</strong><br>${general}<br>
                <strong>Synergic Recommendation:</strong><br>${synergy}<br>
                <strong>Counter Recommendation:</strong><br>${counter}<br>
            </div>
        `;

        // Otomatik tamamlama fonksiyonunu çağır
        autocomplete(document.getElementById('selection'), championList);

        // Enter tuşuna basıldığında butonu tıklamayı tetikler
        document.getElementById('selection').addEventListener('keyup', function (event) {
            if (event.key === 'Enter') {
                document.getElementById('next-selection-button').click();
            }
        });

        document.getElementById('next-selection-button').onclick = () => {
            let selection = document.getElementById('selection').value.toLowerCase();
            if (side === 'blue') {
                bluePicks.push(selection);
            } else {
                redPicks.push(selection);
            }
            updateSelectionStatus();
            nextSelection();
        };
    });
}

function summarize() {
    document.getElementById('selection-stage').style.display = 'none';
    document.getElementById('summary-stage').style.display = 'block';

    let selectedHTML = `
        <h3>Blue Bans:</h3>
        <p>${blueBans.join(', ')}</p>
        <h3>Red Bans:</h3>
        <p>${redBans.join(', ')}</p>
        <h3>Blue Picks:</h3>
        <p>${bluePicks.join(', ')}</p>
        <h3>Red Picks:</h3>
        <p>${redPicks.join(', ')}</p>
    `;

    document.getElementById('selected-champions').innerHTML = selectedHTML;
}

function resetDraft() {
    blueBans = [];
    redBans = [];
    bluePicks = [];
    redPicks = [];
    currentSelection = 0;
    pickCounter = {'blue': 0, 'red': 0};

    document.getElementById('summary-stage').style.display = 'none';
    document.getElementById('draft-stage').style.display = 'block';
}

function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener('input', function() {
        let a, b, i, val = this.value.toLowerCase();

        /* Önceki açılmış öneri listelerini kapat */
        closeAllLists();
        if (!val) return false;
        currentFocus = -1;

        /* Öneri öğelerini içerecek bir div oluştur */
        a = document.createElement('div');
        a.setAttribute('id', this.id + '-autocomplete-list');
        a.setAttribute('class', 'autocomplete-items');

        /* Öneri listesini giriş alanının ebeveynine ekle */
        this.parentNode.appendChild(a);

        /* Dizi içindeki her öğe için... */
        for (i = 0; i < arr.length; i++) {
            /* Öğenin, girilen değerle başladığını kontrol et */
            if (arr[i].substr(0, val.length).toLowerCase() == val) {
                /* Eşleşen öğe için bir div oluştur */
                b = document.createElement('div');
                b.innerHTML = '<strong>' + arr[i].substr(0, val.length) + '</strong>';
                b.innerHTML += arr[i].substr(val.length);
                /* Mevcut öğenin değerini tutan gizli bir input ekle */
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";

                /* Öğeye tıklandığında ne olacağını tanımla */
                b.addEventListener('click', function(e) {
                    /* Seçilen değeri giriş alanına aktar */
                    inp.value = this.getElementsByTagName('input')[0].value;
                    /* Açık olan tüm öneri listelerini kapat */
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    /* Klavye tuşları ile gezinmeyi yönet */
    inp.addEventListener('keydown', function(e) {
        let x = document.getElementById(this.id + '-autocomplete-list');
        if (x) x = x.getElementsByTagName('div');
        if (e.keyCode == 40) {
            /* Aşağı tuşu */
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            /* Yukarı tuşu */
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            /* Enter tuşu */
            e.preventDefault();
            if (currentFocus > -1) {
                /* Mevcut öğe varsa, tıklayın */
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;

        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;

        x[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove('autocomplete-active');
        }
    }

    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                if (x[i] && x[i].parentNode) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
    }

    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}
