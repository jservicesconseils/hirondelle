package com.roseedhermon.msevent.service;

import com.roseedhermon.msevent.dto.EventFileDTO;
import com.roseedhermon.msevent.entity.EventFile;
import com.roseedhermon.msevent.repository.EventFileRepository;
import com.roseedhermon.msevent.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventFileService {

    @Autowired
    private EventFileRepository eventFileRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Crée un nouveau fichier d'événement
     */
    public EventFileDTO createEventFile(EventFileDTO fileDTO) {
        EventFile file = convertToEntity(fileDTO);
        
        // Si c'est la photo principale, désactiver les autres photos principales de l'événement
        if (file.isMainPhoto()) {
            setOtherPhotosAsNotMain(file.getEventId());
        }
        
        // Définir la date de téléchargement
        file.setUploadDate(LocalDateTime.now());
        
        EventFile savedFile = eventFileRepository.save(file);
        return convertToDTO(savedFile);
    }

    /**
     * Met à jour un fichier d'événement
     */
    public EventFileDTO updateEventFile(String fileId, EventFileDTO fileDTO) {
        Optional<EventFile> existingFileOpt = eventFileRepository.findById(fileId);
        if (existingFileOpt.isEmpty()) {
            throw new RuntimeException("Fichier non trouvé avec l'ID: " + fileId);
        }

        EventFile existingFile = existingFileOpt.get();
        EventFile updatedFile = convertToEntity(fileDTO);
        updatedFile.setId(fileId);
        updatedFile.setEventId(existingFile.getEventId());

        // Si c'est la photo principale, désactiver les autres photos principales de l'événement
        if (updatedFile.isMainPhoto()) {
            setOtherPhotosAsNotMain(updatedFile.getEventId());
        }

        EventFile savedFile = eventFileRepository.save(updatedFile);
        return convertToDTO(savedFile);
    }

    /**
     * Définit une photo comme photo principale
     */
    public EventFileDTO setMainPhoto(String fileId) {
        Optional<EventFile> fileOpt = eventFileRepository.findById(fileId);
        if (fileOpt.isEmpty()) {
            throw new RuntimeException("Fichier non trouvé avec l'ID: " + fileId);
        }

        EventFile file = fileOpt.get();
        
        // Vérifier que c'est bien une image
        if (!file.isPresentationPhoto()) {
            throw new RuntimeException("Seules les images peuvent être définies comme photo principale");
        }
        
        // Désactiver les autres photos principales de l'événement
        setOtherPhotosAsNotMain(file.getEventId());
        
        // Définir cette photo comme principale
        file.setMainPhoto(true);
        EventFile savedFile = eventFileRepository.save(file);
        return convertToDTO(savedFile);
    }

    /**
     * Récupère tous les fichiers d'un événement
     */
    public List<EventFileDTO> getEventFiles(String eventId) {
        List<EventFile> files = eventFileRepository.findByEventId(eventId);
        return files.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère tous les fichiers d'un type spécifique
     */
    public List<EventFileDTO> getEventFilesByType(String eventId, EventFile.FileType fileType) {
        List<EventFile> files = eventFileRepository.findByEventIdAndFileType(eventId, fileType);
        return files.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les photos de présentation d'un événement
     */
    public List<EventFileDTO> getEventPresentationPhotos(String eventId) {
        List<EventFile> files = eventFileRepository.findByEventIdAndIsPresentationPhotoTrue(eventId);
        return files.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère la photo principale d'un événement
     */
    public EventFileDTO getMainPhoto(String eventId) {
        Optional<EventFile> mainPhoto = eventFileRepository.findByEventIdAndIsMainPhotoTrue(eventId);
        return mainPhoto.map(this::convertToDTO).orElse(null);
    }

    /**
     * Supprime un fichier d'événement
     */
    public void deleteEventFile(String fileId) {
        EventFile file = eventFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé avec l'ID: " + fileId));
        
        // Supprimer le fichier physique
        try {
            String filename = extractFilenameFromPath(file.getFilePath());
            fileStorageService.deleteFile(file.getEventId(), filename);
        } catch (Exception e) {
            // Log l'erreur mais continuer la suppression en base
            System.err.println("Erreur lors de la suppression du fichier: " + e.getMessage());
        }
        
        // Supprimer de la base de données
        eventFileRepository.deleteById(fileId);
    }

    /**
     * Supprime tous les fichiers d'un événement
     */
    public void deleteEventFiles(String eventId) {
        // Supprimer tous les fichiers physiques
        try {
            fileStorageService.deleteEventFiles(eventId);
        } catch (Exception e) {
            // Log l'erreur mais continuer la suppression en base
            System.err.println("Erreur lors de la suppression des fichiers: " + e.getMessage());
        }
        
        // Supprimer de la base de données
        eventFileRepository.deleteByEventId(eventId);
    }

    /**
     * Désactive les autres photos principales d'un événement
     */
    private void setOtherPhotosAsNotMain(String eventId) {
        Optional<EventFile> mainPhotoOpt = eventFileRepository.findByEventIdAndIsMainPhotoTrue(eventId);
        
        if (mainPhotoOpt.isPresent()) {
            EventFile mainPhoto = mainPhotoOpt.get();
            mainPhoto.setMainPhoto(false);
            eventFileRepository.save(mainPhoto);
        }
    }

    /**
     * Extrait le nom du fichier depuis le chemin
     */
    private String extractFilenameFromPath(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return "";
        }
        
        // Extraire le nom du fichier depuis le chemin complet
        String[] parts = filePath.split("/");
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
        
        return "";
    }

    /**
     * Convertit une entité en DTO
     */
    private EventFileDTO convertToDTO(EventFile file) {
        EventFileDTO dto = new EventFileDTO();
        dto.setId(file.getId());
        dto.setEventId(file.getEventId());
        dto.setFileName(file.getFileName());
        dto.setFilePath(file.getFilePath());
        dto.setFileExtension(file.getFileExtension());
        dto.setFileSize(file.getFileSize());
        dto.setMimeType(file.getMimeType());
        dto.setDescription(file.getDescription());
        dto.setUploadDate(file.getUploadDate());
        dto.setFileType(file.getFileType());
        dto.setPresentationPhoto(file.isPresentationPhoto());
        dto.setMainPhoto(file.isMainPhoto());
        
        // Générer les URLs d'accès
        if (file.getFilePath() != null) {
            String filename = extractFilenameFromPath(file.getFilePath());
            dto.setAccessUrl("/api/v1/files/events/" + file.getEventId() + "/" + filename);
            
            // URL du thumbnail si c'est une image
            if (file.isPresentationPhoto()) {
                dto.setThumbnailUrl("/api/v1/files/events/" + file.getEventId() + "/thumbnails/" + filename);
            }
        }
        
        return dto;
    }

    /**
     * Convertit un DTO en entité
     */
    private EventFile convertToEntity(EventFileDTO dto) {
        EventFile file = new EventFile();
        file.setId(dto.getId());
        file.setEventId(dto.getEventId());
        file.setFileName(dto.getFileName());
        file.setFilePath(dto.getFilePath());
        file.setFileExtension(dto.getFileExtension());
        file.setFileSize(dto.getFileSize());
        file.setMimeType(dto.getMimeType());
        file.setDescription(dto.getDescription());
        file.setUploadDate(dto.getUploadDate());
        file.setFileType(dto.getFileType());
        file.setPresentationPhoto(dto.isPresentationPhoto());
        file.setMainPhoto(dto.isMainPhoto());
        
        // Note: Le fichier physique est géré par FileStorageService
        // L'entité ne stocke que les métadonnées
        
        return file;
    }
} 