import {
  forgetGroupFeatures,
  runtimeError,
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

export async function getAllGroups(): Promise<GroupDocument[]> {
  return GroupModel.find().exec();
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
