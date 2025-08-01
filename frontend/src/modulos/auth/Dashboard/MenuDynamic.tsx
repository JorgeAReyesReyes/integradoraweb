import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

// Diccionario para traducir strings a íconos
const Icons = {
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
};

// Tipo de menú
interface MenuItem {
  title: string;
  path: string;
  icon: keyof typeof Icons;
  roles: string[];
}

const MenuDynamic: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Simulación de datos que podrían venir de backend
  const fakeMenuData: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
      roles: ['665a1f2b40fd3a12b3e77611'],
    },
    {
      title: 'Usuarios',
      path: '/users',
      icon: 'UserOutlined',
      roles: ['665a1f2b40fd3a12b3e77612'],
    },
    
  ];

  // Simular llamada a API y filtrar por rol actual
  useEffect(() => {
    const userRole = '665a1f2b40fd3a12b3e77611'; // ← simula rol del usuario

    // Filtra solo las rutas permitidas para el rol
    const filteredMenu = fakeMenuData.filter((item) =>
      item.roles.includes(userRole)
    );

    setTimeout(() => {
      setMenuItems(filteredMenu);
    }, 300);
  }, []);

  // Genera items del menú para <Menu items={…} />
  const renderMenuItems = () =>
    menuItems.map((item) => {
      const Icon = Icons[item.icon];
      return {
        key: item.path,
        icon: Icon ? <Icon /> : null,
        label: item.title,
      };
    });

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      onClick={({ key }) => navigate(key)}
      items={renderMenuItems()}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default MenuDynamic;