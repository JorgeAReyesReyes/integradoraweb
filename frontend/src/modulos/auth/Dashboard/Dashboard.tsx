import React from "react";
import {
  UserOutlined,
  DatabaseOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Modal } from "antd";

const { Sider, Content } = Layout;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
  Modal.confirm({
    title: '¿Estás seguro que deseas salir?',
    content: 'Tu sesión actual se cerrará.',
    okText: 'Sí',
    cancelText: 'No',
    onOk: () => {
      localStorage.removeItem("accessToken");
      navigate("/login");
    },
  });
};

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Menú lateral */}
      <Sider
        width={200}
        style={{
          backgroundColor: "#006400",
          position: "fixed",
          height: "100vh",
          left: 0,
          overflow: "auto",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          <img
            src="https://alejandrone.mx/virtualtours/UTDVirtualTour/images/image_1.png"
            alt="UTD"
            style={{ maxHeight: 80, width: "auto" }}
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ backgroundColor: "#006400" }}
          items={[
            { key: "users", icon: <UserOutlined />, label: "Usuarios" },
            { key: "horarioform", icon: <DatabaseOutlined />, label: "Horarios" },
            { key: "EdificioC", icon: <HomeOutlined />, label: "Monitoreo" },
            { key: "DatosEmporia", icon: <DatabaseOutlined />, label: "Consumo" },
          ]}
        />

        <div style={{ padding: 16 }}>
  <Button onClick={handleLogout} danger type="primary" block>
    Salir
  </Button>
</div>
      </Sider>

      {/* Contenido principal */}
      <Layout style={{ marginLeft: 0 }}>
        <Content
          style={{
            padding: 24,
            backgroundColor: "#fff", // fondo blanco completo
            minHeight: "100vh",
            width: "100%",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;