package com.roseedhermon.msmember.repository;
import com.roseedhermon.msmember.model.MemberEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MemberRepository extends MongoRepository<MemberEntity, UUID> {
}