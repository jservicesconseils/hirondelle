import { Schema, model } from 'mongoose';

/**
 * Reprend `MemberEntity` (@Document(collection = "members")).
 *
 * Les noms de champs sont ceux écrits par Spring Data, y compris `_class` : conservé
 * pour qu'un éventuel retour au service Spring puisse relire les documents créés ici.
 *
 * Aucun champ n'a de `default: null` : Spring Data n'écrit pas les propriétés nulles,
 * les documents existants n'ont donc par exemple aucune clé `address` ni `roles`. Les
 * documents sont construits avec `withoutNulls()` pour conserver cette forme.
 *
 * `_id` est en `Mixed` car l'`@Id` de l'entité est un `String` : Spring Data stocke un
 * identifiant de 24 caractères hexadécimaux en `ObjectId` mais n'importe quel autre
 * texte en `String` (voir `toSpringId`).
 */
export const MEMBER_CLASS = 'com.roseedhermon.msmember.model.MemberEntity';

const memberSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    lastName: { type: String },
    firstName: { type: String },
    gender: { type: String },
    birthDate: { type: Date },
    profession: { type: String },
    // Sous-groupe au sein de la communauté (ex. Pasteur, Diacre, Administrateur) —
    // distinct de `profession`, qui est le métier de la personne dans la vie civile.
    subgroup: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    location: { type: String },
    photo: { type: String },
    // `default: undefined` : sans lui Mongoose écrirait un tableau vide là où Spring
    // Data n'écrivait aucune clé (et le JSON renverrait `[]` au lieu de `null`).
    socialLinks: { type: [String], default: undefined },
    roles: { type: [String], default: undefined },
    groupId: { type: String },
    _class: { type: String, default: MEMBER_CLASS },
  },
  {
    collection: 'members',
    versionKey: false,
    minimize: false,
  },
);

export const MemberModel = model('Member', memberSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type MemberDocument = ReturnType<(typeof MemberModel)['hydrate']>;
