/**
 * Merge day-trips-from / weekend-flights-OD SEO strings into all locale files.
 * Full translations for de, fr, es, it, pl, nl, cs; English fallback for the rest.
 * Run: node scripts/patch-seo-content-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'flight-search', 'frontend', 'src', 'locales');

/** @type {Record<string, object>} */
const EN = {
  meta: {
    dayTripsFrom: {
      title: 'Day Trips from {{city}}',
      description:
        'Find same-day Saturday and Sunday city trips from {{city}} — morning outbound, evening return, no overnight stay. Compare deals and book via Kiwi.com.'
    },
    weekendFlightsOd: {
      title: 'Weekend Flights {{from}} to {{to}}',
      description:
        'Compare the cheapest weekend flights from {{from}} to {{to}} on a monthly price calendar. Find the best Fri–Sun fare and book via Kiwi.com.'
    }
  },
  weekendFlightsFrom: {
    priceHint: 'Weekend deals from {{city}} often start around €{{minPrice}} across {{destinationCount}} destinations.',
    topDestinationsTitle: 'Popular destinations from {{city}}',
    destinationPrice: 'from €{{price}}',
    seeAlsoDayTripsFromCity: 'Day trips from {{city}}',
    faqTitle: 'FAQ: weekend flights from {{city}}',
    faq: [
      {
        q: 'How much do weekend flights from {{city}} cost?',
        a: 'Prices vary by destination and season, but many Fri–Sun routes from {{city}} start from budget-friendly fares — use the calendar and destination links on this page to compare current offers.'
      },
      {
        q: 'Which airlines fly weekend routes from {{city}}?',
        a: "Weekend deals from {{city}} are aggregated from Kiwi.com's flight search, covering both low-cost and full-service carriers depending on the route."
      },
      {
        q: 'Can I find a Friday evening flight from {{city}}?',
        a: 'Yes — use the evening departure filter above to show only outbound flights leaving {{city}} at 17:00 or later, so you can travel after work.'
      },
      {
        q: 'What is the cheapest weekend to fly from {{city}} to a specific city?',
        a: 'Open "Best weekend price" and pick {{city}} as your departure airport and any European city as the destination to compare fares across upcoming weekends on a calendar.'
      }
    ]
  },
  dayTripsFrom: {
    tagline: 'Day trips from {{city}}',
    title: 'Same-day city trips from {{city}}',
    subtitle: 'Fly out Saturday or Sunday morning from {{city}}, come home the same evening',
    lead: 'Leave {{city}} after breakfast, explore a European city, and fly home the same evening — no hotel, no overnight.',
    seoTitle: 'Find day trips from {{city}} without an overnight stay',
    seoBlock:
      'Looking for a same-day city trip from {{city}}? Choose Saturdays or Sundays for morning-out, evening-back flights from {{city}}. Compare deals across nearby destinations and book through Kiwi.com — ideal when you want a full day abroad without a hotel.',
    popularHubsTitle: 'More day-trip departure cities',
    seeAlsoWeekendFromCity: 'Weekend flights from {{city}}',
    faqTitle: 'FAQ: day trips from {{city}}',
    faq: [
      {
        q: 'What counts as a day trip from {{city}}?',
        a: 'A same-day return: fly out of {{city}} in the morning, spend the day in another European city, and fly home the same evening — no hotel and no overnight stay.'
      },
      {
        q: 'Which days can I fly a day trip from {{city}}?',
        a: 'Day trips from {{city}} on euroweekender.com focus on Saturdays and Sundays, matching morning-out and evening-back flight schedules.'
      },
      {
        q: 'How far ahead can I search day trips from {{city}}?',
        a: 'Use the range buttons above the calendar to scan the next month, three months, or six months of Saturdays and Sundays from {{city}}.'
      }
    ]
  },
  weekendFlightsOd: {
    title: 'Cheapest weekend flights {{from}} → {{to}}',
    seoBlock:
      'Compare weekend flight prices from {{from}} to {{to}} on a monthly calendar. Spot the cheapest Fri–Sun fare, open a weekend for flight details, and book securely through Kiwi.com.',
    seeAlsoFromCity: 'Weekend flights from {{city}}'
  }
};

