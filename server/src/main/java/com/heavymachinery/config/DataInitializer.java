package com.heavymachinery.config;

import com.heavymachinery.entity.DispatchTask;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.Project;
import com.heavymachinery.entity.RentalContract;
import com.heavymachinery.entity.User;
import com.heavymachinery.entity.WorkOrder;
import com.heavymachinery.repository.DispatchTaskRepository;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.repository.RentalContractRepository;
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
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           MachineryRepository machineryRepository,
                           WorkOrderRepository workOrderRepository,
                           ProjectRepository projectRepository,
                           DispatchTaskRepository dispatchTaskRepository,
                           RentalContractRepository rentalContractRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.machineryRepository = machineryRepository;
        this.workOrderRepository = workOrderRepository;
        this.projectRepository = projectRepository;
        this.dispatchTaskRepository = dispatchTaskRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        initUsers();
        if (machineryRepository.count() == 0) {
            initMachinery();
        }
        if (workOrderRepository.count() == 0) {
            initWorkOrders();
        }
        if (projectRepository.count() == 0) {
            initProjects();
        }
        if (rentalContractRepository.count() == 0) {
            initRentals();
        }
    }

    private void initUsers() {
        createUserIfMissing("admin", "admin123", "系统管理员", "13800000000", "admin@heavymachinery.com", "admin");
        createUserIfMissing("manager", "manager123", "设备负责人", "13611112222", null, "manager");
        createUserIfMissing("operator", "operator123", "一线维修工", "13533334444", null, "operator");
        log.info("已初始化用户: admin/admin123, manager/manager123, operator/operator123");
    }

    private void createUserIfMissing(String username, String rawPassword, String nickname,
                                     String phone, String email, String role) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }
        User u = new User();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setNickname(nickname);
        u.setPhone(phone);
        u.setEmail(email);
        u.setRole(role);
        userRepository.save(u);
    }

    private void initWorkOrders() {
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

    private void initMachinery() {
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

    private void initProjects() {
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

    private void initRentals() {
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
            rentalContractRepository.save(c1);
            m4.setStatus("rented");
            machineryRepository.save(m4);
        }
        log.info("已初始化示例租赁合同");
    }
}
