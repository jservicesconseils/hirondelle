import mongoose from 'mongoose';
import {
  forgetGroupFeatures,
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
 */
export async function getMyGroupRequest(email: string): Promise<GroupDocument | null> {
  return GroupModel.findOne({ requestedByEmail: email.trim().toLowerCase() })
    .sort({ requestedAt: -1 })
    .exec();
}

/**
 * Un membre sans groupe ouvre sa propre communauté. Elle reste invisible de
 * tous — y compris de lui — tant qu'un super administrateur ne l'a pas
 * approuvée : `getAllGroups` l'exclut explicitement.
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
  });
}

/**
 * Approuve la demande : le groupe devient une communauté normale, et son
 * auteur en devient l'administrateur — dans Cognito (rôle, groupe
 * d'appartenance) comme dans le jeton qu'il obtiendra à sa prochaine connexion.
 */
export async function approveGroup(id: string, decidedByEmail: string): Promise<GroupDocument> {
  const group = await GroupModel.findOne(springIdFilter(id)).exec();
  if (!group) throw runtimeError(`Group not found: ${id}`);

  const requester = toStringOrNull(group.get('requestedByEmail'));
  if (!requester) throw runtimeError("Ce groupe ne porte aucune demande à approuver.");

  group.set('status', 'APPROVED');
  group.set('decidedByEmail', decidedByEmail.trim().toLowerCase());
  group.set('decidedAt', new Date());
  await group.save();

  const groupId = String(group._id);
  await promoteToGroupAdmin(requester);
  await setAccountGroupId(requester, groupId);
  forgetGroupFeatures(groupId);

  return group;
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
   * Seule entorse au remplacement intégral : `features` porte des droits. Une
   * modification qui ne le mentionne pas — l'écran d'identité du groupe, par
   * exemple — reconduit la valeur enregistrée plutôt que de l'effacer, ce qui
   * reviendrait à accorder tous les modules par omission.
   */
  if (body.features === undefined) {
    const existing = await GroupModel.findOne(springIdFilter(id)).exec();
    const kept = existing?.get('features');
    if (Array.isArray(kept)) document.features = kept;
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
