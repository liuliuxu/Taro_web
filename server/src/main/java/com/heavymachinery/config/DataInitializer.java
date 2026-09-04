package com.heavymachinery.config;

import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * 初始化示例数据（仅当数据库为空时执行）
 */
@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MachineryRepository machineryRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           MachineryRepository machineryRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.machineryRepository = machineryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            initUsers();
        }
        if (machineryRepository.count() == 0) {
            initMachinery();
        }
    }

    private void initUsers() {
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setNickname("系统管理员");
        admin.setPhone("13800000000");
        admin.setEmail("admin@heavymachinery.com");
        admin.setRole("admin");
        userRepository.save(admin);

        User customer = new User();
        customer.setUsername("demo");
        customer.setPassword(passwordEncoder.encode("demo123"));
        customer.setNickname("示例用户");
        customer.setPhone("13912345678");
        customer.setEmail("demo@example.com");
        customer.setRole("customer");
        userRepository.save(customer);

        log.info("已初始化用户: admin/admin123, demo/demo123");
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
}
