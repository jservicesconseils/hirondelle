package com.roseedhermon.msmember.controller;

import com.roseedhermon.msmember.dto.CreateGroupRequest;
import com.roseedhermon.msmember.model.GroupEntity;
import com.roseedhermon.msmember.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupEntity> createGroup(@RequestBody GroupEntity group) {
        GroupEntity created = groupService.createGroup(group);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupEntity> getGroup(@PathVariable String id) {
        Optional<GroupEntity> group = groupService.getGroupById(id);
        return group.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<GroupEntity>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupEntity> updateGroup(@PathVariable String id, @RequestBody GroupEntity group) {
        return ResponseEntity.ok(groupService.updateGroup(id, group));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable String id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/with-admins")
    public ResponseEntity<GroupEntity> createGroupWithAdmins(@RequestBody CreateGroupRequest request) {
        GroupEntity group = groupService.createGroupWithAdmins(request);
        return ResponseEntity.ok(group);
    }
}
