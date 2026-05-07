package com.project.exe.common.service;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/** Base CRUD service contract. */
public interface CrudService<D, ID> {

    Optional<D> findById(ID id);

    D create(D dto);

    D update(ID id, D dto);

    void deleteById(ID id);

    Page<D> findAll(Pageable pageable);
}
