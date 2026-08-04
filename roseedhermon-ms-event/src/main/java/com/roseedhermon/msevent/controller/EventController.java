package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.dto.CreateEventWithPhotosDTO;
import com.roseedhermon.msevent.dto.EventDTO;
import com.roseedhermon.msevent.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@Tag(name = "Événements", description = "Gestion des événements")
@Transactional
public class EventController {

    @Autowired
    private EventService eventService;

    @PostMapping
    @Operation(summary = "Créer un événement", description = "Crée un nouvel événement")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO eventDTO) {
        EventDTO createdEvent = eventService.createEvent(eventDTO);
        return ResponseEntity.ok(createdEvent);
    }

    @PostMapping("/with-photos")
    @Operation(summary = "Créer un événement avec photos", 
               description = "Crée un nouvel événement avec ses photos associées")
    public ResponseEntity<EventDTO> createEventWithPhotos(@RequestBody CreateEventWithPhotosDTO createDTO) {
        EventDTO createdEvent = eventService.createEventWithPhotos(createDTO);
        return ResponseEntity.ok(createdEvent);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un événement", description = "Récupère un événement par son ID")
    public ResponseEntity<EventDTO> getEvent(@PathVariable("id") String id) {
        EventDTO eventDTO = eventService.getEvent(id);
        return ResponseEntity.ok(eventDTO);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un événement", description = "Met à jour un événement existant")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable("id") String id, @RequestBody EventDTO eventDTO) {
        EventDTO updatedEvent = eventService.updateEvent(id, eventDTO);
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un événement", description = "Supprime un événement et toutes ses photos")
    public ResponseEntity<Void> deleteEvent(@PathVariable("id") String id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les événements", description = "Récupère la liste de tous les événements")
    public ResponseEntity<List<EventDTO>> getAllEvents() {
        List<EventDTO> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/with-files")
    @Operation(summary = "Récupérer tous les événements avec fichiers", 
               description = "Récupère la liste de tous les événements avec leurs fichiers associés")
    public ResponseEntity<List<EventDTO>> getAllEventsWithFiles() {
        List<EventDTO> events = eventService.getAllEventsWithFiles();
        return ResponseEntity.ok(events);
    }
}
