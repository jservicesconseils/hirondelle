import { toStringOrNull, normalizeFeatures, type Feature } from '../../common';
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
  /** `null` = absent du corps, à distinguer d'une liste vide (voir `groupFromBody`). */
  features: Feature[] | null;
}

export type GroupStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Un groupe sans statut est antérieur à cette fonctionnalité — donc déjà actif. */
export function normalizeStatus(value: unknown): GroupStatus {
  const upper = String(value ?? '').toUpperCase();
  return upper === 'PENDING' || upper === 'REJECTED' ? upper : 'APPROVED';
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
    // Toujours explicite : le client n'a pas à deviner ce que signifie l'absence.
    features: normalizeFeatures(doc.features),
    status: normalizeStatus(doc.status),
    requestedByEmail: doc.requestedByEmail ?? null,
    requestedAt: doc.requestedAt ?? null,
    decidedByEmail: doc.decidedByEmail ?? null,
    decidedAt: doc.decidedAt ?? null,
    rejectionReason: doc.rejectionReason ?? null,
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
    /**
     * On distingue « non transmis » de « transmis vide ». Le premier laisse le
     * champ absent — `withoutNulls` l'écarte — pour que `updateGroup` reconduise
     * la valeur enregistrée au lieu d'accorder tous les modules par omission.
     */
    features: body.features === undefined ? null : normalizeFeatures(body.features),
  };
}
