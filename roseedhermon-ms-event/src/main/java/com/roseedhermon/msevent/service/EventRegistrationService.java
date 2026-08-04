package com.roseedhermon.msevent.service;

import com.roseedhermon.msevent.dto.EventRegistrationDTO;
import com.roseedhermon.msevent.entity.EventRegistrationEntity;
import com.roseedhermon.msevent.repository.EventRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EventRegistrationService {

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    public EventRegistrationDTO registerForEvent(EventRegistrationDTO dto) {
        EventRegistrationEntity entity = dtoToEntity(dto);
        EventRegistrationEntity saved = eventRegistrationRepository.save(entity);
        return entityToDto(saved);
    }

    public void cancelRegistration(String registrationId) {
        eventRegistrationRepository.deleteById(registrationId);
    }

    public String getRegistrationStatus(String registrationId) {
        Optional<EventRegistrationEntity> registration = eventRegistrationRepository.findById(registrationId);
        return registration.map(EventRegistrationEntity::getStatus).orElse("not_found");
    }

    private EventRegistrationEntity dtoToEntity(EventRegistrationDTO dto) {
        EventRegistrationEntity entity = new EventRegistrationEntity();
        entity.setId(dto.getId());
        entity.setEventId(dto.getEventId());
        entity.setUserId(dto.getUserId());
        entity.setStatus(dto.getStatus());
        return entity;
    }

    private EventRegistrationDTO entityToDto(EventRegistrationEntity entity) {
        EventRegistrationDTO dto = new EventRegistrationDTO();
        dto.setId(entity.getId());
        dto.setEventId(entity.getEventId());
        dto.setUserId(entity.getUserId());
        dto.setStatus(entity.getStatus());
        return dto;
    }
}
