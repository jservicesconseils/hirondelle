package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.service.FileStorageService;
import com.roseedhermon.msevent.service.EventFileService;
import com.roseedhermon.msevent.dto.EventFileDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "Fichiers", description = "Gestion des fichiers uploadés")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private EventFileService eventFileService;
    
    @Value("${app.file.upload-dir:uploads/events}")
    private String uploadDir;

    @GetMapping("/events/{eventId}/{filename:.+}")
    @Operation(summary = "Télécharger une photo d'événement", 
               description = "Récupère une photo d'événement par son nom de fichier")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable("eventId") String eventId,
            @PathVariable("filename") String filename) {
        
        try {
            System.out.println("=== FileController.downloadFile ===");
            System.out.println("Event ID: " + eventId);
            System.out.println("Filename demandé: " + filename);
            
            // Récupérer tous les fichiers de l'événement pour trouver celui qui correspond au nom original
            List<EventFileDTO> eventFiles = eventFileService.getEventFiles(eventId);
            System.out.println("Fichiers trouvés dans la base: " + eventFiles.size());
            
            // Chercher le fichier qui correspond au nom unique (UUID)
            EventFileDTO targetFile = null;
            for (EventFileDTO file : eventFiles) {
                String uniqueFilename = extractFilenameFromPath(file.getFilePath());
                System.out.println("Vérification du fichier: " + uniqueFilename + " vs " + filename);
                if (filename.equals(uniqueFilename)) {
                    targetFile = file;
                    System.out.println("✅ Fichier trouvé dans la base: " + uniqueFilename);
                    break;
                }
            }
            
            if (targetFile == null) {
                System.out.println("❌ Fichier non trouvé dans la base de données");
                return ResponseEntity.notFound().build();
            }
            
            // Extraire le nom unique du fichier depuis le chemin stocké
            String storedFilePath = targetFile.getFilePath();
            System.out.println("Chemin stocké dans la base: " + storedFilePath);
            
            if (storedFilePath == null || storedFilePath.isEmpty()) {
                System.out.println("❌ Chemin du fichier non défini dans la base");
                return ResponseEntity.notFound().build();
            }
            
            // Construire le chemin complet vers le fichier
            Path filePath = Paths.get(storedFilePath);
            System.out.println("Chemin du fichier: " + filePath);
            
            Resource resource = new UrlResource(filePath.toUri());
            System.out.println("Resource créée: " + resource.getURI());
            System.out.println("Resource existe: " + resource.exists());
            System.out.println("Resource lisible: " + resource.isReadable());
            
            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(filename);
                System.out.println("Content-Type déterminé: " + contentType);
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                System.out.println("❌ Fichier non trouvé ou non lisible");
                System.out.println("Chemin absolu: " + filePath.toAbsolutePath());
                System.out.println("Fichier existe: " + Files.exists(filePath));
                return ResponseEntity.notFound().build();
            }
            
        } catch (MalformedURLException e) {
            System.err.println("❌ Erreur MalformedURLException: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Erreur inattendue: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
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

    @GetMapping("/events/{eventId}/thumbnails/{filename:.+}")
    @Operation(summary = "Télécharger un thumbnail", 
               description = "Récupère un thumbnail d'une photo d'événement")
    public ResponseEntity<Resource> downloadThumbnail(
            @PathVariable("eventId") String eventId,
            @PathVariable("filename") String filename) {
        
        try {
            System.out.println("=== FileController.downloadThumbnail ===");
            System.out.println("Event ID: " + eventId);
            System.out.println("Filename demandé: " + filename);
            
            // Récupérer tous les fichiers de l'événement pour trouver celui qui correspond au nom original
            List<EventFileDTO> eventFiles = eventFileService.getEventFiles(eventId);
            System.out.println("Fichiers trouvés dans la base: " + eventFiles.size());
            
            // Chercher le fichier qui correspond au nom original
            EventFileDTO targetFile = null;
            for (EventFileDTO file : eventFiles) {
                System.out.println("Vérification du fichier: " + file.getFileName() + " vs " + filename);
                if (filename.equals(file.getFileName())) {
                    targetFile = file;
                    System.out.println("✅ Fichier trouvé dans la base: " + file.getFileName());
                    break;
                }
            }
            
            if (targetFile == null) {
                System.out.println("❌ Fichier non trouvé dans la base de données");
                return ResponseEntity.notFound().build();
            }
            
            // Extraire le nom unique du fichier depuis le chemin stocké
            String storedFilePath = targetFile.getFilePath();
            System.out.println("Chemin stocké dans la base: " + storedFilePath);
            
            if (storedFilePath == null || storedFilePath.isEmpty()) {
                System.out.println("❌ Chemin du fichier non défini dans la base");
                return ResponseEntity.notFound().build();
            }
            
            // Construire le chemin du thumbnail
            Path originalFilePath = Paths.get(storedFilePath);
            String originalFileName = originalFilePath.getFileName().toString();
            Path thumbnailPath = Paths.get(uploadDir, eventId, "thumb_" + originalFileName);
            
            System.out.println("Chemin du thumbnail: " + thumbnailPath);
            
            Resource resource = new UrlResource(thumbnailPath.toUri());
            System.out.println("Resource créée: " + resource.getURI());
            System.out.println("Resource existe: " + resource.exists());
            System.out.println("Resource lisible: " + resource.isReadable());
            
            if (resource.exists() && resource.isReadable()) {
                System.out.println("✅ Thumbnail trouvé et lisible");
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"thumb_" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                System.out.println("❌ Thumbnail non trouvé ou non lisible");
                System.out.println("Chemin absolu: " + thumbnailPath.toAbsolutePath());
                System.out.println("Thumbnail existe: " + Files.exists(thumbnailPath));
                
                // Si le thumbnail n'existe pas, essayer de le créer
                System.out.println("Tentative de création du thumbnail...");
                try {
                    fileStorageService.createThumbnail(storedFilePath, uploadDir + "/" + eventId, originalFileName);
                    System.out.println("Thumbnail créé avec succès");
                    
                    // Réessayer de charger le thumbnail
                    resource = new UrlResource(thumbnailPath.toUri());
                    if (resource.exists() && resource.isReadable()) {
                        System.out.println("✅ Thumbnail créé et chargé avec succès");
                        return ResponseEntity.ok()
                                .contentType(MediaType.IMAGE_JPEG)
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"thumb_" + resource.getFilename() + "\"")
                                .body(resource);
                    }
                } catch (Exception e) {
                    System.err.println("❌ Erreur lors de la création du thumbnail: " + e.getMessage());
                }
                
                return ResponseEntity.notFound().build();
            }
            
        } catch (MalformedURLException e) {
            System.err.println("❌ Erreur MalformedURLException: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Erreur inattendue: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Détermine le type MIME basé sur l'extension du fichier
     */
    private String determineContentType(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        
        switch (extension) {
            case ".jpg":
            case ".jpeg":
                return "image/jpeg";
            case ".png":
                return "image/png";
            case ".gif":
                return "image/gif";
            case ".webp":
                return "image/webp";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * Extrait l'extension du fichier
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
} 