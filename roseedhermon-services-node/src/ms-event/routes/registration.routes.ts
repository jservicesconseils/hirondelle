import { Router } from 'express';
import type { Request } from 'express';
import { ApiError, asyncHandler, emptyResponse, isSuperAdmin, requireAuth, ROLES } from '../../common';
import { administers, isVisibleTo, ownsRegistration } from '../event-visibility';
import { getAllEvents, getEvent } from '../services/event.service';
import {
  cancelRegistration,
  countReservedSeats,
  findExistingRegistration,
  getAllRegistrations,
  getRegistration,
  getRegistrationsByEvent,
  getRegistrationsByEvents,
  getRegistrationsByUser,
  getRegistrationStatus,
  registerForEvent,
  registrationFromBody,
} from '../services/event-registration.service';
import { createCheckoutSession, refundRegistrationPayment } from '../services/checkout.service';

/** Routes de `EventRegistrationController`, montées sur `/api/v1/registrations`. */
export const registrationRouter = Router();

/** Événement associé à l'inscription, ou `null` s'il a été supprimé depuis. */
async function loadEvent(eventId: string | null): Promise<Record<string, unknown> | null> {
  if (!eventId) return null;
  try {
    return await getEvent(eventId);
  } catch {
    return null;
  }
}

/** Identifiants des événements du groupe administré par la requête. */
async function ownedEventIds(req: Request): Promise<string[]> {
  const events = await getAllEvents();
  return events.filter((event) => administers(req, event)).map((event) => String(event.id));
}

// --- Création ---------------------------------------------------------------------

/**
 * Réservation d'une place.
 *
 * Ouverte sans authentification — c'est le parcours d'un visiteur du site — mais
 * bornée : on ne peut pas s'inscrire à un événement que l'on n'a pas le droit de
 * voir, ni réserver deux fois la même place.
 */
registrationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = registrationFromBody(req.body);

    if (!input.eventId) {
      res.status(400).json({ error: "L'identifiant de l'événement est requis." });
      return;
    }

    const event = await loadEvent(input.eventId);
    if (event === null) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    // Un événement privé d'un autre groupe répond 404, comme sa consultation :
    // on ne révèle pas son existence.
    if (!isVisibleTo(req, event)) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    if (!input.firstName && !input.lastName && !input.email && !input.userId) {
      res.status(400).json({ error: 'Indiquez au moins un nom ou un courriel.' });
      return;
    }

    // Un rechargement de la page de confirmation ne doit pas créer un second billet.
    const existing = await findExistingRegistration(input.eventId, input.userId, input.email);
    if (existing !== null) {
      res.status(200).json({ ...existing, alreadyRegistered: true });
      return;
    }

    // Contrôle des places restantes, quand l'organisateur en a annoncé un nombre.
    const announced = Number(event.availableSeats ?? 0);
    const requested = input.seats ?? 1;
    if (announced > 0) {
      const reserved = await countReservedSeats(input.eventId);
      if (reserved + requested > announced) {
        res.status(409).json({
          error: 'Il ne reste pas assez de places.',
          availableSeats: Math.max(0, announced - reserved),
        });
        return;
      }
    }

    const created = await registerForEvent({
      ...input,
      seats: requested,
      status: input.status ?? 'CONFIRMED',
      // Le groupe organisateur est recopié : il permet de filtrer les inscriptions
      // par groupe sans avoir à relire l'événement à chaque lecture.
      groupId: input.groupId ?? (event.groupId ? String(event.groupId) : null),
    });

    res.json(created);
  }),
);

/**
 * Démarre le paiement d'une inscription à un événement payant : crée
 * l'inscription en attente puis renvoie l'URL d'une Checkout Session Stripe.
 * Reprend, avant le paiement lui-même, exactement les contrôles de `POST /` —
 * un événement payant n'est pas moins ouvert qu'un événement gratuit.
 */
