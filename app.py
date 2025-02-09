
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def check_roles(picked):


    picked_roles = []
    all_roles = ["top","jg","mid","adc","sup"]
    role_list = {
        "top" : 0,
        "jg" : 0,
        "mid" : 0,
        "adc" : 0,
        "sup" : 0
    }
    x=0
    for champ in picked:
        roles = get_role(champ)
        for role in roles:
            x = (1 / len(roles))
            role_list[role] += x

    role_list = dict(sorted(role_list.items(), key = lambda x:x[1],reverse = True))
    for role,value in role_list.items():
        if value >= 1:
            picked_roles.append(role)
            x = value - 1
            role_list[role] = -99
            break
    for role,value in role_list.items():
        role_list[role] += x
        if x+value >= 1:
            picked_roles.append(role)
            role_list[role] = -99

    non_picked = [item for item in all_roles if item not in picked_roles]
    return non_picked

def get_role(champ):
    # Şampiyon ismini küçük harflere çeviriyoruz
    champ = champ.lower()

    # DATA_DIR değişkenini kullanarak dosya yolunu belirliyoruz
    path = DATA_DIR
    roles = []

    # Şampiyon klasörünün yolunu oluşturuyoruz
    champ_folder_path = os.path.join(path, champ)

    # Şampiyon klasörü mevcut mu kontrol ediyoruz
    if not os.path.isdir(champ_folder_path):
        # Eğer klasör yoksa, boş liste döndürüyoruz
        return roles

    # Şampiyon klasöründeki dosyaları tarıyoruz
    for file in os.listdir(champ_folder_path):
        if file.endswith("-role.txt"):
            file_path = os.path.join(champ_folder_path, file)
            # Role dosyasını açıp rolleri okuyoruz
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    parts = line.strip().split(',')
                    roles.extend(parts)
            # Role dosyasını bulduktan sonra döngüden çıkıyoruz
            break

    return roles

def add(champ,mylist):
    champ = champ.lower()
    mylist.append(champ)

def find_max_play_count():
    path = DATA_DIR
    max_play_count = -1

    # Klasörler içinde gez
    for folder in os.listdir(path):

        folder_path = os.path.join(path, folder)

        if os.path.isdir(folder_path):  # Sadece klasörleri kontrol et
            # Klasör içindeki dosyaları tara
            for file in os.listdir(folder_path):
                if file.endswith("-data.txt"):  # Sadece -data.txt ile biten dosyaları işle
                    file_path = os.path.join(folder_path, file)

                    with open(file_path, 'r', encoding='utf-8') as f:
                        total = 0


                        for line in f:
                            parts = line.strip().split(',')
                            if parts[0] == folder:
                                champ, w, l = parts[0], int(parts[1]), int(parts[2])
                                total += w + l
                                break

                        if total > max_play_count:
                            max_play_count = total

    return max_play_count



