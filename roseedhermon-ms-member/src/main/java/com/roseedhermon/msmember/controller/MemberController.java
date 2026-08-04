package com.roseedhermon.msmember.controller;

import com.roseedhermon.msmember.model.MemberEntity;
import com.roseedhermon.msmember.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Add these dependencies to your pom.xml or build.gradle
// spring-boot-starter-web for Spring Web MVC
// spring-boot-starter-data-jpa for Spring Data JPA (if using JPA)

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:52009"})
@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @PostMapping
    public ResponseEntity<MemberEntity> createMember(@RequestBody MemberEntity member) {
        MemberEntity createdMember = memberService.addMember(member);
        return ResponseEntity.ok(createdMember);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberEntity> getMemberById(@PathVariable UUID id) {
        Optional<MemberEntity> member = memberService.getMemberById(id);
        return member.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<MemberEntity>> getAllMembers() {
        List<MemberEntity> members = memberService.getAllMembers();
        return ResponseEntity.ok(members);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MemberEntity> updateMember(@PathVariable UUID id, @RequestBody MemberEntity member) {
        MemberEntity updatedMember = memberService.updateMember(id, member);
        return ResponseEntity.ok(updatedMember);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable UUID id) {
        memberService.deleteMember(id);
        return ResponseEntity.noContent().build();
    }
}