package com.smartcampus.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

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
                )
                .oauth2Login(oauth -> oauth
                        .defaultSuccessUrl(frontendUrl + "/dashboard", true)
                        .failureUrl(frontendUrl + "/?auth=failed")
                        .userInfoEndpoint(Customizer.withDefaults())
                )
                .logout(logout -> logout
                        .logoutSuccessUrl(frontendUrl + "/")
                );

        return http.build();
    }
}
