package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.SysMenu;
import com.heavymachinery.repository.SysMenuRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统菜单管理
 */
@RestController
@RequestMapping("/api/admin/menus")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMenuController {

    private final SysMenuRepository menuRepository;

    public AdminMenuController(SysMenuRepository menuRepository) {
        this.menuRepository = menuRepository;
    }

    @GetMapping("/list")
    public ApiResponse<List<SysMenu>> list() {
        return ApiResponse.success(menuRepository.findAllByOrderBySortAscIdAsc());
    }

    @PostMapping
    public ApiResponse<SysMenu> create(@RequestBody SysMenu menu) {
        normalize(menu);
        return ApiResponse.success("保存成功", menuRepository.save(menu));
    }

    @PutMapping("/{id}")
    public ApiResponse<SysMenu> update(@PathVariable Long id, @RequestBody SysMenu body) {
        SysMenu menu = menuRepository.findById(id).orElseThrow(() -> new BusinessException(404, "菜单不存在"));
        menu.setType(body.getType());
        menu.setName(body.getName());
        menu.setPath(body.getPath());
        menu.setIcon(body.getIcon());
        menu.setParentId(body.getParentId());
        menu.setSort(body.getSort());
        menu.setEnabled(body.getEnabled());
        menu.setCached(body.getCached());
        return ApiResponse.success("更新成功", menuRepository.save(menu));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> delete(@PathVariable Long id) {
        List<SysMenu> children = menuRepository.findAll().stream()
                .filter(m -> id.equals(m.getParentId()))
                .toList();
        menuRepository.deleteAll(children);
        menuRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }

    private void normalize(SysMenu menu) {
        if (menu.getName() == null || menu.getName().isBlank()) {
            throw new BusinessException(400, "菜单名称不能为空");
        }
        if ("item".equals(menu.getType()) && (menu.getPath() == null || menu.getPath().isBlank())) {
            throw new BusinessException(400, "页面菜单必须填写路径");
        }
        if (menu.getSort() == null) menu.setSort(0);
        if (menu.getEnabled() == null) menu.setEnabled(true);
        if (menu.getCached() == null) menu.setCached(true);
        if ("parent".equals(menu.getType())) menu.setParentId(null);
    }
}