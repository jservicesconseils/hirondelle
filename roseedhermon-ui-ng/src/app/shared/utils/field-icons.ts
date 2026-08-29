/**
 * Catégorie visuelle d'un champ de fiche membre, déduite de son libellé.
 *
 * Un fichier importé peut porter n'importe quel en-tête (voir l'assistant
 * d'import) : « Ville », « Adresse » ou « Genre » ne sont plus des champs
 * reconnus par le serveur, seulement des champs personnalisés parmi
 * d'autres. Ce mapping ne sert qu'à choisir une icône adaptée à l'affichage,
 * indépendamment de la façon dont la donnée est stockée.
 */
export type FieldIconKind = 'city' | 'address' | 'gender' | 'phone' | 'email' | 'birthdate' | 'group' | 'generic';

/**
 * Sous-chaînes reconnues dans le libellé une fois normalisé (minuscules, sans
 * accents) — pas une correspondance exacte : un fichier dit aussi bien « Ville »
 * que « Numéro de téléphone » ou « Adresse email ». L'ordre compte : une entrée
 * plus haut est testée avant celles du dessous, pour trancher les chevauchements
 * (« adresse email » doit rester un courriel, pas une adresse postale).
 */
const PATTERNS: [string[], FieldIconKind][] = [
  [['email', 'courriel', 'mail'], 'email'],
  [['naissance', 'birth'], 'birthdate'],
  [['telephone', 'tel', 'phone', 'mobile', 'cellulaire'], 'phone'],
  [['ville', 'city'], 'city'],
  [['adresse', 'address'], 'address'],
  [['genre', 'sexe', 'gender'], 'gender'],
  [['groupe', 'group'], 'group'],
];

/** Minuscules, accents retirés : « Numéro de Téléphone » -> « numero de telephone ». */
function normalize(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function fieldIconKind(label: string): FieldIconKind {
  const needle = normalize(label);
  const match = PATTERNS.find(([keywords]) => keywords.some((keyword) => needle.includes(keyword)));
  return match ? match[1] : 'generic';
}

/** Classe PrimeIcons correspondante, pour les tableaux et listes du site. */
export function primeIconFor(kind: FieldIconKind): string {
  switch (kind) {
    case 'city': return 'pi-map-marker';
    case 'address': return 'pi-home';
    case 'gender': return 'pi-user';
    case 'phone': return 'pi-phone';
    case 'email': return 'pi-envelope';
    case 'birthdate': return 'pi-calendar';
    case 'group': return 'pi-sitemap';
    default: return 'pi-tag';
  }
}
