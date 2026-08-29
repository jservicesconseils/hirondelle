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

const PATTERNS: [RegExp, FieldIconKind][] = [
  [/^(ville|city)$/i, 'city'],
  [/^(adresse|address)$/i, 'address'],
  [/^(genre|sexe|gender)$/i, 'gender'],
  [/^(t[ée]l[ée]phone|tel|phone|mobile|cellulaire)$/i, 'phone'],
  [/^(email|courriel|mail)$/i, 'email'],
  [/naissance|birth/i, 'birthdate'],
  [/^(groupe|group|sous.?groupe|subgroup)$/i, 'group'],
];

export function fieldIconKind(label: string): FieldIconKind {
  const needle = label.trim();
  const match = PATTERNS.find(([pattern]) => pattern.test(needle));
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
