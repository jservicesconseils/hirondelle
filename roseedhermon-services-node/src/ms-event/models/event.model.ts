import { Schema, model } from 'mongoose';

export const EVENT_CLASS = 'com.roseedhermon.msevent.entity.EventEntity';

/**
 * Reprend `EventLocation` : objet imbriqué sans `@Id`, donc écrit sans `_id`
 * ni `_class` par Spring Data (vérifié sur les documents existants).
 */
const eventLocationSchema = new Schema(
  {
    address: String,
    city: String,
    postalCode: String,
    country: String,
    placeName: String,
    latitude: Number,
    longitude: Number,
  },
  { _id: false, versionKey: false, minimize: false },
);

/** Reprend `Presenter`. */
const presenterSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    title: String,
    resume: String,
  },
  { _id: false, versionKey: false, minimize: false },
);

/**
 * Reprend `EventFile` lorsqu'il est imbriqué dans `EventEntity.files`.
 *
 * Attention : `EventEntity.files` (tableau imbriqué) et la collection `event_files`
 * sont deux stockages distincts dans le code Java. `EventService.updateEvent` écrit
 * le tableau imbriqué, tandis que les uploads alimentent la collection. On conserve
 * les deux à l'identique.
 *
 * Les noms de champs sont ceux de Spring Data (nom du champ Java), d'où
 * `isPresentationPhoto` / `isMainPhoto` en base alors que Jackson expose
 * `presentationPhoto` / `mainPhoto` dans le JSON.
 */
export const embeddedEventFileSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    fileName: String,
    filePath: String,
    fileExtension: String,
    fileSize: Number,
    mimeType: String,
    description: String,
    uploadDate: Date,
    fileType: String,
    isPresentationPhoto: Boolean,
    isMainPhoto: Boolean,
  },
  { versionKey: false, minimize: false },
);

/** Reprend `EventEntity` (@Document(collection = "event")). */
const eventSchema = new Schema(
  {
    name: String,
    /** Chaîne libre côté Java (format « JJ/MM/AAAA »), pas une date BSON. */
    date: String,
    /**
     * Heure de début « HH:mm ». Champ additif, absent de l'entité Java : Spring Data
     * ignore les champs inconnus à la lecture, la reprise du service Java reste donc
     * possible sans migration.
     */
    time: String,
    location: { type: eventLocationSchema, default: undefined },
    description: String,
    /** `private boolean isFree` → champ `isFree` en base, propriété JSON `free`. */
    isFree: Boolean,
    /** `BigDecimal` Java. */
    amount: Number,
    numberOfDays: Number,
    presenters: { type: [presenterSchema], default: undefined },
    category: String,
    availableSeats: Number,
    lastRegistrationDate: String,
    eventType: String,
    eventStatus: String,
    // Champs additifs : Spring Data les ignore en lecture, le retour au service
    // Java reste donc possible sans migration.
    visibility: String,
    groupId: String,
    /** Champ additif : qui a créé l'événement, pour lui laisser voir ses statistiques. */
    createdByEmail: String,
    files: { type: [embeddedEventFileSchema], default: undefined },
    mainPhotoId: String,
    _class: { type: String, default: EVENT_CLASS },
  },
  {
    collection: 'event',
    versionKey: false,
    minimize: false,
  },
);

export const EventModel = model('Event', eventSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type EventDocument = ReturnType<(typeof EventModel)['hydrate']>;
