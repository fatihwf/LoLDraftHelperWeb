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

// Yeni global değişkenler
let isFearlessMode = false;
let fearlessPickedChampions = []; // Tüm maçlardan seçilen şampiyonlar

// Champion listesini sunucudan al
document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_champion_list')
    .then(response => response.json())
    .then(data => {
        championList = data.championList;
        // İlk ban giriş alanlarında autocomplete ayarlanıyor.
        autocomplete(document.getElementById('blue-ban1'), getAvailableChampions());
        autocomplete(document.getElementById('blue-ban2'), getAvailableChampions());
        autocomplete(document.getElementById('blue-ban3'), getAvailableChampions());
        autocomplete(document.getElementById('red-ban1'), getAvailableChampions());
        autocomplete(document.getElementById('red-ban2'), getAvailableChampions());
        autocomplete(document.getElementById('red-ban3'), getAvailableChampions());
    });
});

/**
 * Kullanıcının mod seçimini yapması.
 * Classic seçilirse klasik akış, Fearless seçilirse fearless akış başlatılır.
 */
function chooseMode(mode) {
    if (mode === 'classic') {
        document.getElementById('mode-stage').style.display = 'none';
        document.getElementById('draft-stage').style.display = 'block';
    } else if (mode === 'fearless') {
        isFearlessMode = true;
        document.getElementById('mode-stage').style.display = 'none';
        // Fearless mod için picked listesi alanını göster
        document.getElementById('fearless-picked-champions').style.display = 'block';
        document.getElementById('draft-stage').style.display = 'block';
    }
}

/**
 * Fearless modda mevcut kullanılabilir şampiyon listesini döndürür.
 * (Daha önce seçilmiş şampiyonlar hariç)
 */
function getAvailableChampions() {
    if (isFearlessMode) {
        return championList.filter(champ => !fearlessPickedChampions.includes(champ.toLowerCase()));
    }
    return championList;
}

/**
 * Şampiyon ismine göre splash art URL'si oluşturur.
 */
let specialChampionsFile = ["ksante" ,"jarvaniv","kogmaw","leesin","missfortune","renataglasc","tahmkench","twistedfate","xinzhao","wukong"];
let specialChampionsURL  = ["KSante","JarvanIV","KogMaw","LeeSin","MissFortune","Renata","TahmKench","TwistedFate","XinZhao","MonkeyKing"];

function getChampionImageUrl(champ) {
    let index = specialChampionsFile.indexOf(champ);
    let champName;
    
    if (index !== -1) {
        champName = specialChampionsURL[index];
    } else {
        champName = champ.charAt(0).toUpperCase() + champ.slice(1);
    }
    
    return `https://ddragon.leagueoflegends.com/cdn/15.3.1/img/champion/${champName}.png`;
}

/**
 * Draft başlamadan önce banların alınması.
 */
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

/**
 * Seçim (ban & pick) listelerini günceller.
 */
function updateSelectionStatus() {
    const blueBansHTML = blueBans.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    const redBansHTML = redBans.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    const bluePicksHTML = bluePicks.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;           
    }).join('');

    const redPicksHTML = redPicks.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    document.getElementById('selection-status').innerHTML = `
      <div class="flex-item blue-background"><h3>Blue Bans:</h3>${blueBansHTML}</div>
      <div class="flex-item red-background"><h3>Red Bans:</h3>${redBansHTML}</div>
      <div class="flex-item blue-background"><h3>Blue Picks:</h3>${bluePicksHTML}</div>
      <div class="flex-item red-background"><h3>Red Picks:</h3>${redPicksHTML}</div>
    `;
}

/**
 * Bir sonraki seçim için adım.
 */
function nextSelection() {
    if (currentSelection >= selectionOrder.length) {
        summarize();
        return;
    }

    let side = selectionOrder[currentSelection];
    document.getElementById('selection-prompts').innerHTML = `<div class="loading">Loading...</div>`;
    
    currentSelection++;

    setTimeout(() => {
        if (side.includes('Ban')) {
            promptBanSelection(side);
        } else {
            fetchPrediction(side.toLowerCase());
        }
    }, 300);
}

/**
 * Ban seçimleri için kullanıcıya input kutusu sunar.
 * Fearless modda autocomplete, mevcut kullanılabilir şampiyon listesini kullanır.
 */
