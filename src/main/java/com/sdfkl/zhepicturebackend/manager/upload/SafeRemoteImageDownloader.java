package com.sdfkl.zhepicturebackend.manager.upload;

import com.sdfkl.zhepicturebackend.exception.BusinessException;
import com.sdfkl.zhepicturebackend.exception.ErrorCode;
import org.apache.http.HttpEntity;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.conn.DnsResolver;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Locale;
import java.util.concurrent.Semaphore;

/**
 * 带 SSRF 防护和大小限制的远程图片下载器。
 */
@Component
public class SafeRemoteImageDownloader {
    private static final int MAX_REDIRECTS = 3;

    @Value("${picture.upload.url.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${picture.upload.url.read-timeout-ms:10000}")
    private int readTimeoutMs;

    @Value("${picture.upload.url.max-bytes:2097152}")
    private long maxBytes;

    @Value("${picture.upload.url.max-concurrency:8}")
    private int maxConcurrency;

    private volatile Semaphore semaphore;
    private volatile int semaphoreLimit;

    public void validateUrl(String value) {
        URI uri = parseAndValidate(value);
        try {
            resolvePublicAddresses(uri.getHost());
        } catch (UnknownHostException e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 无法解析或指向受限地址");
        }
    }

    public void download(String value, File target) {
        validateUrl(value);
        Semaphore currentSemaphore = getSemaphore();
        boolean acquired = false;
        try {
            acquired = currentSemaphore.tryAcquire();
            if (!acquired) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "远程图片下载并发数已达上限，请稍后重试");
            }
            String currentUrl = value;
            RequestConfig requestConfig = RequestConfig.custom()
                    .setConnectTimeout(Math.max(1, connectTimeoutMs))
                    .setSocketTimeout(Math.max(1, readTimeoutMs))
                    .setConnectionRequestTimeout(Math.max(1, connectTimeoutMs))
                    .setRedirectsEnabled(false)
                    .build();
            try (CloseableHttpClient client = HttpClients.custom()
                    .setDefaultRequestConfig(requestConfig)
                    .setDnsResolver(new SafeDnsResolver())
                    .disableRedirectHandling()
                    .disableAutomaticRetries()
                    .build()) {
                for (int redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
                    URI uri = parseAndValidate(currentUrl);
                    // 先校验一次；真正连接时仍由 SafeDnsResolver 返回同一批已校验地址，避免 DNS 重绑定。
                    validateUrl(currentUrl);
                    HttpGet request = new HttpGet(uri);
                    request.setHeader("Accept", "image/*");
                    try (CloseableHttpResponse response = client.execute(request)) {
                        int responseCode = response.getStatusLine().getStatusCode();
                        if (isRedirect(responseCode)) {
                            org.apache.http.Header location = response.getFirstHeader("Location");
                            if (location == null || redirectCount == MAX_REDIRECTS) {
                                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 重定向次数过多");
                            }
                            currentUrl = uri.resolve(location.getValue()).toString();
                            parseAndValidate(currentUrl);
                            continue;
                        }
                        if (responseCode < 200 || responseCode >= 300) {
                            throw new BusinessException(ErrorCode.PARAMS_ERROR,
                                    "远程图片下载失败，HTTP 状态码：" + responseCode);
                        }
                        HttpEntity entity = response.getEntity();
                        if (entity == null) {
                            throw new BusinessException(ErrorCode.PARAMS_ERROR, "远程图片内容为空");
                        }
                        long contentLength = entity.getContentLength();
                        if (contentLength > maxBytes) {
                            throw new BusinessException(ErrorCode.PARAMS_ERROR, "远程图片大小超过限制");
                        }
                        copyWithLimit(entity.getContent(), target);
                        return;
                    }
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "远程图片下载失败");
        } finally {
            if (acquired) {
                currentSemaphore.release();
            }
        }
    }

    private void copyWithLimit(InputStream inputStream, File target) throws IOException {
        if (inputStream == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "远程图片内容为空");
        }
        try (InputStream input = inputStream; FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[8192];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > maxBytes) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "远程图片大小超过限制");
                }
                output.write(buffer, 0, read);
            }
            if (total == 0) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "远程图片内容为空");
            }
        }
    }

    private URI parseAndValidate(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 不能为空");
        }
        try {
            URI uri = new URI(value.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!("http".equals(scheme) || "https".equals(scheme))) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 仅支持 HTTP 或 HTTPS");
            }
            if (uri.getHost() == null || uri.getHost().isEmpty() || uri.getUserInfo() != null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 格式不安全");
            }
            return uri;
        } catch (java.net.URISyntaxException e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "图片 URL 格式错误");
        }
    }

    private InetAddress[] resolvePublicAddresses(String host) throws UnknownHostException {
        InetAddress[] addresses = InetAddress.getAllByName(host);
        if (addresses.length == 0) {
            throw new UnknownHostException(host);
        }
        for (InetAddress address : addresses) {
            if (isBlockedAddress(address)) {
                throw new UnknownHostException("受限地址：" + address.getHostAddress());
            }
        }
        return addresses;
    }

    private boolean isBlockedAddress(InetAddress address) {
        if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return true;
        }
        byte[] bytes = address.getAddress();
        if (bytes.length == 4) {
            return isBlockedIpv4(bytes);
        }
        if (address instanceof Inet6Address && isIpv4Mapped(bytes)) {
            return isBlockedIpv4(Arrays.copyOfRange(bytes, 12, 16));
        }
        if (address instanceof Inet6Address) {
            int first = bytes[0] & 0xff;
            return (first & 0xfe) == 0xfc || ((bytes[0] & 0xff) == 0xfe && (bytes[1] & 0xc0) == 0x80);
        }
        return false;
    }

    private boolean isBlockedIpv4(byte[] bytes) {
        int first = bytes[0] & 0xff;
        int second = bytes[1] & 0xff;
        int third = bytes[2] & 0xff;
        int fourth = bytes[3] & 0xff;
        return (first == 169 && second == 254) // 云元数据和链路本地地址
                || (first == 100 && second >= 64 && second <= 127) // CGNAT
                || first == 0 || first == 10 || (first == 172 && second >= 16 && second <= 31)
                || (first == 192 && second == 168) || first == 127
                || (first == 192 && second == 0 && third == 0)
                || (first == 198 && (second == 18 || second == 19))
                || (first == 198 && second == 51 && third == 100)
                || (first == 203 && second == 0 && third == 113)
                || (first == 255 && second == 255 && third == 255 && fourth == 255);
    }

    private boolean isIpv4Mapped(byte[] bytes) {
        for (int i = 0; i < 10; i++) {
            if (bytes[i] != 0) return false;
        }
        return (bytes[10] & 0xff) == 0xff && (bytes[11] & 0xff) == 0xff;
    }

    private boolean isRedirect(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    private Semaphore getSemaphore() {
        int limit = Math.max(1, maxConcurrency);
        Semaphore current = semaphore;
        if (current == null || semaphoreLimit != limit) {
            synchronized (this) {
                if (semaphore == null || semaphoreLimit != limit) {
                    semaphore = new Semaphore(limit);
                    semaphoreLimit = limit;
                }
                current = semaphore;
            }
        }
        return current;
    }

    /**
     * HttpClient 会直接使用该解析器返回的地址建立连接，不会在校验后再次通过系统 DNS 解析。
     */
    private class SafeDnsResolver implements DnsResolver {
        @Override
        public InetAddress[] resolve(String host) throws UnknownHostException {
            return resolvePublicAddresses(host);
        }
    }
}
