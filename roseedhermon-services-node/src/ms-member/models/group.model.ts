import { Schema, model } from 'mongoose';

export const GROUP_CLASS = 'com.roseedhermon.msmember.model.GroupEntity';

/**
 * Reprend `GroupEntity` (@Document(collection = "groups")).
 *
 * Comme pour `members` : pas de `default: null` (Spring Data n'écrit pas les propriétés
 * nulles) et `_id` en `Mixed` (l'`@Id` est un `String`, voir `toSpringId`).
 */
const groupSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String },
    /** ex: "association", "communauté religieuse" */
    type: { type: String },
    country: { type: String },
    street: { type: String },
    city: { type: String },
    stateOrProvince: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    /**
     * Modules attribués au groupe : EVENTS, MEMBERS, ou les deux.
     *
     * Champ ajouté après coup, donc sans valeur par défaut : les documents
     * existants n'en portent pas, et `normalizeFeatures` traite cette absence
     * comme « toutes les fonctionnalités ». Côté Java, un `List<String> features`
     * s'ajoutera sans migration.
     */
    features: { type: [String] },
    /**
     * Champ additif : absent ou vrai, les membres du groupe voient aussi les
     * événements publics des autres groupes — le comportement d'origine.
     * `false` referme le catalogue à ce que ce groupe organise lui-même.
     */
    showPublicCatalog: { type: Boolean },
    /**
     * Champ additif : un groupe créé par le super administrateur (formulaire
     * `/app/groups`, ou document antérieur à cette fonctionnalité) n'en porte
     * pas et vaut `APPROVED` — voir `normalizeStatus`. Seule une demande
     * ouverte par un membre depuis son compte passe par `PENDING`.
     */
    status: { type: String },
    requestedByEmail: { type: String },
    requestedAt: { type: Date },
    decidedByEmail: { type: String },
    decidedAt: { type: Date },
    /**
     * Champ additif : comptes autorisés à administrer ce groupe — au moins son
     * auteur, une fois la demande approuvée. Un compte peut figurer dans
     * `adminEmails` de plusieurs groupes à la fois (une personne peut créer
     * plusieurs communautés) ; `custom:groupId` côté Cognito ne retient que
     * celui actif pour la session en cours — voir `activateGroupForAccount`.
     * Absent sur un document antérieur à cette fonctionnalité.
     */
    adminEmails: { type: [String] },
    rejectionReason: { type: String },
    _class: { type: String, default: GROUP_CLASS },
  },
  {
    collection: 'groups',
    versionKey: false,
    minimize: false,
  },
);

export const GroupModel = model('Group', groupSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type GroupDocument = ReturnType<(typeof GroupModel)['hydrate']>;