def get_synergy_score(champ,picked):
    if len(picked) == 0:
        return 0

    path = DATA_DIR
    max_played_with_count = 0.001
    synergy_score = 0
    for folder in os.listdir(path):
        if folder == champ:
            folder_path = os.path.join(path, folder)
            for file in os.listdir(folder_path):
                if file.endswith("-data.txt"):
                    file_path = os.path.join(folder_path, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            parts = line.strip().split(',')
                            name,w,l = parts[0],int(parts[1]),int(parts[2])
                            if name == champ:
                                continue
                            x = w+l
                            if x > max_played_with_count:
                                max_played_with_count = x


                    with open(file_path, 'r', encoding='utf-8') as f:
                        for ally in picked:

                            for line in f:
                                parts = line.strip().split(',')
                                name,w,l = parts[0],int(parts[1]),int(parts[2])
                                if name == ally:
                                    synergy_score += (w/(w+l)) * ((w+l)/max_played_with_count)

    return (synergy_score / len(picked))

def get_counter_score(champ,picked):
    if len(picked) == 0:
        return 0

    path = DATA_DIR
    max_played_against_count = 0.001
    counter_score = 0
    for folder in os.listdir(path):
        if folder == champ:
            folder_path = os.path.join(path, folder)
            for file in os.listdir(folder_path):
                if file.endswith("-data2.txt"):
                    file_path = os.path.join(folder_path, file)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            parts = line.strip().split(',')
                            name, w, l = parts[0], int(parts[1]), int(parts[2])
                            if name == champ:
                                continue
                            x = w + l
                            if x > max_played_against_count:
                                max_played_against_count = x

                    with open(file_path, 'r', encoding='utf-8') as f:
                        for ally in picked:

                            for line in f:
                                parts = line.strip().split(',')
                                name, w, l = parts[0], int(parts[1]), int(parts[2])
                                if name == ally:
                                    counter_score += (w / (w + l)) * ((w + l) / max_played_against_count)

    return (counter_score / len(picked))


def get_winrate_score(champ):
    path = DATA_DIR
    print("DATA_DIR:", DATA_DIR)
    print("Champion:", champ)
    print("Folders in DATA_DIR:", os.listdir(DATA_DIR))

    for folder in os.listdir(path):
        print(folder)
        if folder.lower() == champ.lower():
            folder_path = os.path.join(path, folder)
            for file in os.listdir(folder_path):
                if file.endswith("-data.txt"):
                    file_path = os.path.join(folder_path, file)
                    with open(file_path, 'r', encoding='utf-8') as f:

                        for line in f:
                            parts = line.strip().split(',')
                            if parts[0].lower() == champ.lower():
                                w = int(parts[1])
                                l = int(parts[2])
                                winrate_score = (w / (w+l)) * ((w+l) / (find_max_play_count()))
                                break
                        
            
    return winrate_score


def check_same_position_score(champ,best,points):
    roles = get_role(champ)
    points_to_add = 0
    for i in range(len(best)):
        name,points_other = best[i]
        if name == champ:
            continue
        if set(roles) & set(get_role(name)):
            points_to_add = points - points_other
            if points_to_add < 0:
                points_to_add = 0
            break
    return points_to_add


@app.route('/get_champion_list', methods=['GET'])
def get_champion_list():
    path = DATA_DIR

    # Klasör isimlerini okuyarak şampiyon listesini oluşturun
    champion_list = [folder for folder in os.listdir(path)]

    return jsonify({'championList': champion_list})

def predict_red(blue_bans, red_bans, blue_picked, red_picked):

    path = DATA_DIR
    best_general = []
    best_synergy = []
    best_counter = []
    for folder in os.listdir(path):
            if folder not in blue_bans and folder not in red_bans and folder not in blue_picked and folder not in red_picked:
                if set(get_role(folder)) & set(check_roles(red_picked)):
                    synergy_score = get_synergy_score(folder, red_picked)
                    best_synergy.append((folder, synergy_score))
                    counter_score = get_counter_score(folder, blue_picked)
                    best_counter.append((folder, counter_score))
                    winrate_score = get_winrate_score(folder)
                    general_points = synergy_score/3 + counter_score/3 + winrate_score
                    best_general.append((folder, general_points))
    best_general.sort(key=lambda x: x[1], reverse=True)
    best_synergy.sort(key=lambda x: x[1], reverse=True)
    best_counter.sort(key=lambda x: x[1], reverse=True)
    for i in range(len(best_general)):
        name, points = best_general[i]
        points += check_same_position_score(name, best_general, points)
        best_general[i] = (name, points)
    best_general.sort(key=lambda x: x[1], reverse=True)

    general_recommendations = [f"{i + 1}.: {best_general[i]}" for i in range(5)]
    synergetic_recommendations = [f"{i + 1}.: {best_synergy[i]}" for i in range(3)]
    counter_recommendations = [f"{i + 1}.: {best_counter[i]}" for i in range(3)]

    return general_recommendations, synergetic_recommendations, counter_recommendations

def predict_blue(blue_bans, red_bans, blue_picked, red_picked):
    path = DATA_DIR

    best_general = []
    best_synergy = []
    best_counter = []
    for folder in os.listdir(path):
            if folder not in blue_bans and folder not in red_bans and folder not in blue_picked and folder not in red_picked:
                if set(get_role(folder)) & set(check_roles(blue_picked)):
                    synergy_score = get_synergy_score(folder, blue_picked)
                    best_synergy.append((folder, synergy_score))

                    counter_score = get_counter_score(folder, red_picked)
                    best_counter.append((folder, counter_score))

                    winrate_score = get_winrate_score(folder)
                    general_points = synergy_score + counter_score + winrate_score
                    best_general.append((folder, general_points))

    best_general.sort(key=lambda x: x[1], reverse=True)
    best_synergy.sort(key=lambda x: x[1], reverse=True)
    best_counter.sort(key=lambda x: x[1], reverse=True)

    for i in range(len(best_general)):
        name, points = best_general[i]
        points += check_same_position_score(name, best_general, points)
        best_general[i] = (name, points)

    best_general.sort(key=lambda x: x[1], reverse=True)

    general_recommendations = [f"{i + 1}.: {best_general[i]}" for i in range(5)]
    synergetic_recommendations = [f"{i + 1}.: {best_synergy[i]}" for i in range(3)]
    counter_recommendations = [f"{i + 1}.: {best_counter[i]}" for i in range(3)]

    return general_recommendations, synergetic_recommendations, counter_recommendations

def extract_champion_and_score(recommendations):
    extracted = []
    for rec in recommendations:
        parts = rec.split(": ", 1)  # İlk ": " kısmına göre böl
        if len(parts) == 2:
            index = parts[0]  # Sıra numarasını al
            champ_score = parts[1].strip("()")  # Parantezleri temizle
            champ_parts = champ_score.rsplit(" ", 1)  # Son boşluğa göre böl
            if len(champ_parts) == 2:
                champion, score = champ_parts
                try:
                    extracted.append(f"{index}: {champion} ({float(score):.2f})")
                except ValueError:
                    pass  # Eğer skoru float'a çeviremezsek hatayı yok say
    return extracted

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    blue_bans = data['blue_bans']
    red_bans = data['red_bans']
    blue_picked = data['blue_picked']
    red_picked = data['red_picked']
    side = data['side']

    if side == 'blue':
        general, synergy, counter = predict_blue(blue_bans, red_bans, blue_picked, red_picked)
    else:
        general, synergy, counter = predict_red(blue_bans, red_bans, blue_picked, red_picked)

    general = extract_champion_and_score(general)
    synergy = extract_champion_and_score(synergy)
    counter = extract_champion_and_score(counter)

    return jsonify({"status": "success", "general": general, "synergy": synergy, "counter": counter})



if __name__ == '__main__':
    app.run(debug=True)
