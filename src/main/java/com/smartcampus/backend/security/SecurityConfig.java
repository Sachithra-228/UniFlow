package com.smartcampus.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.security.google.client-id:}")
    private String googleClientId;

    @Value("${app.security.google.client-secret:}")
    private String googleClientSecret;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        AuthenticationEntryPoint unauthorizedEntryPoint = new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);

        http
                .cors(Customizer.withDefaults())
    .csrf(csrf -> csrf.disable())
    .sessionManagement(session -> session
        .sessionFixation(sessionFixation -> sessionFixation.migrateSession())
    )
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/error", "/oauth2/**", "/login/**", "/api/auth/activate").permitAll()
        .requestMatchers("/profile", "/api/**").authenticated()
        .anyRequest().authenticated()
    )
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(
                                unauthorizedEntryPoint,
                                new AntPathRequestMatcher("/profile")
                        )
                        .defaultAuthenticationEntryPointFor(
                                unauthorizedEntryPoint,
                                new AntPathRequestMatcher("/api/**")
                        )
                );

        if (isGoogleOAuthConfigured()) {
            http
                    .oauth2Login(oauth -> oauth
                        .loginPage("/oauth2/authorization/google")
                        .defaultSuccessUrl(frontendUrl + "/dashboard", true)
                        .failureUrl(frontendUrl + "/?auth=failed")
                        .userInfoEndpoint(Customizer.withDefaults())
)
                    .logout(logout -> logout
                            .logoutSuccessUrl(frontendUrl + "/")
                    );
        }

        return http.build();
    }

    @Bean
    @ConditionalOnExpression("'${app.security.google.client-id:}' != '' and '${app.security.google.client-secret:}' != ''")
    public ClientRegistrationRepository clientRegistrationRepository() {
        ClientRegistration googleRegistration = CommonOAuth2Provider.GOOGLE
                .getBuilder("google")
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .scope("openid", "profile", "email")
                .build();

        return new InMemoryClientRegistrationRepository(googleRegistration);
    }

    @Bean
    @ConditionalOnExpression("'${app.security.google.client-id:}' != '' and '${app.security.google.client-secret:}' != ''")
    public OAuth2AuthorizedClientService authorizedClientService(
            ClientRegistrationRepository clientRegistrationRepository) {
        return new InMemoryOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    private boolean isGoogleOAuthConfigured() {
        return !googleClientId.isBlank() && !googleClientSecret.isBlank();
    }
}
