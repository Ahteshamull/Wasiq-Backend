const fs = require('fs');
const path = require('path');

// 1. Array from popularStoppages.ts
const targetPopular = [
  // Level 1
  { name: "Cliffs of Moher", level: 1 },
  { name: "Killarney National Park", level: 1 },
  { name: "Brú na Bóinne", level: 1 },
  { name: "Blarney Castle", level: 1 },
  { name: "Rock of Cashel", level: 1 },
  { name: "Sean's Bar", level: 1 },
  { name: "Irish National Stud & Gardens", level: 1 },
  { name: "Kylemore Abbey", level: 1 },
  { name: "Giant's Causeway", level: 1 },
  { name: "Slieve League", level: 1 },

  // Level 2
  { name: "Kilkenny Castle", level: 2 },
  { name: "Doolin", level: 2 },
  { name: "Limerick", level: 2 },
  { name: "Adare", level: 2 },
  { name: "Bunratty Castle & Folk Park", level: 2 },
  { name: "Gap of Dunloe", level: 2 },
  { name: "Hillsborough Castle and Gardens", level: 2 },
  { name: "Clifden", level: 2 },
  { name: "The Dark Hedges", level: 2 },
  { name: "Slea Head Drive", level: 2 },
  { name: "Glendalough", level: 2 },
  { name: "Trim Castle", level: 2 },
  { name: "Powerscourt Estate", level: 2 },
  { name: "Titanic Belfast", level: 2 },
  { name: "Rock of Dunamase", level: 2 },
  { name: "Dunluce Castle", level: 2 },
  { name: "Knock Shrine", level: 2 },
  { name: "Croagh Patrick", level: 2 },
  { name: "Cong Abbey", level: 2 },
  { name: "Athlone Castle", level: 2 },
  { name: "Donegal Castle", level: 2 },
  { name: "The Burren National Park", level: 2 },
  { name: "Connemara National Park", level: 2 },
  { name: "Carrick-a-Rede Rope Bridge", level: 2 },
  { name: "Cahir Castle", level: 2 },
  { name: "Marble Arch Caves", level: 2 },
  { name: "Clonmacnoise", level: 2 },
  { name: "Irish National Heritage Park", level: 2 },
  { name: "Kildare Village", level: 2 },
  { name: "Game of Thrones Studio Tour", level: 2 },
  { name: "Tollymore Forest Park", level: 2 },
  { name: "Carlingford", level: 2 },
  { name: "Monasterboice", level: 2 },
  { name: "Galway", level: 2 },

  // Level 3
  { name: "St Mary's Cathedral", level: 3 },
  { name: "Trinity College Dublin", level: 3 },
  { name: "King John's Castle", level: 3 },
  { name: "Cobh", level: 3 },
  { name: "Kilkenny", level: 3 },
  { name: "Guinness Storehouse", level: 3 },
  { name: "Kinsale", level: 3 },
  { name: "English Market", level: 3 },
  { name: "Dunguaire Castle", level: 3 },
  { name: "Mitchelstown Cave", level: 3 },
  { name: "Temple Bar", level: 3 },
  { name: "Poulnabrone Dolmen", level: 3 },
  { name: "Torc Waterfall", level: 3 },
  { name: "Cork", level: 3 },
  { name: "Holy Cross Abbey", level: 3 },
  { name: "Ferns Castle", level: 3 },
  { name: "Midleton Distillery Experience", level: 3 },
  { name: "Stormont Estate", level: 3 },
  { name: "Altamont Gardens", level: 3 },
  { name: "Antrim Castle Gardens", level: 3 },
  { name: "Waterford", level: 3 },
  { name: "Irish Military War Museum", level: 3 },
  { name: "Botanic Gardens", level: 3 },
  { name: "Belfast City Hall", level: 3 },
  { name: "Florence Court", level: 3 },
  { name: "Arigna Mining Experience", level: 3 },
  { name: "Athenry Castle", level: 3 },
  { name: "Castlebar", level: 3 },
  { name: "Downpatrick", level: 3 },
  { name: "Keem Bay", level: 3 },
  { name: "Westport", level: 3 },
  { name: "Malin Head", level: 3 },
  { name: "Derryglad Folk Museum", level: 3 },
  { name: "Tullamore D.E.W. Distillery", level: 3 },
  { name: "Birr Castle Demesne", level: 3 },
  { name: "Muckross House", level: 3 },
  { name: "Glencar Waterfall", level: 3 },
  { name: "Ladies View", level: 3 },
  { name: "Mizen Head", level: 3 },
  { name: "Muckross Abbey", level: 3 },
  { name: "Ross Castle", level: 3 },
  { name: "Charles Fort", level: 3 },
  { name: "Peace Walls", level: 3 },
  { name: "Hook Lighthouse", level: 3 },
  { name: "Benbulben", level: 3 },
  { name: "Mussenden Temple", level: 3 },
  { name: "Ballintoy Harbour", level: 3 },
  { name: "Cushendun Caves", level: 3 },
  { name: "Fanad Head Lighthouse", level: 3 },
  { name: "Wicklow Mountains National Park", level: 3 },
  { name: "Galway Cathedral", level: 3 },
  { name: "Ulster American Folk Park", level: 3 },

  // Level 4
  { name: "Killarney", level: 4 },
  { name: "Swiss Cottage", level: 4 },
  { name: "Medieval Mile Museum", level: 4 },
  { name: "Crag Cave", level: 4 },
  { name: "St Canice's Cathedral", level: 4 },
  { name: "Castletown House", level: 4 },
  { name: "Kilmainham Gaol", level: 4 },
  { name: "Aillwee Burren Experience", level: 4 },
  { name: "Howth", level: 4 },
  { name: "Russborough House", level: 4 },
  { name: "Wexford", level: 4 },
  { name: "Crumlin Road Gaol", level: 4 },
  { name: "Terra Nova Fairy Garden", level: 4 },
  { name: "The Donkey Sanctuary", level: 4 },
  { name: "St Patrick's Cathedral", level: 4 },
  { name: "Christ Church Cathedral", level: 4 },
  { name: "Phoenix Park", level: 4 },
  { name: "Hill of Tara", level: 4 },
  { name: "National Botanic Gardens", level: 4 },
  { name: "Fota Wildlife Park", level: 4 },
  { name: "Jerpoint Abbey", level: 4 },
  { name: "Dublin Castle", level: 4 },
  { name: "EPIC The Irish Emigration Museum", level: 4 },
  { name: "Malahide Castle", level: 4 },
];

