package app.together.email.web;

import app.together.common.email.api.TransactionalEmailRequest;
import app.together.email.service.TransactionalMailService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/emails")
@RequiredArgsConstructor
@Tag(name = "Transactional email")
public class TransactionalEmailController {

    private final TransactionalMailService transactionalMailService;

    @PostMapping("/transactional")
    public ResponseEntity<Void> sendTransactional(@Valid @RequestBody TransactionalEmailRequest request) {
        transactionalMailService.send(request);
        return ResponseEntity.accepted().build();
    }
}
