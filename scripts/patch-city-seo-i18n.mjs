/**
 * Merge programmatic city SEO strings into all locale files.
 * Run: node scripts/patch-city-seo-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'flight-search', 'frontend', 'src', 'locales');

const EN = {
  meta: {
    notFound: {
      title: 'Page not found',
      description: 'The page you requested was not found on euroweekender.com.'
    },
    weekendFlightsFrom: {
      title: 'Weekend Flights from {{city}}',
      description:
        'Compare cheap European weekend flights from {{city}}. Fri–Sun city breaks without vacation days — find deals and book via Kiwi.com.'
    }
  },
  notFound: {
    title: 'Page not found',
    lead: 'That page does not exist or the city link is invalid.',
    backHome: 'Back to search'
  },
  weekendFlightsFrom: {
    tagline: 'Weekend flights from {{city}}',
    title: 'Cheap weekend flights from {{city}}',
    subtitle: 'City breaks from {{city}} without using vacation days',
    lead: 'Compare round-trip weekend flights from {{city}} across Europe — leave Friday evening, return Sunday.',
    seoTitle: 'Find weekend flight deals from {{city}}',
    seoBlock:
      'Search cheap weekend flights from {{city}} to cities across Europe. Filter Fri–Sun and other short trip patterns, compare prices, and book on Kiwi.com.',
    popularHubsTitle: 'Popular departure cities',
    seeAlsoCheapest: 'Find the cheapest weekend to a destination',
    seeAlsoDayTrips: 'Same-day city trips'
  }
};

/** @type {Record<string, typeof EN>} */
const patches = {
  en: EN,
  de: {
    meta: {
      notFound: {
        title: 'Seite nicht gefunden',
        description: 'Die angeforderte Seite wurde auf euroweekender.com nicht gefunden.'
      },
      weekendFlightsFrom: {
        title: 'Wochenendflüge ab {{city}}',
        description:
          'Vergleichen Sie günstige europäische Wochenendflüge ab {{city}}. Fr–So-Städtereisen ohne Urlaubstage — Angebote finden und über Kiwi.com buchen.'
      }
    },
    notFound: {
      title: 'Seite nicht gefunden',
      lead: 'Diese Seite existiert nicht oder der Stadtlink ist ungültig.',
      backHome: 'Zurück zur Suche'
    },
    weekendFlightsFrom: {
      tagline: 'Wochenendflüge ab {{city}}',
      title: 'Günstige Wochenendflüge ab {{city}}',
      subtitle: 'Städtereisen ab {{city}} ohne Urlaubstage',
      lead: 'Vergleichen Sie Hin- und Rückflüge fürs Wochenende ab {{city}} in ganz Europa — Freitagabend los, Sonntag zurück.',
      seoTitle: 'Wochenend-Flugangebote ab {{city}} finden',
      seoBlock:
        'Suchen Sie günstige Wochenendflüge ab {{city}} in europäische Städte. Filtern Sie Fr–So und andere Kurzmuster, vergleichen Sie Preise und buchen Sie auf Kiwi.com.',
      popularHubsTitle: 'Beliebte Abflugstädte',
      seeAlsoCheapest: 'Günstigstes Wochenende zu einem Ziel finden',
      seeAlsoDayTrips: 'Eintägige Städtetrips'
    }
  },
  fr: {
    meta: {
      notFound: {
        title: 'Page introuvable',
        description: 'La page demandée est introuvable sur euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Vols week-end depuis {{city}}',
        description:
          'Comparez des vols week-end économiques depuis {{city}}. City breaks ven–dim sans congés — trouvez des offres et réservez via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Page introuvable',
      lead: 'Cette page n’existe pas ou le lien ville est invalide.',
      backHome: 'Retour à la recherche'
    },
    weekendFlightsFrom: {
      tagline: 'Vols week-end depuis {{city}}',
      title: 'Vols week-end pas chers depuis {{city}}',
      subtitle: 'City breaks depuis {{city}} sans poser de congés',
      lead: 'Comparez les vols aller-retour week-end depuis {{city}} en Europe — départ vendredi soir, retour dimanche.',
      seoTitle: 'Trouver des offres week-end depuis {{city}}',
      seoBlock:
        'Recherchez des vols week-end pas chers depuis {{city}} vers des villes en Europe. Filtrez ven–dim et autres courts séjours, comparez les prix et réservez sur Kiwi.com.',
      popularHubsTitle: 'Villes de départ populaires',
      seeAlsoCheapest: 'Trouver le week-end le moins cher vers une destination',
      seeAlsoDayTrips: 'Escapades d’une journée'
    }
  },
  es: {
    meta: {
      notFound: {
        title: 'Página no encontrada',
        description: 'La página solicitada no se encontró en euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Vuelos de fin de semana desde {{city}}',
        description:
          'Compara vuelos de fin de semana baratos desde {{city}}. Escapadas vie–dom sin vacaciones — encuentra ofertas y reserva en Kiwi.com.'
      }
    },
    notFound: {
      title: 'Página no encontrada',
      lead: 'Esa página no existe o el enlace de la ciudad no es válido.',
      backHome: 'Volver a la búsqueda'
    },
    weekendFlightsFrom: {
      tagline: 'Vuelos de fin de semana desde {{city}}',
      title: 'Vuelos de fin de semana baratos desde {{city}}',
      subtitle: 'Escapadas desde {{city}} sin usar vacaciones',
      lead: 'Compara vuelos de ida y vuelta de fin de semana desde {{city}} por Europa — salida viernes por la noche, regreso domingo.',
      seoTitle: 'Encuentra ofertas de fin de semana desde {{city}}',
      seoBlock:
        'Busca vuelos de fin de semana baratos desde {{city}} a ciudades de Europa. Filtra vie–dom y otros patrones cortos, compara precios y reserva en Kiwi.com.',
      popularHubsTitle: 'Ciudades de salida populares',
      seeAlsoCheapest: 'Encuentra el fin de semana más barato a un destino',
      seeAlsoDayTrips: 'Escapadas de un día'
    }
  },
  it: {
    meta: {
      notFound: {
        title: 'Pagina non trovata',
        description: 'La pagina richiesta non è stata trovata su euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Voli weekend da {{city}}',
        description:
          'Confronta voli weekend economici da {{city}}. City break ven–dom senza ferie — trova offerte e prenota su Kiwi.com.'
      }
    },
    notFound: {
      title: 'Pagina non trovata',
      lead: 'Questa pagina non esiste o il link della città non è valido.',
      backHome: 'Torna alla ricerca'
    },
    weekendFlightsFrom: {
      tagline: 'Voli weekend da {{city}}',
      title: 'Voli weekend economici da {{city}}',
      subtitle: 'City break da {{city}} senza usare ferie',
      lead: 'Confronta voli andata e ritorno per il weekend da {{city}} in Europa — partenza venerdì sera, ritorno domenica.',
      seoTitle: 'Trova offerte weekend da {{city}}',
      seoBlock:
        'Cerca voli weekend economici da {{city}} verso città in Europa. Filtra ven–dom e altri pattern brevi, confronta i prezzi e prenota su Kiwi.com.',
      popularHubsTitle: 'Città di partenza popolari',
      seeAlsoCheapest: 'Trova il weekend più economico verso una destinazione',
      seeAlsoDayTrips: 'Gite di un giorno'
    }
  },
  pl: {
    meta: {
      notFound: {
        title: 'Nie znaleziono strony',
        description: 'Nie znaleziono żądanej strony na euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Loty weekendowe z {{city}}',
        description:
          'Porównuj tanie europejskie loty weekendowe z {{city}}. Wyjazdy pt–nd bez urlopu — znajdź oferty i rezerwuj przez Kiwi.com.'
      }
    },
    notFound: {
      title: 'Nie znaleziono strony',
      lead: 'Ta strona nie istnieje lub link do miasta jest nieprawidłowy.',
      backHome: 'Wróć do wyszukiwania'
    },
    weekendFlightsFrom: {
      tagline: 'Loty weekendowe z {{city}}',
      title: 'Tanie loty weekendowe z {{city}}',
      subtitle: 'City breaki z {{city}} bez urlopu',
      lead: 'Porównuj loty weekendowe w obie strony z {{city}} po Europie — wylot w piątek wieczorem, powrót w niedzielę.',
      seoTitle: 'Znajdź oferty lotów weekendowych z {{city}}',
      seoBlock:
        'Szukaj tanich lotów weekendowych z {{city}} do miast w Europie. Filtruj pt–nd i inne krótkie wzorce, porównuj ceny i rezerwuj na Kiwi.com.',
      popularHubsTitle: 'Popularne miasta wylotu',
      seeAlsoCheapest: 'Znajdź najtańszy weekend do celu',
      seeAlsoDayTrips: 'Jednodniowe wycieczki'
    }
  },
  nl: {
    meta: {
      notFound: {
        title: 'Pagina niet gevonden',
        description: 'De gevraagde pagina is niet gevonden op euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Weekendvluchten vanuit {{city}}',
        description:
          'Vergelijk goedkope Europese weekendvluchten vanuit {{city}}. Vr–zo citybreaks zonder vakantiedagen — vind deals en boek via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Pagina niet gevonden',
      lead: 'Deze pagina bestaat niet of de stadskoppeling is ongeldig.',
      backHome: 'Terug naar zoeken'
    },
    weekendFlightsFrom: {
      tagline: 'Weekendvluchten vanuit {{city}}',
      title: 'Goedkope weekendvluchten vanuit {{city}}',
      subtitle: 'Citybreaks vanuit {{city}} zonder vakantiedagen',
      lead: 'Vergelijk retour-weekendvluchten vanuit {{city}} door Europa — vrijdagavond vertrek, zondag terug.',
      seoTitle: 'Vind weekendvluchtdeals vanuit {{city}}',
      seoBlock:
        'Zoek goedkope weekendvluchten vanuit {{city}} naar steden in Europa. Filter vr–zo en andere korte patronen, vergelijk prijzen en boek op Kiwi.com.',
      popularHubsTitle: 'Populaire vertreksteden',
      seeAlsoCheapest: 'Vind het goedkoopste weekend naar een bestemming',
      seeAlsoDayTrips: 'Dagtrips'
    }
  },
  cs: {
    meta: {
      notFound: {
        title: 'Stránka nenalezena',
        description: 'Požadovaná stránka nebyla na euroweekender.com nalezena.'
      },
      weekendFlightsFrom: {
        title: 'Víkendové lety z {{city}}',
        description:
          'Porovnejte levné evropské víkendové lety z {{city}}. Pá–ne city breaky bez dovolené — najděte nabídky a rezervujte přes Kiwi.com.'
      }
    },
    notFound: {
      title: 'Stránka nenalezena',
      lead: 'Tato stránka neexistuje nebo odkaz na město je neplatný.',
      backHome: 'Zpět na vyhledávání'
    },
    weekendFlightsFrom: {
      tagline: 'Víkendové lety z {{city}}',
      title: 'Levné víkendové lety z {{city}}',
      subtitle: 'City breaky z {{city}} bez dovolené',
      lead: 'Porovnejte víkendové lety tam a zpět z {{city}} po Evropě — odlet v pátek večer, návrat v neděli.',
      seoTitle: 'Najděte víkendové letecké nabídky z {{city}}',
      seoBlock:
        'Hledejte levné víkendové lety z {{city}} do evropských měst. Filtrujte pá–ne a další krátké vzory, porovnávejte ceny a rezervujte na Kiwi.com.',
      popularHubsTitle: 'Oblíbená odletová města',
      seeAlsoCheapest: 'Najděte nejlevnější víkend do destinace',
      seeAlsoDayTrips: 'Jednodenní výlety'
    }
  },
  pt: {
    meta: {
      notFound: {
        title: 'Página não encontrada',
        description: 'A página solicitada não foi encontrada em euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Voos de fim de semana de {{city}}',
        description:
          'Compare voos de fim de semana baratos de {{city}}. Escapadas sex–dom sem férias — encontre ofertas e reserve via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Página não encontrada',
      lead: 'Essa página não existe ou o link da cidade é inválido.',
      backHome: 'Voltar à pesquisa'
    },
    weekendFlightsFrom: {
      tagline: 'Voos de fim de semana de {{city}}',
      title: 'Voos de fim de semana baratos de {{city}}',
      subtitle: 'Escapadas de {{city}} sem usar férias',
      lead: 'Compare voos de ida e volta de fim de semana de {{city}} pela Europa — saída sexta à noite, regresso domingo.',
      seoTitle: 'Encontre ofertas de fim de semana de {{city}}',
      seoBlock:
        'Pesquise voos de fim de semana baratos de {{city}} para cidades na Europa. Filtre sex–dom e outros padrões curtos, compare preços e reserve no Kiwi.com.',
      popularHubsTitle: 'Cidades de partida populares',
      seeAlsoCheapest: 'Encontre o fim de semana mais barato para um destino',
      seeAlsoDayTrips: 'Escapadas de um dia'
    }
  },
  ro: {
    meta: {
      notFound: {
        title: 'Pagină negăsită',
        description: 'Pagina solicitată nu a fost găsită pe euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Zboruri de weekend din {{city}}',
        description:
          'Comparați zboruri de weekend ieftine din {{city}}. City break-uri vin–dum fără concediu — găsiți oferte și rezervați prin Kiwi.com.'
      }
    },
    notFound: {
      title: 'Pagină negăsită',
      lead: 'Această pagină nu există sau linkul orașului este invalid.',
      backHome: 'Înapoi la căutare'
    },
    weekendFlightsFrom: {
      tagline: 'Zboruri de weekend din {{city}}',
      title: 'Zboruri de weekend ieftine din {{city}}',
      subtitle: 'City break-uri din {{city}} fără zile de concediu',
      lead: 'Comparați zboruri dus-întors de weekend din {{city}} în Europa — plecare vineri seara, întoarcere duminică.',
      seoTitle: 'Găsiți oferte de zbor de weekend din {{city}}',
      seoBlock:
        'Căutați zboruri de weekend ieftine din {{city}} spre orașe din Europa. Filtrați vin–dum și alte tipare scurte, comparați prețurile și rezervați pe Kiwi.com.',
      popularHubsTitle: 'Orașe de plecare populare',
      seeAlsoCheapest: 'Găsiți cel mai ieftin weekend spre o destinație',
      seeAlsoDayTrips: 'Excursii de o zi'
    }
  },
  hu: {
    meta: {
      notFound: {
        title: 'Az oldal nem található',
        description: 'A kért oldal nem található az euroweekender.com oldalon.'
      },
      weekendFlightsFrom: {
        title: 'Hétvégi járatok {{city}} városból',
        description:
          'Hasonlítsa össze az olcsó európai hétvégi járatokat {{city}} városból. P–V city breakek szabadság nélkül — találjon ajánlatokat és foglaljon a Kiwi.com-on.'
      }
    },
    notFound: {
      title: 'Az oldal nem található',
      lead: 'Ez az oldal nem létezik, vagy a városlink érvénytelen.',
      backHome: 'Vissza a kereséshez'
    },
    weekendFlightsFrom: {
      tagline: 'Hétvégi járatok {{city}} városból',
      title: 'Olcsó hétvégi járatok {{city}} városból',
      subtitle: 'City break {{city}} városból szabadság felhasználása nélkül',
      lead: 'Hasonlítsa össze a hétvégi oda-vissza járatokat {{city}} városból Európában — péntek esti indulás, vasárnapi visszaérkezés.',
      seoTitle: 'Hétvégi repülőjárat-ajánlatok {{city}} városból',
      seoBlock:
        'Keressen olcsó hétvégi járatokat {{city}} városból európai városokba. Szűrjön P–V és más rövid minták szerint, hasonlítson árakat és foglaljon a Kiwi.com-on.',
      popularHubsTitle: 'Népszerű induló városok',
      seeAlsoCheapest: 'Találja meg a legolcsóbb hétvégét egy célállomásra',
      seeAlsoDayTrips: 'Egynapos utak'
    }
  },
  sk: {
    meta: {
      notFound: {
        title: 'Stránka nenájdená',
        description: 'Požadovaná stránka nebola na euroweekender.com nájdená.'
      },
      weekendFlightsFrom: {
        title: 'Víkendové lety z {{city}}',
        description:
          'Porovnajte lacné európske víkendové lety z {{city}}. Pia–ne city breaky bez dovolenky — nájdite ponuky a rezervujte cez Kiwi.com.'
      }
    },
    notFound: {
      title: 'Stránka nenájdená',
      lead: 'Táto stránka neexistuje alebo odkaz na mesto je neplatný.',
      backHome: 'Späť na vyhľadávanie'
    },
    weekendFlightsFrom: {
      tagline: 'Víkendové lety z {{city}}',
      title: 'Lacné víkendové lety z {{city}}',
      subtitle: 'City breaky z {{city}} bez dovolenky',
      lead: 'Porovnajte víkendové lety tam a späť z {{city}} po Európe — odlet v piatok večer, návrat v nedeľu.',
      seoTitle: 'Nájdite víkendové letecké ponuky z {{city}}',
      seoBlock:
        'Hľadajte lacné víkendové lety z {{city}} do európskych miest. Filtrujte pia–ne a iné krátke vzory, porovnávajte ceny a rezervujte na Kiwi.com.',
      popularHubsTitle: 'Obľúbené odletové mestá',
      seeAlsoCheapest: 'Nájdite najlacnejší víkend do destinácie',
      seeAlsoDayTrips: 'Jednodňové výlety'
    }
  },
  sv: {
    meta: {
      notFound: {
        title: 'Sidan hittades inte',
        description: 'Den begärda sidan hittades inte på euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Helgflyg från {{city}}',
        description:
          'Jämför billiga europeiska helgflyg från {{city}}. Fre–sön city breaks utan ledighet — hitta erbjudanden och boka via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Sidan hittades inte',
      lead: 'Sidan finns inte eller så är stadslänken ogiltig.',
      backHome: 'Tillbaka till sökning'
    },
    weekendFlightsFrom: {
      tagline: 'Helgflyg från {{city}}',
      title: 'Billiga helgflyg från {{city}}',
      subtitle: 'City breaks från {{city}} utan ledighet',
      lead: 'Jämför tur-och-retur-helgflyg från {{city}} i Europa — avgång fredag kväll, hemresa söndag.',
      seoTitle: 'Hitta helgerbjudanden från {{city}}',
      seoBlock:
        'Sök billiga helgflyg från {{city}} till städer i Europa. Filtrera fre–sön och andra korta mönster, jämför priser och boka på Kiwi.com.',
      popularHubsTitle: 'Populära avgångsstäder',
      seeAlsoCheapest: 'Hitta den billigaste helgen till en destination',
      seeAlsoDayTrips: 'Dagsresor'
    }
  },
  da: {
    meta: {
      notFound: {
        title: 'Side ikke fundet',
        description: 'Den anmodede side blev ikke fundet på euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Weekendfly fra {{city}}',
        description:
          'Sammenlign billige europæiske weekendfly fra {{city}}. Fre–søn city breaks uden feriedage — find tilbud og book via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Side ikke fundet',
      lead: 'Den side findes ikke, eller bylinket er ugyldigt.',
      backHome: 'Tilbage til søgning'
    },
    weekendFlightsFrom: {
      tagline: 'Weekendfly fra {{city}}',
      title: 'Billige weekendfly fra {{city}}',
      subtitle: 'City breaks fra {{city}} uden feriedage',
      lead: 'Sammenlign tur-retur-weekendfly fra {{city}} i Europa — afgang fredag aften, hjemkomst søndag.',
      seoTitle: 'Find weekendflytilbud fra {{city}}',
      seoBlock:
        'Søg billige weekendfly fra {{city}} til byer i Europa. Filtrer fre–søn og andre korte mønstre, sammenlign priser og book på Kiwi.com.',
      popularHubsTitle: 'Populære afgangsbyer',
      seeAlsoCheapest: 'Find den billigste weekend til en destination',
      seeAlsoDayTrips: 'Dagsrejser'
    }
  },
  fi: {
    meta: {
      notFound: {
        title: 'Sivua ei löytynyt',
        description: 'Pyydettyä sivua ei löytynyt osoitteesta euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Viikonloppulennot kohteesta {{city}}',
        description:
          'Vertaa edullisia eurooppalaisia viikonloppulentoja kohteesta {{city}}. Pe–su city breakit ilman lomapäiviä — löydä tarjoukset ja varaa Kiwi.comin kautta.'
      }
    },
    notFound: {
      title: 'Sivua ei löytynyt',
      lead: 'Sivua ei ole olemassa tai kaupunkilinkki on virheellinen.',
      backHome: 'Takaisin hakuun'
    },
    weekendFlightsFrom: {
      tagline: 'Viikonloppulennot kohteesta {{city}}',
      title: 'Edulliset viikonloppulennot kohteesta {{city}}',
      subtitle: 'City breakit kohteesta {{city}} ilman lomapäiviä',
      lead: 'Vertaa meno-paluu-viikonloppulentoja kohteesta {{city}} ympäri Eurooppaa — lähtö perjantai-iltana, paluu sunnuntaina.',
      seoTitle: 'Löydä viikonloppulento-tarjoukset kohteesta {{city}}',
      seoBlock:
        'Etsi edullisia viikonloppulentoja kohteesta {{city}} Euroopan kaupunkeihin. Suodata pe–su ja muita lyhyitä malleja, vertaa hintoja ja varaa Kiwi.comissa.',
      popularHubsTitle: 'Suositut lähtökaupungit',
      seeAlsoCheapest: 'Löydä edullisin viikonloppu kohteeseen',
      seeAlsoDayTrips: 'Päiväretket'
    }
  },
  no: {
    meta: {
      notFound: {
        title: 'Siden ble ikke funnet',
        description: 'Den forespurte siden ble ikke funnet på euroweekender.com.'
      },
      weekendFlightsFrom: {
        title: 'Helgefly fra {{city}}',
        description:
          'Sammenlign billige europeiske helgefly fra {{city}}. Fre–søn city breaks uten feriedager — finn tilbud og bestill via Kiwi.com.'
      }
    },
    notFound: {
      title: 'Siden ble ikke funnet',
      lead: 'Denne siden finnes ikke, eller bylenken er ugyldig.',
      backHome: 'Tilbake til søk'
    },
    weekendFlightsFrom: {
      tagline: 'Helgefly fra {{city}}',
      title: 'Billige helgefly fra {{city}}',
      subtitle: 'City breaks fra {{city}} uten feriedager',
      lead: 'Sammenlign tur-retur-helgefly fra {{city}} i Europa — avgang fredag kveld, hjemkomst søndag.',
      seoTitle: 'Finn helgetilbud fra {{city}}',
      seoBlock:
        'Søk billige helgefly fra {{city}} til byer i Europa. Filtrer fre–søn og andre korte mønstre, sammenlign priser og bestill på Kiwi.com.',
      popularHubsTitle: 'Populære avreisebyer',
      seeAlsoCheapest: 'Finn den billigste helgen til en destinasjon',
      seeAlsoDayTrips: 'Dagsreiser'
    }
  }
};

const FALLBACK_LOCALES = ['tr', 'el', 'uk', 'ru', 'bg', 'lt', 'lv', 'et', 'is'];
for (const code of FALLBACK_LOCALES) {
  patches[code] = EN;
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const lang = file.replace('.json', '');
  const patch = patches[lang] ?? EN;
  const full = path.join(dir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  deepMerge(json, patch);
  fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n');
  console.log('patched', file);
}

console.log('done');
