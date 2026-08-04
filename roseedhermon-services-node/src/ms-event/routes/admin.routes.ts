import { Router } from 'express';
import { toPrimitiveBoolean } from '../../common';
import { config } from '../config';
import { deleteEvent, getAllEvents, getEvent } from '../services/event.service';

/** Routes de `AdminController`, montées sur `/api/v1/admin`. */
export const adminRouter = Router();

/**
 * Un événement est considéré « sans photos » quand son tableau imbriqué `files` est
 * vide — c'est bien ce que testait `AdminController`, qui lisait `getAllEvents()` et
 * non la collection `event_files`.
 */
function hasNoFiles(event: Record<string, unknown>): boolean {
  const files = event.files;
  return !Array.isArray(files) || files.length === 0;
}

adminRouter.get('/events/cleanup/status', async (req, res) => {
  try {
    const allEvents = await getAllEvents();
    const eventsWithPhotos = allEvents.filter((event) => !hasNoFiles(event)).length;
    const eventsToClean = allEvents.filter(hasNoFiles).map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      category: event.category,
    }));

    res.json({
      totalEvents: allEvents.length,
      eventsWithPhotos,
      eventsWithoutPhotos: allEvents.length - eventsWithPhotos,
      eventsToClean,
      cleanupNeeded: allEvents.length - eventsWithPhotos > 0,
    });
  } catch (error) {
    res.status(500).json({ error: `Erreur lors de la vérification: ${(error as Error).message}` });
  }
});

adminRouter.post('/events/cleanup', async (req, res) => {
  try {
    const dryRun = toPrimitiveBoolean(req.query.dryRun, false);
    const allEvents = await getAllEvents();
    const eventsToDelete = allEvents.filter(hasNoFiles);

    if (eventsToDelete.length === 0) {
      res.json({ message: 'Aucun événement à supprimer', deletedCount: 0, dryRun });
      return;
    }

    const eventsDetails = eventsToDelete.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
    }));

    if (dryRun) {
      res.json({
        eventsToDelete: eventsToDelete.length,
        eventsDetails,
        message: 'Mode simulation - Aucun événement supprimé',
        deletedCount: 0,
        dryRun: true,
      });
      return;
    }

    let deletedCount = 0;
    for (const event of eventsToDelete) {
      try {
        await deleteEvent(String(event.id));
        deletedCount += 1;
      } catch (error) {
        console.error(
          `[${config.serviceName}] Erreur lors de la suppression de l'événement ${String(event.id)}: ${(error as Error).message}`,
        );
      }
    }

    res.json({
      eventsToDelete: eventsToDelete.length,
      eventsDetails,
      message: 'Nettoyage terminé avec succès',
      deletedCount,
      dryRun: false,
    });
  } catch (error) {
    res.status(500).json({ error: `Erreur lors du nettoyage: ${(error as Error).message}` });
  }
});

adminRouter.delete('/events/:eventId', async (req, res) => {
  try {
    const eventId = String(req.params.eventId);
    const event = await getEvent(eventId);
    await deleteEvent(eventId);

    res.json({
      message: 'Événement supprimé avec succès',
      deletedEvent: { id: event.id, name: event.name, date: event.date },
    });
  } catch (error) {
    res.status(500).json({ error: `Erreur lors de la suppression: ${(error as Error).message}` });
  }
});
