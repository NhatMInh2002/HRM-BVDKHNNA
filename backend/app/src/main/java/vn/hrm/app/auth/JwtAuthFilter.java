package vn.hrm.app.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        Claims claims = jwtService.parseToken(token);
        String email = claims.getSubject();
        String role  = claims.get("role", String.class);

        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        // Role-based authority (backward compat với @PreAuthorize hasRole)
        if (role != null) authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        // Fine-grained permissions
        Object rawPerms = claims.get("permissions");
        if (rawPerms instanceof java.util.List<?> perms) {
            perms.forEach(p -> authorities.add(new SimpleGrantedAuthority(p.toString())));
        }

        var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        auth.setDetails(claims);
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
