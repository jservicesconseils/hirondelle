package com.roseedhermon.msevent.repository;

import com.roseedhermon.msevent.entity.EventEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EventRepository extends MongoRepository<EventEntity, String> {
}
