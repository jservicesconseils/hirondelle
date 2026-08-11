import { EventDTO } from '../services/api/model/eventDTO';

/**
 * Mise en forme partagée par toutes les pages publiques (accueil, détail,
 * réservation, billet), pour qu'un même événement s'y présente à l'identique.
 *
 * Règle appliquée partout : rien n'est inventé. Un champ absent produit `null`,
 * et c'est au gabarit de ne pas afficher la ligne.
 */

/** Identité visuelle d'une catégorie : icône, couleur pleine, teinte et dégradé. */
export interface CategoryStyle {
  icon: string;
  /** Couleur pleine : icônes, étiquettes, texte. */
  color: string;
  /** Teinte claire unie, pour le fond des étiquettes. */
  tint: string;
  /** Dégradé clair du fond de tuile : deux teintes proches, jamais un aplat. */
  surface: string;
  /** Bordure de la tuile, dans la couleur de la catégorie très diluée. */
  border: string;
  /** Dégradé à trois teintes occupant l'emplacement du visuel. */
  gradient: string;
  /** Illustration servie depuis `public/media`, utilisée faute de photo. */
  illustration: string;
}

/**
 * Une couleur par catégorie, reprise partout : pastille de la tuile, étiquette de
 * la carte, et dégradé de l'emplacement du visuel. Dès qu'un organisateur joint une
 * photo à son événement, celle-ci remplace l'illustration sans autre changement.
 */
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  // Corail
  Conférence: {
    icon: 'pi-megaphone',
    color: '#dc4a22',
    tint: '#ffede5',
    surface: 'linear-gradient(150deg, #fff4ee 0%, #ffe0d0 100%)',
    border: 'rgba(220, 74, 34, 0.22)',
    gradient: 'linear-gradient(140deg, #ff9a6b 0%, #e0491c 55%, #b8320d 100%)',
    illustration: 'media/categories/conference.svg'
  },
  // Violet
  Atelier: {
    icon: 'pi-palette',
    color: '#6d3be4',
    tint: '#f1ebff',
    surface: 'linear-gradient(150deg, #f6f1ff 0%, #e6daff 100%)',
    border: 'rgba(109, 59, 228, 0.22)',
    gradient: 'linear-gradient(140deg, #b79bff 0%, #7a4bec 55%, #4c1fb8 100%)',
    illustration: 'media/categories/atelier.svg'
  },
  // Émeraude
  Séminaire: {
    icon: 'pi-briefcase',
    color: '#0e8f72',
    tint: '#e3f7f1',
    surface: 'linear-gradient(150deg, #edfbf6 0%, #d2f1e7 100%)',
    border: 'rgba(14, 143, 114, 0.22)',
    gradient: 'linear-gradient(140deg, #6fe3c0 0%, #12a583 55%, #06705a 100%)',
    illustration: 'media/categories/seminaire.svg'
  },
  // Océan
  Formation: {
    icon: 'pi-book',
    color: '#2360d4',
    tint: '#e8f0fe',
    surface: 'linear-gradient(150deg, #eff5ff 0%, #dae8ff 100%)',
    border: 'rgba(35, 96, 212, 0.22)',
    gradient: 'linear-gradient(140deg, #8fb8ff 0%, #2f6bdd 55%, #12409e 100%)',
    illustration: 'media/categories/formation.svg'
  },
  // Ambre
  Retraite: {
    icon: 'pi-sun',
    color: '#c07a06',
    tint: '#fef3df',
    surface: 'linear-gradient(150deg, #fff8e9 0%, #fcebc6 100%)',
    border: 'rgba(192, 122, 6, 0.22)',
    gradient: 'linear-gradient(140deg, #ffd879 0%, #efa31d 55%, #b9700a 100%)',
    illustration: 'media/categories/retraite.svg'
  },
  // Rose
  Autre: {
    icon: 'pi-sparkles',
    color: '#c42e6b',
    tint: '#fde9f1',
    surface: 'linear-gradient(150deg, #fff0f6 0%, #fbdce9 100%)',
    border: 'rgba(196, 46, 107, 0.22)',
    gradient: 'linear-gradient(140deg, #ff9cc2 0%, #d8397c 55%, #9b1f52 100%)',
    illustration: 'media/categories/autre.svg'
  }
};