registrationRouter.post(
  '/checkout-session',
  asyncHandler(async (req, res) => {
    const input = registrationFromBody(req.body);

    if (!input.eventId) {
      res.status(400).json({ error: "L'identifiant de l'événement est requis." });
      return;
    }

    const event = await loadEvent(input.eventId);
    if (event === null || !isVisibleTo(req, event)) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }

    if (!input.firstName && !input.lastName && !input.email && !input.userId) {
      res.status(400).json({ error: 'Indiquez au moins un nom ou un courriel.' });
      return;
    }

    const existing = await findExistingRegistration(input.eventId, input.userId, input.email);
    if (existing !== null) {
      res.status(200).json({ ...existing, alreadyRegistered: true });
      return;
    }

    const announced = Number(event.availableSeats ?? 0);
    const requested = input.seats ?? 1;
    if (announced > 0) {
      const reserved = await countReservedSeats(input.eventId);
      if (reserved + requested > announced) {
        res.status(409).json({
          error: 'Il ne reste pas assez de places.',
          availableSeats: Math.max(0, announced - reserved),
        });
        return;
      }
    }

    try {
      const { url } = await createCheckoutSession(event, {
        ...input,
        seats: requested,
        groupId: input.groupId ?? (event.groupId ? String(event.groupId) : null),
      });
      res.json({ url });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }),
);

// --- Lectures ---------------------------------------------------------------------

/**
 * Inscriptions de la personne connectée, rapprochées par courriel.
 *
 * Déclarée avant `/:id` : sans cela « mine » serait pris pour un identifiant.
 */
registrationRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getRegistrationsByUser(null, req.auth?.email ?? null));
  }),
);

/**
 * Liste des inscriptions, bornée au périmètre de la requête.
 *
 * Le super administrateur voit tout ; l'administrateur de groupe les inscriptions
 * aux événements de son groupe ; un membre uniquement les siennes.
 */
registrationRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : null;

    if (eventId) {
      const event = await loadEvent(eventId);
      if (event === null || !isVisibleTo(req, event)) {
        res.status(404).json({ error: 'Événement introuvable.' });
        return;
      }
      if (!administers(req, event)) {
        res.status(403).json({ error: 'Droits insuffisants.' });
        return;
      }
      res.json(await getRegistrationsByEvent(eventId));
      return;
    }

    if (isSuperAdmin(req)) {
      res.json(await getAllRegistrations());
      return;
    }

    if (req.auth?.roles.includes(ROLES.GROUP_ADMIN)) {
      res.json(await getRegistrationsByEvents(await ownedEventIds(req)));
      return;
    }

    res.json(await getRegistrationsByUser(null, req.auth?.email ?? null));
  }),
);

/**
 * Une inscription précise.
 *
 * Volontairement lisible sans authentification : le billet délivré au visiteur
 * porte cet identifiant, et il doit pouvoir le rouvrir depuis un autre appareil.
 * L'identifiant fait donc office de jeton — il est imprévisible, mais quiconque
 * le détient voit l'inscription. Le contrôle à l'entrée fonctionne sur ce principe.
 */
registrationRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const registration = await getRegistration(String(req.params.id));
    if (registration === null) {
      res.status(404).json({ error: 'Inscription introuvable.' });
      return;
    }
    res.json(registration);
  }),
);

registrationRouter.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = await getRegistrationStatus(String(req.params.id));
    // `ResponseEntity<String>` passait par le StringHttpMessageConverter : le corps est
    // le texte brut, pas une chaîne JSON.
    res.type('text/plain; charset=utf-8').send(status);
  }),
);

// --- Annulation -------------------------------------------------------------------

/**
 * Annulation. Ouverte à qui détient l'identifiant — comme la lecture — ainsi qu'à
 * l'organisateur de l'événement et au super administrateur.
 */
registrationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const registrationId = String(req.params.id);
    const registration = await getRegistration(registrationId);

    if (registration === null) {
      // `deleteById` ignorait déjà un identifiant inconnu : on garde ce contrat.
      emptyResponse.noContent(res);
      return;
    }

    const event = await loadEvent(registration.eventId ? String(registration.eventId) : null);
    const allowed = event !== null && administers(req, event);

    if (!allowed && req.auth && !ownsRegistration(req, registration)) {
      // Une session ouverte qui n'est ni l'organisateur ni la personne inscrite.
      res.status(403).json({ error: 'Droits insuffisants.' });
      return;
    }

    // Une réservation payée doit être remboursée avant d'être effacée — sans
    // quoi le débit reste en place alors que le billet n'existe plus.
    if (registration.paymentStatus === 'paid' && registration.stripePaymentIntentId) {
      try {
        await refundRegistrationPayment(String(registration.stripePaymentIntentId));
      } catch (error) {
        res.status(502).json({
          error: `Le remboursement a échoué, la réservation n'a pas été annulée : ${(error as Error).message}`,
        });
        return;
      }
    }

    await cancelRegistration(registrationId);
    emptyResponse.noContent(res);
  }),
);
