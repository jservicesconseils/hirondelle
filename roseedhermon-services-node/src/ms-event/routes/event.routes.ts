import { Router } from 'express';
import type { Request } from 'express';
import {
  FEATURES,
  ROLES,
  asyncHandler,
  emptyResponse,
  isSuperAdmin,
  requestAllows,
  requireAuth,
  requireGroupFeature,
  requireRole,
} from '../../common';
import { createEventWithPhotosFromBody, eventFromBody } from '../mappers/event.mapper';
import {
  createEvent,
  createEventWithPhotos,
  deleteEvent,
  getAllEvents,
  getAllEventsWithFiles,
  getEvent,
  updateEvent,
} from '../services/event.service';
import { feedbackFromBody, getFeedbackByEventId, submitFeedback } from '../services/event-feedback.service';
import { getRegistrationsByEvent } from '../services/event-registration.service';
import {
  countInterests,
  findInterest,
  getInterestsByEvent,
  countInterestsByEvents,
  interestFromBody,
  markInterest,
  normalizeEmail,
  removeInterest,
} from '../services/event-interest.service';
import { getEventStats } from '../services/event-stats.service';
import { administers, isPrivate, isVisibleTo, ownerGroupId } from '../event-visibility';
import { registrationRouter } from './registration.routes';

/** Routes de `EventController`, montées sur `/api/v1/events`. */
export const eventRouter = Router();

// Les chemins littéraux sont déclarés avant `/:id`, comme le fait la résolution Spring.
eventRouter.get(
  '/with-files',
  asyncHandler(async (req, res) => {
    const events = await getAllEventsWithFiles();
    res.json(events.filter((event) => isVisibleTo(req, event)));
  }),
);

/**
 * Compteurs d'intérêt de tous les événements visibles, en un seul appel.
 *
 * Déclarée avant `/:id`, qui capturerait sinon « interest-counts » comme un
 * identifiant. Seuls les compteurs sortent : les noms des personnes restent
 * réservés à l'organisateur.
 */
eventRouter.get(
  '/interest-counts',
  asyncHandler(async (req, res) => {
    const events = await getAllEvents();
    const visibleIds = events
      .filter((event) => isVisibleTo(req, event))
      .map((event) => String(event.id))
      .filter(Boolean);

    res.json(await countInterestsByEvents(visibleIds));
  }),
);

eventRouter.post(
  '/with-photos',
  asyncHandler(async (req, res) => {
    res.json(await createEventWithPhotos(createEventWithPhotosFromBody(req.body)));
  }),
);

/**
 * Alias attendus par le client Angular.
 *
 * `EventService` (front) appelle `/api/v1/events/registrations`, `/api/v1/events/feedback`
 * et `/api/v1/events/{id}/feedback`, alors que les contrôleurs Java exposaient
 * `/api/v1/registrations` et `/api/v1/feedback`. Ces trois routes renvoyaient donc une
 * erreur ; on les branche sur les mêmes services pour que le front fonctionne, sans
 * retirer les chemins d'origine.
 */
eventRouter.use('/registrations', registrationRouter);

eventRouter.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    res.json(await submitFeedback(feedbackFromBody(req.body)));
  }),
);

eventRouter.get(
  '/:eventId/feedback',
  asyncHandler(async (req, res) => {
    res.json(await getFeedbackByEventId(String(req.params.eventId)));
  }),
);

/** Liste des inscrits à un événement, réservée à son organisateur. */
eventRouter.get(
  '/:eventId/registrations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await getEvent(eventId).catch(() => null);

    if (event === null || !isVisibleTo(req, event)) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }
    if (!administers(req, event)) {
      res.status(403).json({ error: 'Droits insuffisants.' });
      return;
    }

    res.json(await getRegistrationsByEvent(eventId));
  }),
);

// --- Intérêt et chiffres de participation -----------------------------------------

/**
 * Événement visible par la requête, ou `null`.
 *
 * Un événement privé d'un autre groupe est traité comme inexistant, ici comme
 * partout ailleurs : on ne révèle pas son existence.
 */
async function visibleEvent(req: Request, eventId: string): Promise<Record<string, unknown> | null> {
  const event = await getEvent(eventId).catch(() => null);
  if (event === null || !isVisibleTo(req, event)) return null;
  return event;
}

/**
 * Qui marque son intérêt.
 *
 * Une session ouverte impose son courriel : on ne se déclare pas intéressé à la
 * place de quelqu'un d'autre. Sans session, c'est le courriel envoyé qui sert de
 * clé — c'est la seule façon de ne compter chaque personne qu'une fois.
 */
function interestIdentity(req: Request, provided: string | null): string | null {
  return normalizeEmail(req.auth?.email ?? provided);
}

/** Forme minimale d'un courriel : une barrière contre la faute de frappe, pas contre la fraude. */
function looksLikeEmail(value: string | null): boolean {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Compteur d'intérêt d'un événement, et si la personne qui demande en fait partie.
 *
 * Lisible sans session : le nombre d'intéressés s'affiche sur la fiche publique.
 * Seul le **compte** sort — jamais les noms, qui sont réservés à l'organisateur.
 */
eventRouter.get(
  '/:eventId/interest',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await visibleEvent(req, eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    const email = interestIdentity(req, typeof req.query.email === 'string' ? req.query.email : null);
    const mine = email ? await findInterest(eventId, null, email) : null;

    res.json({
      eventId,
      count: await countInterests(eventId),
      interested: mine !== null,
    });
  }),
);

