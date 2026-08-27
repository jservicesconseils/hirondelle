import { Router } from 'express';
import {
  FEATURES,
  ROLES,
  asyncHandler,
  emptyResponse,
  isSuperAdmin,
  requireAuth,
  requireGroupFeature,
  requireRole,
  resolveScopeGroupId,
} from '../../common';
import { memberToJson } from '../mappers/member.mapper';
import * as memberService from '../services/member.service';
import { sendInvitationSms } from '../services/invitation.service';

/** Reprend `MemberController` : @RequestMapping("/api/v1/members"). */
export const memberRouter = Router();

/**
 * L'annuaire est un module : il n'existe que pour les groupes auxquels il a été
 * attribué. La garde est posée route par route plutôt que sur le routeur entier,
 * car `PUT /:id` en est délibérément exempt — chacun doit pouvoir corriger sa
 * propre fiche, même dans un groupe qui ne gère que ses événements.
 */
const directoryOnly = requireGroupFeature(FEATURES.MEMBERS);

/**
 * Création d'un membre par un administrateur.
 *
 * Le membre est rattaché au groupe de l'administrateur — un administrateur de
 * groupe ne peut pas inscrire quelqu'un ailleurs — puis reçoit son texto
 * d'invitation. L'envoi est asynchrone : son échec ne fait pas échouer la création.
 */
memberRouter.post(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN),
  directoryOnly,
  asyncHandler(async (req, res) => {
    const body = { ...(req.body ?? {}) } as Record<string, unknown>;

    const scopeGroupId = isSuperAdmin(req) ? (body.groupId ?? req.auth?.groupId ?? null) : req.auth?.groupId ?? null;
    if (scopeGroupId) body.groupId = scopeGroupId;
    if (!body.roles) body.roles = [ROLES.MEMBER];

    const created = await memberService.addMember(body);
    const json = memberToJson(created);

    void sendInvitationSms({
      firstName: json.firstName,
      phoneNumber: json.phoneNumber,
      groupId: json.groupId,
    });

    res.json(json);
  }),
);

/**
 * Liste des membres, limitée au groupe de l'appelant.
 *
 * Un super administrateur voit tout le monde et peut restreindre avec `?groupId=`.
 * Les autres ne voient jamais que leur propre groupe.
 */
memberRouter.get(
  '/',
  requireAuth,
  directoryOnly,
  asyncHandler(async (req, res) => {
    const groupId = resolveScopeGroupId(req);
    const members = groupId
      ? await memberService.getMembersByGroup(groupId)
      : await memberService.getAllMembers();
    res.json(members.map(memberToJson));
  }),
);

// GET /api/v1/members/{id}
memberRouter.get(
  '/:id',
  requireAuth,
  directoryOnly,
  asyncHandler(async (req, res) => {
    const member = await memberService.getMemberById(req.params.id);
    if (!member) return emptyResponse.notFound(res);

    const json = memberToJson(member);
    // On ne consulte pas la fiche d'un membre d'un autre groupe.
    if (!isSuperAdmin(req) && json.groupId && json.groupId !== req.auth?.groupId) {
      return emptyResponse.notFound(res);
    }
    return res.json(json);
  }),
);

// PUT /api/v1/members/{id}
memberRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await memberService.getMemberById(req.params.id);
    if (!existing) return emptyResponse.notFound(res);

    const current = memberToJson(existing);
    const isOwnRecord = req.auth?.email !== null && current.email === req.auth?.email;
    const canAdminister =
      isSuperAdmin(req) ||
      (req.auth?.roles.includes(ROLES.GROUP_ADMIN) && current.groupId === req.auth?.groupId);

    // Chacun modifie sa propre fiche ; sinon il faut administrer le groupe.
    if (!isOwnRecord && !canAdminister) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }

    const body = { ...(req.body ?? {}) } as Record<string, unknown>;
    // Ni le groupe ni les rôles ne se changent par ce point d'entrée, sauf super admin.
    if (!isSuperAdmin(req)) {
      body.groupId = current.groupId;
      body.roles = current.roles;
    }

    const updated = await memberService.updateMember(req.params.id, body);
    return res.json(memberToJson(updated));
  }),
);

/**
 * Vide l'annuaire d'un coup — réservé au super administrateur.
 *
 * Sans `?groupId=`, toutes les fiches sont supprimées ; avec, seules celles du
 * groupe visé (`resolveScopeGroupId` borne déjà la portée à ce que l'appelant a
 * le droit de viser). Action irréversible : le client demande une confirmation
 * explicite avant d'appeler.
 */
memberRouter.delete(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  directoryOnly,
  asyncHandler(async (req, res) => {
    const groupId = resolveScopeGroupId(req);
    const deleted = await memberService.deleteAllMembers(groupId);
    return res.json({ deleted });
  }),
);

// DELETE /api/v1/members/{id}
memberRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN),
  directoryOnly,
  asyncHandler(async (req, res) => {
    const existing = await memberService.getMemberById(req.params.id);
    if (!existing) return emptyResponse.notFound(res);

    const current = memberToJson(existing);
    if (!isSuperAdmin(req) && current.groupId !== req.auth?.groupId) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }

    await memberService.deleteMember(req.params.id);
    return emptyResponse.noContent(res);
  }),
);
