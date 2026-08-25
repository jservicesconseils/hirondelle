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
} from '../../common';
import { groupToJson } from '../mappers/group.mapper';
import { memberToJson } from '../mappers/member.mapper';
import * as groupService from '../services/group.service';
import * as memberService from '../services/member.service';

/** Reprend `GroupController` : @RequestMapping("/api/v1/groups"). */
export const groupRouter = Router();

/** Un administrateur de groupe ne travaille que sur le sien. */
function canReach(req: Parameters<typeof isSuperAdmin>[0], groupId: string): boolean {
  return isSuperAdmin(req) || req.auth?.groupId === groupId;
}

// POST /api/v1/groups/with-admins — déclaré avant /:id pour ne pas être capturé par celui-ci
groupRouter.post(
  '/with-admins',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const group = await groupService.createGroupWithAdmins(req.body ?? {});
    res.json(groupToJson(group));
  }),
);

/**
 * Un membre sans groupe ouvre sa propre communauté. `requireRole` n'est pas
 * de mise ici : c'est justement l'absence de rôle d'administration qui amène
 * quelqu'un vers cette route, pas une condition qui l'y autoriserait.
 */
groupRouter.post(
  '/request',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.auth?.groupId) {
      res.status(409).json({ error: 'Ce compte appartient déjà à un groupe.' });
      return;
    }
    const email = req.auth?.email;
    if (!email) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    const created = await groupService.requestGroup(email, req.body ?? {});
    res.status(201).json(groupToJson(created));
  }),
);

// GET /api/v1/groups/my-request — déclaré avant /:id pour ne pas être capturé par celui-ci
groupRouter.get(
  '/my-request',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = req.auth?.email;
    if (!email) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    const group = await groupService.getMyGroupRequest(email);
    res.json(group ? groupToJson(group) : null);
  }),
);

// GET /api/v1/groups/requests — déclaré avant /:id pour ne pas être capturé par celui-ci
groupRouter.get(
  '/requests',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (_req, res) => {
    const groups = await groupService.getPendingGroups();
    res.json(groups.map(groupToJson));
  }),
);

// POST /api/v1/groups — la création d'un groupe reste l'affaire du super administrateur.
groupRouter.post(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const created = await groupService.createGroup(req.body ?? {});
    res.json(groupToJson(created));
  }),
);

/**
 * Liste des groupes : tous pour le super administrateur, uniquement le sien
 * pour les autres.
 */
groupRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (isSuperAdmin(req)) {
      const groups = await groupService.getAllGroups();
      return res.json(groups.map(groupToJson));
    }

    const groupId = req.auth?.groupId;
    if (!groupId) return res.json([]);

    const group = await groupService.getGroupById(groupId);
    return res.json(group ? [groupToJson(group)] : []);
  }),
);

/**
 * Tableau de bord du super administrateur : chaque groupe avec son effectif.
 * Déclaré avant `/:id` pour ne pas être capturé par celui-ci.
 */
groupRouter.get(
  '/overview',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (_req, res) => {
    const [groups, members] = await Promise.all([
      groupService.getAllGroups(),
      memberService.getAllMembers(),
    ]);

    const rows = members.map(memberToJson);
    const countByGroup = new Map<string, number>();
    let unassigned = 0;

    for (const member of rows) {
      if (member.groupId) {
        countByGroup.set(member.groupId, (countByGroup.get(member.groupId) ?? 0) + 1);
      } else {
        unassigned += 1;
      }
    }

    res.json({
      totalGroups: groups.length,
      totalMembers: rows.length,
      membersWithoutGroup: unassigned,
      groups: groups.map((group) => {
        const json = groupToJson(group);
        return { ...json, memberCount: json.id ? countByGroup.get(json.id) ?? 0 : 0 };
      }),
    });
  }),
);

// POST /api/v1/groups/{id}/approve — le compte demandeur devient GROUP_ADMIN de ce groupe.
groupRouter.post(
  '/:id/approve',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const email = req.auth?.email ?? 'inconnu';
    const approved = await groupService.approveGroup(req.params.id, email);
    res.json(groupToJson(approved));
  }),
);

// POST /api/v1/groups/{id}/reject
groupRouter.post(
  '/:id/reject',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const email = req.auth?.email ?? 'inconnu';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() || null : null;
    const rejected = await groupService.rejectGroup(req.params.id, email, reason);
    res.json(groupToJson(rejected));
  }),
);

// GET /api/v1/groups/{id}/stats — effectif et événements, pour le détail d'un groupe.
groupRouter.get(
  '/:id/stats',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await groupService.getGroupStats(req.params.id));
  }),
);

// GET /api/v1/groups/{id}/members — l'annuaire d'un groupe précis.
groupRouter.get(
  '/:id/members',
  requireAuth,
  requireGroupFeature(FEATURES.MEMBERS),
  asyncHandler(async (req, res) => {
    if (!canReach(req, req.params.id)) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }
    const members = await memberService.getMembersByGroup(req.params.id);
    return res.json(members.map(memberToJson));
  }),
);

// GET /api/v1/groups/{id}
groupRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!canReach(req, req.params.id)) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }
    const group = await groupService.getGroupById(req.params.id);
    if (!group) return emptyResponse.notFound(res);
    return res.json(groupToJson(group));
  }),
);

// PUT /api/v1/groups/{id}
groupRouter.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN),
  asyncHandler(async (req, res) => {
    if (!canReach(req, req.params.id)) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }
    const updated = await groupService.updateGroup(req.params.id, req.body ?? {});
    return res.json(groupToJson(updated));
  }),
);

// DELETE /api/v1/groups/{id}
groupRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    await groupService.deleteGroup(req.params.id);
    return emptyResponse.noContent(res);
  }),
);
