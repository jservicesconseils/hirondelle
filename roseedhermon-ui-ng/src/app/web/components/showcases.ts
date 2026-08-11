/**
 * Photos et messages du fond de la bannière d'accueil.
 *
 * Les fichiers sont servis depuis `public/media/showcase`. Une photo absente
 * retire sa vue plutôt que de laisser un cadre vide ; sans aucune photo, la
 * bannière retombe sur son dégradé bleu et son texte fixe.
 */
export interface Showcase {
  /** Fichier attendu dans `public/media/showcase`. */
  image: string;
  /** Nom de la famille d'événements, affiché en surtitre. */
  kicker: string;
  /** Phrase qui accompagne la photo, sous le titre principal. */
  title: string;
  /** Couleur dominante de la photo, reprise sur le surtitre et la progression. */
  color: string;
}

export const SHOWCASES: Showcase[] = [
  {
    image: 'media/showcase/conference-pleniere.jpg',
    kicker: 'Conférences',
    title: 'Réunissez une salle entière autour d’une idée : billetterie, code QR à l’entrée et suivi des inscriptions en direct.',
    color: '#f0a94a'
  },
  {
    image: 'media/showcase/equipe-direction.jpg',
    kicker: 'Comités et réunions',
    title: 'Gardez votre comité aligné : convoquez les bonnes personnes et sachez qui a confirmé sa présence.',
    color: '#6fa8f5'
  },
  {
    image: 'media/showcase/rassemblement.jpg',
    kicker: 'Rassemblements',
    title: 'Les grands moments de votre communauté. Un événement, un lien, un billet — reçu par texto.',
    color: '#ff9a6b'
  },
  {
    image: 'media/showcase/atelier-creatif.jpg',
    kicker: 'Ateliers',
    title: 'Limitez le nombre de places, voyez la liste se compléter en direct, et sachez qui vient avant d’acheter le matériel.',
    color: '#b79bff'
  },
  {
    image: 'media/showcase/comite-strategie.jpg',
    kicker: 'Séminaires',
    title: 'Une journée de travail organisée à la minute : programme, intervenants, lieu et horaires sur une seule fiche.',
    color: '#5fdcd0'
  },
  {
    image: 'media/showcase/formation.jpg',
    kicker: 'Formations',
    title: 'Sessions successives, inscriptions nominatives et liste de présence : vous savez qui a suivi quoi, et quand.',
    color: '#8fb8ff'
  },
  {
    image: 'media/showcase/celebration.jpg',
    kicker: 'Célébrations',
    title: 'Les réservations arrivent, le compteur de places se met à jour tout seul, et vous profitez de la fête.',
    color: '#ff9cc2'
  }
];
