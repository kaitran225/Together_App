package app.together.common.workflow.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserFeatureUsageId implements Serializable {

    String userSso;
    String featureCode;
}
