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

/**
 * Libellé court à afficher pour un champ reconnu — « Numéro de téléphone » ou
 * « Tél. cellulaire » deviennent tous deux « Téléphone », plutôt que de reprendre
 * l'en-tête exact du fichier, verbeux ou inconsistant d'un import à l'autre.
 * `null` pour un champ générique : celui-là garde son en-tête d'origine, seul
 * repère possible pour un champ propre à une communauté (« Ministère »...).
 */
export function canonicalLabel(kind: FieldIconKind): string | null {
  switch (kind) {
    case 'city': return 'Ville';
    case 'address': return 'Adresse';
    case 'gender': return 'Genre';
    case 'phone': return 'Téléphone';
    case 'email': return 'Email';
    case 'birthdate': return 'Date de naissance';
    case 'group': return 'Groupe';
    default: return null;
  }
}

/**
 * Concepts qui ont déjà leur champ structuré sur la fiche (Ville, Adresse,
 * Genre, Téléphone) : un fichier importé avant que ces colonnes ne deviennent
 * des champs structurés — ou qui les a nommées autrement que l'en-tête exact
 * attendu — les a laissées dans `customFields`. Une fois la valeur retrouvée
 * là (voir `mergedFieldValue`), elle ne doit plus apparaître une seconde fois
 * comme un champ personnalisé générique : ni dans une colonne de tableau, ni
 * dans une carte, ni comme entrée éditable séparée d'un formulaire.
 */
export const MERGED_KINDS: FieldIconKind[] = ['city', 'address', 'gender', 'phone'];

/**
 * Valeur d'un champ reconnu (Ville, Adresse, Genre, Téléphone...) : celle du
 * champ structuré si elle existe, sinon celle du premier champ personnalisé
 * qui désigne le même concept — voir `MERGED_KINDS`.
 */
export function mergedFieldValue(
  customFields: Record<string, string> | undefined,
  structured: string | undefined,
  kind: FieldIconKind,
  fallback = ''
): string {
  if (structured) return structured;
  const entry = Object.entries(customFields || {}).find(([key]) => fieldIconKind(key) === kind);
  return entry ? entry[1] : fallback;
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
