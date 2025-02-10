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

/**
 * Verilen şampiyon ismine göre splash art URL'sini oluşturur.
 * Şampiyon ismi: örn. "ahri" → "Ahri"
 */

let specialChampionsFile = ["ksante" ,"jarvaniv","kogmaw","leesin","missfortune","renataglasc","tahmkench","twistedfate","xinzhao","wukong"];  // Örnek: dosyadaki yazılış
let specialChampionsURL  = ["KSante","JarvanIV","KogMaw","LeeSin","MissFortune","Renata","TahmKench","TwistedFate","XinZhao","MonkeyKing"];


function getChampionImageUrl(champ) {
    // Giriş değerini küçük harfe çevirip kontrol ediyoruz.
    

    let index = specialChampionsFile.indexOf(champ);
    let champName;
    
    if (index !== -1) {
        // Eğer şampiyon problemli listede bulunuyorsa, URL için özel yazımı kullan.
        champName = specialChampionsURL[index];
    } else {
        // Aksi durumda, ilk harfi büyük hale getir.
        champName = champ.charAt(0).toUpperCase() + champ.slice(1);
    }
    
    let url = `https://ddragon.leagueoflegends.com/cdn/15.3.1/img/champion/${champName}.png`;
    
    return url;
}





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
 * Ban ve pick listelerini günceller; her şampiyon için görsel ve isim gösterilir.
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
        return `<div class="champion-item"><img src="${imgUrl}" alt="${champName}" class="champion-img"><span>${champName}</span></div>`;           
    }).join('');

    const redPicksHTML = redPicks.map(champ => {
        let champName = champ.charAt(0).toUpperCase() + champ.slice(1);
        let imgUrl = getChampionImageUrl(champ);
        return `<div class="champion-item"><img src="${imgUrl}" alt="${champName}" class="champion-img"><span>${champName}</span></div>`;
                    
    }).join('');

    document.getElementById('selection-status').innerHTML = `<div class="flex-item blue-background"><h3>Blue Bans:</h3>${blueBansHTML}</div><div class="flex-item red-background"><h3>Red Bans:</h3>${redBansHTML}</div><div class="flex-item blue-background"><h3>Blue Picks:</h3>${bluePicksHTML}</div><div class="flex-item red-background"><h3>Red Picks:</h3>${redPicksHTML}</div>`;

            

}

function nextSelection() {
    if (currentSelection >= selectionOrder.length) {
        summarize();
        return;
    }

    let side = selectionOrder[currentSelection];

    document.getElementById('selection-prompts').innerHTML = `<div class="loading">Loading...</div>`;
        
    

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
    document.getElementById('selection-prompts').innerHTML = `<div class="autocomplete"><label for="selection">${promptText}</label><input type="text" id="selection" autocomplete="off"></div>`;
        

    // Otomatik tamamlama fonksiyonunu çağır
    autocomplete(document.getElementById('selection'), championList);

    // Enter tuşuna basıldığında buton tıklamasını tetikle
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

        // Öneri verilerini alıyoruz
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

        // Enter tuşuna basıldığında buton tıklamasını tetikle
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
    // Artık ok tuşlarıyla gezinme için currentFocus değişkenine gerek yok
    // let currentFocus;

    // Input alanına yazı girildiğinde öneri listesini oluşturur.
    inp.addEventListener('input', function() {
        let a, b, i, val = this.value.toLowerCase();
        closeAllLists();
        if (!val) return false;
        
        // Öneri listesini içerecek bir div oluştur
        a = document.createElement('div');
        a.setAttribute('id', this.id + '-autocomplete-list');
        a.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(a);
    
        // Dizideki her bir eleman için
        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toLowerCase() === val) {
                // Eşleşen öğe için bir div oluştur
                b = document.createElement('div');
                let imgUrl = getChampionImageUrl(arr[i].toLowerCase());
                b.innerHTML = "<img src='" + imgUrl + "' class='autocomplete-champion-img'>" +
                              "<span><strong>" + arr[i].substr(0, val.length) + "</strong>" +
                              arr[i].substr(val.length) + "</span>" +
                              "<input type='hidden' value='" + arr[i] + "'>";
    
                // Tıklanırsa, inputa değeri aktarır ve öneri listesini kapatır
                b.addEventListener('click', function(e) {
                    inp.value = this.getElementsByTagName('input')[0].value;
                    closeAllLists();
                    inp.focus(); // Seçim sonrası input odakta kalsın
                });
                a.appendChild(b);
            }
        }
    });
    
    // Sadece Enter tuşu için bir handler ekliyoruz; ok tuşlarıyla gezinme kaldırıldı.
    inp.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            let x = document.getElementById(this.id + '-autocomplete-list');
            if (x) {
                x = x.getElementsByTagName('div');
                // Eğer listede en az bir öğe varsa, ilk öğeyi seçelim
                if (x.length > 0) {
                    x[0].click();
                }
            }
        }
    });
    
    // Açık olan tüm öneri listelerini kapatır
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
    
    // Sayfada herhangi bir yere tıklandığında öneri listesini kapatır
    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}


