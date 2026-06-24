package vn.hrm.app.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakAdminService {

    @Value("${keycloak.admin.url}")
    private String keycloakUrl;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private String getAdminToken() {
        String tokenUrl = keycloakUrl + "/realms/master/protocol/openid-connect/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);
        body.add("grant_type", "password");

        ResponseEntity<JsonNode> resp = restTemplate.postForEntity(
                tokenUrl, new HttpEntity<>(body, headers), JsonNode.class);
        return resp.getBody().get("access_token").asText();
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    /** Tìm userId trong Keycloak theo username */
    public String findUserId(String username) {
        try {
            String token = getAdminToken();
            String url = keycloakUrl + "/admin/realms/" + realm + "/users?username=" + username + "&exact=true";
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), JsonNode.class);
            JsonNode users = resp.getBody();
            if (users != null && users.isArray() && !users.isEmpty()) {
                return users.get(0).get("id").asText();
            }
        } catch (Exception e) {
            log.warn("Không tìm thấy user Keycloak: {}", username);
        }
        return null;
    }

    /** Lấy role ID theo tên role */
    private Map<String, String> getRoleInfo(String token, String roleName) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/roles/" + roleName;
        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), JsonNode.class);
            JsonNode role = resp.getBody();
            return Map.of("id", role.get("id").asText(), "name", role.get("name").asText());
        } catch (Exception e) {
            log.error("Không tìm thấy role '{}' trong Keycloak", roleName);
            return null;
        }
    }

    private static final List<String> HRM_ROLES = List.of(
            "ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "EMPLOYEE", "ACCOUNTANT");

    /** Xoá tất cả HRM realm roles của user, sau đó gán role mới */
    public boolean assignRole(String keycloakUserId, String newRole) {
        try {
            String token = getAdminToken();
            String roleMappingUrl = keycloakUrl + "/admin/realms/" + realm
                    + "/users/" + keycloakUserId + "/role-mappings/realm";

            // Lấy danh sách role hiện tại để xoá
            ResponseEntity<JsonNode> current = restTemplate.exchange(
                    roleMappingUrl, HttpMethod.GET, new HttpEntity<>(authHeaders(token)), JsonNode.class);

            List<Map<String, Object>> toDelete = new java.util.ArrayList<>();
            if (current.getBody() != null) {
                for (JsonNode r : current.getBody()) {
                    String name = r.get("name").asText();
                    if (HRM_ROLES.contains(name)) {
                        toDelete.add(Map.of("id", r.get("id").asText(), "name", name));
                    }
                }
            }
            if (!toDelete.isEmpty()) {
                restTemplate.exchange(roleMappingUrl, HttpMethod.DELETE,
                        new HttpEntity<>(toDelete, authHeaders(token)), Void.class);
            }

            // Gán role mới
            Map<String, String> roleInfo = getRoleInfo(token, newRole);
            if (roleInfo == null) return false;
            restTemplate.postForEntity(roleMappingUrl,
                    new HttpEntity<>(List.of(roleInfo), authHeaders(token)), Void.class);

            log.info("Đã gán role {} cho user {}", newRole, keycloakUserId);
            return true;
        } catch (Exception e) {
            log.error("Lỗi gán role Keycloak: {}", e.getMessage());
            return false;
        }
    }
}
