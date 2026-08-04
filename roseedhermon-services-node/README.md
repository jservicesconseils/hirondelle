# roseedhermon-services-node

Portage Node.js / TypeScript des deux microservices Spring Boot `roseedhermon-ms-event`
et `roseedhermon-ms-member`, plus une passerelle HTTP.

L'objectif est la **compatibilité au fil (wire compatibility)** : l'application Angular
`roseedhermon-ui-ng` fonctionne sans aucune modification. Mêmes routes, mêmes ports,
mêmes noms de propriétés JSON, mêmes codes de statut (y compris les réponses à corps
vide) et **même forme de documents MongoDB** que ce que produisaient Spring Data,
Jackson et Lombok. Les services Java restent en place et peuvent être repris à tout
moment sans migration de données.

## Démarrage

```bash
npm install
cp .env.example .env      # optionnel : les valeurs par défaut suffisent en local
npm run dev               # les trois processus (event, member, gateway) en watch
```

En production :

```bash
npm run build && npm start
```

Individuellement : `npm run dev:event`, `npm run dev:member`, `npm run dev:gateway`.
Vérification des types : `npm run typecheck`.

MongoDB doit écouter sur `mongodb://localhost:27017/db_rdh` (voir
`../start-mongodb-no-docker.sh`). La configuration se fait par variables
d'environnement, décrites dans `.env.example`.

## Ports

| Port | Processus | Contenu |
| --- | --- | --- |
| 8081 | `ms-event` | événements, fichiers, inscriptions, feedback, admin |
| 8082 | `ms-member` | membres, groupes |
| 8080 | `gateway` | `/api/v1/members` et `/api/v1/groups` → 8082, tout le reste → 8081 |

La passerelle est nécessaire parce que le front n'utilise pas une base d'URL unique :
`members.service.ts` lit `environment.dev.memberHost` (8080) tandis que les services
d'événements pointent sur 8081. Avec la passerelle, les deux bases sont
interchangeables. Aucun body-parser n'est monté devant les proxys : le JSON comme le
multipart sont relayés en streaming.

`GET /health` répond sur les trois ports.

## Structure

```
src/
  common/         env, bootstrap, connexion Mongo, helpers Jackson, helpers Spring Data
  ms-event/       config, models (Mongoose), mappers (DTO), services, routes
  ms-member/      idem
  gateway/        proxy HTTP
```

Chaque service suit le découpage du code Java : `models` ≙ entités `@Document`,
`mappers` ≙ DTO + `convertToDTO`/`convertToEntity`, `services` ≙ `@Service`,
`routes` ≙ `@RestController`.

## Surface HTTP

`ms-event` (8081) :

- `POST|GET /api/v1/events`, `GET|PUT|DELETE /api/v1/events/:id`
- `GET /api/v1/events/with-files` — remplace le tableau `files` imbriqué par la
  collection `event_files`
- `POST /api/v1/events/with-photos` — corps **JSON** (`CreateEventWithPhotosDTO`),
  pas du multipart
- `POST|GET /api/v1/events/:eventId/files`, `POST .../files/upload` (champ `file`),
  `POST .../files/upload-multiple` (champ `files`), `GET .../files/type/:fileType`,
  `GET .../files/photos`, `GET .../files/main-photo`,
  `PUT .../files/:fileId/set-main-photo`, `PUT|DELETE .../files/:fileId`,
  `DELETE .../files`
- `GET /api/v1/files/events/:eventId/:filename`,
  `GET /api/v1/files/events/:eventId/thumbnails/:filename`
- `POST /api/v1/registrations`, `GET /api/v1/registrations/:id/status` (`text/plain`),
  `DELETE /api/v1/registrations/:id`
- `POST /api/v1/feedback`, `GET /api/v1/feedback/:eventId`
- `GET /api/v1/admin/events/cleanup/status`, `POST /api/v1/admin/events/cleanup?dryRun=`,
  `DELETE /api/v1/admin/events/:eventId`

`ms-member` (8082) : `POST|GET /api/v1/members`, `GET|PUT|DELETE /api/v1/members/:id`,
`POST|GET /api/v1/groups`, `GET|PUT|DELETE /api/v1/groups/:id`,
`POST /api/v1/groups/with-admins`.

Trois routes existent **en plus** du Java, parce que le `EventService` Angular les
appelle alors que Spring ne les exposait pas (elles retournaient donc 404 ou 500) :
`POST /api/v1/events/registrations`, `POST /api/v1/events/feedback`,
`GET /api/v1/events/:eventId/feedback`. Elles délèguent aux mêmes services que
`/api/v1/registrations` et `/api/v1/feedback`.

## Points de compatibilité

Ces détails ne sont pas cosmétiques : ce sont eux qui permettent au front et à la base
existante de continuer à fonctionner.

