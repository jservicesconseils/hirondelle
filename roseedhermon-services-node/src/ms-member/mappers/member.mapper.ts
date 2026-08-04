import { formatLocalDate, parseLocalDate, toStringOrNull } from '../../common';
import type { MemberDocument } from '../models/member.model';

/** Champs modifiables d'un membre (l'id est porté par `_id`). */
export interface MemberInput {
  lastName: string | null;
  firstName: string | null;
  gender: string | null;
  birthDate: Date | null;
  profession: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  location: string | null;
  photo: string | null;
  socialLinks: string[] | null;
  roles: string[] | null;
  groupId: string | null;
}

function toStringArrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => String(item));
}

/**
 * `MemberEntity` -> JSON, dans l'ordre et avec les types produits par Jackson.
 * `birthDate` est un `LocalDate` : "YYYY-MM-DD".
 */
export function memberToJson(doc: MemberDocument) {
  return {
    id: doc._id ? String(doc._id) : null,
    lastName: doc.lastName ?? null,
    firstName: doc.firstName ?? null,
    gender: doc.gender ?? null,
    birthDate: formatLocalDate(doc.birthDate),
    profession: doc.profession ?? null,
    phoneNumber: doc.phoneNumber ?? null,
    email: doc.email ?? null,
    address: doc.address ?? null,
    city: doc.city ?? null,
    location: doc.location ?? null,
    photo: doc.photo ?? null,
    socialLinks: doc.socialLinks ?? null,
    roles: doc.roles ?? null,
    groupId: doc.groupId ?? null,
  };
}

/** Corps de requête -> champs d'entité (les propriétés inconnues sont ignorées, comme Jackson). */
export function memberFromBody(body: Record<string, unknown>): MemberInput {
  return {
    lastName: toStringOrNull(body.lastName),
    firstName: toStringOrNull(body.firstName),
    gender: toStringOrNull(body.gender),
    birthDate: parseLocalDate(body.birthDate),
    profession: toStringOrNull(body.profession),
    phoneNumber: toStringOrNull(body.phoneNumber),
    email: toStringOrNull(body.email),
    address: toStringOrNull(body.address),
    city: toStringOrNull(body.city),
    location: toStringOrNull(body.location),
    photo: toStringOrNull(body.photo),
    socialLinks: toStringArrayOrNull(body.socialLinks),
    roles: toStringArrayOrNull(body.roles),
    groupId: toStringOrNull(body.groupId),
  };
}
