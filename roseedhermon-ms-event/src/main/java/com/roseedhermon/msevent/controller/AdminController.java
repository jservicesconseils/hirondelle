package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.service.EventService;
import com.roseedhermon.msevent.service.EventFileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Administration", description = "Endpoints d'administration")
public class AdminController {

    @Autowired
    private EventService eventService;
    
    @Autowired
    private EventFileService eventFileService;

    @GetMapping("/events/cleanup/status")
    @Operation(summary = "Statut du nettoyage", description = "Vérifie le statut des événements et identifie ceux sans photos")
    public ResponseEntity<Map<String, Object>> getCleanupStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // Récupérer tous les événements
            var allEvents = eventService.getAllEvents();
            
            // Compter les événements avec et sans photos
            long totalEvents = allEvents.size();
            long eventsWithPhotos = allEvents.stream()
                .filter(event -> event.getFiles() != null && !event.getFiles().isEmpty())
                .count();
            long eventsWithoutPhotos = totalEvents - eventsWithPhotos;
            
            // Identifier les événements sans photos
            List<Map<String, Object>> eventsToClean = allEvents.stream()
                .filter(event -> event.getFiles() == null || event.getFiles().isEmpty())
                .map(event -> {
                    Map<String, Object> eventInfo = new HashMap<>();
                    eventInfo.put("id", event.getId());
                    eventInfo.put("name", event.getName());
                    eventInfo.put("date", event.getDate());
                    eventInfo.put("category", event.getCategory());
                    return eventInfo;
                })
                .toList();
            
            status.put("totalEvents", totalEvents);
            status.put("eventsWithPhotos", eventsWithPhotos);
            status.put("eventsWithoutPhotos", eventsWithoutPhotos);
            status.put("eventsToClean", eventsToClean);
            status.put("cleanupNeeded", eventsWithoutPhotos > 0);
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            status.put("error", "Erreur lors de la vérification: " + e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }

    @PostMapping("/events/cleanup")
    @Operation(summary = "Nettoyer les événements", description = "Supprime tous les événements qui n'ont pas de photos")
    public ResponseEntity<Map<String, Object>> cleanupEventsWithoutPhotos(
            @RequestParam(defaultValue = "false") boolean dryRun) {
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Récupérer tous les événements
            var allEvents = eventService.getAllEvents();
            
            // Identifier les événements sans photos
            var eventsToDelete = allEvents.stream()
                .filter(event -> event.getFiles() == null || event.getFiles().isEmpty())
                .toList();
            
            if (eventsToDelete.isEmpty()) {
                result.put("message", "Aucun événement à supprimer");
                result.put("deletedCount", 0);
                result.put("dryRun", dryRun);
                return ResponseEntity.ok(result);
            }
            
            result.put("eventsToDelete", eventsToDelete.size());
            result.put("eventsDetails", eventsToDelete.stream()
                .map(event -> Map.of(
                    "id", event.getId(),
                    "name", event.getName(),
                    "date", event.getDate()
                ))
                .toList());
            
            if (dryRun) {
                result.put("message", "Mode simulation - Aucun événement supprimé");
                result.put("deletedCount", 0);
                result.put("dryRun", true);
            } else {
                // Supprimer les événements
                int deletedCount = 0;
                for (var event : eventsToDelete) {
                    try {
                        eventService.deleteEvent(event.getId());
                        deletedCount++;
                    } catch (Exception e) {
                        System.err.println("Erreur lors de la suppression de l'événement " + event.getId() + ": " + e.getMessage());
                    }
                }
                
                result.put("message", "Nettoyage terminé avec succès");
                result.put("deletedCount", deletedCount);
                result.put("dryRun", false);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("error", "Erreur lors du nettoyage: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @DeleteMapping("/events/{eventId}")
    @Operation(summary = "Supprimer un événement spécifique", description = "Supprime un événement par son ID")
    public ResponseEntity<Map<String, Object>> deleteSpecificEvent(@PathVariable("eventId") String eventId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Vérifier si l'événement existe
            var event = eventService.getEvent(eventId);
            
            // Supprimer l'événement
            eventService.deleteEvent(eventId);
            
            result.put("message", "Événement supprimé avec succès");
            result.put("deletedEvent", Map.of(
                "id", event.getId(),
                "name", event.getName(),
                "date", event.getDate()
            ));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("error", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
} 