const sourcePath = path.join(__dirname, '..', 'src', 'app', 'modules', 'Stoppage', 'popularStoppagesWithCoords.json');
const rawData = fs.readFileSync(sourcePath, 'utf8');
const popularStoppages = JSON.parse(rawData);

// Special manual mappings for names that differ slightly
const manualMappings = {
  "Brú na Bóinne": "Newgrange",
  "Powerscourt Estate": "Powerscourt house and gardens",
  "St Mary's Cathedral": "Saint Mary's Cathedral",
  "Trinity College Dublin": "Trinity College & Book of Kells",
  "Keem Bay": "Keem Beach",
  "Derryglad Folk Museum": "Derryglad Folk & Heritage Museum",
  "Peace Walls": "Belfast Peace Wall"
};

const alignedList = [];

for (const target of targetPopular) {
  // Check manual mapping first
  const mappedSourceName = manualMappings[target.name];
  
  let matchIndex = -1;
  if (mappedSourceName) {
    matchIndex = popularStoppages.findIndex(item => item.name === mappedSourceName);
  }
  
  // If not matched via manual mapping, try standard close matching
  if (matchIndex === -1) {
    function normalize(str) {
      return str.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace('and', '')
        .replace('city', '')
        .replace('town', '')
        .replace('gardens', 'garden')
        .replace('cliffs', 'cliff')
        .trim();
    }
    const normTarget = normalize(target.name);
    
    matchIndex = popularStoppages.findIndex(item => {
      const normName = normalize(item.name);
      const normGoogle = normalize(item.googleName || '');
      return normName === normTarget || normGoogle === normTarget || normName.includes(normTarget) || normTarget.includes(normName);
    });
  }

  if (matchIndex !== -1) {
    const matchedItem = popularStoppages[matchIndex];
    // Rename the user-friendly "name" property to match popularStoppages.ts exactly!
    matchedItem.name = target.name;
    matchedItem.level = target.level;
    alignedList.push(matchedItem);
    
    // Remove from source array to avoid duplicate matching
    popularStoppages.splice(matchIndex, 1);
  } else {
    console.log(`Could not find match for target: "${target.name}"`);
  }
}

// For remaining items (like Kildare City), let's keep them and append them at the end.
console.log(`Matched and aligned: ${alignedList.length} items.`);
console.log(`Extra items appended at the end: ${popularStoppages.length} items.`);

const finalResult = [...alignedList, ...popularStoppages];

// Write formatted JSON back to file
fs.writeFileSync(sourcePath, JSON.stringify(finalResult, null, 2), 'utf8');
console.log(`Successfully updated and aligned popularStoppagesWithCoords.json!`);
