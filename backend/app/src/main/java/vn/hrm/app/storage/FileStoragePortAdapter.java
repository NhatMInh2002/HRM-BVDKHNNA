package vn.hrm.app.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.hrm.shared.port.FileStoragePort;

@Service
@RequiredArgsConstructor
public class FileStoragePortAdapter implements FileStoragePort {

    private final StorageService storageService;

    @Override
    public byte[] readBytes(String key) {
        return storageService.readBytes(key);
    }
}
