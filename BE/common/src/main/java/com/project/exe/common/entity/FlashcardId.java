package com.project.exe.common.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class FlashcardId implements Serializable {

    Long quizId;
    Long quizQuestionId;
}
