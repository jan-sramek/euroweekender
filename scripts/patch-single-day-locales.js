const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'flight-search', 'frontend', 'src', 'locales');
const navLabels = {
  cs: 'Jednodenní výlety',
  sk: 'Jednodňové výlety',
  de: 'Tagesausflüge',
  fr: "Excursions d'une journée",
  es: 'Excursiones de un día',
  it: 'Gite di un giorno',
  pl: 'Wycieczki jednodniowe',
  nl: 'Eendaagse trips',
  pt: 'Viagens de um dia',
  hu: 'Egynapos utak',
  ro: 'Excursii de o zi',
  bg: 'Еднодневни пътувания',
  uk: 'Одноденні поїздки',
  ru: 'Однодневные поездки',
  el: 'Ημερήσιες εκδρομές',
  tr: 'Tek günlük geziler',
  fi: 'Päiväretket',
  sv: 'Dagsresor',
  no: 'Dagsreiser',
  da: 'Dagsrejser',
  lt: 'Vienos dienos kelionės',
  lv: 'Vienas dienas braucieni',
  et: 'Ühepäevareisid',
  is: 'Dagsferðir'
};
const meta = {
  title: 'Single Day Trips in Europe',
  description:
    'Find same-day European flights that leave in the morning and return in the evening — city day trips without an overnight stay.'
};
const page = {
  tagline: 'Out morning · back evening',
  title: 'Single day trips across Europe',
  subtitle: 'Same-day return flights for a full day in another city',
  lead: 'Leave after breakfast, explore a European city, and fly home the same evening — no hotel, no overnight.',
  travelDay: 'Travel day',
  travelDayHint: 'Pick one or more days for morning-out / evening-back trips',
  selectDays: 'Select travel days',
  dayTripTag: 'Day trip',
  scheduleSummary: 'Morning out · evening back',
  daysCount: '{{count}} days',
  noFlights:
    'No same-day trips found for the selected days yet. Try other dates or departure airports — day-trip offers are still being collected.'
};

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const lang = file.replace('.json', '');
  const full = path.join(dir, file);
  const j = JSON.parse(fs.readFileSync(full, 'utf8'));
  j.nav = j.nav || {};
  j.nav.singleDayTrips = j.nav.singleDayTrips || navLabels[lang] || 'Single day trips';
  j.meta = j.meta || {};
  j.meta.singleDayTrips = j.meta.singleDayTrips || meta;
  j.singleDayTrips = j.singleDayTrips || page;
  fs.writeFileSync(full, JSON.stringify(j, null, 2) + '\n');
  console.log('ok', file);
}
