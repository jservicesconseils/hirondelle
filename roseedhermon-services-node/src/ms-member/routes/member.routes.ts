import { Router } from 'express';
import { asyncHandler, emptyResponse } from '../../common';
import { memberToJson } from '../mappers/member.mapper';
import * as memberService from '../services/member.service';

/** Reprend `MemberController` : @RequestMapping("/api/v1/members"). */
export const memberRouter = Router();

// POST /api/v1/members
memberRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await memberService.addMember(req.body ?? {});
    res.json(memberToJson(created));
  }),
);

// GET /api/v1/members
memberRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const members = await memberService.getAllMembers();
    res.json(members.map(memberToJson));
  }),
);

// GET /api/v1/members/{id}
memberRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await memberService.getMemberById(req.params.id);
    if (!member) return emptyResponse.notFound(res);
    return res.json(memberToJson(member));
  }),
);

// PUT /api/v1/members/{id}
memberRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await memberService.updateMember(req.params.id, req.body ?? {});
    res.json(memberToJson(updated));
  }),
);

// DELETE /api/v1/members/{id}
memberRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await memberService.deleteMember(req.params.id);
    emptyResponse.noContent(res);
  }),
);