/** Catégorie absente ou inconnue du référentiel : un bleu-gris neutre. */
export const NEUTRAL_STYLE: CategoryStyle = {
  icon: 'pi-calendar',
  color: '#43608a',
  tint: '#edf1f7',
  surface: 'linear-gradient(150deg, #f3f6fb 0%, #e2e9f3 100%)',
  border: 'rgba(67, 96, 138, 0.2)',
  gradient: 'linear-gradient(140deg, #9db6d4 0%, #4a6a96 55%, #2c4770 100%)',
  illustration: 'media/categories/autre.svg'
};

export function styleOf(category?: string | null): CategoryStyle {
  return (category && CATEGORY_STYLES[category]) || NEUTRAL_STYLE;
}

/** Un événement prêt à afficher : tous les libellés sont précalculés. */
export interface EventCard {
  event: EventDTO;
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  /** Ville, ou lieu à défaut. Jamais inventée : nulle si l'événement n'en porte pas. */
  place: string | null;
  city: string | null;
  /** Adresse complète, telle que saisie. */
  address: string | null;
  date: Date | null;
  day: string;
  month: string;
  weekday: string;
  /** « Vendredi 25 septembre 2026 », ou null sans date exploitable. */
  longDate: string | null;
  /** Heure telle que saisie ; nulle si l'organisateur ne l'a pas renseignée. */
  time: string | null;
  /** « Gratuit », un montant, ou nul si le tarif n'est pas encore fixé. */
  price: string | null;
  /** Vrai seulement si l'organisateur a coché « gratuit ». */
  free: boolean;
  amount: number | null;
  seats: number | null;
  days: number | null;
  /** Photo réellement jointe à l'événement. */
  image: string | null;
  /** Photo, sinon illustration de la catégorie. `null` si rien ne se charge. */
  visual: string | null;
  initial: string;
  upcoming: boolean;
  style: CategoryStyle;
}

/**
 * Construit la présentation d'un événement. `image` vient de `EventImageService`
 * et vaut `null` quand aucune photo n'est jointe — auquel cas on ne met pas de
 * photo d'emprunt, seulement l'illustration de la catégorie.
 */
export function toEventCard(event: EventDTO, image: string | null): EventCard {
  const date = parseFrDate(event.date);
  const city = event.location?.city?.trim() || null;
  const placeName = event.location?.placeName?.trim() || null;
  const style = styleOf(event.category?.trim());

  return {
    event,
    id: event.id ?? '',
    name: event.name?.trim() || 'Sans titre',
    description: event.description?.trim() || null,
    category: event.category?.trim() || null,
    place: city ?? placeName,
    city,
    address: formatAddress(event),
    date,
    day: date ? String(date.getDate()).padStart(2, '0') : '--',
    month: date ? MONTHS[date.getMonth()] : '',
    weekday: date ? WEEKDAYS[date.getDay()] : '',
    longDate: date ? capitalize(date.toLocaleDateString('fr-CA', LONG_DATE)) : null,
    time: event.time?.trim() || null,
    price: priceLabel(event),
    free: event.free === true,
    amount: typeof event.amount === 'number' && event.amount > 0 ? event.amount : null,
    seats: typeof event.availableSeats === 'number' && event.availableSeats > 0 ? event.availableSeats : null,
    days: typeof event.numberOfDays === 'number' && event.numberOfDays > 0 ? event.numberOfDays : null,
    image,
    visual: image ?? style.illustration,
    initial: (event.name?.trim().charAt(0) || '?').toUpperCase(),
    upcoming: date ? date.getTime() >= startOfToday() : false,
    style
  };
}

export const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
export const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const LONG_DATE: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
};

/** Les dates arrivent du serveur au format « JJ/MM/AAAA ». */
export function parseFrDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function priceLabel(event: EventDTO): string | null {
  if (event.free) return 'Gratuit';
  if (typeof event.amount === 'number' && event.amount > 0) return `${event.amount} $`;
  // Ni gratuit ni chiffré : le tarif n'est pas fixé, on n'affiche rien.
  return null;
}

export function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** À venir d'abord, du plus proche au plus lointain ; les sans-date à la fin. */
export function byDate(a: EventCard, b: EventCard): number {
  if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.upcoming ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime();
}

function formatAddress(event: EventDTO): string | null {
  const parts = [
    event.location?.address,
    event.location?.city,
    event.location?.postalCode,
    event.location?.country
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => !!part);

  return parts.length ? parts.join(', ') : null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
