package com.hhkungfu.backend.config;

import java.util.Collections;
import java.util.Optional;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.module.user.repository.UserRepository;

@Component("userDetailsService")
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<com.hhkungfu.backend.module.user.entity.User> user = this.userRepository.findByEmail(email);

        if (user.isEmpty()) {
            throw new BusinessException("Invalid User", "login", "email_not_found");
        }

        return new User(
                user.get().getEmail(),
                user.get().getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.get().getRole() == null ? "ROLE_USER" : "ROLE_" + user.get().getRole())));
    }

}
