package com.heavymachinery.controller.common;

import com.heavymachinery.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * 文件上传 / 静态文件访问
 */
@RestController
public class UploadController {

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @PostMapping("/api/upload")
    public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext = original.contains(".") ? original.substring(original.lastIndexOf(".")) : "";
            String name = UUID.randomUUID().toString().replace("-", "") + ext;
            file.transferTo(dir.resolve(name).toFile());
            return ApiResponse.success(Map.of("url", "/files/" + name, "name", original));
        } catch (Exception e) {
            throw new com.heavymachinery.common.BusinessException(500, "上传失败: " + e.getMessage());
        }
    }

    @GetMapping("/files/**")
    public ResponseEntity<Resource> file(jakarta.servlet.http.HttpServletRequest request) throws Exception {
        String uri = request.getRequestURI();
        String relative = uri.substring(uri.indexOf("/files/") + "/files/".length());
        String fileName = URLDecoder.decode(relative, StandardCharsets.UTF_8);
        Path path = Paths.get(uploadDir).resolve(fileName).normalize();
        if (!path.toAbsolutePath().startsWith(Paths.get(uploadDir).toAbsolutePath())) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(path);
        if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}