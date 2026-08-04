package com.roseedhermon.msmember.repository;

import com.roseedhermon.msmember.model.GroupEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GroupRepository extends MongoRepository<GroupEntity, String> {
    // tu peux ajouter des méthodes custom si besoin
}