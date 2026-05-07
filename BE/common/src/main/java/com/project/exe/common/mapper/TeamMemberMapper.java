package com.project.exe.common.mapper;

import com.project.exe.common.dto.TeamMemberDto;
import com.project.exe.common.entity.TeamMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TeamMemberMapper {

    TeamMemberDto toDto(TeamMember entity);

    @Mapping(target = "teamId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    TeamMember toEntity(TeamMemberDto dto);

    @Mapping(target = "teamId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    void updateEntity(@MappingTarget TeamMember entity, TeamMemberDto dto);

    TeamMember copy(TeamMember entity);

    TeamMember deepCopy(TeamMember entity);
}
