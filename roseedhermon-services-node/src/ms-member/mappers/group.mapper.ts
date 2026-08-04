import { toStringOrNull } from '../../common';
import type { GroupDocument } from '../models/group.model';

/** Champs modifiables d'un groupe (l'id est porté par `_id`). */
export interface GroupInput {
  name: string | null;
  type: string | null;
  country: string | null;
  street: string | null;
  city: string | null;
  stateOrProvince: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

/** `GroupEntity` -> JSON, dans l'ordre produit par Jackson. */
export function groupToJson(doc: GroupDocument) {
  return {
    id: doc._id ? String(doc._id) : null,
    name: doc.name ?? null,
    type: doc.type ?? null,
    country: doc.country ?? null,
    street: doc.street ?? null,
    city: doc.city ?? null,
    stateOrProvince: doc.stateOrProvince ?? null,
    phone: doc.phone ?? null,
    email: doc.email ?? null,
    website: doc.website ?? null,
  };
}

export function groupFromBody(body: Record<string, unknown>): GroupInput {
  return {
    name: toStringOrNull(body.name),
    type: toStringOrNull(body.type),
    country: toStringOrNull(body.country),
    street: toStringOrNull(body.street),
    city: toStringOrNull(body.city),
    stateOrProvince: toStringOrNull(body.stateOrProvince),
    phone: toStringOrNull(body.phone),
    email: toStringOrNull(body.email),
    website: toStringOrNull(body.website),
  };
}
