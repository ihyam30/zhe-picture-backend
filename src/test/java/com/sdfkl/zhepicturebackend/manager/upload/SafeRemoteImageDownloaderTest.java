package com.sdfkl.zhepicturebackend.manager.upload;

import com.sdfkl.zhepicturebackend.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class SafeRemoteImageDownloaderTest {

    private final SafeRemoteImageDownloader downloader = new SafeRemoteImageDownloader();

    @Test
    void rejectsNonHttpUrl() {
        assertThrows(BusinessException.class, () -> downloader.validateUrl("file:///etc/passwd"));
    }

    @Test
    void rejectsCredentialsInUrl() {
        assertThrows(BusinessException.class, () -> downloader.validateUrl("http://user:password@example.com/a.png"));
    }

    @Test
    void rejectsLoopbackAddress() {
        assertThrows(BusinessException.class, () -> downloader.validateUrl("http://127.0.0.1/image.png"));
    }

    @Test
    void rejectsCloudMetadataAddress() {
        assertThrows(BusinessException.class, () -> downloader.validateUrl("http://169.254.169.254/latest/meta-data/"));
    }
}
