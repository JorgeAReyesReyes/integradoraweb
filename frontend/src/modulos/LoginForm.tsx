import React from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

const LoginForm: React.FC = () => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handlersumit = async () => {
    try {
      const values = form.getFieldsValue();
      console.log(values);

      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      login(data.accessToken);
      navigate('/dashboard');
      form.resetFields();
    } catch (error: any) {
      console.error('Ocurrió un error en LoginForm.tsx:', error);
      message.error(error.message || 'Ocurrió un error al iniciar sesión');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#Fff',
      }}
    >
      {/* Logo */}
      <img
        src="https://alejandrone.mx/virtualtours/UTDVirtualTour/images/image_1.png"
        style={{ width: 300, marginBottom: 20 }}
        alt="logo"
      />

      {/* Título */}
      <h2 style={{ marginBottom: 5, textAlign: 'center' }}>
        Sistema de Monitoreo de Aires Acondicionados
      </h2>
      <p style={{ color: '#888', marginBottom: 30 }}>Inicia sesión</p>

      {/* Formulario */}
      <Form
        form={form}
        name="login"
        layout="vertical"
        initialValues={{ remember: true }}
        style={{ width: '100%', maxWidth: 360 }}
      >
        <Form.Item
          label="Correo electrónico"
          name="email"
          rules={[
            { required: true, message: 'Ingresa tu correo' },
            { type: 'email', message: 'Correo no válido' },
          ]}
        >
          <Input
            placeholder="Ingresa tu correo"
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
        >
          <Input.Password
            placeholder="Ingresa tu contraseña"
            prefix={<LockOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            block
            size="large"
            style={{
              backgroundColor: '#FFA726',
              borderColor: '#FFA726',
              fontWeight: 'bold',
            }}
            onClick={handlersumit}
          >
            Iniciar Sesión
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;