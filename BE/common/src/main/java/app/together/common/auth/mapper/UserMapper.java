package app.together.common.auth.mapper;

import app.together.common.auth.dto.UserDto;
import app.together.common.auth.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;


@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    @Mapping(target = "skills", ignore = true)
    @Mapping(target = "learningGoals", ignore = true)
    UserDto toDto(User entity);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "metadata", ignore = true)
    User toEntity(UserDto dto);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "metadata", ignore = true)
    void updateEntity(@MappingTarget User entity, UserDto dto);

    @Mapping(target = "passwordHash", ignore = true)
    default User copy(User entity) {
        if (entity == null) {
            return null;
        }

        User copy = new User();
        copy.setCreatedAt(entity.getCreatedAt());
        copy.setCreatedBy(entity.getCreatedBy());
        copy.setUpdatedAt(entity.getUpdatedAt());
        copy.setUpdatedBy(entity.getUpdatedBy());
        copy.setUserId(entity.getUserId());
        copy.setUserSso(entity.getUserSso());
        copy.setEmail(entity.getEmail());
        copy.setFullName(entity.getFullName());
        copy.setAvatarUrl(entity.getAvatarUrl());
        copy.setPlanType(entity.getPlanType());
        copy.setPlanExpiresAt(entity.getPlanExpiresAt());
        copy.setExp(entity.getExp());
        copy.setLevel(entity.getLevel());
        copy.setStreak(entity.getStreak());
        copy.setLongestStreak(entity.getLongestStreak());
        copy.setLastActiveDate(entity.getLastActiveDate());
        copy.setMetadata(entity.getMetadata());
        copy.setStatus(entity.getStatus());
        copy.setEmailVerified(entity.getEmailVerified());
        copy.setSystemRole(entity.getSystemRole());
        copy.setIsAdmin(entity.getIsAdmin());
        return copy;
    }
}
