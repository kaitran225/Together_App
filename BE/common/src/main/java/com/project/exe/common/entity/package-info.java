/**
 * JPA entities for the shared domain model.
 * <p>
 * {@code com.project.exe.common.entity.User} is the shared User entity for read/workflow
 * (and any other resource-server modules). The auth module defines its own User and
 * UserRepository for the authorization server; it does not use common's User.
 */

package com.project.exe.common.entity;