/** @type {Record<string, object>} */
const patches = {
  de: {
    meta: {
      dayTripsFrom: {
        title: 'Tagesausflüge ab {{city}}',
        description:
          'Finden Sie eintägige Samstags- und Sonntags-Städtetrips ab {{city}} — morgens hin, abends zurück, ohne Übernachtung. Angebote vergleichen und über Kiwi.com buchen.'
      },
      weekendFlightsOd: {
        title: 'Wochenendflüge {{from}} nach {{to}}',
        description:
          'Vergleichen Sie die günstigsten Wochenendflüge von {{from}} nach {{to}} in einem monatlichen Preiskalender. Finden Sie den besten Fr–So-Tarif und buchen Sie über Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Wochenendangebote ab {{city}} beginnen oft bei rund {{minPrice}} € für {{destinationCount}} Ziele.',
      topDestinationsTitle: 'Beliebte Ziele ab {{city}}',
      destinationPrice: 'ab {{price}} €',
      seeAlsoDayTripsFromCity: 'Tagesausflüge ab {{city}}',
      faqTitle: 'FAQ: Wochenendflüge ab {{city}}',
      faq: [
        {
          q: 'Wie viel kosten Wochenendflüge ab {{city}}?',
          a: 'Die Preise variieren je nach Ziel und Saison, aber viele Fr–So-Strecken ab {{city}} starten preisgünstig — nutzen Sie den Kalender und die Zielverlinkungen auf dieser Seite, um aktuelle Angebote zu vergleichen.'
        },
        {
          q: 'Welche Airlines fliegen Wochenendstrecken ab {{city}}?',
          a: 'Wochenendangebote ab {{city}} stammen aus der Flugsuche von Kiwi.com und umfassen je nach Strecke sowohl Low-Cost- als auch Netzwerk-Airlines.'
        },
        {
          q: 'Finde ich einen Freitagabendflug ab {{city}}?',
          a: 'Ja — nutzen Sie oben den Abendabflug-Filter, um nur Hinflüge ab {{city}} ab 17:00 Uhr anzuzeigen, damit Sie nach der Arbeit losfliegen können.'
        },
        {
          q: 'Was ist das günstigste Wochenende, um von {{city}} in eine bestimmte Stadt zu fliegen?',
          a: 'Öffnen Sie „Bester Wochenendpreis“ und wählen Sie {{city}} als Abflughafen sowie eine europäische Stadt als Ziel, um Tarife über kommende Wochenenden im Kalender zu vergleichen.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Tagesausflüge ab {{city}}',
      title: 'Eintägige Städtetrips ab {{city}}',
      subtitle: 'Samstag oder Sonntag morgens ab {{city}} los, am selben Abend zurück',
      lead: 'Verlassen Sie {{city}} nach dem Frühstück, erkunden Sie eine europäische Stadt und fliegen Sie am selben Abend zurück — ohne Hotel, ohne Übernachtung.',
      seoTitle: 'Tagesausflüge ab {{city}} ohne Übernachtung finden',
      seoBlock:
        'Suchen Sie einen eintägigen Städtetrip ab {{city}}? Wählen Sie Samstage oder Sonntage für Flüge morgens hin und abends zurück ab {{city}}. Vergleichen Sie Angebote naher Ziele und buchen Sie über Kiwi.com — ideal für einen vollen Tag im Ausland ohne Hotel.',
      popularHubsTitle: 'Weitere Tagesausflug-Abflugstädte',
      seeAlsoWeekendFromCity: 'Wochenendflüge ab {{city}}',
      faqTitle: 'FAQ: Tagesausflüge ab {{city}}',
      faq: [
        {
          q: 'Was gilt als Tagesausflug ab {{city}}?',
          a: 'Ein Same-Day-Rückflug: morgens ab {{city}} los, einen Tag in einer anderen europäischen Stadt verbringen und am selben Abend zurückfliegen — ohne Hotel und ohne Übernachtung.'
        },
        {
          q: 'An welchen Tagen kann ich einen Tagesausflug ab {{city}} fliegen?',
          a: 'Tagesausflüge ab {{city}} auf euroweekender.com konzentrieren sich auf Samstage und Sonntage, passend zu Flügen morgens hin und abends zurück.'
        },
        {
          q: 'Wie weit im Voraus kann ich Tagesausflüge ab {{city}} suchen?',
          a: 'Nutzen Sie die Bereichsschaltflächen über dem Kalender, um den nächsten Monat, die nächsten drei oder sechs Monate an Samstagen und Sonntagen ab {{city}} zu durchsuchen.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Günstigste Wochenendflüge {{from}} → {{to}}',
      seoBlock:
        'Vergleichen Sie Wochenend-Flugpreise von {{from}} nach {{to}} in einem monatlichen Kalender. Finden Sie den günstigsten Fr–So-Tarif, öffnen Sie ein Wochenende für Flugdetails und buchen Sie sicher über Kiwi.com.',
      seeAlsoFromCity: 'Wochenendflüge ab {{city}}'
    }
  },
  fr: {
    meta: {
      dayTripsFrom: {
        title: 'Excursions d’une journée depuis {{city}}',
        description:
          'Trouvez des escapades samedi et dimanche le jour même depuis {{city}} — départ le matin, retour le soir, sans nuitée. Comparez les offres et réservez via Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Vols week-end {{from}} vers {{to}}',
        description:
          'Comparez les vols week-end les moins chers de {{from}} vers {{to}} sur un calendrier de prix mensuel. Trouvez le meilleur tarif ven–dim et réservez via Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Les offres week-end depuis {{city}} démarrent souvent autour de {{minPrice}} € vers {{destinationCount}} destinations.',
      topDestinationsTitle: 'Destinations populaires depuis {{city}}',
      destinationPrice: 'dès {{price}} €',
      seeAlsoDayTripsFromCity: 'Escapades d’une journée depuis {{city}}',
      faqTitle: 'FAQ : vols week-end depuis {{city}}',
      faq: [
        {
          q: 'Combien coûtent les vols week-end depuis {{city}} ?',
          a: 'Les prix varient selon la destination et la saison, mais de nombreuses routes ven–dim depuis {{city}} démarrent à des tarifs abordables — utilisez le calendrier et les liens de destination sur cette page pour comparer les offres actuelles.'
        },
        {
          q: 'Quelles compagnies desservent les routes week-end depuis {{city}} ?',
          a: 'Les offres week-end depuis {{city}} sont agrégées depuis la recherche de vols Kiwi.com, couvrant compagnies low-cost et traditionnelles selon la route.'
        },
        {
          q: 'Puis-je trouver un vol le vendredi soir depuis {{city}} ?',
          a: 'Oui — utilisez le filtre de départ en soirée ci-dessus pour n’afficher que les vols aller au départ de {{city}} à partir de 17h00, afin de partir après le travail.'
        },
        {
          q: 'Quel est le week-end le moins cher pour voler de {{city}} vers une ville précise ?',
          a: 'Ouvrez « Meilleur prix week-end » et choisissez {{city}} comme aéroport de départ et n’importe quelle ville européenne comme destination pour comparer les tarifs des prochains week-ends sur un calendrier.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Escapades d’une journée depuis {{city}}',
      title: 'Escapades le jour même depuis {{city}}',
      subtitle: 'Partez samedi ou dimanche matin depuis {{city}}, rentrez le même soir',
      lead: 'Quittez {{city}} après le petit-déjeuner, explorez une ville européenne et rentrez le même soir — pas d’hôtel, pas de nuitée.',
      seoTitle: 'Trouvez des escapades depuis {{city}} sans nuitée',
      seoBlock:
        'Vous cherchez une escapade d’une journée depuis {{city}} ? Choisissez samedi ou dimanche pour des vols matin aller / soir retour depuis {{city}}. Comparez les offres des destinations proches et réservez via Kiwi.com — idéal pour une journée complète à l’étranger sans hôtel.',
      popularHubsTitle: 'Autres villes de départ pour escapades',
      seeAlsoWeekendFromCity: 'Vols week-end depuis {{city}}',
      faqTitle: 'FAQ : escapades d’une journée depuis {{city}}',
      faq: [
        {
          q: 'Qu’est-ce qu’une escapade d’une journée depuis {{city}} ?',
          a: 'Un aller-retour le jour même : décollage de {{city}} le matin, une journée dans une autre ville européenne et retour le même soir — sans hôtel ni nuitée.'
        },
        {
          q: 'Quels jours puis-je voyager en escapade depuis {{city}} ?',
          a: 'Les escapades depuis {{city}} sur euroweekender.com se concentrent sur les samedis et dimanches, avec des vols matin aller / soir retour.'
        },
        {
          q: 'Jusqu’à quand puis-je rechercher des escapades depuis {{city}} ?',
          a: 'Utilisez les boutons de plage au-dessus du calendrier pour parcourir le mois, les trois mois ou les six prochains mois de samedis et dimanches depuis {{city}}.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Vols week-end les moins chers {{from}} → {{to}}',
      seoBlock:
        'Comparez les prix des vols week-end de {{from}} vers {{to}} sur un calendrier mensuel. Repérez le tarif ven–dim le plus bas, ouvrez un week-end pour les détails du vol et réservez en toute sécurité via Kiwi.com.',
      seeAlsoFromCity: 'Vols week-end depuis {{city}}'
    }
  },
  es: {
    meta: {
      dayTripsFrom: {
        title: 'Escapadas de un día desde {{city}}',
        description:
          'Encuentra escapadas de sábado y domingo el mismo día desde {{city}} — salida por la mañana, regreso por la noche, sin pernoctar. Compara ofertas y reserva en Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Vuelos de fin de semana {{from}} a {{to}}',
        description:
          'Compara los vuelos de fin de semana más baratos de {{from}} a {{to}} en un calendario de precios mensual. Encuentra la mejor tarifa vie–dom y reserva en Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Las ofertas de fin de semana desde {{city}} suelen empezar en torno a {{minPrice}} € hacia {{destinationCount}} destinos.',
      topDestinationsTitle: 'Destinos populares desde {{city}}',
      destinationPrice: 'desde {{price}} €',
      seeAlsoDayTripsFromCity: 'Escapadas de un día desde {{city}}',
      faqTitle: 'FAQ: vuelos de fin de semana desde {{city}}',
      faq: [
        {
          q: '¿Cuánto cuestan los vuelos de fin de semana desde {{city}}?',
          a: 'Los precios varían según el destino y la temporada, pero muchas rutas vie–dom desde {{city}} parten de tarifas económicas — usa el calendario y los enlaces de destino de esta página para comparar ofertas actuales.'
        },
        {
          q: '¿Qué aerolíneas cubren rutas de fin de semana desde {{city}}?',
          a: 'Las ofertas de fin de semana desde {{city}} se recopilan de la búsqueda de vuelos de Kiwi.com, incluyendo aerolíneas low-cost y tradicionales según la ruta.'
        },
        {
          q: '¿Puedo encontrar un vuelo el viernes por la noche desde {{city}}?',
          a: 'Sí — usa el filtro de salida nocturna arriba para mostrar solo vuelos de ida desde {{city}} a partir de las 17:00, para poder viajar después del trabajo.'
        },
        {
          q: '¿Cuál es el fin de semana más barato para volar de {{city}} a una ciudad concreta?',
          a: 'Abre "Mejor precio de fin de semana" y elige {{city}} como aeropuerto de salida y cualquier ciudad europea como destino para comparar tarifas de los próximos fines de semana en un calendario.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Escapadas de un día desde {{city}}',
      title: 'Escapadas el mismo día desde {{city}}',
      subtitle: 'Sal el sábado o domingo por la mañana desde {{city}}, vuelve la misma noche',
      lead: 'Sal de {{city}} después del desayuno, explora una ciudad europea y vuelve a casa la misma noche — sin hotel, sin pernoctar.',
      seoTitle: 'Encuentra escapadas desde {{city}} sin pernoctar',
      seoBlock:
        '¿Buscas una escapada de un día desde {{city}}? Elige sábados o domingos para vuelos mañana ida / noche vuelta desde {{city}}. Compara ofertas de destinos cercanos y reserva con Kiwi.com — ideal para un día completo en el extranjero sin hotel.',
      popularHubsTitle: 'Más ciudades de salida para escapadas',
      seeAlsoWeekendFromCity: 'Vuelos de fin de semana desde {{city}}',
      faqTitle: 'FAQ: escapadas de un día desde {{city}}',
      faq: [
        {
          q: '¿Qué se considera una escapada de un día desde {{city}}?',
          a: 'Una ida y vuelta el mismo día: sale de {{city}} por la mañana, pasa el día en otra ciudad europea y vuelve la misma noche — sin hotel ni pernocta.'
        },
        {
          q: '¿Qué días puedo volar una escapada desde {{city}}?',
          a: 'Las escapadas desde {{city}} en euroweekender.com se centran en sábados y domingos, con vuelos mañana ida / noche vuelta.'
        },
        {
          q: '¿Con cuánta antelación puedo buscar escapadas desde {{city}}?',
          a: 'Usa los botones de rango sobre el calendario para explorar el próximo mes, los próximos tres o seis meses de sábados y domingos desde {{city}}.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Vuelos de fin de semana más baratos {{from}} → {{to}}',
      seoBlock:
        'Compara los precios de vuelos de fin de semana de {{from}} a {{to}} en un calendario mensual. Encuentra la tarifa vie–dom más baja, abre un fin de semana para ver los detalles del vuelo y reserva de forma segura en Kiwi.com.',
      seeAlsoFromCity: 'Vuelos de fin de semana desde {{city}}'
    }
  },
  it: {
    meta: {
      dayTripsFrom: {
        title: 'Gite di un giorno da {{city}}',
        description:
          'Trova gite sabato e domenica in giornata da {{city}} — partenza al mattino, ritorno la sera, senza pernottamento. Confronta le offerte e prenota su Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Voli weekend {{from}} verso {{to}}',
        description:
          'Confronta i voli weekend più economici da {{from}} verso {{to}} su un calendario prezzi mensile. Trova la migliore tariffa ven–dom e prenota su Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Le offerte weekend da {{city}} partono spesso da circa {{minPrice}} € verso {{destinationCount}} destinazioni.',
      topDestinationsTitle: 'Destinazioni popolari da {{city}}',
      destinationPrice: 'da {{price}} €',
      seeAlsoDayTripsFromCity: 'Gite di un giorno da {{city}}',
      faqTitle: 'FAQ: voli weekend da {{city}}',
      faq: [
        {
          q: 'Quanto costano i voli weekend da {{city}}?',
          a: 'I prezzi variano in base a destinazione e stagione, ma molte rotte ven–dom da {{city}} partono da tariffe economiche — usa il calendario e i link alle destinazioni in questa pagina per confrontare le offerte attuali.'
        },
        {
          q: 'Quali compagnie coprono le rotte weekend da {{city}}?',
          a: 'Le offerte weekend da {{city}} sono aggregate dalla ricerca voli di Kiwi.com e includono sia compagnie low-cost che tradizionali a seconda della rotta.'
        },
        {
          q: 'Posso trovare un volo venerdì sera da {{city}}?',
          a: 'Sì — usa il filtro partenza serale qui sopra per mostrare solo i voli in partenza da {{city}} dalle 17:00 in poi, così puoi partire dopo il lavoro.'
        },
        {
          q: 'Qual è il weekend più economico per volare da {{city}} verso una città specifica?',
          a: 'Apri "Miglior prezzo weekend" e scegli {{city}} come aeroporto di partenza e una città europea come destinazione per confrontare le tariffe dei prossimi weekend su un calendario.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Gite di un giorno da {{city}}',
      title: 'Gite in giornata da {{city}}',
      subtitle: 'Parti sabato o domenica mattina da {{city}}, torna a casa la stessa sera',
      lead: 'Parti da {{city}} dopo colazione, esplora una città europea e vola a casa la stessa sera — niente hotel, niente pernottamento.',
      seoTitle: 'Trova gite da {{city}} senza pernottamento',
      seoBlock:
        'Cerchi una gita di un giorno da {{city}}? Scegli sabati o domeniche per voli mattina andata / sera ritorno da {{city}}. Confronta le offerte delle destinazioni vicine e prenota tramite Kiwi.com — ideale per una giornata intera all’estero senza hotel.',
      popularHubsTitle: 'Altre città di partenza per gite',
      seeAlsoWeekendFromCity: 'Voli weekend da {{city}}',
      faqTitle: 'FAQ: gite di un giorno da {{city}}',
      faq: [
        {
          q: 'Cosa si intende per gita di un giorno da {{city}}?',
          a: 'Un andata e ritorno in giornata: si parte da {{city}} al mattino, si passa la giornata in un’altra città europea e si torna la stessa sera — senza hotel né pernottamento.'
        },
        {
          q: 'In quali giorni posso fare una gita da {{city}}?',
          a: 'Le gite da {{city}} su euroweekender.com si concentrano su sabati e domeniche, con voli mattina andata / sera ritorno.'
        },
        {
          q: 'Con quanto anticipo posso cercare gite da {{city}}?',
          a: 'Usa i pulsanti dell’intervallo sopra il calendario per esplorare il prossimo mese, i prossimi tre o sei mesi di sabati e domeniche da {{city}}.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Voli weekend più economici {{from}} → {{to}}',
      seoBlock:
        'Confronta i prezzi dei voli weekend da {{from}} verso {{to}} su un calendario mensile. Individua la tariffa ven–dom più bassa, apri un weekend per i dettagli del volo e prenota in sicurezza su Kiwi.com.',
      seeAlsoFromCity: 'Voli weekend da {{city}}'
    }
  },
  pl: {
    meta: {
      dayTripsFrom: {
        title: 'Jednodniowe wycieczki z {{city}}',
        description:
          'Znajdź sobotnie i niedzielne jednodniowe wycieczki z {{city}} — rano tam, wieczorem z powrotem, bez noclegu. Porównaj oferty i rezerwuj na Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Loty weekendowe {{from}} do {{to}}',
        description:
          'Porównaj najtańsze loty weekendowe z {{from}} do {{to}} w miesięcznym kalendarzu cen. Znajdź najlepszą taryfę pt–nd i rezerwuj na Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Oferty weekendowe z {{city}} często zaczynają się od około {{minPrice}} € do {{destinationCount}} destynacji.',
      topDestinationsTitle: 'Popularne kierunki z {{city}}',
      destinationPrice: 'od {{price}} €',
      seeAlsoDayTripsFromCity: 'Jednodniowe wycieczki z {{city}}',
      faqTitle: 'FAQ: loty weekendowe z {{city}}',
      faq: [
        {
          q: 'Ile kosztują loty weekendowe z {{city}}?',
          a: 'Ceny zależą od kierunku i sezonu, ale wiele tras pt–nd z {{city}} zaczyna się od budżetowych taryf — użyj kalendarza i linków do kierunków na tej stronie, aby porównać aktualne oferty.'
        },
        {
          q: 'Które linie lotnicze obsługują trasy weekendowe z {{city}}?',
          a: 'Oferty weekendowe z {{city}} są zbierane z wyszukiwarki lotów Kiwi.com i obejmują zarówno tanie linie, jak i przewoźników sieciowych, w zależności od trasy.'
        },
        {
          q: 'Czy znajdę lot w piątek wieczorem z {{city}}?',
          a: 'Tak — użyj powyższego filtra wieczornych odlotów, aby pokazać tylko loty z {{city}} od godziny 17:00, dzięki czemu możesz wylecieć po pracy.'
        },
        {
          q: 'Jaki jest najtańszy weekend na lot z {{city}} do konkretnego miasta?',
          a: 'Otwórz „Najlepszą cenę weekendu” i wybierz {{city}} jako lotnisko wylotu oraz dowolne europejskie miasto jako cel, aby porównać taryfy nadchodzących weekendów w kalendarzu.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Jednodniowe wycieczki z {{city}}',
      title: 'Wycieczki tego samego dnia z {{city}}',
      subtitle: 'Wylot w sobotę lub niedzielę rano z {{city}}, powrót tego samego wieczoru',
      lead: 'Wyjedź z {{city}} po śniadaniu, zwiedzaj europejskie miasto i wróć tego samego wieczoru — bez hotelu, bez noclegu.',
      seoTitle: 'Znajdź wycieczki z {{city}} bez noclegu',
      seoBlock:
        'Szukasz jednodniowej wycieczki z {{city}}? Wybierz soboty lub niedziele na loty rano tam / wieczorem z powrotem z {{city}}. Porównaj oferty pobliskich kierunków i rezerwuj przez Kiwi.com — idealne na pełny dzień za granicą bez hotelu.',
      popularHubsTitle: 'Więcej miast wylotu na wycieczki jednodniowe',
      seeAlsoWeekendFromCity: 'Loty weekendowe z {{city}}',
      faqTitle: 'FAQ: jednodniowe wycieczki z {{city}}',
      faq: [
        {
          q: 'Co liczy się jako wycieczka jednodniowa z {{city}}?',
          a: 'Lot w obie strony tego samego dnia: wylot z {{city}} rano, dzień w innym europejskim mieście i powrót wieczorem — bez hotelu i bez noclegu.'
        },
        {
          q: 'W jakie dni mogę polecieć na wycieczkę jednodniową z {{city}}?',
          a: 'Wycieczki jednodniowe z {{city}} na euroweekender.com skupiają się na sobotach i niedzielach, z lotami rano tam / wieczorem z powrotem.'
        },
        {
          q: 'Z jakim wyprzedzeniem mogę szukać wycieczek z {{city}}?',
          a: 'Użyj przycisków zakresu nad kalendarzem, aby przeglądać najbliższy miesiąc, trzy lub sześć miesięcy sobót i niedziel z {{city}}.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Najtańsze loty weekendowe {{from}} → {{to}}',
      seoBlock:
        'Porównaj ceny lotów weekendowych z {{from}} do {{to}} w miesięcznym kalendarzu. Znajdź najniższą taryfę pt–nd, otwórz weekend, aby zobaczyć szczegóły lotu, i rezerwuj bezpiecznie na Kiwi.com.',
      seeAlsoFromCity: 'Loty weekendowe z {{city}}'
    }
  },
  nl: {
    meta: {
      dayTripsFrom: {
        title: 'Dagtrips vanuit {{city}}',
        description:
          'Vind zaterdag- en zondagtrips op dezelfde dag vanuit {{city}} — ’s ochtends heen, ’s avonds terug, zonder overnachting. Vergelijk deals en boek via Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Weekendvluchten {{from}} naar {{to}}',
        description:
          'Vergelijk de goedkoopste weekendvluchten van {{from}} naar {{to}} op een maandelijkse priskalender. Vind de beste vr–zo-tarief en boek via Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Weekenddeals vanuit {{city}} beginnen vaak rond {{minPrice}} € naar {{destinationCount}} bestemmingen.',
      topDestinationsTitle: 'Populaire bestemmingen vanuit {{city}}',
      destinationPrice: 'vanaf {{price}} €',
      seeAlsoDayTripsFromCity: 'Dagtrips vanuit {{city}}',
      faqTitle: 'FAQ: weekendvluchten vanuit {{city}}',
      faq: [
        {
          q: 'Hoeveel kosten weekendvluchten vanuit {{city}}?',
          a: 'Prijzen variëren per bestemming en seizoen, maar veel vr–zo-routes vanuit {{city}} beginnen bij budgetvriendelijke tarieven — gebruik de kalender en bestemmingslinks op deze pagina om actuele aanbiedingen te vergelijken.'
        },
        {
          q: 'Welke maatschappijen vliegen weekendroutes vanuit {{city}}?',
          a: 'Weekenddeals vanuit {{city}} komen uit de vluchtzoekmachine van Kiwi.com en omvatten zowel low-cost als traditionele maatschappijen, afhankelijk van de route.'
        },
        {
          q: 'Kan ik een vrijdagavondvlucht vanuit {{city}} vinden?',
          a: 'Ja — gebruik hierboven het avondvertrekfilter om alleen heenvluchten vanuit {{city}} vanaf 17:00 uur te tonen, zodat je na het werk kunt vertrekken.'
        },
        {
          q: 'Wat is het goedkoopste weekend om van {{city}} naar een specifieke stad te vliegen?',
          a: 'Open "Beste weekendprijs" en kies {{city}} als vertrekluchthaven en een Europese stad als bestemming om tarieven van komende weekenden op een kalender te vergelijken.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Dagtrips vanuit {{city}}',
      title: 'Dagtrips op dezelfde dag vanuit {{city}}',
      subtitle: 'Vlieg zaterdag of zondag ’s ochtends vanuit {{city}} weg, kom dezelfde avond terug',
      lead: 'Vertrek na het ontbijt vanuit {{city}}, verken een Europese stad en vlieg dezelfde avond terug — geen hotel, geen overnachting.',
      seoTitle: 'Vind dagtrips vanuit {{city}} zonder overnachting',
      seoBlock:
        'Op zoek naar een dagtrip vanuit {{city}}? Kies zaterdagen of zondagen voor ochtend-heen, avond-terug vluchten vanuit {{city}}. Vergelijk deals van nabije bestemmingen en boek via Kiwi.com — ideaal voor een volle dag in het buitenland zonder hotel.',
      popularHubsTitle: 'Meer vertreksteden voor dagtrips',
      seeAlsoWeekendFromCity: 'Weekendvluchten vanuit {{city}}',
      faqTitle: 'FAQ: dagtrips vanuit {{city}}',
      faq: [
        {
          q: 'Wat geldt als dagtrip vanuit {{city}}?',
          a: 'Een same-day retour: ’s ochtends vanuit {{city}} vertrekken, de dag in een andere Europese stad doorbrengen en dezelfde avond terugvliegen — zonder hotel of overnachting.'
        },
        {
          q: 'Op welke dagen kan ik een dagtrip vanuit {{city}} vliegen?',
          a: 'Dagtrips vanuit {{city}} op euroweekender.com focussen op zaterdagen en zondagen, passend bij ochtend-heen en avond-terug vluchten.'
        },
        {
          q: 'Hoe ver vooruit kan ik dagtrips vanuit {{city}} zoeken?',
          a: 'Gebruik de bereikknoppen boven de kalender om de komende maand, drie maanden of zes maanden aan zaterdagen en zondagen vanuit {{city}} te bekijken.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Goedkoopste weekendvluchten {{from}} → {{to}}',
      seoBlock:
        'Vergelijk weekendvluchtprijzen van {{from}} naar {{to}} op een maandelijkse kalender. Spot het laagste vr–zo-tarief, open een weekend voor vluchtdetails en boek veilig via Kiwi.com.',
      seeAlsoFromCity: 'Weekendvluchten vanuit {{city}}'
    }
  },
  cs: {
    meta: {
      dayTripsFrom: {
        title: 'Jednodenní výlety z {{city}}',
        description:
          'Najděte sobotní a nedělní jednodenní výlety z {{city}} — ráno tam, večer zpět, bez přenocování. Porovnejte nabídky a rezervujte na Kiwi.com.'
      },
      weekendFlightsOd: {
        title: 'Víkendové lety {{from}} do {{to}}',
        description:
          'Porovnejte nejlevnější víkendové lety z {{from}} do {{to}} v měsíčním cenovém kalendáři. Najděte nejlepší pá–ne tarif a rezervujte na Kiwi.com.'
      }
    },
    weekendFlightsFrom: {
      priceHint: 'Víkendové nabídky z {{city}} často začínají kolem {{minPrice}} € do {{destinationCount}} destinací.',
      topDestinationsTitle: 'Oblíbené destinace z {{city}}',
      destinationPrice: 'od {{price}} €',
      seeAlsoDayTripsFromCity: 'Jednodenní výlety z {{city}}',
      faqTitle: 'FAQ: víkendové lety z {{city}}',
      faq: [
        {
          q: 'Kolik stojí víkendové lety z {{city}}?',
          a: 'Ceny se liší podle destinace a sezóny, ale mnoho tras pá–ne z {{city}} začíná na dostupných tarifech — pomocí kalendáře a odkazů na destinace na této stránce porovnejte aktuální nabídky.'
        },
        {
          q: 'Které aerolinky létají na víkendových trasách z {{city}}?',
          a: 'Víkendové nabídky z {{city}} pocházejí z vyhledávání letů Kiwi.com a zahrnují jak nízkonákladové, tak síťové dopravce podle trasy.'
        },
        {
          q: 'Najdu let v pátek večer z {{city}}?',
          a: 'Ano — použijte výše filtr večerních odletů, který zobrazí pouze odlety z {{city}} od 17:00, abyste mohli odletět po práci.'
        },
        {
          q: 'Jaký je nejlevnější víkend pro let z {{city}} do konkrétního města?',
          a: 'Otevřete „Nejlepší víkendovou cenu“ a vyberte {{city}} jako odletové letiště a libovolné evropské město jako cíl, abyste porovnali tarify nadcházejících víkendů v kalendáři.'
        }
      ]
    },
    dayTripsFrom: {
      tagline: 'Jednodenní výlety z {{city}}',
      title: 'Výlety v rámci jednoho dne z {{city}}',
      subtitle: 'Odlet v sobotu nebo neděli ráno z {{city}}, návrat tentýž večer',
      lead: 'Vyjeďte z {{city}} po snídani, prozkoumejte evropské město a vraťte se tentýž večer — bez hotelu, bez přenocování.',
      seoTitle: 'Najděte výlety z {{city}} bez přenocování',
      seoBlock:
        'Hledáte jednodenní výlet z {{city}}? Vyberte soboty nebo neděle pro lety ráno tam / večer zpět z {{city}}. Porovnejte nabídky blízkých destinací a rezervujte přes Kiwi.com — ideální na celý den v zahraničí bez hotelu.',
      popularHubsTitle: 'Další odletová města pro jednodenní výlety',
      seeAlsoWeekendFromCity: 'Víkendové lety z {{city}}',
      faqTitle: 'FAQ: jednodenní výlety z {{city}}',
      faq: [
        {
          q: 'Co se počítá jako jednodenní výlet z {{city}}?',
          a: 'Let tam a zpět tentýž den: ráno odlet z {{city}}, den v jiném evropském městě a návrat tentýž večer — bez hotelu a bez přenocování.'
        },
        {
          q: 'V jakých dnech mohu letět na jednodenní výlet z {{city}}?',
          a: 'Jednodenní výlety z {{city}} na euroweekender.com se zaměřují na soboty a neděle, odpovídající letům ráno tam / večer zpět.'
        },
        {
          q: 'Jak daleko dopředu mohu hledat výlety z {{city}}?',
          a: 'Použijte tlačítka rozsahu nad kalendářem k procházení nejbližšího měsíce, tří nebo šesti měsíců sobot a nedělí z {{city}}.'
        }
      ]
    },
    weekendFlightsOd: {
      title: 'Nejlevnější víkendové lety {{from}} → {{to}}',
      seoBlock:
        'Porovnejte ceny víkendových letů z {{from}} do {{to}} v měsíčním kalendáři. Najděte nejnižší pá–ne tarif, otevřete víkend pro podrobnosti o letu a rezervujte bezpečně na Kiwi.com.',
      seeAlsoFromCity: 'Víkendové lety z {{city}}'
    }
  }
};

const FALLBACK_LOCALES = ['ro', 'tr', 'pt', 'hu', 'el', 'sv', 'uk', 'ru', 'bg', 'da', 'fi', 'sk', 'no', 'lt', 'lv', 'et', 'is'];
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
  if (lang === 'en') continue;
  const patch = patches[lang];
  if (!patch) {
    console.warn('missing patch', lang);
    continue;
  }
  const full = path.join(dir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  deepMerge(json, patch);
  fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n');
  console.log('patched', file);
}

console.log('done');