- **Noms de propriétés divergents.** `EventDTO` avait un getter manuel `isFree()`
  (Jackson émettait `free`) et un setter `setIsFree()` (Jackson acceptait `isFree`),
  alors que `CreateEventWithPhotosDTO` attendait `free`. De même, Lombok produisait
  `presentationPhoto`/`mainPhoto` pour `EventFileDTO` tandis que le client Angular
  généré déclare `isPresentationPhoto`/`isMainPhoto`. En entrée les deux orthographes
  sont acceptées, en sortie les deux sont émises. En base, ce sont toujours les noms
  de champs Java (`isFree`, `isPresentationPhoto`, `isMainPhoto`).
- **Spring Data n'écrit pas les propriétés nulles.** Les documents sont donc
  construits via `withoutNulls()` : aucune clé `amount` ou `mainPhotoId` n'apparaît
  quand la valeur est absente, comme dans les documents existants. En JSON, à
  l'inverse, Jackson sérialisait les nuls : ils sont bien présents dans les réponses.
- **Conversion d'identifiant.** Pour une entité dont l'`@Id` est un `String`,
  Spring Data enregistre un id absent comme un nouvel `ObjectId`, une chaîne de
  24 caractères hexadécimaux comme un `ObjectId`, et tout autre texte (un UUID) tel
  quel. C'est ce que reproduit `common/spring-data.ts` — d'où des `_id` de type
  `objectId` dans `event` et `members` mais des UUID `string` dans `event_files`.
- **Sémantique de `MongoRepository.save()`.** Insertion quand l'id est nul, sinon
  remplacement complet du document (`findOneAndReplace` + `upsert`). Un `PUT` qui
  omet un champ le remet donc à null, exactement comme en Java.
- **`_class`** est écrit avec le nom de la classe Java correspondante, pour que les
  services Spring puissent relire les documents sans réécriture.
- **Corps vides.** Les 204, et les 400/404/500 des contrôleurs qui utilisaient
  `ResponseEntity.notFound().build()` & co., répondent bien avec zéro octet. Les
  erreurs non gérées reprennent le corps par défaut de Spring Boot
  (`{timestamp,status,error,path}`), et `GET /registrations/:id/status` renvoie du
  `text/plain`.
- **Exceptions métier.** Les `RuntimeException` du code Java (« Event not found »,
  « Fichier non trouvé ») produisaient un HTTP 500 : ce comportement est conservé, y
  compris pour `DELETE` d'un fichier inexistant.
- **Vignettes.** JPEG 300×300 `fit: inside` nommées `thumb_<nom unique>`, générées à
  l'upload et reconstruites à la demande si elles ont disparu — comme
  `FileStorageService.createThumbnail`. Un échec de génération n'invalide pas l'upload.
- **Validation d'upload.** Les fichiers sont d'abord reçus en mémoire, puis validés,
  puis écrits sur disque : l'ordre du code Java est préservé, donc un fichier refusé
  ne laisse rien derrière lui.

Trois écarts sont assumés, tous pour corriger des routes qui ne pouvaient pas
fonctionner en Java :

1. `FileController.downloadFile` comparait le nom demandé au nom unique (UUID) alors
   que `downloadThumbnail` le comparait au nom d'origine. Les URLs produites par l'API
   (`accessUrl`, `thumbnailUrl`) et celles construites par le front tombaient donc
   chacune sur la mauvaise route. Les deux routes acceptent maintenant l'un ou l'autre
   nom.
2. `createEventWithPhotos` lisait `fileDTO.getId()` pour renseigner `mainPhotoId`,
   valeur toujours nulle à cet instant. L'identifiant réellement attribué est utilisé.
3. `MemberController` déclarait `@PathVariable UUID id` alors que les `_id` de la
   collection `members` sont des `ObjectId` : la conversion échouait toujours, et
   `GET`/`PUT`/`DELETE /api/v1/members/:id` répondaient systématiquement 400.
   L'identifiant est ici traité comme une chaîne.

## Fichiers uploadés

Par défaut : `uploads/events/<eventId>/` sous ce projet. Le répertoire historique
`../roseedhermon-ms-event/uploads/events` contient des dossiers orphelins (la
collection `event_files` est vide) ; pour le réutiliser malgré tout, pointer
`APP_FILE_UPLOAD_DIR` dessus. Le chemin absolu du fichier est stocké dans
`event_files.filePath`, comme le faisait Java ; les chemins relatifs hérités sont
résolus depuis la racine du projet.

## Limite connue, indépendante du backend

`src/app/api/api/fileController.service.ts` (client généré) appelle `/api/v1/files`
en relatif, sans `proxyConfig` déclaré dans `angular.json` : ces appels partent vers
le serveur de dev Angular et échouaient déjà avec les services Java. Les services
écrits à la main (`events.service.ts`, `event-image.service.ts`) utilisent bien une
URL absolue et fonctionnent.
