package com.project.exe.common.service;

import com.project.exe.common.constant.ErrorCodes;
import com.project.exe.common.exception.ResourceNotFoundException;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base CRUD implementation using repo + mapper callbacks.
 * Update behaves as PATCH: nulls in DTO do not clear entity fields (MapStruct default).
 */
public abstract class AbstractCrudService<E, D, ID> implements CrudService<D, ID> {

    protected abstract JpaRepository<E, ID> getRepository();

    protected abstract D toDto(E entity);

    protected abstract E toEntity(D dto);

    protected abstract void updateEntity(E entity, D dto);

    @Override
    @Transactional(readOnly = true)
    public Optional<D> findById(ID id) {
        return getRepository().findById(id).map(this::toDto);
    }

    @Override
    @Transactional
    public D create(D dto) {
        E entity = toEntity(dto);
        entity = getRepository().save(entity);
        return toDto(entity);
    }

    @Override
    @Transactional
    public D update(ID id, D dto) {
        E entity = getRepository().findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                String.format("%s not found: %s", getEntityName(), id), getNotFoundErrorCode()));
        updateEntity(entity, dto);
        entity = getRepository().save(entity);
        return toDto(entity);
    }

    @Override
    @Transactional
    public void deleteById(ID id) {
        if (!getRepository().existsById(id)) {
            throw new ResourceNotFoundException(
                String.format("%s not found: %s", getEntityName(), id), getNotFoundErrorCode());
        }
        getRepository().deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<D> findAll(Pageable pageable) {
        return getRepository().findAll(pageable).map(this::toDto);
    }

    protected String getEntityName() {
        return "Entity";
    }

    /** Override to return a resource-specific error code (e.g. MessageConstants.MESSAGE_TASK_NOT_FOUND). */
    protected String getNotFoundErrorCode() {
        return ErrorCodes.NOT_FOUND;
    }
}
