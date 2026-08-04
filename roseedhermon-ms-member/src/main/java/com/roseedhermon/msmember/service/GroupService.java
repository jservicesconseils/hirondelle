package com.roseedhermon.msmember.service;

import com.roseedhermon.msmember.dto.CreateGroupRequest;
import com.roseedhermon.msmember.model.GroupEntity;
import com.roseedhermon.msmember.model.MemberEntity;
import com.roseedhermon.msmember.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.roseedhermon.msmember.repository.MemberRepository;


import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private  MemberRepository memberRepository;

    public GroupEntity createGroup(GroupEntity group) {
        return groupRepository.save(group);
    }

    public Optional<GroupEntity> getGroupById(String id) {
        return groupRepository.findById(id);
    }

    public List<GroupEntity> getAllGroups() {
        return groupRepository.findAll();
    }

    public GroupEntity updateGroup(String id, GroupEntity group) {
        group.setId(id);
        return groupRepository.save(group);
    }

    public void deleteGroup(String id) {
        groupRepository.deleteById(id);
    }

    public GroupEntity createGroupWithAdmins(CreateGroupRequest request) {
        // 1. Créer le groupe
        GroupEntity group = new GroupEntity();
        group.setName(request.getName());
        group.setType(request.getType());
        group.setCountry(request.getCountry());
        group.setStreet(request.getStreet());
        group.setCity(request.getCity());
        group.setStateOrProvince(request.getStateOrProvince());
        group.setPhone(request.getPhone());
        group.setEmail(request.getEmail());
        group.setWebsite(request.getWebsite());

        GroupEntity savedGroup = groupRepository.save(group);

        // 2. Vérifier qu’on a bien 2 admins
        if (request.getAdministrators() == null || request.getAdministrators().size() != 2) {
            throw new IllegalArgumentException("Deux administrateurs sont requis.");
        }

        // 3. Créer les administrateurs
        List<MemberEntity> createdAdmins = new ArrayList<>();
        for (CreateGroupRequest.AdminDto adminDto : request.getAdministrators()) {
            MemberEntity admin = new MemberEntity();
            admin.setFirstName(adminDto.getFirstName());
            admin.setLastName(adminDto.getLastName());
            admin.setGender(adminDto.getGender());
            admin.setPhoneNumber(adminDto.getPhoneNumber());
            admin.setEmail(adminDto.getEmail());
            admin.setAddress(adminDto.getAddress());
            admin.setCity(adminDto.getCity());
            admin.setLocation(adminDto.getLocation());
            admin.setProfession(adminDto.getProfession());
            admin.setPhoto(adminDto.getPhoto());
            admin.setSocialLinks(adminDto.getSocialLinks());
            admin.setRoles(List.of("ADMIN"));
            admin.setGroupId(savedGroup.getId());

            createdAdmins.add(memberRepository.save(admin));
        }

        return savedGroup;
    }
}
