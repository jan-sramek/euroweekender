import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE } from '../config/locales';
import bg from '../locales/bg.json';
import cs from '../locales/cs.json';
import da from '../locales/da.json';
import de from '../locales/de.json';
import el from '../locales/el.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import et from '../locales/et.json';
import fi from '../locales/fi.json';
import fr from '../locales/fr.json';
import hu from '../locales/hu.json';
import is from '../locales/is.json';
import it from '../locales/it.json';
import lt from '../locales/lt.json';
import lv from '../locales/lv.json';
import nl from '../locales/nl.json';
import no from '../locales/no.json';
import pl from '../locales/pl.json';
import pt from '../locales/pt.json';
import ro from '../locales/ro.json';
import ru from '../locales/ru.json';
import sk from '../locales/sk.json';
import sv from '../locales/sv.json';
import tr from '../locales/tr.json';
import uk from '../locales/uk.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    pl: { translation: pl },
    nl: { translation: nl },
    ro: { translation: ro },
    tr: { translation: tr },
    pt: { translation: pt },
    cs: { translation: cs },
    hu: { translation: hu },
    el: { translation: el },
    sv: { translation: sv },
    uk: { translation: uk },
    ru: { translation: ru },
    bg: { translation: bg },
    da: { translation: da },
    fi: { translation: fi },
    sk: { translation: sk },
    no: { translation: no },
    lt: { translation: lt },
    lv: { translation: lv },
    et: { translation: et },
    is: { translation: is }
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  pluralSeparator: '_'
});

export default i18n;
