package com.heavymachinery.config;

import com.heavymachinery.entity.DispatchTask;
import com.heavymachinery.entity.Announcement;
import com.heavymachinery.entity.FormDefinition;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.OptionSet;
import com.heavymachinery.entity.Org;
import com.heavymachinery.entity.ProcessDefinition;
import com.heavymachinery.entity.Project;
import com.heavymachinery.entity.RentalContract;
import com.heavymachinery.entity.SparePart;
import com.heavymachinery.entity.Supplier;
import com.heavymachinery.entity.User;
import com.heavymachinery.entity.WorkOrder;
import com.heavymachinery.repository.AnnouncementRepository;
import com.heavymachinery.repository.DispatchTaskRepository;
import com.heavymachinery.repository.FormDefinitionRepository;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.OptionSetRepository;
import com.heavymachinery.repository.OrgRepository;
import com.heavymachinery.repository.ProcessDefinitionRepository;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.repository.RentalContractRepository;
import com.heavymachinery.repository.SparePartRepository;
import com.heavymachinery.repository.SupplierRepository;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.repository.WorkOrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 初始化示例数据（仅当数据库为空时执行）
 */
@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MachineryRepository machineryRepository;
    private final WorkOrderRepository workOrderRepository;
    private final ProjectRepository projectRepository;
    private final DispatchTaskRepository dispatchTaskRepository;
    private final RentalContractRepository rentalContractRepository;
    private final OrgRepository orgRepository;
    private final OptionSetRepository optionSetRepository;
    private final FormDefinitionRepository formDefinitionRepository;
    private final ProcessDefinitionRepository processDefinitionRepository;
    private final AnnouncementRepository announcementRepository;
    private final SupplierRepository supplierRepository;
    private final SparePartRepository sparePartRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           MachineryRepository machineryRepository,
                           WorkOrderRepository workOrderRepository,
                           ProjectRepository projectRepository,
                           DispatchTaskRepository dispatchTaskRepository,
                           RentalContractRepository rentalContractRepository,
                           OrgRepository orgRepository,
                           OptionSetRepository optionSetRepository,
                           FormDefinitionRepository formDefinitionRepository,
                           ProcessDefinitionRepository processDefinitionRepository,
                           AnnouncementRepository announcementRepository,
                           SupplierRepository supplierRepository,
                           SparePartRepository sparePartRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.machineryRepository = machineryRepository;
        this.workOrderRepository = workOrderRepository;
        this.projectRepository = projectRepository;
        this.dispatchTaskRepository = dispatchTaskRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.orgRepository = orgRepository;
        this.optionSetRepository = optionSetRepository;
        this.formDefinitionRepository = formDefinitionRepository;
        this.processDefinitionRepository = processDefinitionRepository;
        this.announcementRepository = announcementRepository;
        this.supplierRepository = supplierRepository;
        this.sparePartRepository = sparePartRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Long rootOrgId = ensureRootOrg();
        initUsers(rootOrgId);
        if (machineryRepository.count() == 0) {
            initMachinery(rootOrgId);
        }
        if (workOrderRepository.count() == 0) {
            initWorkOrders(rootOrgId);
        }
        if (projectRepository.count() == 0) {
            initProjects(rootOrgId);
        }
        if (rentalContractRepository.count() == 0) {
            initRentals(rootOrgId);
        }
        initApprovalConfig();
        if (announcementRepository.count() == 0) {
            initAnnouncements(rootOrgId);
        }
        if (supplierRepository.count() == 0) {
            initSuppliers(rootOrgId);
        }
        if (sparePartRepository.count() == 0) {
            initSpareParts(rootOrgId);
        }
    }

    private Long ensureRootOrg() {
        Org root = orgRepository.findByCode("ORG_ROOT").orElse(null);
        if (root == null) {
            root = new Org();
            root.setCode("ORG_ROOT");
            root.setName("重工机械集团");
            root.setParentId(null);
            root.setPath("/");
            root.setOrgLevel(0);
            root.setStatus("enabled");
            root = orgRepository.save(root);
            log.info("已初始化根机构：重工机械集团");
        }
        return root.getId();
    }

    private void initUsers(Long rootOrgId) {
        createUserIfMissing("admin", "admin123", "系统管理员", "13800000000", "admin@heavymachinery.com", "admin", null);
        createUserIfMissing("manager", "manager123", "设备负责人", "13611112222", null, "manager", rootOrgId);
        createUserIfMissing("operator", "operator123", "一线维修工", "13533334444", null, "operator", rootOrgId);
        log.info("已初始化用户: admin/admin123, manager/manager123, operator/operator123");
    }

    private void createUserIfMissing(String username, String rawPassword, String nickname,
                                     String phone, String email, String role, Long orgId) {
        if (userRepository.findByUsername(username).isPresent()) {
            userRepository.findByUsername(username).ifPresent(u -> {
                if (u.getOrgId() == null && orgId != null) {
                    u.setOrgId(orgId);
                    userRepository.save(u);
                }
            });
            return;
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setNickname(nickname);
        u.setPhone(phone);
        u.setEmail(email);
        u.setRole(role);
        u.setOrgId(orgId);
        userRepository.save(u);
    }

    private void initWorkOrders(Long rootOrgId) {
        Machinery m1 = machineryRepository.findAll().stream()
                .filter(m -> "液压挖掘机".equals(m.getName())).findFirst().orElse(null);
        Machinery m2 = machineryRepository.findAll().stream()
                .filter(m -> "轮式装载机".equals(m.getName())).findFirst().orElse(null);

        User operator = userRepository.findByUsername("operator").orElse(null);

        long operatorId = operator != null ? operator.getId() : 3L;
        String operatorName = operator != null ? operator.getNickname() : "一线维修工";

        if (m1 != null) {
            saveWork("液压系统压力异常，挖掘无力，需检查主泵及液压油路",
                    m1, "维修", 1L, "系统管理员", operatorId, operatorName, "已更换液压油滤芯并复位溢流阀", "assigned", "high");
            saveWork("每日例行保养：更换机油及滤芯",
                    m1, "保养", 2L, "设备负责人", operatorId, operatorName, null, "created", "medium");
        }
        if (m2 != null) {
            saveWork("装载机铲斗油缸漏油，需更换油封",
                    m2, "维修", 3L, "设备负责人", operatorId, operatorName, "更换铲斗油缸油封，测试正常", "review", "medium");
            saveWork("发动机异响，需全面检查",
                    m2, "维修", 1L, "系统管理员", null, null, null, "created", "urgent");
        }
        log.info("已初始化示例维修/保养工单");
    }

    private void saveWork(String title, Machinery m, String type,
                          Long reporterId, String reporterName,
                          Long assigneeId, String assigneeName,
                          String note, String status, String priority) {
        WorkOrder wo = new WorkOrder();
        wo.setWorkNo("WO" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(1000, 9999));
        wo.setMachineryId(m.getId());
        wo.setMachineryName(m.getName());
        wo.setOrgId(m.getOrgId());
        wo.setTitle(title);
        wo.setType("维修".equals(type) ? "repair" : "maintain");
        wo.setPriority(priority);
        wo.setStatus(status);
        wo.setReportUserId(reporterId);
        wo.setReportUserName(reporterName);
        wo.setAssigneeUserId(assigneeId);
        wo.setAssigneeName(assigneeName);
        wo.setHandleNote(note);
        wo.setReportedAt(LocalDateTime.now().minusDays(1));
        if ("assigned".equals(status)) {
            wo.setAssignedAt(LocalDateTime.now().minusHours(18));
        }
        if ("review".equals(status)) {
            wo.setAssignedAt(LocalDateTime.now().minusHours(30));
            wo.setCompletedAt(null);
        }
        if ("done".equals(status)) {
            wo.setAssignedAt(LocalDateTime.now().minusDays(2));
            wo.setCompletedAt(LocalDateTime.now().minusHours(20));
        }
        workOrderRepository.save(wo);
    }

    private Long currentRootOrgId;

    private void initMachinery(Long rootOrgId) {
        currentRootOrgId = rootOrgId;
        save(build("液压挖掘机", "挖掘机", "卡特彼勒",
                "大型履带式液压挖掘机，适用于土方开挖、矿山剥离等重载作业。采用先进液压系统，操作精准，耐用可靠，配备智能监控系统，燃油经济性出色。",
                "98.00", 5, "31500 kg", "110 kW", "9.5m x 3.2m x 3.1m", "1.6 m³", true, "CAT 320"));
        save(build("轮式装载机", "装载机", "徐工",
                "高效节能型轮式装载机，配备大功率发动机与液力变矩器，铲装能力强，转向灵活，适合工地、矿山、港口等场所的物料装卸作业。",
                "32.50", 8, "16500 kg", "162 kW", "8.2m x 2.9m x 3.3m", "3.0 m³", true, "XCMG LW500KN"));
        save(build("液压破碎锤", "破碎锤", "阿特拉斯",
                "专业液压破碎锤，适配多种挖掘机，冲击力强劲，广泛用于矿山、道路、建筑拆除等破碎作业。耐磨耐用，维护简单。",
                "8.80", 12, "2350 kg", "—", "2.3m x 0.6m x 0.55m", "钎杆直径135mm", true, "ATLAS SB81"));
        save(build("自卸卡车", "自卸车", "奔驰",
                "重型矿用自卸卡车，载重能力强，动力澎湃，专为矿山和大型工地的长距离运输设计。坚固的车身结构与高效的动力系统保证长期稳定运行。",
                "260.00", 3, "24000 kg", "310 kW", "9.8m x 3.0m x 3.6m", "25 m³", true, "BENZ 3365"));
        save(build("混凝土泵车", "泵车", "三一重工",
                "46米臂架混凝土泵车，臂架伸展灵活，泵送效率高，适用于高层建筑、桥梁等大型混凝土浇筑工程。配备先进的智能控制系统。",
                "380.00", 2, "32000 kg", "294 kW", "12.5m x 2.55m x 3.98m", "120 m³/h", false, "SANY 46米"));
        save(build("塔式起重机", "塔吊", "中联重科",
                "QTZ80塔式起重机，起重力矩大，安装便捷，广泛用于高层建筑施工中的物料垂直与水平运输。结构稳定安全，操作简便。",
                "45.00", 6, "45500 kg", "—", "塔身1.66m x 1.66m", "8 t·m", true, "QTZ80"));
        save(build("推土机", "推土机", "山推",
                "履带式推土机，接地比压小，通过性强，配备高性能发动机与液力传动系统，广泛应用于道路建设、土地平整等土方工程。",
                "55.00", 4, "16000 kg", "120 kW", "5.2m x 2.5m x 3.0m", "4.5 m³", false, "SHANTUI SD16"));
        save(build("压路机", "压路机", "徐工",
                "单钢轮振动压路机，压实效果好，操作舒适，适用于道路基层、面层及机场跑道等的压实作业。",
                "28.00", 7, "22000 kg", "129 kW", "6.1m x 2.38m x 3.3m", "振动频率28Hz", false, "XCMG XS223J"));
        save(build("钻机", "钻机", "山河智能",
                "多功能履带式钻机，可配置潜孔锤、螺旋钻等多种钻具，适用于桩基础、锚杆等钻孔作业，效率高，成孔质量好。",
                "68.00", 3, "18500 kg", "90 kW", "6.8m x 2.3m x 2.6m", "最大孔径450mm", false, "HGY 机械钻机"));
    }

    private void save(Machinery m) {
        m.setOrgId(currentRootOrgId);
        machineryRepository.save(m);
    }

    private Machinery build(String name, String category, String brand, String description,
                            String price, int stock, String weight, String power,
                            String dimensions, String bucketCapacity, boolean recommended, String model) {
        Machinery m = new Machinery();
        m.setName(name);
        m.setCategory(category);
        m.setBrand(brand);
        m.setModel(model);
        m.setDescription(description);
        m.setPrice(new BigDecimal(price));
        m.setStock(stock);
        m.setSpecWeight(weight);
        m.setSpecPower(power);
        m.setSpecDimensions(dimensions);
        m.setSpecCapacity(bucketCapacity);
        m.setStatus("available");
        m.setRecommended(recommended);
        return m;
    }

    private void initProjects(Long rootOrgId) {
        User manager = userRepository.findByUsername("manager").orElse(null);
        User operator = userRepository.findByUsername("operator").orElse(null);
        String managerName = manager != null ? manager.getNickname() : "设备负责人";
        String operatorName = operator != null ? operator.getNickname() : "一线维修工";

        Project p1 = new Project();
        p1.setProjectNo("PRJ" + System.currentTimeMillis() + "001");
        p1.setName("滨海新区市政道路改造工程");
        p1.setCustomerName("滨海市政建设有限公司");
        p1.setCustomerPhone("021-68888888");
        p1.setAddress("滨海新区临港大道");
        p1.setPlannedStart(LocalDate.now().minusDays(15));
        p1.setPlannedEnd(LocalDate.now().plusMonths(3));
        p1.setBudget(new BigDecimal("680.00"));
        p1.setManagerName(managerName);
        p1.setDescription("路基土方开挖、回填碾压及道路面层施工，涉及挖掘机、装载机、压路机等设备。");
        p1.setOrgId(rootOrgId);
        p1.setStatus("active");
        projectRepository.save(p1);

        Project p2 = new Project();
        p2.setProjectNo("PRJ" + System.currentTimeMillis() + "002");
        p2.setName("青山矿场采剥工程");
        p2.setCustomerName("青山矿业集团");
        p2.setCustomerPhone("0371-67555555");
        p2.setAddress("青山市矿区一号采场");
        p2.setPlannedStart(LocalDate.now().plusDays(10));
        p2.setPlannedEnd(LocalDate.now().plusMonths(6));
        p2.setBudget(new BigDecimal("1250.00"));
        p2.setManagerName(managerName);
        p2.setDescription("矿山剥离与矿石运输，投入挖掘机、破碎锤、自卸车等大型设备。");
        p2.setOrgId(rootOrgId);
        p2.setStatus("created");
        projectRepository.save(p2);

        if (operator != null) {
            Machinery m1 = machineryRepository.findAll().stream()
                    .filter(m -> "液压挖掘机".equals(m.getName())).findFirst().orElse(null);
            if (m1 != null) {
                DispatchTask d1 = new DispatchTask();
                d1.setDispatchNo("DP" + System.currentTimeMillis() + "001");
                d1.setProjectId(p1.getId());
                d1.setProjectName(p1.getName());
                d1.setMachineryId(m1.getId());
                d1.setMachineryName(m1.getName());
                d1.setMachineryModel(m1.getModel());
                d1.setTitle("临港大道段路基开挖");
                d1.setDescription("负责K2+300~K2+800段路基土方开挖，日工作量约800方。");
                d1.setAssigneeUserId(operator.getId());
                d1.setAssigneeName(operatorName);
                d1.setStartAt(LocalDateTime.now().minusDays(2));
                d1.setEndAt(LocalDateTime.now().plusDays(3));
                d1.setStatus("ongoing");
                d1.setProgress(40);
                dispatchTaskRepository.save(d1);
            }
        }
        log.info("已初始化示例工程与调度任务");
    }

    private void initRentals(Long rootOrgId) {
        User admin = userRepository.findByUsername("admin").orElse(null);

        Machinery m4 = machineryRepository.findAll().stream()
                .filter(m -> "混凝土泵车".equals(m.getName())).findFirst().orElse(null);
        if (m4 != null) {
            RentalContract c1 = new RentalContract();
            c1.setContractNo("HT" + System.currentTimeMillis() + "001");
            c1.setMachineryId(m4.getId());
            c1.setMachineryName(m4.getName());
            c1.setMachineryModel(m4.getModel());
            c1.setClientCompany("宏宇建筑工程公司");
            c1.setClientContact("王先生");
            c1.setClientPhone("13922223333");
            c1.setDeposit(new BigDecimal("200000.00"));
            c1.setDailyRate(new BigDecimal("8000.00"));
            c1.setStartDate(LocalDate.now().minusDays(20));
            c1.setEndDate(LocalDate.now().plusDays(40));
            c1.setRentDays(60);
            c1.setTotalAmount(new BigDecimal("480000.00"));
            c1.setStatus("active");
            c1.setNote("含司机与泵送管路，按日租金结算。");
            if (admin != null) {
                c1.setCreatedByUserId(admin.getId());
                c1.setCreatedByName(admin.getNickname());
            }
            c1.setOrgId(rootOrgId);
            rentalContractRepository.save(c1);
            m4.setStatus("rented");
            machineryRepository.save(m4);
        }
        log.info("已初始化示例租赁合同");
    }

    /** 审批配置种子：选项集 / 动态表单（含全部字段类型）/ 已发布流程 */
    private void initApprovalConfig() {
        OptionSet dept = optionSetRepository.findByCode("DEPT").orElse(null);
        if (dept == null) {
            dept = new OptionSet();
            dept.setCode("DEPT");
            dept.setName("部门选项");
            dept.setOptionsJson("[{\"label\":\"设备部\",\"value\":\"equipment\"},{\"label\":\"工程部\",\"value\":\"engineering\"},{\"label\":\"采购部\",\"value\":\"purchase\"}]");
            dept.setStatus("enabled");
            optionSetRepository.save(dept);
        }

        if (formDefinitionRepository.count() == 0) {
            FormDefinition commonForm = new FormDefinition();
            commonForm.setName("通用申请单");
            commonForm.setBizType("common");
            commonForm.setStatus("enabled");
            commonForm.setFieldsJson("["
                    + "{\"key\":\"title\",\"label\":\"申请标题\",\"type\":\"input\",\"required\":true,\"placeholder\":\"请输入申请标题\"},"
                    + "{\"key\":\"dept\",\"label\":\"所属部门\",\"type\":\"select\",\"required\":true,\"optionsFrom\":\"optionSet\",\"optionSetCode\":\"DEPT\"},"
                    + "{\"key\":\"amount\",\"label\":\"申请金额\",\"type\":\"number\",\"required\":true,\"placeholder\":\"元\"},"
                    + "{\"key\":\"reason\",\"label\":\"申请事由\",\"type\":\"textarea\",\"required\":true},"
                    + "{\"key\":\"tags\",\"label\":\"标签\",\"type\":\"multiple\",\"options\":[{\"label\":\"紧急\",\"value\":\"urgent\"},{\"label\":\"常规\",\"value\":\"normal\"},{\"label\":\"重要\",\"value\":\"important\"}]},"
                    + "{\"key\":\"receipt\",\"label\":\"附件\",\"type\":\"upload\"},"
                    + "{\"key\":\"category\",\"label\":\"申请类别\",\"type\":\"tree\",\"treeData\":[{\"title\":\"行政类\",\"value\":\"admin\",\"children\":[{\"title\":\"办公用品\",\"value\":\"office\"},{\"title\":\"差旅\",\"value\":\"travel\"}]},{\"title\":\"业务类\",\"value\":\"biz\",\"children\":[{\"title\":\"采购\",\"value\":\"purchase\"},{\"title\":\"维修\",\"value\":\"repair\"}]}]}"
                    + "]");
            commonForm = formDefinitionRepository.save(commonForm);

            FormDefinition purchaseForm = new FormDefinition();
            purchaseForm.setName("采购申请单");
            purchaseForm.setBizType("purchase");
            purchaseForm.setStatus("enabled");
            purchaseForm.setFieldsJson("["
                    + "{\"key\":\"itemName\",\"label\":\"物料名称\",\"type\":\"input\",\"required\":true},"
                    + "{\"key\":\"quantity\",\"label\":\"数量\",\"type\":\"number\",\"required\":true},"
                    + "{\"key\":\"supplier\",\"label\":\"供应商\",\"type\":\"input\"},"
                    + "{\"key\":\"note\",\"label\":\"采购说明\",\"type\":\"textarea\"}"
                    + "]");
            FormDefinition purchase = formDefinitionRepository.save(purchaseForm);

            FormDefinition expenseForm = new FormDefinition();
            expenseForm.setName("维修费用报销单");
            expenseForm.setBizType("workorder_cost");
            expenseForm.setStatus("enabled");
            expenseForm.setFieldsJson("["
                    + "{\"key\":\"workOrderNo\",\"label\":\"工单号\",\"type\":\"input\",\"required\":true},"
                    + "{\"key\":\"cost\",\"label\":\"报销金额\",\"type\":\"number\",\"required\":true},"
                    + "{\"key\":\"memo\",\"label\":\"费用说明\",\"type\":\"textarea\"}"
                    + "]");
            formDefinitionRepository.save(expenseForm);

            if (processDefinitionRepository.count() == 0) {
                ProcessDefinition commonProcess = new ProcessDefinition();
                commonProcess.setName("通用申请审批");
                commonProcess.setFormId(commonForm.getId());
                commonProcess.setStatus("published");
                commonProcess.setNodesJson("[{\"index\":0,\"name\":\"部门主管审批\",\"approverType\":\"role\",\"approverValue\":\"manager\"},{\"index\":1,\"name\":\"系统管理员审批\",\"approverType\":\"role\",\"approverValue\":\"admin\"}]");
                processDefinitionRepository.save(commonProcess);

                ProcessDefinition purchaseProcess = new ProcessDefinition();
                purchaseProcess.setName("采购申请审批");
                purchaseProcess.setFormId(purchase.getId());
                purchaseProcess.setStatus("published");
                purchaseProcess.setNodesJson("[{\"index\":0,\"name\":\"部门主管审批\",\"approverType\":\"role\",\"approverValue\":\"manager\"},{\"index\":1,\"name\":\"设备负责人复核\",\"approverType\":\"user\",\"approverValue\":\"2\"}]");
                processDefinitionRepository.save(purchaseProcess);
            }
            log.info("已初始化审批配置：表单/流程");
        }
    }

    private void initAnnouncements(Long rootOrgId) {
        User admin = userRepository.findByUsername("admin").orElse(null);
        saveAnnouncement("新系统上线使用指南", "欢迎使用重工机械一体化管理平台，已开通设备管理、工程派单、租赁、审批、采购与备件库存等模块。", "notice", admin, rootOrgId);
        saveAnnouncement("关于开展设备安全巡检的通知", "请各分公司按巡检计划完成本月设备安全巡检，并于月底前提交巡检结果。", "system", admin, rootOrgId);
        log.info("已初始化公告");
    }

    private void saveAnnouncement(String title, String content, String type, User admin, Long rootOrgId) {
        Announcement a = new Announcement();
        a.setTitle(title);
        a.setContent(content);
        a.setType(type);
        a.setStatus("published");
        a.setOrgId(rootOrgId);
        if (admin != null) {
            a.setPublisherId(admin.getId());
            a.setPublisherName(admin.getNickname());
        }
        announcementRepository.save(a);
    }

    private void initSuppliers(Long rootOrgId) {
        saveSupplier("徐工集团配件供应中心", "张经理", "13811110001", "工程机械", "江苏省徐州市", "A", rootOrgId);
        saveSupplier("卡特彼勒授权经销商", "李经理", "13811110002", "发动机及液压件", "北京市朝阳区", "A", rootOrgId);
        saveSupplier("华北工程物资有限公司", "王经理", "13811110003", "通用五金/易损件", "河北省石家庄市", "B", rootOrgId);
        log.info("已初始化供应商");
    }

    private void saveSupplier(String name, String contact, String phone, String category, String address, String level, Long rootOrgId) {
        Supplier s = new Supplier();
        s.setName(name);
        s.setContact(contact);
        s.setPhone(phone);
        s.setCategory(category);
        s.setAddress(address);
        s.setCreditLevel(level);
        s.setStatus("enabled");
        s.setOrgId(rootOrgId);
        supplierRepository.save(s);
    }

    private void initSpareParts(Long rootOrgId) {
        savePart("SP001", "液压油滤芯", "过滤件", "适配卡特彼勒320", "个", "450.00", 36, 10, "1号仓库", rootOrgId);
        savePart("SP002", "发动机机油(15W-40)", "油品化工", "18L/桶", "桶", "680.00", 24, 6, "1号仓库", rootOrgId);
        savePart("SP003", "铲斗油封组件", "密封件", "135型", "套", "320.00", 18, 6, "2号仓库", rootOrgId);
        savePart("SP004", "空气滤芯", "过滤件", "标准", "个", "120.00", 60, 20, "1号仓库", rootOrgId);
        savePart("SP005", "耐磨斗齿", "易损件", "LM320", "个", "85.00", 80, 30, "2号仓库", rootOrgId);
        log.info("已初始化备件库存");
    }

    private void savePart(String partNo, String name, String category, String spec, String unit,
                          String price, int stock, int min, String warehouse, Long rootOrgId) {
        SparePart p = new SparePart();
        p.setPartNo(partNo);
        p.setName(name);
        p.setCategory(category);
        p.setSpec(spec);
        p.setUnit(unit);
        p.setPrice(new BigDecimal(price));
        p.setStockQty(new BigDecimal(stock));
        p.setMinStock(new BigDecimal(min));
        p.setWarehouse(warehouse);
        p.setOrgId(rootOrgId);
        sparePartRepository.save(p);
    }
}
