package vn.hrm.app.storage;

import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class StorageService {

    private final MinioClient minio;
    private final String bucket;

    public StorageService(
            @Value("${minio.endpoint}")    String endpoint,
            @Value("${minio.access-key}")  String accessKey,
            @Value("${minio.secret-key}")  String secretKey,
            @Value("${minio.bucket}")      String bucket) {

        this.bucket = bucket;
        this.minio  = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        ensureBucket();
    }

    private void ensureBucket() {
        try {
            boolean exists = minio.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minio.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("Could not ensure bucket '{}': {}", bucket, e.getMessage());
        }
    }

    /** Upload avatar, trả về key (không phải URL). */
    public String uploadAvatar(MultipartFile file) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String key = "avatars/" + UUID.randomUUID() + "." + ext;
            upload(file, key);
            return key;
        } catch (Exception e) {
            throw new RuntimeException("Upload avatar thất bại: " + e.getMessage(), e);
        }
    }

    /** Upload tài liệu, trả về key (không phải URL). */
    public String uploadDocument(MultipartFile file, String folder) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String key = "documents/" + folder + "/" + UUID.randomUUID() + "." + ext;
            upload(file, key);
            return key;
        } catch (Exception e) {
            throw new RuntimeException("Upload tài liệu thất bại: " + e.getMessage(), e);
        }
    }

    /** Stream file từ MinIO — dùng cho download/view endpoint. */
    public InputStream getObject(String key) throws Exception {
        return minio.getObject(GetObjectArgs.builder()
                .bucket(bucket)
                .object(key)
                .build());
    }

    /** Lấy content-type của object. */
    public String getContentType(String key) {
        try {
            return minio.statObject(StatObjectArgs.builder()
                    .bucket(bucket).object(key).build())
                    .contentType();
        } catch (Exception e) {
            return "application/octet-stream";
        }
    }

    /** Upload byte array (dùng cho PDF tự sinh). */
    public void uploadBytes(byte[] data, String key, String contentType) {
        try {
            minio.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(new ByteArrayInputStream(data), data.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("Upload bytes thất bại: " + e.getMessage(), e);
        }
    }

    /** Đọc toàn bộ bytes của một object. */
    public byte[] readBytes(String key) {
        try (var in = getObject(key)) {
            return in.readAllBytes();
        } catch (Exception e) {
            return null;
        }
    }

    private void upload(MultipartFile file, String key) throws Exception {
        minio.putObject(PutObjectArgs.builder()
                .bucket(bucket)
                .object(key)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build());
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
