package com.hhkungfu.backend.config;

import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info(">>> START INIT DATABASE");

        if (userRepository.count() == 0) {
            log.info(">>> No users found. Initializing default ADMIN account...");

            User adminUser = User.builder()
                    .email("admin@gmail.com")
                    .username("admin")
                    .password(passwordEncoder.encode("12345678"))
                    .provider(ProviderType.LOCAL)
                    .role(RoleType.ADMIN)
                    .isActive(true)
                    .emailVerified(true)
                    .build();

            userRepository.save(adminUser);
            log.info(">>> Default ADMIN account created");
        } else {
            log.info(">>> Database already initialized (users count: {})", userRepository.count());
        }

        log.info(">>> END INIT DATABASE");
    }
}
