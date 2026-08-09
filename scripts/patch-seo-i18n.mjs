/**
 * Patches SEO-related locale strings after single-day trips launch.
 * Run: node scripts/patch-seo-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'flight-search', 'frontend', 'src', 'locales');

/** @type {Record<string, object>} */
const patches = {
  de: {
    meta: {
      home: {
        description:
          'Vergleichen Sie günstige europäische Wochenendflüge, finden Sie das günstigste Wochenende zu jeder Stadt oder buchen Sie eintägige Samstags- und Sonntags-Städtetrips. Freitagabend los — oder hin und zurück am selben Tag — ohne Urlaubstage.'
      },
      about: {
        description:
          'Günstige europäische Wochenendflüge, eintägige Städtetrips und Ziel-Preiskalender — Städtereisen ohne Urlaubstage auf euroweekender.com.'
      },
      faq: {
        description:
          'FAQ zu günstigen europäischen Wochenendflügen, eintägigen Städtetrips, Fr–So-Mustern, Abendabflügen und Buchung über Kiwi.com.'
      },
      howItWorks: {
        description:
          'So finden Sie günstige europäische Wochenendflüge und Tagestrips: Flughäfen wählen, Wochenenden oder Samstage/Sonntage auswählen, Abendabflüge filtern und auf Kiwi.com buchen.'
      },
      singleDayTrips: {
        title: 'Eintägige Städtetrips in Europa',
        description:
          'Finden Sie Samstags- und Sonntags-Tagestrips in Europa — morgens hin, abends zurück, ohne Übernachtung. Vergleichen Sie Same-Day-Flüge von Flughäfen in Ihrer Nähe.'
      }
    },
    home: {
      seoTitle: 'Günstige Wochenendflüge und Tagestrips in Europa finden',
      seoBlock:
        'Suchen und vergleichen Sie günstige Wochenendflüge ab Prag, Wien, Berlin, München, London, Barcelona und Dutzenden europäischer Flughäfen. Filtern Sie Fr–So-, Do–So- und Mi–So-Muster, aktivieren Sie Abendabflüge oder wechseln Sie zu eintägigen Samstags- und Sonntags-Städtetrips — und entdecken Sie Auszeiten ohne Urlaubstage. Nutzen Sie „Bester Wochenendpreis“, um Tarife zu einem Ziel im Kalender zu vergleichen.'
    },
    singleDayTrips: {
      tagline: 'Morgens hin · abends zurück',
      title: 'Eintägige Städtetrips in Europa',
      subtitle: 'Samstag oder Sonntag morgens raus, am selben Abend wieder zu Hause',
      lead: 'Nach dem Frühstück los, eine europäische Stadt erkunden und am selben Abend zurückfliegen — ohne Hotel, ohne Übernachtung.',
      travelDayHint: 'Samstag oder Sonntag für morgens-hin / abends-zurück wählen',
      scheduleSummary: 'Morgens hin · abends zurück',
      seoTitle: 'Europäische Tagestrips ohne Übernachtung finden',
      seoBlock:
        'Suchen Sie einen eintägigen Städtetrip in Europa? Wählen Sie Abflughäfen und Samstage oder Sonntage für Flüge morgens hin und abends zurück. Vergleichen Sie Angebote naher Hubs, scannen Sie die nächsten Wochenendtage und buchen Sie über Kiwi.com — ideal für einen vollen Tag im Ausland ohne Hotel.'
    },
    about: {
      heroSubtitle:
        'Bezahlbare europäische Städtereisen um die Arbeitswoche herum — Freitagabend raus, Sonntag zurück, oder ein eintägiger Samstags-Trip.',
      lead: 'Wir helfen Europäern, günstige Kurztrips zu finden — Freitagabend los, Sonntag zurück, oder am selben Tag hin und zurück — ohne Urlaubstage zu verbrauchen.',
      sections: {
        whatP:
          'euroweekender.com aggregiert Flugangebote von Kiwi.com und zeigt sie in drei einfachen Tools: Wochenendangebote von Ihren Flughäfen, ein Kalender für das günstigste Wochenende zu einer europäischen Stadt, und eintägige Samstags-/Sonntags-Städtetrips mit morgens hin und abends zurück. Flughäfen und Daten wählen, Preise vergleichen und beim Partner buchen.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Vier einfache Schritte vom Freitagabendflug bis zur Sonntagsrückkehr — oder einem eintägigen Städtetrip — ohne Urlaubstage.',
      lead: 'Finden Sie einen günstigen europäischen Wochenendtrip oder eintägigen Städtetrip in vier Schritten — Freitagabend los, Sonntag zurück, oder samstags/sonntags am selben Tag hin und zurück.',
      builtP1:
        'euroweekender.com konzentriert sich auf kurze Hin- und Rückflüge, die um die Arbeit herumpassen. Nehmen Sie nach Ihrem letzten Meeting einen Freitagabendflug, verbringen Sie den Samstag in einer neuen Stadt und fliegen Sie sonntagabend nach Hause — zwei Nächte weg, null Urlaubstage. Lieber ohne Hotel? Nutzen Sie Tagestrips für morgens-hin, abends-zurück an Samstag oder Sonntag.',
      step2text:
        'Wählen Sie ein oder mehrere Reisewochenenden. Jede Kachel zeigt den Hinflugzeitraum für diese Reise. Bei Tagestrips wählen Sie stattdessen Samstage oder Sonntage.',
      tip5:
        'Öffnen Sie „Bester Wochenendpreis“, um jedes kommende Wochenende zu einer Stadt zu vergleichen, oder „Tagesausflüge“ für Same-Day-Rückflüge an Samstag/Sonntag.'
    },
    faq: {
      heroSubtitle:
        'Alles über günstige europäische Wochenendflüge und eintägige Städtetrips.',
      lead: 'Antworten zu günstigen Wochenendflügen in Europa, eintägigen Samstags-/Sonntags-Trips, Fr–So-Mustern, Abendabflügen und sicherer Buchung auf Kiwi.com.',
      newItems: [
        {
          q: 'Was ist ein eintägiger Trip?',
          a: 'Ein Same-Day-Rückflug: morgens hin, den Tag in einer anderen europäischen Stadt verbringen und am selben Abend zurück — ohne Hotel und ohne Übernachtung. Auf euroweekender.com konzentrieren sich Tagestrips auf Samstage und Sonntage.'
        },
        {
          q: 'Was ist „Bester Wochenendpreis“?',
          a: '„Bester Wochenendpreis“ ist ein Zielkalender. Wählen Sie einen Abflughafen und eine europäische Stadt und vergleichen Sie kommende Wochenendpreise in einer Monatsansicht, um das günstigste Wochenende zu finden.'
        }
      ],
      whatIsAnswer:
        'Ein Suchtool für günstige europäische Kurztrips. Wir sammeln Hin- und Rückflug-Angebote für Wochenendaufenthalte und eintägige Städtetrips und lassen Sie nach Daten, Reisedauer und Abflugzeit filtern — oder Wochenendpreise zu einem Ziel vergleichen.'
    }
  },
  fr: {
    meta: {
      home: {
        description:
          'Comparez des vols week-end économiques en Europe, trouvez le week-end le moins cher vers n’importe quelle ville, ou réservez des escapades le samedi et le dimanche aller-retour le jour même. Partez le vendredi soir — ou allez et revenez le même jour — sans poser de congés.'
      },
      about: {
        description:
          'Vols week-end économiques en Europe, escapades d’une journée et calendriers de prix par destination — city breaks sans congés sur euroweekender.com.'
      },
      faq: {
        description:
          'FAQ sur les vols week-end économiques en Europe, les escapades d’une journée, les trajets ven–dim, les départs en soirée et la réservation via Kiwi.com.'
      },
      howItWorks: {
        description:
          'Comment trouver des vols week-end économiques et des escapades d’une journée : choisissez les aéroports, les week-ends ou samedis/dimanches, filtrez les départs du soir et réservez sur Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Escapades d’une journée en Europe',
        description:
          'Trouvez des escapades samedi et dimanche en Europe — départ le matin, retour le soir, sans nuitée. Comparez les vols aller-retour le jour même depuis les aéroports près de chez vous.'
      }
    },
    home: {
      seoTitle: 'Trouvez des vols week-end et escapades d’une journée en Europe',
      seoBlock:
        'Recherchez et comparez des vols week-end économiques depuis Prague, Vienne, Berlin, Munich, Londres, Barcelone et des dizaines d’aéroports européens. Filtrez ven–dim, jeu–dim et mer–dim, ajoutez les départs du soir, ou passez aux escapades samedi et dimanche le jour même — et découvrez des pauses sans utiliser de congés. Utilisez Meilleur prix week-end pour comparer les tarifs vers une destination sur un calendrier.'
    },
    singleDayTrips: {
      tagline: 'Départ matin · retour soir',
      title: 'Escapades d’une journée en Europe',
      subtitle: 'Parte le samedi ou dimanche matin, rentrez le même soir',
      lead: 'Partez après le petit-déjeuner, explorez une ville européenne et rentrez le même soir — pas d’hôtel, pas de nuitée.',
      travelDayHint: 'Choisissez samedi ou dimanche pour un départ le matin / retour le soir',
      scheduleSummary: 'Départ matin · retour soir',
      seoTitle: 'Trouvez des escapades européennes sans nuitée',
      seoBlock:
        'Vous cherchez une escapade d’une journée en Europe ? Choisissez vos aéroports de départ et des samedis ou dimanches pour des vols matin aller / soir retour. Comparez les offres des hubs proches, parcourez les prochains week-ends et réservez via Kiwi.com — idéal pour une journée à l’étranger sans hôtel.'
    },
    about: {
      heroSubtitle:
        'City breaks européens abordables autour de la semaine de travail — départ vendredi soir, retour dimanche, ou escapade le samedi.',
      lead: 'Nous aidons les Européens à découvrir des courts séjours abordables — départ vendredi soir, retour dimanche, ou aller-retour le même jour — sans poser de congés.',
      sections: {
        whatP:
          'euroweekender.com agrège des offres de vols Kiwi.com et les présente dans trois outils simples : deals week-end depuis vos aéroports, un calendrier du week-end le moins cher vers une ville européenne, et des escapades samedi/dimanche aller-retour le jour même. Choisissez aéroports et dates, comparez les prix et réservez chez le partenaire.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Quatre étapes simples du vol vendredi soir au retour dimanche — ou une escapade d’une journée — sans congés.',
      lead: 'Trouvez un week-end européen pas cher ou une escapade d’une journée en quatre étapes — départ vendredi soir, retour dimanche, ou aller-retour le samedi ou le dimanche.',
      builtP1:
        'euroweekender.com se concentre sur les courts aller-retour compatibles avec le travail. Prenez un vol vendredi soir après votre dernière réunion, passez le samedi dans une nouvelle ville et rentrez dimanche soir — deux nuits dehors, zéro jour de congé. Sans hôtel ? Utilisez les escapades d’une journée pour un départ le matin et un retour le soir le samedi ou le dimanche.',
      step2text:
        'Sélectionnez un ou plusieurs week-ends. Chaque pastille montre la plage de départ. Pour les escapades d’une journée, choisissez plutôt samedis ou dimanches.',
      tip5:
        'Ouvrez Meilleur prix week-end pour comparer chaque week-end à venir vers une ville, ou Excursions d’une journée pour des retours le jour même le samedi/dimanche.'
    },
    faq: {
      heroSubtitle:
        'Tout ce qu’il faut savoir sur les vols week-end économiques et les escapades d’une journée en Europe.',
      lead: 'Réponses sur les vols week-end en Europe, les escapades samedi/dimanche le jour même, les trajets ven–dim, les départs du soir et la réservation sécurisée sur Kiwi.com.',
      newItems: [
        {
          q: 'Qu’est-ce qu’une escapade d’une journée ?',
          a: 'Un aller-retour le jour même : départ le matin, journée dans une autre ville européenne, retour le même soir — sans hôtel ni nuitée. Sur euroweekender.com, ces escapades se concentrent sur les samedis et dimanches.'
        },
        {
          q: 'Qu’est-ce que « Meilleur prix week-end » ?',
          a: 'Meilleur prix week-end est un calendrier de destination. Choisissez un aéroport de départ et une ville européenne, puis comparez les tarifs des week-ends à venir sur une vue mensuelle pour repérer le week-end le moins cher.'
        }
      ],
      whatIsAnswer:
        'Un outil de recherche pour les courts séjours européens pas chers. Nous collectons des offres aller-retour pour les week-ends et les escapades d’une journée, et vous laissez filtrer par dates, durée et heure de départ — ou comparer les prix week-end vers une destination.'
    }
  },
  es: {
    meta: {
      home: {
        description:
          'Compara vuelos de fin de semana baratos por Europa, encuentra el fin de semana más barato a cualquier ciudad o reserva escapadas de sábado y domingo de ida y vuelta el mismo día. Sal el viernes por la noche — o ve y vuelve el mismo día — sin días de vacaciones.'
      },
      about: {
        description:
          'Vuelos de fin de semana baratos por Europa, escapadas de un día y calendarios de precios por destino — city breaks sin vacaciones en euroweekender.com.'
      },
      faq: {
        description:
          'FAQ sobre vuelos de fin de semana baratos por Europa, escapadas de un día, patrones vie–dom, salidas nocturnas y reserva a través de Kiwi.com.'
      },
      howItWorks: {
        description:
          'Cómo encontrar vuelos de fin de semana baratos y escapadas de un día: elige aeropuertos, fines de semana o sábados/domingos, filtra salidas nocturnas y reserva en Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Escapadas de un día por Europa',
        description:
          'Encuentra escapadas de sábado y domingo por Europa — salida por la mañana, regreso por la noche, sin pernoctar. Compara vuelos del mismo día desde aeropuertos cerca de ti.'
      }
    },
    home: {
      seoTitle: 'Encuentra vuelos de fin de semana y escapadas de un día por Europa',
      seoBlock:
        'Busca y compara vuelos de fin de semana baratos desde Praga, Viena, Berlín, Múnich, Londres, Barcelona y docenas de aeropuertos europeos. Filtra vie–dom, jue–dom y mié–dom, añade salidas nocturnas o pasa a escapadas de sábado y domingo el mismo día — y descubre pausas sin usar vacaciones. Usa Mejor precio de fin de semana para comparar tarifas a un destino en un calendario.'
    },
    singleDayTrips: {
      tagline: 'Salida mañana · regreso noche',
      title: 'Escapadas de un día por Europa',
      subtitle: 'Sal el sábado o domingo por la mañana y vuelve la misma noche',
      lead: 'Sal después del desayuno, explora una ciudad europea y vuelve a casa la misma noche — sin hotel, sin pernoctar.',
      travelDayHint: 'Elige sábado o domingo para salida mañana / regreso noche',
      scheduleSummary: 'Salida mañana · regreso noche',
      seoTitle: 'Encuentra escapadas europeas sin pernoctar',
      seoBlock:
        '¿Buscas una escapada de un día en Europa? Elige aeropuertos de salida y sábados o domingos para vuelos mañana ida / noche vuelta. Compara ofertas de hubs cercanos, revisa los próximos fines de semana y reserva con Kiwi.com — ideal para un día completo en el extranjero sin hotel.'
    },
    about: {
      heroSubtitle:
        'City breaks europeos asequibles alrededor de la semana laboral — salida viernes noche, regreso domingo, o una escapada el sábado.',
      lead: 'Ayudamos a los europeos a descubrir viajes cortos asequibles — salida viernes noche, regreso domingo, o ida y vuelta el mismo día — sin gastar días de vacaciones.',
      sections: {
        whatP:
          'euroweekender.com agrega ofertas de vuelos de Kiwi.com y las presenta en tres herramientas simples: ofertas de fin de semana desde tus aeropuertos, un calendario del fin de semana más barato a una ciudad europea, y escapadas sábado/domingo de ida y vuelta el mismo día. Elige aeropuertos y fechas, compara precios y reserva con el partner.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Cuatro pasos simples desde el vuelo del viernes noche hasta el regreso del domingo — o una escapada de un día — sin vacaciones.',
      lead: 'Encuentra un fin de semana europeo barato o una escapada de un día en cuatro pasos — salida viernes noche, regreso domingo, o ida y vuelta el sábado o domingo.',
      builtP1:
        'euroweekender.com se centra en vuelos cortos de ida y vuelta que encajan con el trabajo. Coge un vuelo el viernes noche tras tu última reunión, pasa el sábado en una ciudad nueva y vuelve el domingo por la noche — dos noches fuera, cero días de vacaciones. ¿Sin hotel? Usa escapadas de un día para salida mañana y regreso noche el sábado o domingo.',
      step2text:
        'Selecciona uno o más fines de semana. Cada pastilla muestra el rango de salida. En escapadas de un día, elige sábados o domingos.',
      tip5:
        'Abre Mejor precio de fin de semana para comparar cada fin de semana próximo a una ciudad, o Excursiones de un día para regresos el mismo día sábado/domingo.'
    },
    faq: {
      heroSubtitle:
        'Todo lo que necesitas saber sobre vuelos de fin de semana baratos y escapadas de un día por Europa.',
      lead: 'Respuestas sobre vuelos de fin de semana por Europa, escapadas sábado/domingo el mismo día, patrones vie–dom, salidas nocturnas y reserva segura en Kiwi.com.',
      newItems: [
        {
          q: '¿Qué es una escapada de un día?',
          a: 'Una ida y vuelta el mismo día: sale por la mañana, pasa el día en otra ciudad europea y vuelve la misma noche — sin hotel ni pernocta. En euroweekender.com, las escapadas de un día se centran en sábados y domingos.'
        },
        {
          q: '¿Qué es «Mejor precio de fin de semana»?',
          a: 'Mejor precio de fin de semana es un calendario de destino. Elige un aeropuerto de salida y una ciudad europea, y compara tarifas de fines de semana próximos en una vista mensual para encontrar el más barato.'
        }
      ],
      whatIsAnswer:
        'Una herramienta de búsqueda de viajes cortos baratos por Europa. Recopilamos ofertas de ida y vuelta para fines de semana y escapadas de un día, y te dejamos filtrar por fechas, duración y hora de salida — o comparar precios de fin de semana a un destino.'
    }
  },
  it: {
    meta: {
      home: {
        description:
          'Confronta voli weekend economici in Europa, trova il weekend più economico verso qualsiasi città o prenota gite sabato e domenica andata e ritorno lo stesso giorno. Parti venerdì sera — o vai e torni lo stesso giorno — senza ferie.'
      },
      about: {
        description:
          'Voli weekend economici in Europa, gite di un giorno e calendari prezzi per destinazione — city break senza ferie su euroweekender.com.'
      },
      faq: {
        description:
          'FAQ sui voli weekend economici in Europa, gite di un giorno, pattern ven–dom, partenze serali e prenotazione tramite Kiwi.com.'
      },
      howItWorks: {
        description:
          'Come trovare voli weekend economici e gite di un giorno: scegli aeroporti, weekend o sabati/domeniche, filtra le partenze serali e prenota su Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Gite di un giorno in Europa',
        description:
          'Trova gite sabato e domenica in Europa — partenza al mattino, ritorno la sera, senza pernottamento. Confronta voli same-day dagli aeroporti vicino a te.'
      }
    },
    home: {
      seoTitle: 'Trova voli weekend e gite di un giorno in Europa',
      seoBlock:
        'Cerca e confronta voli weekend economici da Praga, Vienna, Berlino, Monaco, Londra, Barcellona e decine di aeroporti europei. Filtra ven–dom, gio–dom e mer–dom, aggiungi partenze serali o passa alle gite sabato e domenica lo stesso giorno — e scopri pause senza usare ferie. Usa Miglior prezzo weekend per confrontare le tariffe verso una destinazione su un calendario.'
    },
    singleDayTrips: {
      tagline: 'Partenza mattina · ritorno sera',
      title: 'Gite di un giorno in Europa',
      subtitle: 'Parti sabato o domenica mattina, torna a casa la stessa sera',
      lead: 'Parti dopo colazione, esplora una città europea e vola a casa la stessa sera — niente hotel, niente pernottamento.',
      travelDayHint: 'Scegli sabato o domenica per partenza mattina / ritorno sera',
      scheduleSummary: 'Partenza mattina · ritorno sera',
      seoTitle: 'Trova gite europee senza pernottamento',
      seoBlock:
        'Cerchi una gita di un giorno in Europa? Scegli gli aeroporti di partenza e sabati o domeniche per voli mattina andata / sera ritorno. Confronta le offerte degli hub vicini, scorri i prossimi weekend e prenota tramite Kiwi.com — ideale per una giornata all’estero senza hotel.'
    },
    about: {
      heroSubtitle:
        'City break europei accessibili intorno alla settimana lavorativa — partenza venerdì sera, ritorno domenica, o una gita il sabato.',
      lead: 'Aiutiamo gli europei a scoprire viaggi brevi convenienti — partenza venerdì sera, ritorno domenica, o andata e ritorno lo stesso giorno — senza consumare ferie.',
      sections: {
        whatP:
          'euroweekender.com aggrega offerte di voli da Kiwi.com e le presenta in tre strumenti semplici: offerte weekend dai tuoi aeroporti, un calendario del weekend più economico verso una città europea, e gite sabato/domenica andata e ritorno lo stesso giorno. Scegli aeroporti e date, confronta i prezzi e prenota con il partner.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Quattro passi semplici dal volo di venerdì sera al ritorno di domenica — o una gita di un giorno — senza ferie.',
      lead: 'Trova un weekend europeo economico o una gita di un giorno in quattro passi — partenza venerdì sera, ritorno domenica, o andata e ritorno sabato o domenica.',
      builtP1:
        'euroweekender.com si concentra su andata e ritorno brevi che rientrano nel lavoro. Prendi un volo venerdì sera dopo l’ultima riunione, passa il sabato in una nuova città e torna domenica sera — due notti fuori, zero giorni di ferie. Preferisci senza hotel? Usa le gite di un giorno per partenza mattina e ritorno sera sabato o domenica.',
      step2text:
        'Seleziona uno o più weekend. Ogni pill mostra l’intervallo di partenza. Nelle gite di un giorno, scegli invece sabati o domeniche.',
      tip5:
        'Apri Miglior prezzo weekend per confrontare ogni weekend prossimo verso una città, o Gite di un giorno per ritorni same-day sabato/domenica.'
    },
    faq: {
      heroSubtitle:
        'Tutto ciò che serve sapere sui voli weekend economici e le gite di un giorno in Europa.',
      lead: 'Risposte sui voli weekend in Europa, gite sabato/domenica lo stesso giorno, pattern ven–dom, partenze serali e prenotazione sicura su Kiwi.com.',
      newItems: [
        {
          q: 'Cos’è una gita di un giorno?',
          a: 'Un andata e ritorno lo stesso giorno: parti al mattino, passi la giornata in un’altra città europea e torni la stessa sera — senza hotel né pernottamento. Su euroweekender.com le gite di un giorno si concentrano su sabati e domeniche.'
        },
        {
          q: 'Cos’è «Miglior prezzo weekend»?',
          a: 'Miglior prezzo weekend è un calendario destinazione. Scegli un aeroporto di partenza e una città europea, poi confronta le tariffe dei weekend prossimi in vista mensile per trovare il più economico.'
        }
      ],
      whatIsAnswer:
        'Uno strumento di ricerca per viaggi brevi economici in Europa. Raccogliamo offerte andata e ritorno per weekend e gite di un giorno e ti lasciamo filtrare per date, durata e orario di partenza — o confrontare i prezzi weekend verso una destinazione.'
    }
  },
  pl: {
    meta: {
      home: {
        description:
          'Porównuj tanie loty weekendowe po Europie, znajdź najtańszy weekend do dowolnego miasta lub rezerwuj jednodniowe wycieczki w sobotę i niedzielę. Wylot w piątek wieczorem — albo tam i z powrotem tego samego dnia — bez urlopu.'
      },
      about: {
        description:
          'Tanie loty weekendowe po Europie, jednodniowe wycieczki i kalendarze cen do destynacji — city breaki bez urlopu na euroweekender.com.'
      },
      faq: {
        description:
          'FAQ o tanich lotach weekendowych po Europie, wycieczkach jednodniowych, wzorcach pt–nd, wieczornych odlotach i rezerwacji przez Kiwi.com.'
      },
      howItWorks: {
        description:
          'Jak znaleźć tanie loty weekendowe i wycieczki jednodniowe: wybierz lotniska, weekendy lub soboty/niedziele, filtruj wieczorne odloty i rezerwuj na Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Jednodniowe wycieczki po Europie',
        description:
          'Znajdź sobotnie i niedzielne wycieczki po Europie — rano tam, wieczorem z powrotem, bez noclegu. Porównuj loty tego samego dnia z lotnisk w pobliżu.'
      }
    },
    home: {
      seoTitle: 'Znajdź tanie loty weekendowe i wycieczki jednodniowe po Europie',
      seoBlock:
        'Szukaj i porównuj tanie loty weekendowe z Pragi, Wiednia, Berlina, Monachium, Londynu, Barcelony i dziesiątek europejskich lotnisk. Filtruj pt–nd, cz–nd i śr–nd, dodaj wieczorne odloty lub przejdź do sobotnich i niedzielnych wycieczek jednodniowych — i odkrywaj przerwy bez urlopu. Użyj Najlepszej ceny weekendu, by porównać taryfy do jednego miasta w kalendarzu.'
    },
    singleDayTrips: {
      tagline: 'Rano tam · wieczorem z powrotem',
      title: 'Jednodniowe wycieczki po Europie',
      subtitle: 'Wylot w sobotę lub niedzielę rano, powrót tego samego wieczoru',
      lead: 'Wyrusz po śniadaniu, zwiedzaj europejskie miasto i wróć tego samego wieczoru — bez hotelu, bez noclegu.',
      travelDayHint: 'Wybierz sobotę lub niedzielę na lot rano / powrót wieczorem',
      scheduleSummary: 'Rano tam · wieczorem z powrotem',
      seoTitle: 'Znajdź europejskie wycieczki jednodniowe bez noclegu',
      seoBlock:
        'Szukasz jednodniowej wycieczki po Europie? Wybierz lotniska wylotu oraz soboty lub niedziele na loty rano tam / wieczorem z powrotem. Porównuj oferty pobliskich hubów, przeglądaj najbliższe weekendy i rezerwuj przez Kiwi.com — idealne na pełny dzień za granicą bez hotelu.'
    },
    about: {
      heroSubtitle:
        'Przystępne europejskie city breaki wokół tygodnia pracy — wylot w piątek wieczorem, powrót w niedzielę, albo jednodniowa sobota.',
      lead: 'Pomagamy Europejczykom znaleźć tanie krótkie wyjazdy — wylot w piątek wieczorem, powrót w niedzielę albo tam i z powrotem tego samego dnia — bez spalania urlopu.',
      sections: {
        whatP:
          'euroweekender.com agreguje oferty lotów z Kiwi.com i pokazuje je w trzech prostych narzędziach: oferty weekendowe z Twoich lotnisk, kalendarz najtańszego weekendu do jednego miasta oraz sobotnio-niedzielne wycieczki jednodniowe. Wybierz lotniska i daty, porównaj ceny i rezerwuj u partnera.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Cztery proste kroki od lotu w piątek wieczorem do powrotu w niedzielę — albo jednodniowej wycieczki — bez urlopu.',
      lead: 'Znajdź tani europejski weekend lub jednodniową wycieczkę w czterech krokach — wylot w piątek wieczorem, powrót w niedzielę, albo tam i z powrotem w sobotę lub niedzielę.',
      builtP1:
        'euroweekender.com skupia się na krótkich lotach w obie strony dopasowanych do pracy. Weź lot w piątek wieczorem po ostatnim spotkaniu, spędź sobotę w nowym mieście i wróć w niedzielę wieczorem — dwie noce poza domem, zero dni urlopu. Bez hotelu? Użyj wycieczek jednodniowych: rano tam, wieczorem z powrotem w sobotę lub niedzielę.',
      step2text:
        'Wybierz jeden lub więcej weekendów. Każda kapsułka pokazuje zakres wylotu. Przy wycieczkach jednodniowych wybierz soboty lub niedziele.',
      tip5:
        'Otwórz Najlepszą cenę weekendu, by porównać każdy nadchodzący weekend do jednego miasta, albo Wycieczki jednodniowe na sobotnio-niedzielne powroty tego samego dnia.'
    },
    faq: {
      heroSubtitle:
        'Wszystko, co musisz wiedzieć o tanich lotach weekendowych i wycieczkach jednodniowych po Europie.',
      lead: 'Odpowiedzi o tanich lotach weekendowych po Europie, sobotnio-niedzielnych wycieczkach jednodniowych, wzorcach pt–nd, wieczornych odlotach i bezpiecznej rezerwacji na Kiwi.com.',
      newItems: [
        {
          q: 'Czym jest wycieczka jednodniowa?',
          a: 'Lot w obie strony tego samego dnia: rano wylot, dzień w innym europejskim mieście i powrót wieczorem — bez hotelu i bez noclegu. Na euroweekender.com wycieczki jednodniowe obejmują soboty i niedziele.'
        },
        {
          q: 'Czym jest „Najlepsza cena weekendu”?',
          a: 'Najlepsza cena weekendu to kalendarz destynacji. Wybierz lotnisko wylotu i europejskie miasto, potem porównaj nadchodzące ceny weekendowe w widoku miesiąca, by znaleźć najtańszy weekend.'
        }
      ],
      whatIsAnswer:
        'Narzędzie wyszukiwania tanich krótkich wyjazdów po Europie. Zbieramy oferty w obie strony na weekendy i wycieczki jednodniowe oraz pozwalamy filtrować po datach, długości i godzinie wylotu — albo porównywać ceny weekendowe do jednej destynacji.'
    }
  },
  nl: {
    meta: {
      home: {
        description:
          'Vergelijk goedkope Europese weekendvluchten, vind het goedkoopste weekend naar elke stad of boek zaterdag- en zondagtrips heen en terug op dezelfde dag. Vertrek vrijdagavond — of heen en terug op één dag — zonder vakantiedagen.'
      },
      about: {
        description:
          'Goedkope Europese weekendvluchten, dagtrips en bestemmingsprijskalenders — citybreaks zonder vakantiedagen op euroweekender.com.'
      },
      faq: {
        description:
          'FAQ over goedkope Europese weekendvluchten, dagtrips, vr–zo-patronen, avondvertrekken en boeken via Kiwi.com.'
      },
      howItWorks: {
        description:
          'Zo vind je goedkope Europese weekendvluchten en dagtrips: kies luchthavens, weekenden of zaterdagen/zondagen, filter avondvertrekken en boek op Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Dagtrips door Europa',
        description:
          'Vind zaterdag- en zondagtrips door Europa — ’s ochtends heen, ’s avonds terug, zonder overnachting. Vergelijk same-day vluchten vanaf luchthavens bij jou in de buurt.'
      }
    },
    home: {
      seoTitle: 'Vind goedkope weekendvluchten en dagtrips door Europa',
      seoBlock:
        'Zoek en vergelijk goedkope weekendvluchten vanaf Praag, Wenen, Berlijn, München, Londen, Barcelona en tientallen Europese luchthavens. Filter vr–zo, do–zo en wo–zo, voeg avondvertrekken toe of schakel over naar zaterdag- en zondagtrips op dezelfde dag — en ontdek breaks zonder vakantiedagen. Gebruik Beste weekendprijs om tarieven naar één bestemming op een kalender te vergelijken.'
    },
    singleDayTrips: {
      tagline: '’s Ochtends heen · ’s avonds terug',
      title: 'Dagtrips door Europa',
      subtitle: 'Vlieg zaterdag of zondag ’s ochtends weg, kom dezelfde avond terug',
      lead: 'Vertrek na het ontbijt, verken een Europese stad en vlieg dezelfde avond terug — geen hotel, geen overnachting.',
      travelDayHint: 'Kies zaterdag of zondag voor ochtend heen / avond terug',
      scheduleSummary: '’s Ochtends heen · ’s avonds terug',
      seoTitle: 'Vind Europese dagtrips zonder overnachting',
      seoBlock:
        'Op zoek naar een dagtrip in Europa? Kies vertrekluchthavens en zaterdagen of zondagen voor ochtend-heen, avond-terug vluchten. Vergelijk deals van nabije hubs, scan de komende weekenddagen en boek via Kiwi.com — ideaal voor een volle dag in het buitenland zonder hotel.'
    },
    about: {
      heroSubtitle:
        'Betaalbare Europese citybreaks rond je werkweek — vrijdagavond weg, zondag terug, of een zaterdagdagtrip.',
      lead: 'We helpen Europeanen goedkope korte trips te vinden — vrijdagavond weg, zondag terug, of heen en terug op dezelfde dag — zonder vakantiedagen op te maken.',
      sections: {
        whatP:
          'euroweekender.com aggregeert vluchtdeals van Kiwi.com en toont ze in drie eenvoudige tools: weekenddeals vanaf jouw luchthavens, een kalender voor het goedkoopste weekend naar één Europese stad, en zaterdag/zondag same-day citytrips. Kies luchthavens en data, vergelijk prijzen en boek bij de partner.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Vier eenvoudige stappen van vrijdagavondvlucht tot zondagterugkomst — of een dagtrip — zonder vakantiedagen.',
      lead: 'Vind een goedkope Europese weekendtrip of dagtrip in vier stappen — vrijdagavond weg, zondag terug, of heen en terug op zaterdag of zondag.',
      builtP1:
        'euroweekender.com focust op korte retourvluchten die om werk heen passen. Neem na je laatste meeting een vrijdagavondvlucht, breng zaterdag door in een nieuwe stad en vlieg zondagavond terug — twee nachten weg, nul vakantiedagen. Liever geen hotel? Gebruik dagtrips voor ochtend heen en avond terug op zaterdag of zondag.',
      step2text:
        'Selecteer een of meer weekenden. Elke pill toont het vertrekbereik. Bij dagtrips kies je zaterdagen of zondagen.',
      tip5:
        'Open Beste weekendprijs om elk komend weekend naar één stad te vergelijken, of Eendaagse trips voor same-day retour op zaterdag/zondag.'
    },
    faq: {
      heroSubtitle:
        'Alles wat je moet weten over goedkope Europese weekendvluchten en dagtrips.',
      lead: 'Antwoorden over goedkope weekendvluchten in Europa, zaterdag/zondag same-day trips, vr–zo-patronen, avondvertrekken en veilig boeken op Kiwi.com.',
      newItems: [
        {
          q: 'Wat is een dagtrip?',
          a: 'Een same-day retour: ’s ochtends heen, de dag in een andere Europese stad doorbrengen en dezelfde avond terug — zonder hotel of overnachting. Op euroweekender.com focussen dagtrips op zaterdagen en zondagen.'
        },
        {
          q: 'Wat is „Beste weekendprijs”?',
          a: 'Beste weekendprijs is een bestemmingskalender. Kies één vertrekluchthaven en één Europese stad, en vergelijk komende weekendtarieven in een maandweergave om het goedkoopste weekend te spotten.'
        }
      ],
      whatIsAnswer:
        'Een zoektool voor goedkope korte trips door Europa. We verzamelen retourdeals voor weekenden en dagtrips en laten je filteren op data, duur en vertrektijd — of weekendprijzen naar één bestemming vergelijken.'
    }
  },
  cs: {
    meta: {
      home: {
        description:
          'Porovnejte levné evropské víkendové lety, najděte nejlevnější víkend do libovolného města nebo rezervujte jednodenní sobotní a nedělní výlety. Odjezd v pátek večer — nebo tam a zpět tentýž den — bez dovolené.'
      },
      about: {
        description:
          'Levné evropské víkendové lety, jednodenní výlety a cenové kalendáře destinací — city breaky bez dovolené na euroweekender.com.'
      },
      faq: {
        description:
          'FAQ o levných evropských víkendových letech, jednodenních výletech, vzorech pá–ne, večerních odletech a rezervaci přes Kiwi.com.'
      },
      howItWorks: {
        description:
          'Jak najít levné evropské víkendové lety a jednodenní výlety: vyberte letiště, víkendy nebo soboty/neděle, filtrujte večerní odlety a rezervujte na Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Jednodenní výlety po Evropě',
        description:
          'Najděte sobotní a nedělní výlety po Evropě — ráno tam, večer zpět, bez přenocování. Porovnejte lety téhož dne z letišť poblíž vás.'
      }
    },
    home: {
      seoTitle: 'Najděte levné víkendové lety a jednodenní výlety po Evropě',
      seoBlock:
        'Hledejte a porovnávejte levné víkendové lety z Prahy, Vídně, Berlína, Mnichova, Londýna, Barcelony a desítek evropských letišť. Filtrujte pá–ne, čt–ne a st–ne, přidejte večerní odlety nebo přepněte na sobotní a nedělní jednodenní výlety — a objevte pauzy bez dovolené. Použijte Nejlepší víkendovou cenu k porovnání tarifů do jednoho města v kalendáři.'
    },
    singleDayTrips: {
      tagline: 'Ráno tam · večer zpět',
      title: 'Jednodenní výlety po Evropě',
      subtitle: 'Odlet v sobotu nebo neděli ráno, návrat tentýž večer',
      lead: 'Vyrazte po snídani, prozkoumejte evropské město a vraťte se tentýž večer — bez hotelu, bez přenocování.',
      travelDayHint: 'Vyberte sobotu nebo neděli pro odlet ráno / návrat večer',
      scheduleSummary: 'Ráno tam · večer zpět',
      seoTitle: 'Najděte evropské jednodenní výlety bez přenocování',
      seoBlock:
        'Hledáte jednodenní výlet po Evropě? Vyberte odletová letiště a soboty nebo neděle pro lety ráno tam / večer zpět. Porovnejte nabídky blízkých hubů, projděte nejbližší víkendy a rezervujte přes Kiwi.com — ideální na celý den v zahraničí bez hotelu.'
    },
    about: {
      heroSubtitle:
        'Dostupné evropské city breaky kolem pracovního týdne — pátek večer pryč, neděle zpět, nebo sobotní jednodenní výlet.',
      lead: 'Pomáháme Evropanům objevovat levné krátké cesty — pátek večer pryč, neděle zpět, nebo tam a zpět tentýž den — bez spotřeby dovolené.',
      sections: {
        whatP:
          'euroweekender.com agreguje nabídky letů z Kiwi.com a ukazuje je ve třech jednoduchých nástrojích: víkendové nabídky z vašich letišť, kalendář nejlevnějšího víkendu do jednoho evropského města a sobotní/nedělní jednodenní výlety. Vyberte letiště a data, porovnejte ceny a rezervujte u partnera.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Čtyři jednoduché kroky od pátečního večerního letu k nedělnímu návratu — nebo jednodennímu výletu — bez dovolené.',
      lead: 'Najděte levný evropský víkend nebo jednodenní výlet ve čtyřech krocích — pátek večer pryč, neděle zpět, nebo tam a zpět v sobotu či neděli.',
      builtP1:
        'euroweekender.com se soustředí na krátké lety tam a zpět kolem práce. Po poslední schůzce vezměte páteční večerní let, sobotu stravte v novém městě a vraťte se v neděli večer — dvě noci pryč, nula dnů dovolené. Bez hotelu? Použijte jednodenní výlety: ráno tam, večer zpět v sobotu nebo neděli.',
      step2text:
        'Vyberte jeden nebo více víkendů. Každá pilulka ukazuje rozsah odletu. U jednodenních výletů volte soboty nebo neděle.',
      tip5:
        'Otevřete Nejlepší víkendovou cenu pro porovnání každého nadcházejícího víkendu do jednoho města, nebo Jednodenní výlety pro sobotní/nedělní návraty téhož dne.'
    },
    faq: {
      heroSubtitle:
        'Vše, co potřebujete vědět o levných evropských víkendových letech a jednodenních výletech.',
      lead: 'Odpovědi o levných víkendových letech po Evropě, sobotních/nedělních jednodenních výletech, vzorech pá–ne, večerních odletech a bezpečné rezervaci na Kiwi.com.',
      newItems: [
        {
          q: 'Co je jednodenní výlet?',
          a: 'Let tam a zpět tentýž den: ráno odlet, den v jiném evropském městě a návrat večer — bez hotelu a bez přenocování. Na euroweekender.com se jednodenní výlety zaměřují na soboty a neděle.'
        },
        {
          q: 'Co je „Nejlepší víkendová cena“?',
          a: 'Nejlepší víkendová cena je kalendář destinace. Vyberte odletové letiště a evropské město a porovnejte nadcházející víkendové tarify v měsíčním přehledu, abyste našli nejlevnější víkend.'
        }
      ],
      whatIsAnswer:
        'Vyhledávací nástroj pro levné krátké cesty po Evropě. Sbíráme nabídky tam a zpět na víkendy a jednodenní výlety a necháme vás filtrovat podle dat, délky a času odletu — nebo porovnávat víkendové ceny do jedné destinace.'
    }
  }
};

/** Full translations for remaining high-traffic locales */
const more = {
  pt: {
    meta: {
      home: {
        description:
          'Compare voos de fim de semana baratos na Europa, encontre o fim de semana mais barato para qualquer cidade ou reserve escapadas de sábado e domingo de ida e volta no mesmo dia. Saia sexta à noite — ou vá e volte no mesmo dia — sem férias.'
      },
      about: {
        description:
          'Voos de fim de semana baratos na Europa, escapadas de um dia e calendários de preços por destino — city breaks sem férias em euroweekender.com.'
      },
      faq: {
        description:
          'FAQ sobre voos de fim de semana baratos na Europa, escapadas de um dia, padrões sex–dom, partidas noturnas e reserva via Kiwi.com.'
      },
      howItWorks: {
        description:
          'Como encontrar voos de fim de semana baratos e escapadas de um dia: escolha aeroportos, fins de semana ou sábados/domingos, filtre partidas noturnas e reserve no Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Escapadas de um dia na Europa',
        description:
          'Encontre escapadas de sábado e domingo na Europa — saída de manhã, regresso à noite, sem pernoita. Compare voos no mesmo dia a partir de aeroportos perto de si.'
      }
    },
    home: {
      seoTitle: 'Encontre voos de fim de semana e escapadas de um dia na Europa',
      seoBlock:
        'Pesquise e compare voos de fim de semana baratos a partir de Praga, Viena, Berlim, Munique, Londres, Barcelona e dezenas de aeroportos europeus. Filtre sex–dom, qui–dom e qua–dom, adicione partidas noturnas ou mude para escapadas de sábado e domingo no mesmo dia — e descubra pausas sem usar férias. Use Melhor preço de fim de semana para comparar tarifas para um destino num calendário.'
    },
    singleDayTrips: {
      tagline: 'Saída manhã · regresso noite',
      title: 'Escapadas de um dia na Europa',
      subtitle: 'Saia sábado ou domingo de manhã e volte na mesma noite',
      lead: 'Saia após o pequeno-almoço, explore uma cidade europeia e volte a casa na mesma noite — sem hotel, sem pernoita.',
      travelDayHint: 'Escolha sábado ou domingo para saída de manhã / regresso à noite',
      scheduleSummary: 'Saída manhã · regresso noite',
      seoTitle: 'Encontre escapadas europeias sem pernoita',
      seoBlock:
        'Procura uma escapada de um dia na Europa? Escolha aeroportos de partida e sábados ou domingos para voos manhã ida / noite volta. Compare ofertas de hubs próximos, veja os próximos fins de semana e reserve via Kiwi.com — ideal para um dia completo no estrangeiro sem hotel.'
    },
    about: {
      heroSubtitle:
        'City breaks europeus acessíveis à volta da semana de trabalho — saída sexta à noite, regresso domingo, ou uma escapada no sábado.',
      lead: 'Ajudamos europeus a descobrir viagens curtas acessíveis — saída sexta à noite, regresso domingo, ou ida e volta no mesmo dia — sem gastar férias.',
      sections: {
        whatP:
          'euroweekender.com agrega ofertas de voos da Kiwi.com e apresenta-as em três ferramentas simples: ofertas de fim de semana dos seus aeroportos, um calendário do fim de semana mais barato para uma cidade europeia, e escapadas sábado/domingo de ida e volta no mesmo dia. Escolha aeroportos e datas, compare preços e reserve com o parceiro.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Quatro passos simples do voo de sexta à noite ao regresso de domingo — ou uma escapada de um dia — sem férias.',
      lead: 'Encontre um fim de semana europeu barato ou uma escapada de um dia em quatro passos — saída sexta à noite, regresso domingo, ou ida e volta no sábado ou domingo.',
      builtP1:
        'euroweekender.com foca-se em voos curtos de ida e volta que cabem no trabalho. Apanhe um voo sexta à noite após a última reunião, passe o sábado numa cidade nova e volte domingo à noite — duas noites fora, zero dias de férias. Sem hotel? Use escapadas de um dia para saída de manhã e regresso à noite no sábado ou domingo.',
      step2text:
        'Selecione um ou mais fins de semana. Cada pastilha mostra o intervalo de partida. Em escapadas de um dia, escolha sábados ou domingos.',
      tip5:
        'Abra Melhor preço de fim de semana para comparar cada fim de semana próximo para uma cidade, ou Viagens de um dia para regressos no mesmo dia sábado/domingo.'
    },
    faq: {
      heroSubtitle:
        'Tudo o que precisa de saber sobre voos de fim de semana baratos e escapadas de um dia na Europa.',
      lead: 'Respostas sobre voos de fim de semana na Europa, escapadas sábado/domingo no mesmo dia, padrões sex–dom, partidas noturnas e reserva segura no Kiwi.com.',
      newItems: [
        {
          q: 'O que é uma escapada de um dia?',
          a: 'Uma ida e volta no mesmo dia: sai de manhã, passa o dia noutra cidade europeia e volta na mesma noite — sem hotel nem pernoita. No euroweekender.com, as escapadas de um dia focam-se em sábados e domingos.'
        },
        {
          q: 'O que é «Melhor preço de fim de semana»?',
          a: 'Melhor preço de fim de semana é um calendário de destino. Escolha um aeroporto de partida e uma cidade europeia e compare tarifas dos próximos fins de semana numa vista mensal para encontrar o mais barato.'
        }
      ],
      whatIsAnswer:
        'Uma ferramenta de pesquisa para viagens curtas baratas na Europa. Recolhemos ofertas de ida e volta para fins de semana e escapadas de um dia e deixamos filtrar por datas, duração e hora de partida — ou comparar preços de fim de semana para um destino.'
    }
  },
  sk: {
    meta: {
      home: {
        description:
          'Porovnajte lacné európske víkendové lety, nájdite najlacnejší víkend do ľubovoľného mesta alebo rezervujte jednodňové sobotné a nedeľné výlety. Odlet v piatok večer — alebo tam a späť v ten istý deň — bez dovolenky.'
      },
      about: {
        description:
          'Lacné európske víkendové lety, jednodňové výlety a cenové kalendáre destinácií — city breaky bez dovolenky na euroweekender.com.'
      },
      faq: {
        description:
          'FAQ o lacných európskych víkendových letoch, jednodňových výletoch, vzoroch pia–ne, večerných odletoch a rezervácii cez Kiwi.com.'
      },
      howItWorks: {
        description:
          'Ako nájsť lacné európske víkendové lety a jednodňové výlety: vyberte letiská, víkendy alebo soboty/nedele, filtrujte večerné odlety a rezervujte na Kiwi.com.'
      },
      singleDayTrips: {
        title: 'Jednodňové výlety po Európe',
        description:
          'Nájdite sobotné a nedeľné výlety po Európe — ráno tam, večer späť, bez prenocovania. Porovnajte lety v ten istý deň z letísk blízko vás.'
      }
    },
    home: {
      seoTitle: 'Nájdite lacné víkendové lety a jednodňové výlety po Európe',
      seoBlock:
        'Hľadajte a porovnávajte lacné víkendové lety z Prahy, Viedne, Berlína, Mníchova, Londýna, Barcelony a desiatok európskych letísk. Filtrujte pia–ne, št–ne a st–ne, pridajte večerné odlety alebo prepnite na sobotné a nedeľné jednodňové výlety — a objavte prestávky bez dovolenky. Použite Najlepšiu víkendovú cenu na porovnanie taríf do jedného mesta v kalendári.'
    },
    singleDayTrips: {
      tagline: 'Ráno tam · večer späť',
      title: 'Jednodňové výlety po Európe',
      subtitle: 'Odlet v sobotu alebo nedeľu ráno, návrat v ten istý večer',
      lead: 'Vyrazte po raňajkách, preskúmajte európske mesto a vráťte sa v ten istý večer — bez hotela, bez prenocovania.',
      travelDayHint: 'Vyberte sobotu alebo nedeľu pre odlet ráno / návrat večer',
      scheduleSummary: 'Ráno tam · večer späť',
      seoTitle: 'Nájdite európske jednodňové výlety bez prenocovania',
      seoBlock:
        'Hľadáte jednodňový výlet po Európe? Vyberte odletové letiská a soboty alebo nedele pre lety ráno tam / večer späť. Porovnajte ponuky blízkych hubov, prejdite najbližšie víkendy a rezervujte cez Kiwi.com — ideálne na celý deň v zahraničí bez hotela.'
    },
    about: {
      heroSubtitle:
        'Dostupné európske city breaky okolo pracovného týždňa — piatok večer preč, nedeľa späť, alebo sobotný jednodňový výlet.',
      lead: 'Pomáhame Európanom objavovať lacné krátke cesty — piatok večer preč, nedeľa späť, alebo tam a späť v ten istý deň — bez spotreby dovolenky.',
      sections: {
        whatP:
          'euroweekender.com agreguje ponuky letov z Kiwi.com a ukazuje ich v troch jednoduchých nástrojoch: víkendové ponuky z vašich letísk, kalendár najlacnejšieho víkendu do jedného európskeho mesta a sobotné/nedeľné jednodňové výlety. Vyberte letiská a dátumy, porovnajte ceny a rezervujte u partnera.'
      }
    },
    howItWorks: {
      heroSubtitle:
        'Štyri jednoduché kroky od piatkového večerného letu k nedeľnému návratu — alebo jednodňovému výletu — bez dovolenky.',
      lead: 'Nájdite lacný európsky víkend alebo jednodňový výlet v štyroch krokoch — piatok večer preč, nedeľa späť, alebo tam a späť v sobotu či nedeľu.',
      builtP1:
        'euroweekender.com sa sústreďuje na krátke lety tam a späť okolo práce. Po poslednej schôdzke vezmite piatkový večerný let, sobotu strávte v novom meste a vráťte sa v nedeľu večer — dve noci preč, nula dní dovolenky. Bez hotela? Použite jednodňové výlety: ráno tam, večer späť v sobotu alebo nedeľu.',
      step2text:
        'Vyberte jeden alebo viac víkendov. Každá pilulka ukazuje rozsah odletu. Pri jednodňových výletoch voľte soboty alebo nedele.',
      tip5:
        'Otvorte Najlepšiu víkendovú cenu na porovnanie každého nadchádzajúceho víkendu do jedného mesta, alebo Jednodňové výlety pre sobotné/nedeľné návraty v ten istý deň.'
    },
    faq: {
      heroSubtitle:
        'Všetko, čo potrebujete vedieť o lacných európskych víkendových letoch a jednodňových výletoch.',
      lead: 'Odpovede o lacných víkendových letoch po Európe, sobotných/nedeľných jednodňových výletoch, vzoroch pia–ne, večerných odletoch a bezpečnej rezervácii na Kiwi.com.',
      newItems: [
        {
          q: 'Čo je jednodňový výlet?',
          a: 'Let tam a späť v ten istý deň: ráno odlet, deň v inom európskom meste a návrat večer — bez hotela a bez prenocovania. Na euroweekender.com sa jednodňové výlety zameriavajú na soboty a nedele.'
        },
        {
          q: 'Čo je „Najlepšia víkendová cena“?',
          a: 'Najlepšia víkendová cena je kalendár destinácie. Vyberte odletové letisko a európske mesto a porovnajte nadchádzajúce víkendové tarify v mesačnom prehľade, aby ste našli najlacnejší víkend.'
        }
      ],
      whatIsAnswer:
        'Vyhľadávací nástroj pre lacné krátke cesty po Európe. Zbierame ponuky tam a späť na víkendy a jednodňové výlety a necháme vás filtrovať podľa dátumov, dĺžky a času odletu — alebo porovnávať víkendové ceny do jednej destinácie.'
    }
  }
};

Object.assign(patches, more);

// Remaining languages with solid translations
const rest = {
  ro: makeRest(
    'ro',
    'Excursii de o zi în Europa',
    'Găsiți excursii de sâmbătă și duminică în Europa — dimineața dus, seara întors, fără cazare. Comparați zboruri în aceeași zi de pe aeroporturi aproape de dvs.',
    'Dimineața dus · seara întors',
    'Zburăți sâmbătă sau duminică dimineața, reveniți în aceeași seară',
    'Plecați după micul dejun, explorați un oraș european și zburați acasă în aceeași seară — fără hotel, fără cazare.',
    'Alegeți sâmbătă sau duminică pentru dus dimineața / întors seara',
    'Găsiți excursii europene fără cazare',
    'Căutați o excursie de o zi în Europa? Alegeți aeroporturile de plecare și sâmbete sau duminici pentru zboruri dimineața dus / seara întors. Comparați ofertele hub-urilor din apropiere, parcurgeți weekendurile următoare și rezervați prin Kiwi.com — ideal pentru o zi completă în străinătate fără hotel.',
    'Cel mai bun preț de weekend',
    'Excursii de o zi',
    'Ce este o excursie de o zi?',
    'Dus-întors în aceeași zi: decolare dimineața, ziua într-un alt oraș european și întoarcere seara — fără hotel și fără cazare. Pe euroweekender.com, excursiile de o zi se concentrează pe sâmbete și duminici.',
    'Ce este „Cel mai bun preț de weekend”?',
    'Cel mai bun preț de weekend este un calendar de destinație. Alegeți un aeroport de plecare și un oraș european, apoi comparați tarifele weekendurilor următoare într-o vedere lunară pentru a găsi cel mai ieftin weekend.',
    'Un instrument de căutare pentru călătorii scurte ieftine în Europa. Colectăm oferte dus-întors pentru weekenduri și excursii de o zi și vă lăsăm să filtrați după date, durată și ora plecării — sau să comparați prețurile de weekend către o destinație.'
  ),
  tr: makeRest(
    'tr',
    'Avrupa’da tek günlük geziler',
    'Avrupa’da Cumartesi ve Pazar günü gezileri bulun — sabah gidiş, akşam dönüş, geceleme yok. Yakınınızındaki havalimanlarından aynı gün uçuşları karşılaştırın.',
    'Sabah gidiş · akşam dönüş',
    'Cumartesi veya Pazar sabahı uçun, aynı akşam dönün',
    'Kahvaltıdan sonra çıkın, bir Avrupa şehrini keşfedin ve aynı akşam eve uçun — otel yok, geceleme yok.',
    'Sabah gidiş / akşam dönüş için Cumartesi veya Pazar seçin',
    'Gecelemesiz Avrupa günü gezileri bulun',
    'Avrupa’da tek günlük bir şehir gezisi mi arıyorsunuz? Kalkış havalimanlarınızı ve Cumartesi veya Pazar’ı sabah gidiş / akşam dönüş uçuşları için seçin. Yakın hub’lardaki fırsatları karşılaştırın, önümüzdeki hafta sonlarını tarayın ve Kiwi.com üzerinden rezervasyon yapın — otelsiz tam bir gün yurt dışı için ideal.',
    'En iyi hafta sonu fiyatı',
    'Tek günlük geziler',
    'Tek günlük gezi nedir?',
    'Aynı gün gidiş-dönüş: sabah uçuş, günü başka bir Avrupa şehrinde geçirme ve aynı akşam dönüş — otel ve geceleme yok. euroweekender.com’da tek günlük geziler Cumartesi ve Pazar’a odaklanır.',
    '“En iyi hafta sonu fiyatı” nedir?',
    'En iyi hafta sonu fiyatı bir destinasyon takvimidir. Bir kalkış havalimanı ve bir Avrupa şehri seçin, ardından en ucuz hafta sonunu bulmak için yaklaşan hafta sonu ücretlerini aylık görünümde karşılaştırın.',
    'Avrupa’da ucuz kısa geziler için bir arama aracı. Hafta sonları ve tek günlük geziler için gidiş-dönüş fırsatlarını toplar; tarih, süre ve kalkış saatiyle filtrelemenize — veya bir destinasyona hafta sonu fiyatlarını karşılaştırmanıza — izin verir.'
  ),
  hu: makeRest(
    'hu',
    'Egynapos városi kirándulások Európában',
    'Találjon szombati és vasárnapi egynapos utakat Európában — reggel oda, este vissza, éjszakázás nélkül. Hasonlítsa össze az egynapos járatokat a közeli reptérről.',
    'Reggel oda · este vissza',
    'Szombat vagy vasárnap reggel induljon, ugyanaznap este érjen haza',
    'Reggeli után induljon, fedezzen fel egy európai várost, és ugyanaznap este repüljön haza — szálloda nélkül, éjszakázás nélkül.',
    'Válasszon szombatot vagy vasárnapot reggeli induláshoz / esti visszatéréshez',
    'Találjon európai egynapos utakat éjszakázás nélkül',
    'Európai egynapos városi kirándulást keres? Válassza ki az induló reptéreket és a szombatokat vagy vasárnapokat reggel oda / este vissza járatokhoz. Hasonlítsa össze a közeli hubok ajánlatait, böngéssze a következő hétvégéket, és foglaljon a Kiwi.com-on — ideális egy teljes külföldi naphoz szálloda nélkül.',
    'Legjobb hétvégi ár',
    'Egynapos utak',
    'Mi az egynapos út?',
    'Ugyanaznapi oda-vissza: reggel indulás, nap egy másik európai városban, este vissza — szálloda és éjszakázás nélkül. Az euroweekender.com-on az egynapos utak szombatra és vasárnapra fókuszálnak.',
    'Mi a „Legjobb hétvégi ár”?',
    'A Legjobb hétvégi ár egy célállomás-naptár. Válasszon egy induló reptéri és egy európai várost, majd hasonlítsa össze a közelgő hétvégi díjakat havi nézetben, hogy megtalálja a legolcsóbb hétvégét.',
    'Keresőeszköz olcsó európai rövid utakhoz. Oda-vissza ajánlatokat gyűjtünk hétvégékre és egynapos utakra, és szűrhet dátum, időtartam és indulási idő szerint — vagy összehasonlíthatja egy célállomás hétvégi árait.'
  ),
  el: makeRest(
    'el',
    'Ημερήσιες εκδρομές στην Ευρώπη',
    'Βρείτε εκδρομές Σαββάτου και Κυριακής στην Ευρώπη — πρωί αναχώρηση, βράδυ επιστροφή, χωρίς διανυκτέρευση. Συγκρίνετε πτήσεις αυθημερόν από αεροδρόμια κοντά σας.',
    'Πρωί αναχώρηση · βράδυ επιστροφή',
    'Αναχωρήστε Σάββατο ή Κυριακή το πρωί, επιστρέψτε το ίδιο βράδυ',
    'Φύγετε μετά το πρωινό, εξερευνήστε μια ευρωπαϊκή πόλη και πετάξτε σπίτι το ίδιο βράδυ — χωρίς ξενοδοχείο, χωρίς διανυκτέρευση.',
    'Επιλέξτε Σάββατο ή Κυριακή για πρωινή αναχώρηση / βραδινή επιστροφή',
    'Βρείτε ευρωπαϊκές ημερήσιες εκδρομές χωρίς διανυκτέρευση',
    'Ψάχνετε ημερήσια εκδρομή στην Ευρώπη; Επιλέξτε αεροδρόμια αναχώρησης και Σάββατα ή Κυριακές για πτήσεις πρωί μετάβαση / βράδυ επιστροφή. Συγκρίνετε προσφορές κοντινών κόμβων, σαρώστε τα επόμενα Σαββατοκύριακα και κλείστε μέσω Kiwi.com — ιδανικό για μια γεμάτη μέρα στο εξωτερικό χωρίς ξενοδοχείο.',
    'Καλύτερη τιμή Σαββατοκύριακου',
    'Ημερήσιες εκδρομές',
    'Τι είναι η ημερήσια εκδρομή;',
    'Μετάβαση-επιστροφή αυθημερόν: πρωί αναχώρηση, μέρα σε άλλη ευρωπαϊκή πόλη και επιστροφή το ίδιο βράδυ — χωρίς ξενοδοχείο και χωρίς διανυκτέρευση. Στο euroweekender.com οι ημερήσιες εκδρομές εστιάζουν σε Σάββατα και Κυριακές.',
    'Τι είναι η «Καλύτερη τιμή Σαββατοκύριακου»;',
    'Η Καλύτερη τιμή Σαββατοκύριακου είναι ημερολόγιο προορισμού. Επιλέξτε αεροδρόμιο αναχώρησης και ευρωπαϊκή πόλη, μετά συγκρίνετε τις επερχόμενες τιμές Σαββατοκύριακου σε μηνιαία προβολή για να βρείτε το φθηνότερο.',
    'Εργαλείο αναζήτησης για φθηνά σύντομα ταξίδια στην Ευρώπη. Συλλέγουμε προσφορές μετάβασης-επιστροφής για Σαββατοκύριακα και ημερήσιες εκδρομές και σας αφήνουμε να φιλτράρετε κατά ημερομηνίες, διάρκεια και ώρα αναχώρησης — ή να συγκρίνετε τιμές Σαββατοκύριακου προς έναν προορισμό.'
  ),
  sv: makeRest(
    'sv',
    'Dagsresor i Europa',
    'Hitta lördags- och söndagsresor i Europa — ut på morgonen, hem på kvällen, utan övernattning. Jämför same-day-flyg från flygplatser nära dig.',
    'Ut på morgonen · hem på kvällen',
    'Flyg ut lördag eller söndag morgon, kom hem samma kväll',
    'Åk efter frukost, utforska en europeisk stad och flyg hem samma kväll — inget hotell, ingen övernattning.',
    'Välj lördag eller söndag för utresa morgon / hemresa kväll',
    'Hitta europeiska dagsresor utan övernattning',
    'Letar du efter en dagsresa i Europa? Välj avreseflygplatser och lördagar eller söndagar för morgon ut / kväll hem. Jämför erbjudanden från närliggande hubbar, bläddra kommande helger och boka via Kiwi.com — perfekt för en hel dag utomlands utan hotell.',
    'Bästa helgpris',
    'Dagsresor',
    'Vad är en dagsresa?',
    'Tur och retur samma dag: ut på morgonen, dagen i en annan europeisk stad och hem samma kväll — utan hotell och utan övernattning. På euroweekender.com fokuserar dagsresor på lördagar och söndagar.',
    'Vad är „Bästa helgpris”?',
    'Bästa helgpris är en destinationskalender. Välj en avreseflygplats och en europeisk stad, jämför sedan kommande helgpriser i månadsvy för att hitta den billigaste helgen.',
    'Ett sökverktyg för billiga korta resor i Europa. Vi samlar tur-och-retur-erbjudanden för helger och dagsresor och låter dig filtrera på datum, längd och avresetid — eller jämföra helgpriser till en destination.'
  ),
  da: makeRest(
    'da',
    'Dagsrejser i Europa',
    'Find lørdags- og søndagsrejser i Europa — ud om morgenen, hjem om aftenen, uden overnatning. Sammenlign same-day-fly fra lufthavne nær dig.',
    'Ud om morgenen · hjem om aftenen',
    'Flyv ud lørdag eller søndag morgen, kom hjem samme aften',
    'Tag afsted efter morgenmad, udforsk en europæisk by og flyv hjem samme aften — intet hotel, ingen overnatning.',
    'Vælg lørdag eller søndag til udrejse morgen / hjemrejse aften',
    'Find europæiske dagsrejser uden overnatning',
    'Leder du efter en dagsrejse i Europa? Vælg afrejselufthavne og lørdage eller søndage til morgen-ud / aften-hjem. Sammenlign tilbud fra nærliggende hubs, skim de kommende weekender og book via Kiwi.com — ideelt til en fuld dag i udlandet uden hotel.',
    'Bedste weekendpris',
    'Dagsrejser',
    'Hvad er en dagsrejse?',
    'Tur-retur samme dag: ud om morgenen, dagen i en anden europæisk by og hjem samme aften — uden hotel og uden overnatning. På euroweekender.com fokuserer dagsrejser på lørdage og søndage.',
    'Hvad er „Bedste weekendpris”?',
    'Bedste weekendpris er en destinationskalender. Vælg en afrejselufthavn og en europæisk by, og sammenlign kommende weekendpriser i månedsvisning for at finde den billigste weekend.',
    'Et søgeværktøj til billige korte rejser i Europa. Vi indsamler tur-retur-tilbud til weekender og dagsrejser og lader dig filtrere efter datoer, længde og afgangstid — eller sammenligne weekendpriser til én destination.'
  ),
  no: makeRest(
    'no',
    'Dagsreiser i Europa',
    'Finn lørdags- og søndagsreiser i Europa — ut om morgenen, hjem om kvelden, uten overnatting. Sammenlign same-day-fly fra flyplasser nær deg.',
    'Ut om morgenen · hjem om kvelden',
    'Fly ut lørdag eller søndag morgen, kom hjem samme kveld',
    'Dra etter frokost, utforsk en europeisk by og fly hjem samme kveld — ikke hotell, ikke overnatting.',
    'Velg lørdag eller søndag for utreise morgen / hjemreise kveld',
    'Finn europeiske dagsreiser uten overnatting',
    'Ser du etter en dagsreise i Europa? Velg avreiseflyplasser og lørdager eller søndager for morgen ut / kveld hjem. Sammenlign tilbud fra nærliggende hubber, bla gjennom kommende helger og bestill via Kiwi.com — ideelt for en hel dag i utlandet uten hotell.',
    'Beste helgepris',
    'Dagsreiser',
    'Hva er en dagsreise?',
    'Tur-retur samme dag: ut om morgenen, dagen i en annen europeisk by og hjem samme kveld — uten hotell og uten overnatting. På euroweekender.com fokuserer dagsreiser på lørdager og søndager.',
    'Hva er „Beste helgepris”?',
    'Beste helgepris er en destinasjonskalender. Velg en avreiseflyplass og en europeisk by, og sammenlign kommende helgepriser i månedsvisning for å finne den billigste helgen.',
    'Et søkeverktøy for billige korte turer i Europa. Vi samler tur-retur-tilbud for helger og dagsreiser og lar deg filtrere etter datoer, lengde og avgangstid — eller sammenligne helgepriser til én destinasjon.'
  ),
  fi: makeRest(
    'fi',
    'Päiväretket Euroopassa',
    'Löydä lauantai- ja sunnuntaimatkat Euroopassa — aamulla mennen, illalla takaisin, ilman yöpymistä. Vertaa saman päivän lentoja lähelläsi olevilta lentoasemilta.',
    'Aamulla mennen · illalla takaisin',
    'Lennä lauantaina tai sunnuntaina aamulla, palaa saman illan aikana',
    'Lähde aamiaisen jälkeen, tutustu eurooppalaiseen kaupunkiin ja lennä kotiin saman illan aikana — ei hotellia, ei yöpymistä.',
    'Valitse lauantai tai sunnuntai aamuulos / iltapaluu -matkoille',
    'Löydä eurooppalaisia päiväretkiä ilman yöpymistä',
    'Etsitkö päiväretkeä Euroopassa? Valitse lähtölentoasemat sekä lauantait tai sunnuntait aamuulos / iltapaluu -lennoille. Vertaa lähellä olevien hubien tarjouksia, selaa tulevia viikonloppuja ja varaa Kiwi.comin kautta — ihanteellinen täyteen päivään ulkomailla ilman hotellia.',
    'Paras viikonloppuhinta',
    'Päiväretket',
    'Mikä on päiväretki?',
    'Meno-paluu samana päivänä: aamulla lähtö, päivä toisessa eurooppalaisessa kaupungissa ja paluu illalla — ilman hotellia ja ilman yöpymistä. euroweekender.comissa päiväretket keskittyvät lauantaihin ja sunnuntaihin.',
    'Mikä on „Paras viikonloppuhinta”?',
    'Paras viikonloppuhinta on kohdekalenteri. Valitse lähtölentoasema ja eurooppalainen kaupunki, sitten vertaa tulevia viikonloppuhintoja kuukausinäkymässä löytääksesi edullisimman viikonlopun.',
    'Hakutyökalu edullisiin lyhyihin matkoihin Euroopassa. Keräämme meno-paluu-tarjouksia viikonlopuille ja päiväretkille ja annamme suodattaa päivämäärän, keston ja lähtöajan mukaan — tai vertailla viikonloppuhintoja yhteen kohteeseen.'
  ),
  uk: makeRest(
    'uk',
    'Одноденні поїздки Європою',
    'Знайдіть суботні та недільні поїздки Європою — вранці туди, ввечері назад, без ночівлі. Порівняйте рейси того самого дня з аеропортів поруч.',
    'Вранці туди · ввечері назад',
    'Виліт у суботу або неділю вранці, повернення того ж вечора',
    'Вирушайте після сніданку, досліджуйте європейське місто й повертайтеся того ж вечора — без готелю, без ночівлі.',
    'Оберіть суботу або неділю для вильоту вранці / повернення ввечері',
    'Знайдіть європейські одноденні поїздки без ночівлі',
    'Шукаєте одноденну поїздку Європою? Оберіть аеропорти вильоту та суботи або неділі для рейсів вранці туди / ввечері назад. Порівняйте пропозиції близьких хабів, перегляньте найближчі вихідні й бронюйте через Kiwi.com — ідеально для повного дня за кордоном без готелю.',
    'Найкраща ціна вихідних',
    'Одноденні поїздки',
    'Що таке одноденна поїздка?',
    'Туди й назад того самого дня: вранці виліт, день в іншому європейському місті й повернення ввечері — без готелю й без ночівлі. На euroweekender.com одноденні поїздки зосереджені на суботах і неділях.',
    'Що таке «Найкраща ціна вихідних»?',
    'Найкраща ціна вихідних — це календар напрямку. Оберіть аеропорт вильоту та європейське місто, потім порівняйте найближчі тарифи вихідних у місячному вигляді, щоб знайти найдешевші вихідні.',
    'Інструмент пошуку дешевих коротких поїздок Європою. Ми збираємо пропозиції туди й назад на вихідні та одноденні поїздки й дозволяємо фільтрувати за датами, тривалістю та часом вильоту — або порівнювати ціни вихідних до одного напрямку.'
  ),
  ru: makeRest(
    'ru',
    'Однодневные поездки по Европе',
    'Найдите субботние и воскресные поездки по Европе — утром туда, вечером обратно, без ночёвки. Сравните рейсы в тот же день из аэропортов рядом с вами.',
    'Утром туда · вечером обратно',
    'Вылет в субботу или воскресенье утром, возвращение тем же вечером',
    'Отправляйтесь после завтрака, исследуйте европейский город и летите домой тем же вечером — без отеля, без ночёвки.',
    'Выберите субботу или воскресенье для вылета утром / возвращения вечером',
    'Найдите европейские однодневные поездки без ночёвки',
    'Ищете однодневную поездку по Европе? Выберите аэропорты вылета и субботы или воскресенья для рейсов утром туда / вечером обратно. Сравните предложения ближайших хабов, просмотрите ближайшие выходные и бронируйте через Kiwi.com — идеально для полного дня за границей без отеля.',
    'Лучшая цена выходных',
    'Однодневные поездки',
    'Что такое однодневная поездка?',
    'Туда и обратно в тот же день: утром вылет, день в другом европейском городе и возвращение вечером — без отеля и без ночёвки. На euroweekender.com однодневные поездки сосредоточены на субботах и воскресеньях.',
    'Что такое «Лучшая цена выходных»?',
    'Лучшая цена выходных — календарь направления. Выберите аэропорт вылета и европейский город, затем сравните ближайшие тарифы выходных в месячном виде, чтобы найти самые дешёвые выходные.',
    'Инструмент поиска дешёвых коротких поездок по Европе. Мы собираем предложения туда и обратно на выходные и однодневные поездки и позволяем фильтровать по датам, длительности и времени вылета — или сравнивать цены выходных до одного направления.'
  ),
  bg: makeRest(
    'bg',
    'Еднодневни пътувания в Европа',
    'Намерете съботни и неделни пътувания в Европа — сутрин навън, вечер обратно, без нощувка. Сравнете полети в същия ден от летища близо до вас.',
    'Сутрин навън · вечер обратно',
    'Излетете в събота или неделя сутрин, върнете се същата вечер',
    'Тръгнете след закуска, разгледайте европейски град и се върнете същата вечер — без хотел, без нощувка.',
    'Изберете събота или неделя за сутрешен излет / вечерен връщане',
    'Намерете европейски еднодневни пътувания без нощувка',
    'Търсите еднодневно пътуване в Европа? Изберете летища за излитане и съботи или недели за полети сутрин навън / вечер обратно. Сравнете оферти от близки хъбове, прегледайте следващите уикенди и резервирайте чрез Kiwi.com — идеално за пълен ден в чужбина без хотел.',
    'Най-добра уикенд цена',
    'Еднодневни пътувания',
    'Какво е еднодневно пътуване?',
    'Отиване и връщане в същия ден: сутрин излет, ден в друг европейски град и връщане вечер — без хотел и без нощувка. В euroweekender.com еднодневните пътувания се фокусират върху съботи и недели.',
    'Какво е „Най-добра уикенд цена“?',
    'Най-добра уикенд цена е календар на дестинация. Изберете летище за излитане и европейски град, след това сравнете предстоящите уикенд тарифи в месечен изглед, за да намерите най-евтиния уикенд.',
    'Инструмент за търсене на евтини кратки пътувания в Европа. Събираме оферти отиване-връщане за уикенди и еднодневни пътувания и ви позволяваме да филтрирате по дати, продължителност и час на излитане — или да сравнявате уикенд цени към една дестинация.'
  ),
  lt: makeRest(
    'lt',
    'Vienos dienos kelionės Europoje',
    'Raskite šeštadienio ir sekmadienio keliones Europoje — ryte ten, vakare atgal, be nakvynės. Palyginkite tos pačios dienos skrydžius iš netoliese esančių oro uostų.',
    'Ryte ten · vakare atgal',
    'Išskriskite šeštadienį ar sekmadienį ryte, grįžkite tą patį vakarą',
    'Išvykite po pusryčių, tyrinėkite Europos miestą ir skriskite namo tą patį vakarą — be viešbučio, be nakvynės.',
    'Pasirinkite šeštadienį arba sekmadienį rytiniam išskridimui / vakarinėms grįžimui',
    'Raskite europietiškas vienos dienos keliones be nakvynės',
    'Ieškote vienos dienos kelionės Europoje? Pasirinkite išvykimo oro uostus ir šeštadienius ar sekmadienius rytiniams / vakariniams skrydžiams. Palyginkite artimų hubų pasiūlymus, peržiūrėkite artimiausius savaitgalius ir rezervuokite per Kiwi.com — idealu pilnai dienai užsienyje be viešbučio.',
    'Geriausia savaitgalio kaina',
    'Vienos dienos kelionės',
    'Kas yra vienos dienos kelionė?',
    'Į abi puses tą pačią dieną: ryte išskridimas, diena kitame Europos mieste ir grįžimas vakare — be viešbučio ir be nakvynės. euroweekender.com vienos dienos kelionės orientuotos į šeštadienius ir sekmadienius.',
    'Kas yra „Geriausia savaitgalio kaina“?',
    'Geriausia savaitgalio kaina yra paskirties kalendorius. Pasirinkite išvykimo oro uostą ir Europos miestą, tada palyginkite artėjančius savaitgalio tarifus mėnesio rodinyje, kad rastumėte pigiausią savaitgalį.',
    'Paieškos įrankis pigioms trumpoms kelionėms Europoje. Renkame į abi puses pasiūlymus savaitgaliams ir vienos dienos kelionėms ir leidžiame filtruoti pagal datas, trukmę ir išvykimo laiką — arba lyginti savaitgalio kainas į vieną kryptį.'
  ),
  lv: makeRest(
    'lv',
    'Vienas dienas braucieni Eiropā',
    'Atrodiet sestdienas un svētdienas braucienus Eiropā — no rīta turp, vakarā atpakaļ, bez nakšņošanas. Salīdziniet tās pašas dienas lidojumus no lidostām jums tuvumā.',
    'No rīta turp · vakarā atpakaļ',
    'Izlidojiet sestdienā vai svētdienā no rīta, atgriezieties tajā pašā vakarā',
    'Dodieties pēc brokastīm, izpētiet Eiropas pilsētu un lidojiet mājās tajā pašā vakarā — bez viesnīcas, bez nakšņošanas.',
    'Izvēlieties sestdienu vai svētdienu izlidošanai no rīta / atgriešanai vakarā',
    'Atrodiet Eiropas vienas dienas braucienus bez nakšņošanas',
    'Meklējat vienas dienas braucienu Eiropā? Izvēlieties izlidošanas lidostas un sestdienas vai svētdienas rīta turp / vakara atpakaļ lidojumiem. Salīdziniet tuvāko hubu piedāvājumus, pārlūkojiet nākamās nedēļas nogales un rezervējiet caur Kiwi.com — ideāli pilnai dienai ārzemēs bez viesnīcas.',
    'Labākā nedēļas nogales cena',
    'Vienas dienas braucieni',
    'Kas ir vienas dienas brauciens?',
    'Turp un atpakaļ tajā pašā dienā: no rīta izlidošana, diena citā Eiropas pilsētā un atgriešanās vakarā — bez viesnīcas un bez nakšņošanas. euroweekender.com vienas dienas braucieni koncentrējas uz sestdienām un svētdienām.',
    'Kas ir „Labākā nedēļas nogales cena”?',
    'Labākā nedēļas nogales cena ir galamērķa kalendārs. Izvēlieties izlidošanas lidostu un Eiropas pilsētu, pēc tam salīdziniet gaidāmās nedēļas nogales cenas mēneša skatā, lai atrastu lētāko nedēļas nogali.',
    'Meklēšanas rīks lētiem īsiem braucieniem Eiropā. Mēs apkopojam turp un atpakaļ piedāvājumus nedēļas nogalēm un vienas dienas braucieniem un ļaujam filtrēt pēc datumiem, ilguma un izlidošanas laika — vai salīdzināt nedēļas nogales cenas uz vienu galamērķi.'
  ),
  et: makeRest(
    'et',
    'Ühepäevareisid Euroopas',
    'Leidke laupäeva- ja pühapäevareise Euroopas — hommikul välja, õhtul tagasi, ilma ööbimata. Võrrelge sama päeva lende teie lähedal asuvatelt lennujaamadelt.',
    'Hommikul välja · õhtul tagasi',
    'Lennake laupäeval või pühapäeval hommikul välja, tulge sama õhtu tagasi',
    'Minge pärast hommikusööki, avastage Euroopa linna ja lennake koju sama õhtu — ilma hotellita, ilma ööbimata.',
    'Valige laupäev või pühapäev hommikuse väljalennu / õhtuse naasmise jaoks',
    'Leidke Euroopa ühepäevareise ilma ööbimata',
    'Otsite ühepäevareisi Euroopas? Valige väljalennu lennujaamad ning laupäevad või pühapäevad hommik välja / õhtu tagasi lendudeks. Võrrelge lähedaste hubide pakkumisi, sirvige eelseisvaid nädalavahetusi ja broneerige Kiwi.com kaudu — ideaalne täispäevaks välismaal ilma hotellita.',
    'Parim nädalavahetuse hind',
    'Ühepäevareisid',
    'Mis on ühepäevareis?',
    'Edasi-tagasi samal päeval: hommikul väljalend, päev teises Euroopa linnas ja naasmine õhtul — ilma hotellita ja ilma ööbimata. euroweekender.com ühepäevareisid keskenduvad laupäevadele ja pühapäevadele.',
    'Mis on „Parim nädalavahetuse hind”?',
    'Parim nädalavahetuse hind on sihtkoha kalender. Valige väljalennu lennujaam ja Euroopa linn, seejärel võrrelge eelseisvaid nädalavahetuse hindu kuukuvas, et leida odavaim nädalavahetus.',
    'Otsingutööriist odavate lühireiside jaoks Euroopas. Kogume edasi-tagasi pakkumisi nädalavahetusteks ja ühepäevareisideks ning laseme filtreerida kuupäeva, kestuse ja väljalennuaja järgi — või võrrelda nädalavahetuse hindu ühte sihtkohta.'
  ),
  is: makeRest(
    'is',
    'Dagsferðir um Evrópu',
    'Finndu laugardags- og sunnudagsferðir um Evrópu — út að morgni, heim að kvöldi, án gistingar. Berðu saman samdægursflug frá flugvöllum nálægt þér.',
    'Út að morgni · heim að kvöldi',
    'Farðu laugardag eða sunnudag að morgni, komdu heim sama kvöld',
    'Farðu eftir morgunmat, skoðaðu evrópska borg og fljúgðu heim sama kvöld — ekkert hótel, engin gisting.',
    'Veldu laugardag eða sunnudag fyrir útferð morgun / heimferð kvöld',
    'Finndu evrópskar dagsferðir án gistingar',
    'Leitarðu að dagsferð í Evrópu? Veldu brottfararflugvelli og laugardaga eða sunnudaga fyrir morgun út / kvöld heim. Berðu saman tilboð frá nálægum hubbum, skoðaðu næstu helgar og bókaðu í gegnum Kiwi.com — tilvalið fyrir heilan dag erlendis án hótels.',
    'Besta helgarverðið',
    'Dagsferðir',
    'Hvað er dagsferð?',
    'Út og heim sama dag: út að morgni, dagur í annarri evrópskri borg og heim sama kvöld — án hótels og án gistingar. Á euroweekender.com einbeita dagsferðir sér að laugardögum og sunnudögum.',
    'Hvað er „Besta helgarverðið”?',
    'Besta helgarverðið er áfangastaðsdagatal. Veldu brottfararflugvöll og evrópska borg, berðu síðan saman væntanleg helgarverð í mánaðaryfirliti til að finna ódýrustu helgina.',
    'Leitartól fyrir ódýrar stuttar ferðir um Evrópu. Við söfnum út-og-heim tilboðum fyrir helgar og dagsferðir og leyfum þér að sía eftir dagsetningum, lengd og brottfarartíma — eða bera saman helgarverð til eins áfangastaðar.'
  )
};

function makeRest(
  _code,
  dayTitle,
  dayDesc,
  tagline,
  subtitle,
  lead,
  travelDayHint,
  seoTitle,
  seoBlock,
  bestName,
  dayNav,
  faqDayQ,
  faqDayA,
  faqBestQ,
  faqBestA,
  whatIs
) {
  // Day-trip + FAQ/tip only — keep existing home/about/how-it-works hero copy.
  return {
    meta: {
      singleDayTrips: {
        title: dayTitle,
        description: dayDesc
      }
    },
    singleDayTrips: {
      tagline,
      title: dayTitle,
      subtitle,
      lead,
      travelDayHint,
      scheduleSummary: tagline,
      seoTitle,
      seoBlock
    },
    howItWorks: {
      tip5: `Open ${bestName} to compare every upcoming weekend to one city, or ${dayNav} for same-day Saturday/Sunday returns.`
    },
    faq: {
      newItems: [
        { q: faqDayQ, a: faqDayA },
        { q: faqBestQ, a: faqBestA }
      ],
      whatIsAnswer: whatIs
    }
  };
}

Object.assign(patches, rest);

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

function applyFaq(localeJson, faqPatch) {
  if (!faqPatch || !localeJson.faq) return;
  if (faqPatch.heroSubtitle) localeJson.faq.heroSubtitle = faqPatch.heroSubtitle;
  if (faqPatch.lead) localeJson.faq.lead = faqPatch.lead;
  if (!Array.isArray(localeJson.faq.items)) return;

  if (faqPatch.whatIsAnswer) {
    const idx = localeJson.faq.items.findIndex(item => /euroweekender\.com/i.test(item.q));
    if (idx >= 0) localeJson.faq.items[idx].a = faqPatch.whatIsAnswer;
  }

  if (Array.isArray(faqPatch.newItems)) {
    for (const item of [...faqPatch.newItems].reverse()) {
      if (!localeJson.faq.items.some(existing => existing.q === item.q)) {
        localeJson.faq.items.splice(1, 0, item);
      }
    }
  }
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
  const { faq, ...restPatch } = patch;
  deepMerge(json, restPatch);
  applyFaq(json, faq);
  fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n');
  console.log('patched', file);
}

console.log('done');
