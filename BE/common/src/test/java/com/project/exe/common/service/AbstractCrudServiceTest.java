package com.project.exe.common.service;

import com.project.exe.common.constant.MessageConstants;
import com.project.exe.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AbstractCrudServiceTest {

    private JpaRepository<TestEntity, Long> repo;
    private TestCrudService service;

    @BeforeEach
    void setUp() {
        repo = mock(JpaRepository.class);
        service = new TestCrudService(repo);
    }

    @Test
    void findById_returnsEmptyWhenNotFound() {
        when(repo.findById(1L)).thenReturn(Optional.empty());
        assertTrue(service.findById(1L).isEmpty());
    }

    @Test
    void findById_returnsDtoWhenFound() {
        TestEntity entity = new TestEntity(1L, "e1");
        when(repo.findById(1L)).thenReturn(Optional.of(entity));
        Optional<TestDto> dto = service.findById(1L);
        assertTrue(dto.isPresent());
        assertEquals(1L, dto.get().id);
        assertEquals("e1", dto.get().name);
    }

    @Test
    void create_savesAndReturnsDto() {
        TestDto dto = new TestDto(null, "new");
        TestEntity saved = new TestEntity(2L, "new");
        when(repo.save(any(TestEntity.class))).thenReturn(saved);

        TestDto result = service.create(dto);
        assertEquals(2L, result.id);
        assertEquals("new", result.name);
        verify(repo).save(any(TestEntity.class));
    }

    @Test
    void update_throwsResourceNotFoundExceptionWhenNotFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        TestDto dto = new TestDto(99L, "x");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service.update(99L, dto));
        assertEquals("TASK_NOT_FOUND", ex.getErrorCode());
    }

    @Test
    void update_savesAndReturnsDtoWhenFound() {
        TestEntity entity = new TestEntity(1L, "old");
        when(repo.findById(1L)).thenReturn(Optional.of(entity));
        when(repo.save(any(TestEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        TestDto dto = new TestDto(1L, "updated");

        TestDto result = service.update(1L, dto);
        assertEquals(1L, result.id);
        assertEquals("updated", result.name);
        verify(repo).save(entity);
    }

    @Test
    void deleteById_throwsResourceNotFoundExceptionWhenNotFound() {
        when(repo.existsById(99L)).thenReturn(false);

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
            () -> service.deleteById(99L));
        assertEquals("TASK_NOT_FOUND", ex.getErrorCode());
    }

    @Test
    void deleteById_deletesWhenFound() {
        when(repo.existsById(1L)).thenReturn(true);
        service.deleteById(1L);
        verify(repo).deleteById(1L);
    }

    @Test
    void findAll_returnsMappedPage() {
        Page<TestEntity> page = new org.springframework.data.domain.PageImpl<>(
            List.of(new TestEntity(1L, "a")), PageRequest.of(0, 10), 1);
        when(repo.findAll(any(PageRequest.class))).thenReturn(page);

        Page<TestDto> result = service.findAll(PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(1L, result.getContent().get(0).id);
    }

    private static class TestEntity {
        Long id;
        String name;

        TestEntity(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }

    private static final class TestDto {
        final Long id;
        final String name;

        TestDto(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }

    private static final class TestCrudService extends AbstractCrudService<TestEntity, TestDto, Long> {
        private final JpaRepository<TestEntity, Long> repository;

        TestCrudService(JpaRepository<TestEntity, Long> repository) {
            this.repository = repository;
        }

        @Override
        protected JpaRepository<TestEntity, Long> getRepository() {
            return repository;
        }

        @Override
        protected TestDto toDto(TestEntity entity) {
            return new TestDto(entity.id, entity.name);
        }

        @Override
        protected TestEntity toEntity(TestDto dto) {
            return new TestEntity(dto.id, dto.name);
        }

        @Override
        protected void updateEntity(TestEntity entity, TestDto dto) {
            entity.name = dto.name;
        }

        @Override
        protected String getEntityName() {
            return "Task";
        }

        @Override
        protected String getNotFoundErrorCode() {
            return MessageConstants.MESSAGE_TASK_NOT_FOUND;
        }
    }
}
