package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.dto.EventFileDTO;
import com.roseedhermon.msevent.entity.EventFile;
import com.roseedhermon.msevent.service.EventFileService;
import com.roseedhermon.msevent.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events/{eventId}/files")
@Tag(name = "Fichiers d'événement", description = "Gestion unifiée des fichiers des événements (photos, documents, vidéos, audio)")
public class EventFileController {

    @Autowired
    private EventFileService eventFileService;
    
    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    @Operation(summary = "Uploader un fichier pour un événement", 
               description = "Upload un fichier et l'associe à un événement")
    public ResponseEntity<EventFileDTO> uploadEventFile(
            @PathVariable("eventId") String eventId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        
        try {
            System.out.println("=== DÉBUT DE L'UPLOAD ===");
            System.out.println("Timestamp: " + java.time.LocalDateTime.now());
            System.out.println("EventId: " + eventId);
            System.out.println("Nom du fichier: " + file.getOriginalFilename());
            System.out.println("Taille du fichier: " + file.getSize());
            System.out.println("Type MIME: " + file.getContentType());
            System.out.println("Description: " + description);
            System.out.println("Fichier vide: " + file.isEmpty());
            
            // Vérifications préliminaires
            if (file.isEmpty()) {
                System.err.println("❌ ERREUR: Fichier vide");
                return ResponseEntity.badRequest().body(null);
            }
            
            if (eventId == null || eventId.trim().isEmpty()) {
                System.err.println("❌ ERREUR: EventId null ou vide");
                return ResponseEntity.badRequest().body(null);
            }
            
            System.out.println("✅ Vérifications préliminaires OK");
            
            // Stocker le fichier et créer l'objet EventFile
            System.out.println("📁 Début du stockage du fichier...");
            EventFile eventFile = fileStorageService.storeFile(file, eventId, description);
            System.out.println("✅ Fichier stocké avec succès: " + eventFile.getFilePath());
            
            // Sauvegarder en base
            System.out.println("💾 Début de la sauvegarde en base...");
            EventFileDTO fileDTO = convertToDTO(eventFile);
            System.out.println("📋 DTO créé: " + fileDTO.getId());
            
            EventFileDTO createdFile = eventFileService.createEventFile(fileDTO);
            System.out.println("✅ Fichier sauvegardé en base avec succès: " + createdFile.getId());
            
            System.out.println("=== UPLOAD TERMINÉ AVEC SUCCÈS ===");
            return ResponseEntity.ok(createdFile);
            
        } catch (IOException e) {
            System.err.println("=== ERREUR IO LORS DE L'UPLOAD ===");
            System.err.println("Message d'erreur: " + e.getMessage());
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
            
        } catch (Exception e) {
            System.err.println("=== ERREUR INATTENDUE LORS DE L'UPLOAD ===");
            System.err.println("Message d'erreur: " + e.getMessage());
            System.err.println("Type d'erreur: " + e.getClass().getSimpleName());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "N/A"));
            e.printStackTrace();
            
