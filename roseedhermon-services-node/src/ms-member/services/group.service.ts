import mongoose from 'mongoose';
import {
  ApiError,
  forgetGroupFeatures,
  getAccountGroupId,
  promoteToGroupAdmin,
  runtimeError,
  setAccountGroupId,
  springIdFilter,
  toSpringId,
  toStringOrNull,
  withoutNulls,
} from '../../common';
import { groupFromBody } from '../mappers/group.mapper';
import { GROUP_CLASS, GroupModel, type GroupDocument } from '../models/group.model';
import { MEMBER_CLASS, MemberModel } from '../models/member.model';
import { memberFromBody } from '../mappers/member.mapper';

/**
 * Reprend `GroupService`.
 *
 * Comme pour les membres, les écritures suivent la sémantique de
 * `MongoRepository.save()` et ne comportent pas les propriétés nulles.
 */

/** Document `groups` tel qu'il est écrit en base, sans les clés nulles. */
function toDocument(body: Record<string, unknown>): Record<string, unknown> {
  return withoutNulls({ ...groupFromBody(body), _class: GROUP_CLASS });
}

/** Équivalent de `groupRepository.save(group)`. */
export async function createGroup(body: Record<string, unknown>): Promise<GroupDocument> {
  const document = toDocument(body);
  const providedId = toStringOrNull(body.id);

  if (providedId === null) {
    return GroupModel.create({ _id: toSpringId(null), ...document });
  }

  const replaced = await GroupModel.findOneAndReplace(
    springIdFilter(providedId),
    { _id: toSpringId(providedId), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (!replaced) throw runtimeError(`Group could not be saved with id ${providedId}`);
  return replaced;
}

export async function getGroupById(id: string): Promise<GroupDocument | null> {
  return GroupModel.findOne(springIdFilter(id)).exec();
}

/**
 * Groupes utilisables : approuvés, ou antérieurs à cette fonctionnalité (donc
 * sans statut — traités comme approuvés, voir `normalizeStatus`). Une demande
 * `PENDING` ou `REJECTED` n'est pas une communauté, elle ne doit apparaître
 * nulle part où elle serait prise pour une vraie — répertoire, tableau de
 * bord, choix de groupe à l'inscription.
 */
export async function getAllGroups(): Promise<GroupDocument[]> {
  return GroupModel.find({ status: { $nin: ['PENDING', 'REJECTED'] } }).exec();
}

/** Demandes de création en attente, pour l'écran du super administrateur. */
export async function getPendingGroups(): Promise<GroupDocument[]> {
  return GroupModel.find({ status: 'PENDING' }).sort({ requestedAt: 1 }).exec();
}

/**
 * La plus récente demande de ce compte, quel que soit son statut — pour que
 * son propre écran sache s'il doit montrer le formulaire, une attente, ou un
 * refus. `null` si le compte n'a jamais rien demandé.
 *
 * Ne reflète que la dernière : un compte qui administre déjà une première
 * communauté approuvée et en redemande une seconde verra cette nouvelle
 * demande prendre le relais ici, la précédente restant consultable via
 * `getGroupsAdministeredBy`.
 */
export async function getMyGroupRequest(email: string): Promise<GroupDocument | null> {
  return GroupModel.findOne({ requestedByEmail: email.trim().toLowerCase() })
    .sort({ requestedAt: -1 })
    .exec();
}

/**
 * Groupes qu'un compte administre — sa communauté active comme celles,
 * approuvées, qu'il a pu ouvrir en plus (voir `adminEmails`). Alimente
 * l'écran Groupes pour un administrateur de groupe, et la bascule entre
 * communautés.
 */
export async function getGroupsAdministeredBy(email: string): Promise<GroupDocument[]> {
  const needle = email.trim().toLowerCase();
  return GroupModel.find({
    status: { $nin: ['PENDING', 'REJECTED'] },
    $or: [
      { adminEmails: needle },
      // Groupe approuvé avant `adminEmails` (voir `approveGroup`) : son auteur
      // reste reconnu comme administrateur sans migration de données.
      { adminEmails: { $exists: false }, requestedByEmail: needle },
    ],
  }).exec();
}

/**
 * Un membre sans groupe ouvre sa propre communauté ; un administrateur qui en
 * a déjà une peut tout aussi bien en ouvrir une seconde — seule une demande
 * déjà en attente bloque la suivante, le temps qu'elle soit tranchée.
 */
export async function requestGroup(requesterEmail: string, body: Record<string, unknown>): Promise<GroupDocument> {
  const email = requesterEmail.trim().toLowerCase();

  const alreadyPending = await GroupModel.findOne({ status: 'PENDING', requestedByEmail: email }).exec();
  if (alreadyPending) throw runtimeError('Une demande est déjà en attente pour ce compte.');

  const document = withoutNulls({ ...groupFromBody(body), _class: GROUP_CLASS });

  return GroupModel.create({
    _id: toSpringId(null),
    ...document,
    status: 'PENDING',
    requestedByEmail: email,
    requestedAt: new Date(),
    adminEmails: [email],
  });
}

/**
 * Approuve la demande : le groupe devient une communauté normale, et son
 * auteur en devient l'administrateur — un rôle Cognito qui, une fois acquis,
 * couvre toutes les communautés qu'il administre.
 *
 * Sa toute première communauté devient d'emblée active (comme avant, pour ne
 * rien changer au parcours déjà en place — voir le panneau « Demande
 * approuvée » côté client, qui invite à se reconnecter). À partir de la
 * deuxième, celle déjà active le reste : le compte choisit lui-même quand
 * basculer, depuis l'écran Groupes (`activateGroupForAccount`).
 */
export async function approveGroup(id: string, decidedByEmail: string): Promise<GroupDocument> {
  const group = await GroupModel.findOne(springIdFilter(id)).exec();
  if (!group) throw runtimeError(`Group not found: ${id}`);

  const requester = toStringOrNull(group.get('requestedByEmail'));
  if (!requester) throw runtimeError("Ce groupe ne porte aucune demande à approuver.");

  group.set('status', 'APPROVED');
  group.set('decidedByEmail', decidedByEmail.trim().toLowerCase());
  group.set('decidedAt', new Date());
  const admins = new Set<string>(
    Array.isArray(group.get('adminEmails')) ? (group.get('adminEmails') as string[]) : [],
  );
  admins.add(requester);
  group.set('adminEmails', [...admins]);
  await group.save();

  const groupId = String(group._id);
  await promoteToGroupAdmin(requester);
  const currentlyActive = await getAccountGroupId(requester);
  if (!currentlyActive) await setAccountGroupId(requester, groupId);
  forgetGroupFeatures(groupId);

  return group;
}

/**
 * Bascule : le compte choisit, parmi les communautés qu'il administre déjà,
 * laquelle devient active. Le super administrateur, qui les voit toutes sans
 * en dépendre, peut activer n'importe laquelle ; les autres doivent déjà
 * figurer dans `adminEmails` du groupe visé.
 */
export async function activateGroupForAccount(
  email: string,
  groupId: string,
  isSuperAdmin: boolean,
): Promise<void> {
  if (!isSuperAdmin) {
    const needle = email.trim().toLowerCase();
    const group = await GroupModel.findOne(springIdFilter(groupId)).exec();
    const admins = group?.get('adminEmails');
    // Groupe approuvé avant `adminEmails` : son auteur reste reconnu, comme
    // dans `getGroupsAdministeredBy`.
    const allowed = Array.isArray(admins)
      ? admins.includes(needle)
      : toStringOrNull(group?.get('requestedByEmail')) === needle;
    if (!allowed) throw new ApiError("Ce compte n'administre pas ce groupe.", 403);
  }

  await setAccountGroupId(email.trim().toLowerCase(), groupId);
}

export async function rejectGroup(
  id: string,
  decidedByEmail: string,
  reason: string | null,
): Promise<GroupDocument> {
  const group = await GroupModel.findOne(springIdFilter(id)).exec();
  if (!group) throw runtimeError(`Group not found: ${id}`);

  group.set('status', 'REJECTED');
  group.set('decidedByEmail', decidedByEmail.trim().toLowerCase());
  group.set('decidedAt', new Date());
  if (reason) group.set('rejectionReason', reason);
  await group.save();

  return group;
}

export interface GroupStats {
  memberCount: number;
  eventsTotal: number;
  eventsUpcoming: number;
  eventsPast: number;
}

/** Les dates arrivent au format « JJ/MM/AAAA », comme ailleurs dans le projet. */
function parseFrDate(value: unknown): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

/**
 * Chiffres d'un groupe pour l'écran du super administrateur.
 *
 * `event` n'a pas de modèle Mongoose ici — comme `featuresOfGroup`, la
 * collection est interrogée directement par le pilote plutôt que
 * d'enregistrer une seconde fois `EventModel`, propriété de ms-event.
 */
export async function getGroupStats(id: string): Promise<GroupStats> {
  const [memberCount, events] = await Promise.all([
    MemberModel.countDocuments({ groupId: id }).exec(),
    mongoose.connection.collection('event').find({ groupId: id }, { projection: { date: 1 } }).toArray(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let eventsUpcoming = 0;
  let eventsPast = 0;

  for (const event of events) {
    const date = parseFrDate((event as { date?: unknown }).date);
    if (date && date.getTime() >= today.getTime()) eventsUpcoming += 1;
    else eventsPast += 1;
  }

  return { memberCount, eventsTotal: events.length, eventsUpcoming, eventsPast };
}

/**
 * Reprend `updateGroup` : `group.setId(id); return groupRepository.save(group);`
 * — c'est-à-dire un remplacement complet du document, y compris s'il n'existait pas.
 */
export async function updateGroup(id: string, body: Record<string, unknown>): Promise<GroupDocument> {
  const document = toDocument(body);

  /**
   * Seule entorse au remplacement intégral : `features`, `showPublicCatalog`
   * et `adminEmails` portent des droits. Une modification qui ne les
   * mentionne pas — l'écran d'identité du groupe, par exemple — reconduit la
   * valeur enregistrée plutôt que de l'effacer, ce qui reviendrait à tout
   * rouvrir par omission. `adminEmails` n'est d'ailleurs jamais transmis par
   * aucun écran : cette route ne le touche jamais, seules `requestGroup`,
   * `approveGroup` et `activateGroupForAccount` en écrivent.
   */
  {
    const existing = await GroupModel.findOne(springIdFilter(id)).exec();

    if (body.features === undefined) {
      const kept = existing?.get('features');
      if (Array.isArray(kept)) document.features = kept;
    }

    if (body.showPublicCatalog === undefined) {
      const kept = existing?.get('showPublicCatalog');
      if (kept !== undefined) document.showPublicCatalog = kept;
    }

    const keptAdmins = existing?.get('adminEmails');
    if (Array.isArray(keptAdmins)) document.adminEmails = keptAdmins;
  }

  const replaced = await GroupModel.findOneAndReplace(
    springIdFilter(id),
    { _id: toSpringId(id), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (!replaced) throw runtimeError(`Group could not be saved with id ${id}`);
  forgetGroupFeatures(id);
  return replaced;
}

export async function deleteGroup(id: string): Promise<void> {
  await GroupModel.findOneAndDelete(springIdFilter(id)).exec();
  forgetGroupFeatures(id);
}

/**
 * Reprend `createGroupWithAdmins` : crée le groupe, exige exactement deux
 * administrateurs, puis crée ces membres avec le rôle ADMIN rattachés au groupe.
 *
 * L'`IllegalArgumentException` d'origine n'était pas interceptée par Spring :
 * elle produisait un HTTP 500. On conserve ce comportement — y compris le fait que le
 * groupe reste créé alors que les administrateurs ne le sont pas.
 */
export async function createGroupWithAdmins(body: Record<string, unknown>): Promise<GroupDocument> {
  const savedGroup = await GroupModel.create({ _id: toSpringId(null), ...toDocument(body) });

  const administrators = body.administrators;
  if (!Array.isArray(administrators) || administrators.length !== 2) {
    throw runtimeError('Deux administrateurs sont requis.');
  }

  for (const admin of administrators) {
    const input = memberFromBody((admin ?? {}) as Record<string, unknown>);
    const document = withoutNulls({
      ...input,
      // Le DTO AdminDto ne porte pas de date de naissance : elle reste nulle.
      roles: ['ADMIN'],
      groupId: String(savedGroup._id),
      _class: MEMBER_CLASS,
    });
    await MemberModel.create({ _id: toSpringId(null), ...document });
  }

  return savedGroup;
}