/**
 * « Je suis intéressé ».
 *
 * Ouvert sans authentification, comme la réservation : c'est le geste d'un
 * visiteur du site. Un second appel ne compte pas deux fois.
 */
eventRouter.post(
  '/:eventId/interest',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await visibleEvent(req, eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    const body = interestFromBody(req.body);
    const email = interestIdentity(req, body.email);

    if (!looksLikeEmail(email)) {
      res.status(400).json({ error: 'Indiquez un courriel valide pour être tenu au courant.' });
      return;
    }

    const { interest, created } = await markInterest({
      ...body,
      eventId,
      email,
      groupId: event.groupId ? String(event.groupId) : null,
    });

    res.json({
      ...interest,
      alreadyInterested: !created,
      count: await countInterests(eventId),
    });
  }),
);

/** Retrait de l'intérêt : le même geste, dans l'autre sens. */
eventRouter.delete(
  '/:eventId/interest',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await visibleEvent(req, eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    const provided =
      typeof req.query.email === 'string' ? req.query.email : interestFromBody(req.body).email;
    const email = interestIdentity(req, provided);

    if (!email) {
      res.status(400).json({ error: 'Indiquez le courriel à retirer.' });
      return;
    }

    const removed = await removeInterest(eventId, null, email);
    res.json({ eventId, removed, count: await countInterests(eventId), interested: false });
  }),
);

/** Liste nominative des intéressés : réservée à l'organisateur, comme les inscrits. */
eventRouter.get(
  '/:eventId/interests',
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await visibleEvent(req, eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }
    if (!administers(req, event)) {
      res.status(403).json({ error: 'Droits insuffisants.' });
      return;
    }

    res.json(await getInterestsByEvent(eventId));
  }),
);

/**
 * Chiffres de participation : inscrits, total encaissé, intéressés.
 *
 * Réservé à l'organisateur — le total encaissé et le nombre d'inscrits ne
 * regardent pas les visiteurs.
 */
eventRouter.get(
  '/:eventId/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const event = await visibleEvent(req, eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }
    if (!administers(req, event)) {
      res.status(403).json({ error: 'Droits insuffisants.' });
      return;
    }

    res.json(await getEventStats(eventId, event));
  }),
);

/**
 * Création d'un événement.
 *
 * Un événement **public** est ouvert à tous, y compris sans session : c'est le
 * parcours « Créer un événement » du site. Un événement **privé** n'a de sens que
 * rattaché à un groupe : il exige donc une session d'administration.
 */
eventRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = { ...(req.body ?? {}) } as Record<string, unknown>;
    const wantsPrivate = isPrivate(body.visibility);
    const administrator =
      !!req.auth && req.auth.roles.some((role) => role === ROLES.SUPER_ADMIN || role === ROLES.GROUP_ADMIN);

    /**
     * Le module conditionne le rattachement au groupe, pas l'accès au site : un
     * administrateur dont le groupe ne gère que son annuaire reste libre de créer
     * un événement public, comme n'importe quel visiteur — il sera simplement
     * sans groupe. Le privé, lui, n'a pas de sens sans le module et est refusé.
     */
    const organises = administrator && requestAllows(req, FEATURES.EVENTS);

    if (wantsPrivate && !organises) {
      res.status(req.auth ? 403 : 401).json({
        error: administrator
          ? "La gestion des événements n'est pas activée pour votre groupe."
          : "Un événement réservé à un groupe ne peut être créé que par un administrateur de groupe.",
      });
      return;
    }

    if (organises) {
      body.visibility = wantsPrivate ? 'PRIVATE' : 'PUBLIC';
      body.groupId = ownerGroupId(req, body);
    } else {
      // Création sans droits d'organisateur : l'événement est public et n'appartient
      // à aucun groupe. Le client ne peut donc pas se rattacher à un groupe qui
      // n'est pas le sien, ni à un groupe qui ne gère pas d'événements.
      body.visibility = 'PUBLIC';
      body.groupId = null;
    }

    res.json(await createEvent(eventFromBody(body)));
  }),
);

eventRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const events = await getAllEvents();
    res.json(events.filter((event) => isVisibleTo(req, event)));
  }),
);

eventRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await getEvent(String(req.params.id));
    // Un événement privé d'un autre groupe est traité comme inexistant : on ne
    // révèle pas son existence par un 403.
    if (!isVisibleTo(req, event)) return emptyResponse.notFound(res);
    return res.json(event);
  }),
);

eventRouter.put(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN),
  requireGroupFeature(FEATURES.EVENTS),
  asyncHandler(async (req, res) => {
    const existing = await getEvent(String(req.params.id));
    if (!isSuperAdmin(req) && String(existing.groupId ?? '') !== (req.auth?.groupId ?? '')) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }
    const body = { ...(req.body ?? {}) } as Record<string, unknown>;
    body.groupId = ownerGroupId(req, body);
    return res.json(await updateEvent(String(req.params.id), eventFromBody(body)));
  }),
);

eventRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN),
  requireGroupFeature(FEATURES.EVENTS),
  asyncHandler(async (req, res) => {
    const existing = await getEvent(String(req.params.id));
    if (!isSuperAdmin(req) && String(existing.groupId ?? '') !== (req.auth?.groupId ?? '')) {
      return res.status(403).json({ error: 'Droits insuffisants.' });
    }
    await deleteEvent(String(req.params.id));
    return emptyResponse.noContent(res);
  }),
);
