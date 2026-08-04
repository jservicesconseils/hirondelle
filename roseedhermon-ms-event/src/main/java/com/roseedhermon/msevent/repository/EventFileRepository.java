package com.roseedhermon.msevent.repository;

import com.roseedhermon.msevent.entity.EventFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventFileRepository extends MongoRepository<EventFile, String> {
    
    /**
     * Trouve tous les fichiers d'un événement
     */
    List<EventFile> findByEventId(String eventId);
    
    /**
     * Trouve tous les fichiers d'un type spécifique pour un événement
     */
    List<EventFile> findByEventIdAndFileType(String eventId, EventFile.FileType fileType);
    
    /**
     * Trouve la photo principale d'un événement
     */
    Optional<EventFile> findByEventIdAndIsMainPhotoTrue(String eventId);
    
    /**
     * Trouve toutes les photos de présentation d'un événement
     */
    List<EventFile> findByEventIdAndIsPresentationPhotoTrue(String eventId);
    
    /**
     * Trouve toutes les photos principales de tous les événements
     */
    List<EventFile> findByIsMainPhotoTrue();
    
    /**
     * Supprime tous les fichiers d'un événement
     */
    void deleteByEventId(String eventId);
} 