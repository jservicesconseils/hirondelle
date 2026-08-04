import { Schema, model } from 'mongoose';

export const EVENT_FILE_CLASS = 'com.roseedhermon.msevent.entity.EventFile';

/** Valeurs de `EventFile.FileType`. */
export const FILE_TYPES = [
  'PRESENTATION_PHOTO',
  'MAIN_PRESENTATION',
  'DOCUMENT',
  'VIDEO',
  'AUDIO',
  'OTHER',
] as const;

export type FileType = (typeof FILE_TYPES)[number];

/**
 * Reprend `EventFile` (@Document(collection = "event_files")).
 *
 * `_id` est volontairement `Mixed` : `FileStorageService` fabrique un UUID (stocké en
 * `String`), tandis qu'un fichier créé sans identifiant via `/events/with-photos`
 * reçoit un `ObjectId` généré par Spring Data. Les deux formes doivent être lisibles.
 */
const eventFileSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    /** `@Field("file_data")` — jamais alimenté par le code Java, conservé par sécurité. */
    file_data: Buffer,
    fileName: String,
    filePath: String,
    fileExtension: String,
    /** `long fileSize` */
    fileSize: Number,
    mimeType: String,
    description: String,
    uploadDate: Date,
    fileType: { type: String, enum: FILE_TYPES },
    /** Noms de champs Spring Data (nom du champ Java, préfixe `is` inclus). */
    isPresentationPhoto: Boolean,
    isMainPhoto: Boolean,
    _class: { type: String, default: EVENT_FILE_CLASS },
  },
  {
    collection: 'event_files',
    versionKey: false,
    minimize: false,
  },
);

export const EventFileModel = model('EventFile', eventFileSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type EventFileDocument = ReturnType<(typeof EventFileModel)['hydrate']>;
