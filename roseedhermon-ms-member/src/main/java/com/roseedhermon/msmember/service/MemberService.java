package com.roseedhermon.msmember.service;

import com.roseedhermon.msmember.model.MemberEntity;
import com.roseedhermon.msmember.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    @Autowired
    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public MemberEntity addMember(MemberEntity member) {
        return memberRepository.save(member);
    }

    public List<MemberEntity> getAllMembers() {
        return memberRepository.findAll();
    }

    public Optional<MemberEntity> getMemberById(UUID id) {
        return memberRepository.findById(id);
    }

    public MemberEntity updateMember(UUID id, MemberEntity memberDetails) {
        MemberEntity member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found with id " + id));
        member.setLastName(memberDetails.getLastName());
        member.setFirstName(memberDetails.getFirstName());
        member.setGender(memberDetails.getGender());
        member.setBirthDate(memberDetails.getBirthDate());
        member.setProfession(memberDetails.getProfession());
        member.setPhoneNumber(memberDetails.getPhoneNumber());
        member.setEmail(memberDetails.getEmail());
        member.setAddress(memberDetails.getAddress());
        member.setCity(memberDetails.getCity());
        member.setLocation(memberDetails.getLocation());
        member.setPhoto(memberDetails.getPhoto());
        member.setSocialLinks(memberDetails.getSocialLinks());
        member.setRoles(memberDetails.getRoles());
        member.setGroupId(memberDetails.getGroupId());
        return memberRepository.save(member);
    }

    public void deleteMember(UUID id) {
        memberRepository.deleteById(id);
    }
}