package com.hhkungfu.backend.module.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;
import com.hhkungfu.backend.module.user.repository.UserRepository;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            if (ProviderType.LOCAL.equals(user.getProvider())) {
                // Email đã tồn tại với provider LOCAL: không cho login bằng Google
                throw new OAuth2AuthenticationException("Email đã đăng ký LOCAL, không dùng Google OAuth được");
            }
        } else {
            // Register new Google User
            user = User.builder()
                    .email(email)
                    .username(name.replaceAll("\\s+", "").toLowerCase() + "_"
                            + UUID.randomUUID().toString().substring(0, 5))
                    .provider(ProviderType.GOOGLE)
                    .role(RoleType.USER)
                    .avatarUrl(picture)
                    .emailVerified(true)
                    .isActive(true)
                    .build();
            userRepository.save(user);
        }

        return oAuth2User;
    }
}