function promptBanSelection(side) {
    let promptText = side + ':';
    document.getElementById('selection-prompts').innerHTML = `
      <div class="autocomplete">
        <label for="selection">${promptText}</label>
        <input type="text" id="selection" autocomplete="off">
      </div>
    `;
        
    // Fearless modda mevcut kullanılabilir şampiyonları geçiriyoruz.
    autocomplete(document.getElementById('selection'), getAvailableChampions());

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

/**
 * Pick seçimlerinde sunucu tahminini aldıktan sonra input kutusu oluşturur.
 * Fearless modda autocomplete, mevcut kullanılabilir şampiyon listesini kullanır.
 */
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
            fearless_picked: fearlessPickedChampions,
            side: side
        })
    })
    .then(response => response.json())
    .then(data => {
        pickCounter[side]++;
        let pickCount = pickCounter[side];
        let sideCap = side.charAt(0).toUpperCase() + side.slice(1);

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

        autocomplete(document.getElementById('selection'), getAvailableChampions());

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

/**
 * Maç sonu özet ekranı.
 * Eğer fearless moddaysak, bu maçta seçilen şampiyonlar global diziye ekleniyor
 * ve fearless-picked-champions alanı güncelleniyor.
 */
function summarize() {
    document.getElementById('selection-stage').style.display = 'none';
    document.getElementById('summary-stage').style.display = 'block';

    const blueBansHTML = blueBans.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    const redBansHTML = redBans.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    const bluePicksHTML = bluePicks.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    const redPicksHTML = redPicks.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item">
                  <img src="${imgUrl}" alt="${champName}" class="champion-img">
                  <span>${champName}</span>
                </div>`;
    }).join('');

    let selectedHTML = `
      <h3>Blue Bans:</h3>
      <div>${blueBansHTML}</div>
      <h3>Red Bans:</h3>
      <div>${redBansHTML}</div>
      <h3>Blue Picks:</h3>
      <div>${bluePicksHTML}</div>
      <h3>Red Picks:</h3>
      <div>${redPicksHTML}</div>
    `;

    document.getElementById('selected-champions').innerHTML = selectedHTML;

    // Fearless modda, maçda seçilen tüm şampiyonları (ban ve pick) global diziye ekle
    if (isFearlessMode) {
        let matchSelected = [...bluePicks, ...redPicks];
        matchSelected.forEach(champ => {
            let champLower = champ.toLowerCase();
            if (!fearlessPickedChampions.includes(champLower)) {
                fearlessPickedChampions.push(champLower);
            }
        });
        updateFearlessPickedChampionsDisplay();
    }
}

/**
 * Fearless Picked Champions alanını günceller.
 */
function updateFearlessPickedChampionsDisplay() {
    const container = document.getElementById('fearless-picked-champions-list');
    container.innerHTML = fearlessPickedChampions.map(champ => {
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-image">
                    <img src="${imgUrl}" alt="${champ}" class="champion-img">
                </div>`;
    }).join('');
}

/**
 * Reset fonksiyonu:
 * Classic modda tüm draft sıfırlanırken, fearless modda sadece maça ait diziler sıfırlanır.
 * (Fearless modda önceki maçların seçimi korunur.)
 */
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

/**
 * Otomatik tamamlama fonksiyonu (değişmeyen kısım).
 */
function autocomplete(inp, arr) {
    inp.addEventListener('input', function() {
        let a, b, i, val = this.value.toLowerCase();
        closeAllLists();
        if (!val) return false;
        
        a = document.createElement('div');
        a.setAttribute('id', this.id + '-autocomplete-list');
        a.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(a);
    
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toLowerCase() === val) {
                b = document.createElement('div');
                let imgUrl = getChampionImageUrl(arr[i].toLowerCase());
                b.innerHTML = "<img src='" + imgUrl + "' class='autocomplete-champion-img'>" +
                              "<span><strong>" + arr[i].substr(0, val.length) + "</strong>" +
                              arr[i].substr(val.length) + "</span>" +
                              "<input type='hidden' value='" + arr[i] + "'>";
    
                b.addEventListener('click', function(e) {
                    inp.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                    inp.focus();
                });
                a.appendChild(b);
            }
        }
    });
    
    inp.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            let x = document.getElementById(this.id + '-autocomplete-list');
            if (x) {
                x = x.getElementsByTagName('div');
                if (x.length > 0) {
                    x[0].click();
                }
            }
        }
    });
    
    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
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
