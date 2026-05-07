package com.project.exe.common.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs all entity/DTO checks. */
class EntityDtoCorrectnessTest {

    @Test
    void checkAllEntityAndDtoCorrectness() {
        List<String> errors = EntityDtoCorrectness.checkAll();
        assertTrue(errors.isEmpty(),
            "Entity/DTO correctness failures:\n" + String.join("\n", errors));
    }
}