            // Logs supplémentaires pour le débogage
            System.err.println("=== INFORMATIONS DE DÉBOGAGE ===");
            System.err.println("EventId: " + eventId);
            System.err.println("Fichier: " + (file != null ? file.getOriginalFilename() : "null"));
            System.err.println("Taille: " + (file != null ? file.getSize() : "null"));
            
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/upload-multiple")
    @Operation(summary = "Uploader plusieurs fichiers pour un événement", 
               description = "Upload plusieurs fichiers et les associe à un événement")
    public ResponseEntity<List<EventFileDTO>> uploadMultipleEventFiles(
            @PathVariable("eventId") String eventId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "descriptions", required = false) String[] descriptions) {
        
        List<EventFileDTO> createdFiles = new ArrayList<>();
        
        try {
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                String description = (descriptions != null && i < descriptions.length) ? descriptions[i] : "";
                
                // Stocker le fichier
                EventFile eventFile = fileStorageService.storeFile(file, eventId, description);
                
                // Sauvegarder en base
                EventFileDTO fileDTO = convertToDTO(eventFile);
                EventFileDTO createdFile = eventFileService.createEventFile(fileDTO);
                createdFiles.add(createdFile);
            }
            
            return ResponseEntity.ok(createdFiles);
            
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les fichiers d'un événement", 
               description = "Retourne la liste de tous les fichiers associés à un événement")
    public ResponseEntity<List<EventFileDTO>> getEventFiles(@PathVariable("eventId") String eventId) {
        List<EventFileDTO> files = eventFileService.getEventFiles(eventId);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/type/{fileType}")
    @Operation(summary = "Récupérer les fichiers d'un type spécifique", 
               description = "Retourne les fichiers d'un type donné (PRESENTATION_PHOTO, DOCUMENT, VIDEO, AUDIO, OTHER)")
    public ResponseEntity<List<EventFileDTO>> getEventFilesByType(
            @PathVariable("eventId") String eventId,
            @PathVariable("fileType") EventFile.FileType fileType) {
        List<EventFileDTO> files = eventFileService.getEventFilesByType(eventId, fileType);
        return ResponseEntity.ok(files);
    }

    @GetMapping("/photos")
    @Operation(summary = "Récupérer toutes les photos de présentation d'un événement", 
               description = "Retourne la liste de toutes les photos de présentation")
    public ResponseEntity<List<EventFileDTO>> getEventPresentationPhotos(@PathVariable("eventId") String eventId) {
        List<EventFileDTO> photos = eventFileService.getEventPresentationPhotos(eventId);
        return ResponseEntity.ok(photos);
    }

    @GetMapping("/main-photo")
    @Operation(summary = "Récupérer la photo principale d'un événement", 
               description = "Retourne la photo marquée comme principale pour un événement")
    public ResponseEntity<EventFileDTO> getMainPhoto(@PathVariable("eventId") String eventId) {
        EventFileDTO mainPhoto = eventFileService.getMainPhoto(eventId);
        if (mainPhoto != null) {
            return ResponseEntity.ok(mainPhoto);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{fileId}")
    @Operation(summary = "Mettre à jour un fichier d'événement", 
               description = "Met à jour les informations d'un fichier existant")
    public ResponseEntity<EventFileDTO> updateEventFile(
            @PathVariable("eventId") String eventId,
            @PathVariable("fileId") String fileId,
            @RequestBody EventFileDTO fileDTO) {
        fileDTO.setEventId(eventId);
        EventFileDTO updatedFile = eventFileService.updateEventFile(fileId, fileDTO);
        return ResponseEntity.ok(updatedFile);
    }

    @PutMapping("/{fileId}/set-main-photo")
    @Operation(summary = "Définir une photo comme principale", 
               description = "Marque une photo spécifique comme photo principale de l'événement")
    public ResponseEntity<EventFileDTO> setMainPhoto(
            @PathVariable("eventId") String eventId,
            @PathVariable("fileId") String fileId) {
        EventFileDTO mainPhoto = eventFileService.setMainPhoto(fileId);
        return ResponseEntity.ok(mainPhoto);
    }

    @DeleteMapping("/{fileId}")
    @Operation(summary = "Supprimer un fichier d'événement", 
               description = "Supprime un fichier spécifique d'un événement")
    public ResponseEntity<Void> deleteEventFile(
            @PathVariable("eventId") String eventId,
            @PathVariable("fileId") String fileId) {
        eventFileService.deleteEventFile(fileId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "Supprimer tous les fichiers d'un événement", 
               description = "Supprime tous les fichiers associés à un événement")
    public ResponseEntity<Void> deleteAllEventFiles(@PathVariable("eventId") String eventId) {
        eventFileService.deleteEventFiles(eventId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Convertit une entité EventFile en DTO
     */
    private EventFileDTO convertToDTO(EventFile eventFile) {
        EventFileDTO dto = new EventFileDTO();
        dto.setId(eventFile.getId());
        dto.setEventId(eventFile.getEventId());
        dto.setFileName(eventFile.getFileName());
        dto.setFilePath(eventFile.getFilePath());
        dto.setFileExtension(eventFile.getFileExtension());
        dto.setFileSize(eventFile.getFileSize());
        dto.setMimeType(eventFile.getMimeType());
        dto.setDescription(eventFile.getDescription());
        dto.setUploadDate(eventFile.getUploadDate());
        dto.setFileType(eventFile.getFileType());
        dto.setPresentationPhoto(eventFile.isPresentationPhoto());
        dto.setMainPhoto(eventFile.isMainPhoto());
        
        // Générer les URLs d'accès
        if (eventFile.getFilePath() != null) {
            String filename = extractFilenameFromPath(eventFile.getFilePath());
            dto.setAccessUrl("/api/v1/files/events/" + eventFile.getEventId() + "/" + filename);
            
            // URL du thumbnail si c'est une image
            if (eventFile.isPresentationPhoto()) {
                dto.setThumbnailUrl("/api/v1/files/events/" + eventFile.getEventId() + "/thumbnails/" + filename);
            }
        }
        
        return dto;
    }

    /**
     * Extrait le nom du fichier depuis le chemin
     */
    private String extractFilenameFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return "";
        }
        
        String[] parts = filePath.split("/");
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
        
        return "";
    }
} 