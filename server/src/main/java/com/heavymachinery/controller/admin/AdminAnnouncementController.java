package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.Announcement;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.AnnouncementRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公告通知管理
 */
@RestController
@RequestMapping("/api/admin/announcements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminAnnouncementController(AnnouncementRepository announcementRepository,
                                       OrgService orgService,
                                       AuthService authService) {
        this.announcementRepository = announcementRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<Announcement>> list(@RequestParam(required = false) String keyword) {
        List<Announcement> list = announcementRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(a -> keyword == null || keyword.isEmpty() || a.getTitle().contains(keyword))
                .collect(java.util.stream.Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<Announcement> create(@RequestBody Announcement announcement) {
        User u = authService.getCurrentUser();
        if (announcement.getOrgId() == null && u != null) announcement.setOrgId(u.getOrgId());
        if (u != null) {
            announcement.setPublisherId(u.getId());
            announcement.setPublisherName(u.getNickname() != null ? u.getNickname() : u.getUsername());
        }
        if (announcement.getStatus() == null) announcement.setStatus("published");
        if (announcement.getType() == null) announcement.setType("notice");
        if (announcement.getContent() == null) announcement.setContent("");
        return ApiResponse.success("发布成功", announcementRepository.save(announcement));
    }

    @PutMapping("/{id}")
    public ApiResponse<Announcement> update(@PathVariable Long id, @RequestBody Announcement body) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "公告不存在"));
        a.setTitle(body.getTitle());
        a.setContent(body.getContent());
        a.setType(body.getType());
        a.setStatus(body.getStatus());
        return ApiResponse.success("更新成功", announcementRepository.save(a));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        announcementRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }
}