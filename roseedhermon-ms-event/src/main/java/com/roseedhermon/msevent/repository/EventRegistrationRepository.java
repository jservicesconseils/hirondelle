package com.roseedhermon.msevent.repository;

import com.roseedhermon.msevent.entity.EventRegistrationEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface EventRegistrationRepository extends MongoRepository<EventRegistrationEntity, String> {
}
