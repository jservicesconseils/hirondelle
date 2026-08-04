# Gestion des Fichiers d'Événement

## Vue d'ensemble

Le composant `CreateEventComponent` a été mis à jour pour intégrer la gestion complète des fichiers d'événement, en synchronisation avec le backend `roseedhermon-ms-event`.

## Fonctionnalités

### 1. Photos de Présentation
- **Upload multiple** : Possibilité d'uploader plusieurs photos de présentation
- **Interface en tableau** : Affichage organisé avec colonnes Photo, Nom, Commentaire, Taille, Date, Photo principale, Actions
- **Sélection par radio button** : Une seule photo peut être sélectionnée comme photo principale
- **Commentaires éditables** : Chaque photo peut avoir un commentaire personnalisé
- **Types supportés** : Images uniquement (JPG, PNG, GIF, WebP)
- **Taille maximale** : 10 MB par photo
- **Indicateur visuel** : Ligne mise en évidence pour la photo principale sélectionnée

### 2. Upload de Documents
- **Upload multiple** : Plusieurs fichiers simultanément
- **Interface unifiée** : Même structure de tableau que les photos de présentation
- **Types supportés** : Images, vidéos, audio, documents (PDF, Word, etc.)
- **Taille maximale** : 10 MB par fichier
- **Colonnes du tableau** : Photo, Nom du fichier, Type, Taille, Date d'upload, Principal, Actions
- **Gestion des images** : Les images peuvent être définies comme photo principale
- **Gestion des autres fichiers** : Affichage d'icônes pour les types non-image

### 2. Gestion des Fichiers
- **Affichage** : Liste des fichiers uploadés avec métadonnées
- **Suppression** : Suppression individuelle des fichiers
- **Photo principale** : Définition d'une photo comme image principale
- **Types de fichiers** : Catégorisation automatique (PRESENTATION_PHOTO, DOCUMENT, VIDEO, AUDIO, OTHER)

### 3. Interface Utilisateur
- **Onglet dédié** : Interface séparée pour la gestion des fichiers
- **Barre de progression** : Suivi de l'upload en temps réel
- **Notifications** : Messages de succès/erreur pour chaque action
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Tableau organisé** : Affichage structuré des photos avec colonnes claires
- **Sélection par radio button** : Interface intuitive pour choisir la photo principale
- **Commentaires éditables** : Champs de saisie pour personnaliser chaque photo
- **Indicateurs visuels** : Mise en évidence de la ligne de la photo principale
- **Message d'aide** : Astuce pour guider l'utilisateur

## Architecture

### Modèles
- `EventFileDTO` : Interface TypeScript pour les fichiers d'événement
- `EventFileDTOFileTypeEnum` : Énumération des types de fichiers

### Services
- `EventFileControllerService` : Gestion des opérations CRUD sur les fichiers
- `FileControllerService` : Téléchargement et accès aux fichiers

### Composants
- `FileUpload` : Composant PrimeNG pour la sélection de fichiers
- `ProgressBar` : Barre de progression pour l'upload
- `TabView` : Interface à onglets pour organiser le contenu

### Onglets
- **Informations sur l'événement** : Données générales de l'événement
- **Lieu et heure** : Localisation et planning
- **Présentateurs** : Gestion des intervenants
- **Photo de présentation** : Sélection de la photo principale
- **Documents** : Upload et gestion des fichiers divers

## API Backend

### Endpoints Utilisés
- `POST /api/v1/events/{eventId}/files/upload` : Upload d'un fichier
- `POST /api/v1/events/{eventId}/files/upload-multiple` : Upload multiple
- `GET /api/v1/events/{eventId}/files` : Récupération des fichiers
- `PUT /api/v1/events/{eventId}/files/{fileId}/set-main-photo` : Définir la photo principale
- `DELETE /api/v1/events/{eventId}/files/{fileId}` : Suppression d'un fichier

### Types de Fichiers Supportés
- **Images** : JPG, PNG, GIF, WebP
- **Vidéos** : MP4, AVI, MOV, etc.
- **Audio** : MP3, WAV, AAC, etc.
- **Documents** : PDF, DOC, DOCX, TXT

## Workflow Utilisateur

1. **Création de l'événement** : L'utilisateur remplit le formulaire et crée l'événement
2. **Upload des photos de présentation** : L'utilisateur peut uploader plusieurs photos dans l'onglet "Photo de présentation"
3. **Sélection de la photo principale** : L'utilisateur clique sur une photo pour la définir comme photo principale
4. **Upload de documents** : L'utilisateur peut uploader d'autres types de fichiers dans l'onglet "Documents"
5. **Gestion des fichiers** : Possibilité de supprimer, redéfinir la photo principale, etc.
6. **Finalisation** : L'utilisateur peut fermer le dialogue

## Sécurité

- **Validation des types** : Seuls les types de fichiers autorisés sont acceptés
- **Limitation de taille** : Taille maximale configurée à 10 MB
- **Authentification** : Vérification de l'identité de l'utilisateur
- **Autorisation** : Vérification des droits sur l'événement

## Styles

Le composant utilise un design cohérent avec le reste de l'application :
- **Couleurs** : Palette bleue (#2e31a4, #1a1c6b)
- **Typographie** : Police système avec hiérarchie claire
- **Espacement** : Marges et paddings cohérents
- **Animations** : Transitions fluides pour une meilleure UX

## Dépendances

- **PrimeNG** : FileUpload, ProgressBar, TabView, Dialog
- **Angular** : ReactiveFormsModule, HttpClient
- **RxJS** : Gestion des observables pour les appels API

## Tests

Le composant inclut :
- **Validation des formulaires** : Vérification des champs requis
- **Gestion des erreurs** : Messages d'erreur appropriés
- **États de chargement** : Indicateurs visuels pendant les opérations
- **Responsive design** : Adaptation aux différentes tailles d'écran 