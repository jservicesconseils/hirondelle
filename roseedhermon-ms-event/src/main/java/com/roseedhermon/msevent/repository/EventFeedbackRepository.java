package com.roseedhermon.msevent.repository;

import com.roseedhermon.msevent.entity.EventFeedbackEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventFeedbackRepository extends MongoRepository<EventFeedbackEntity, String> {
    List<EventFeedbackEntity> findByEventId(String eventId);
}
