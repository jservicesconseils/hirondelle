package com.roseedhermon.msevent.service;

import com.roseedhermon.msevent.dto.EventFeedbackDTO;
import com.roseedhermon.msevent.entity.EventFeedbackEntity;
import com.roseedhermon.msevent.repository.EventFeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventFeedbackService {

    @Autowired
    private EventFeedbackRepository eventFeedbackRepository;

    public EventFeedbackDTO submitFeedback(EventFeedbackDTO dto) {
        EventFeedbackEntity entity = dtoToEntity(dto);
        EventFeedbackEntity saved = eventFeedbackRepository.save(entity);
        return entityToDto(saved);
    }

    public List<EventFeedbackDTO> getFeedbackByEventId(String eventId) {
        return eventFeedbackRepository.findByEventId(eventId).stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    private EventFeedbackDTO entityToDto(EventFeedbackEntity entity) {
        EventFeedbackDTO dto = new EventFeedbackDTO();
        dto.setId(entity.getId());
        dto.setEventId(entity.getEventId());
        dto.setUserId(entity.getUserId());
        dto.setComment(entity.getComment());
        return dto;
    }

    private EventFeedbackEntity dtoToEntity(EventFeedbackDTO dto) {
        EventFeedbackEntity entity = new EventFeedbackEntity();
        entity.setId(dto.getId());
        entity.setEventId(dto.getEventId());
        entity.setUserId(dto.getUserId());
        entity.setComment(dto.getComment());
        return entity;
    }
}
