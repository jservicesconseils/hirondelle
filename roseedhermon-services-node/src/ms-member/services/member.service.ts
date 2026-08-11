import { runtimeError, springIdFilter, toSpringId, toStringOrNull, withoutNulls } from '../../common';
import { memberFromBody } from '../mappers/member.mapper';
import { MEMBER_CLASS, MemberModel, type MemberDocument } from '../models/member.model';

/**
 * Reprend `MemberService`.
 *
 * Note : le contrôleur Spring déclarait `@PathVariable UUID id` alors que les `_id`
 * en base sont des ObjectId. La conversion échouait donc systématiquement (HTTP 400)
 * sur GET/PUT/DELETE par identifiant. Ici l'identifiant est traité comme une chaîne,
 * ce qui rend ces trois routes réellement fonctionnelles.
 *
 * Les écritures passent par `withoutNulls()` puis par une insertion ou un remplacement
 * complet, comme le faisait `MongoRepository.save()` : les propriétés nulles ne sont
 * pas écrites, exactement comme dans les documents produits par Spring Data.
 */

/** Document `members` tel qu'il est écrit en base, sans les clés nulles. */
function toDocument(body: Record<string, unknown>): Record<string, unknown> {
  return withoutNulls({ ...memberFromBody(body), _class: MEMBER_CLASS });
}

/** Équivalent de `memberRepository.save(member)` : insertion, ou remplacement si l'id est fourni. */
export async function addMember(body: Record<string, unknown>): Promise<MemberDocument> {
  const document = toDocument(body);
  const providedId = toStringOrNull(body.id);

  if (providedId === null) {
    return MemberModel.create({ _id: toSpringId(null), ...document });
  }

  const replaced = await MemberModel.findOneAndReplace(
    springIdFilter(providedId),
    { _id: toSpringId(providedId), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (!replaced) throw runtimeError(`Member could not be saved with id ${providedId}`);
  return replaced;
}

export async function getAllMembers(): Promise<MemberDocument[]> {
  return MemberModel.find().exec();
}

/** Membres rattachés à un groupe : la portée de tout ce que voit un administrateur. */
export async function getMembersByGroup(groupId: string): Promise<MemberDocument[]> {
  return MemberModel.find({ groupId }).exec();
}

/** Retrouve un membre par son courriel : lien entre le compte Cognito et sa fiche. */
export async function findMemberByEmail(email: string): Promise<MemberDocument | null> {
  return MemberModel.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).exec();
}

export async function getMemberById(id: string): Promise<MemberDocument | null> {
  return MemberModel.findOne(springIdFilter(id)).exec();
}

/**
 * Reprend `updateMember` : tous les champs sont réaffectés depuis le corps de la
 * requête, donc ceux qui en sont absents redeviennent nuls — soit, côté document, des
 * clés supprimées.
 */
export async function updateMember(id: string, body: Record<string, unknown>): Promise<MemberDocument> {
  const existing = await MemberModel.findOne(springIdFilter(id)).exec();
  if (!existing) throw runtimeError(`Member not found with id ${id}`);

  const replaced = await MemberModel.findOneAndReplace(
    { _id: existing._id },
    { _id: existing._id, ...toDocument(body) },
    { returnDocument: 'after' },
  ).exec();

  if (!replaced) throw runtimeError(`Member could not be saved with id ${id}`);
  return replaced;
}

/** `deleteById` de Spring Data : sans effet si l'identifiant n'existe pas. */
export async function deleteMember(id: string): Promise<void> {
  await MemberModel.findOneAndDelete(springIdFilter(id)).exec();
}
