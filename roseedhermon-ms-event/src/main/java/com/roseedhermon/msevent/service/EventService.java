package com.roseedhermon.msevent.service;

import com.roseedhermon.msevent.dto.CreateEventWithPhotosDTO;
import com.roseedhermon.msevent.dto.EventDTO;
import com.roseedhermon.msevent.dto.EventFileDTO;
import com.roseedhermon.msevent.dto.PresenterDTO;
import com.roseedhermon.msevent.entity.EventEntity;
import com.roseedhermon.msevent.entity.EventFile;
import com.roseedhermon.msevent.entity.Presenter;
import com.roseedhermon.msevent.repository.EventRepository;
import com.roseedhermon.msevent.service.EventFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private EventFileService eventFileService;

    public EventDTO createEvent(EventDTO dto) {
        EventEntity entity = dtoToEntity(dto);
        EventEntity saved = eventRepository.save(entity);
        return entityToDto(saved);
    }

    /**
     * Crée un événement avec ses photos
     */
    public EventDTO createEventWithPhotos(CreateEventWithPhotosDTO createDTO) {
        // Créer l'événement
        EventDTO eventDTO = new EventDTO();
        eventDTO.setName(createDTO.getName());
        eventDTO.setDate(createDTO.getDate());
        eventDTO.setLocation(createDTO.getLocation());
        eventDTO.setDescription(createDTO.getDescription());
        eventDTO.setIsFree(createDTO.isFree());
        eventDTO.setAmount(createDTO.getAmount());
        eventDTO.setNumberOfDays(createDTO.getNumberOfDays());
        eventDTO.setPresenters(createDTO.getPresenters());
        eventDTO.setCategory(createDTO.getCategory());
        eventDTO.setAvailableSeats(createDTO.getAvailableSeats());
        eventDTO.setLastRegistrationDate(createDTO.getLastRegistrationDate());
        eventDTO.setEventType(createDTO.getEventType());
        eventDTO.setEventStatus(createDTO.getEventStatus());
        
        EventEntity entity = dtoToEntity(eventDTO);
        EventEntity savedEvent = eventRepository.save(entity);
        
        // Ajouter les fichiers si ils existent
        if (createDTO.getPhotos() != null && !createDTO.getPhotos().isEmpty()) {
            String mainPhotoId = null;
            
            for (int i = 0; i < createDTO.getPhotos().size(); i++) {
                EventFileDTO fileDTO = createDTO.getPhotos().get(i);
                fileDTO.setEventId(savedEvent.getId());
                
                // Marquer la première photo comme principale si demandé
                if (i == 0 && createDTO.isSetFirstPhotoAsMain()) {
                    fileDTO.setMainPhoto(true);
                    if (mainPhotoId == null) {
                        mainPhotoId = fileDTO.getId();
                    }
                }
                
                eventFileService.createEventFile(fileDTO);
            }
            
            // Mettre à jour l'événement avec l'ID de la photo principale
            if (mainPhotoId != null) {
                savedEvent.setMainPhotoId(mainPhotoId);
                eventRepository.save(savedEvent);
            }
        }
        
        return entityToDto(savedEvent);
    }

    public EventDTO getEvent(String id) {
        EventEntity entity = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        return entityToDto(entity);
    }

    public List<EventDTO> getAllEvents() {
        return eventRepository.findAll().stream().map(this::entityToDto).collect(Collectors.toList());
    }

    /**
     * Récupère tous les événements avec leurs fichiers associés
     */
    public List<EventDTO> getAllEventsWithFiles() {
        List<EventEntity> events = eventRepository.findAll();
        return events.stream().map(event -> {
            EventDTO dto = entityToDto(event);
            
            // Récupérer les fichiers associés à cet événement
            List<EventFileDTO> files = eventFileService.getEventFiles(event.getId());
            dto.setFiles(files);
            
            return dto;
        }).collect(Collectors.toList());
    }

    public EventDTO updateEvent(String id, EventDTO dto) {
        EventEntity existing = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        existing.setName(dto.getName());
        existing.setDate(dto.getDate());
        existing.setLocation(dto.getLocation());
        existing.setDescription(dto.getDescription());
        existing.setFree(dto.isFree());
        existing.setAmount(dto.getAmount());
        existing.setNumberOfDays(dto.getNumberOfDays());
        existing.setPresenters(convertPresenterDTOsToEntities(dto.getPresenters()));
        existing.setCategory(dto.getCategory());
        existing.setAvailableSeats(dto.getAvailableSeats());
        existing.setLastRegistrationDate(dto.getLastRegistrationDate());
        existing.setEventType(dto.getEventType());
        existing.setEventStatus(dto.getEventStatus());
        existing.setFiles(convertFileDTOsToEntities(dto.getFiles()));
        existing.setMainPhotoId(dto.getMainPhotoId());
        return entityToDto(eventRepository.save(existing));
    }

    public void deleteEvent(String id) {
        // Supprimer tous les fichiers de l'événement avant de supprimer l'événement
        // (cela supprimera aussi les fichiers physiques)
        eventFileService.deleteEventFiles(id);
        eventRepository.deleteById(id);
    }

    private EventDTO entityToDto(EventEntity entity) {
        EventDTO dto = new EventDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDate(entity.getDate());
        dto.setLocation(entity.getLocation());
        dto.setDescription(entity.getDescription());
        dto.setIsFree(entity.isFree());
        dto.setAmount(entity.getAmount());
        dto.setNumberOfDays(entity.getNumberOfDays());
        dto.setPresenters(convertPresenterEntitiesToDTOs(entity.getPresenters()));
        dto.setCategory(entity.getCategory());
        dto.setAvailableSeats(entity.getAvailableSeats());
        dto.setLastRegistrationDate(entity.getLastRegistrationDate());
        dto.setEventType(entity.getEventType());
        dto.setEventStatus(entity.getEventStatus());
        dto.setFiles(convertFileEntitiesToDTOs(entity.getFiles()));
        dto.setMainPhotoId(entity.getMainPhotoId());
        return dto;
    }

    private EventEntity dtoToEntity(EventDTO dto) {
        EventEntity entity = new EventEntity();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setDate(dto.getDate());
        entity.setLocation(dto.getLocation());
        entity.setDescription(dto.getDescription());
        entity.setFree(dto.isFree());
        entity.setAmount(dto.getAmount());
        entity.setNumberOfDays(dto.getNumberOfDays());
        entity.setPresenters(convertPresenterDTOsToEntities(dto.getPresenters()));
        entity.setCategory(dto.getCategory());
        entity.setAvailableSeats(dto.getAvailableSeats());
        entity.setLastRegistrationDate(dto.getLastRegistrationDate());
        entity.setEventType(dto.getEventType());
        entity.setEventStatus(dto.getEventStatus());
        entity.setFiles(convertFileDTOsToEntities(dto.getFiles()));
        entity.setMainPhotoId(dto.getMainPhotoId());
        return entity;
    }

    /**
     * Convertit une liste de DTOs de photos en entités
     */
    private List<EventFile> convertFileDTOsToEntities(List<EventFileDTO> fileDTOs) {
        if (fileDTOs == null) {
            return null;
        }
        return fileDTOs.stream()
                .map(this::convertFileDTOToEntity)
                .collect(Collectors.toList());
    }

    /**
     * Convertit une liste d'entités de fichiers en DTOs
     */
    private List<EventFileDTO> convertFileEntitiesToDTOs(List<EventFile> files) {
        if (files == null) {
            return null;
        }
        return files.stream()
                .map(this::convertFileEntityToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convertit un DTO de fichier en entité
     */
    private EventFile convertFileDTOToEntity(EventFileDTO dto) {
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
        return file;
    }

    /**
     * Convertit une entité de photo en DTO
     */
    private EventFileDTO convertFileEntityToDTO(EventFile file) {
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
        return dto;
    }

    /**
     * Convertit une liste de DTOs de présentateurs en entités
     */
    private List<Presenter> convertPresenterDTOsToEntities(List<PresenterDTO> presenterDTOs) {
        if (presenterDTOs == null) {
            return null;
        }
        return presenterDTOs.stream()
                .map(this::convertPresenterDTOToEntity)
                .collect(Collectors.toList());
    }

    /**
     * Convertit une liste d'entités de présentateurs en DTOs
     */
    private List<PresenterDTO> convertPresenterEntitiesToDTOs(List<Presenter> presenters) {
        if (presenters == null) {
            return null;
        }
        return presenters.stream()
                .map(this::convertPresenterEntityToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convertit un DTO de présentateur en entité
     */
    private Presenter convertPresenterDTOToEntity(PresenterDTO dto) {
        Presenter presenter = new Presenter();
        presenter.setFirstName(dto.getFirstName());
        presenter.setLastName(dto.getLastName());
        presenter.setTitle(dto.getTitle());
        presenter.setResume(dto.getResume());
        return presenter;
    }

    /**
     * Convertit une entité de présentateur en DTO
     */
    private PresenterDTO convertPresenterEntityToDTO(Presenter presenter) {
        PresenterDTO dto = new PresenterDTO();
        dto.setFirstName(presenter.getFirstName());
        dto.setLastName(presenter.getLastName());
        dto.setTitle(presenter.getTitle());
        dto.setResume(presenter.getResume());
        return dto;
    }
}
