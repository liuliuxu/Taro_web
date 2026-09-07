import type { ReactNode } from 'react'
import {
  DashboardOutlined, BarChartOutlined, AppstoreOutlined, ToolOutlined, FileDoneOutlined, SafetyCertificateOutlined,
  ProjectOutlined, CarryOutOutlined, ShoppingOutlined, TeamOutlined, ShoppingCartOutlined, DatabaseOutlined, AuditOutlined,
  SettingOutlined, NotificationOutlined, UserOutlined, ApartmentOutlined, CompassOutlined, CloudServerOutlined,
  ThunderboltOutlined, CrownOutlined, RocketOutlined, ShopOutlined, RobotOutlined
} from '@ant-design/icons'

export const ICON_MAP: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  bar: <BarChartOutlined />,
  appstore: <AppstoreOutlined />,
  tool: <ToolOutlined />,
  file: <FileDoneOutlined />,
  safety: <SafetyCertificateOutlined />,
  project: <ProjectOutlined />,
  carry: <CarryOutOutlined />,
  shopping: <ShoppingOutlined />,
  team: <TeamOutlined />,
  cart: <ShoppingCartOutlined />,
  database: <DatabaseOutlined />,
  audit: <AuditOutlined />,
  setting: <SettingOutlined />,
  notice: <NotificationOutlined />,
  user: <UserOutlined />,
  apartment: <ApartmentOutlined />,
  menu: <AppstoreOutlined />,
  box: <DatabaseOutlined />,
  compass: <CompassOutlined />,
  server: <CloudServerOutlined />,
  bolt: <ThunderboltOutlined />,
  crown: <CrownOutlined />,
  rocket: <RocketOutlined />,
  shop: <ShopOutlined />,
  robot: <RobotOutlined />
}

export const ICON_OPTIONS = Object.keys(ICON_MAP).map((key) => ({ value: key, label: key }))