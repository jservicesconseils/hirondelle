import { Router } from 'express';
import { asyncHandler, emptyResponse } from '../../common';
import { groupToJson } from '../mappers/group.mapper';
import * as groupService from '../services/group.service';

/** Reprend `GroupController` : @RequestMapping("/api/v1/groups"). */
export const groupRouter = Router();

// POST /api/v1/groups/with-admins — déclaré avant /:id pour ne pas être capturé par celui-ci
groupRouter.post(
  '/with-admins',
  asyncHandler(async (req, res) => {
    const group = await groupService.createGroupWithAdmins(req.body ?? {});
    res.json(groupToJson(group));
  }),
);

// POST /api/v1/groups
groupRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await groupService.createGroup(req.body ?? {});
    res.json(groupToJson(created));
  }),
);

// GET /api/v1/groups
groupRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const groups = await groupService.getAllGroups();
    res.json(groups.map(groupToJson));
  }),
);

// GET /api/v1/groups/{id}
groupRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await groupService.getGroupById(req.params.id);
    if (!group) return emptyResponse.notFound(res);
    return res.json(groupToJson(group));
  }),
);

// PUT /api/v1/groups/{id}
groupRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await groupService.updateGroup(req.params.id, req.body ?? {});
    res.json(groupToJson(updated));
  }),
);

// DELETE /api/v1/groups/{id}
groupRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await groupService.deleteGroup(req.params.id);
    emptyResponse.noContent(res);
  }),
);
