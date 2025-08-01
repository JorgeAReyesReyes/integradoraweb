import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Table, Popconfirm, Modal, Spin, Alert, ConfigProvider } from 'antd';
import axios from 'axios';

// Configuración del tema de Ant Design con el color naranja
const orangeTheme = {
  token: {
    colorPrimary: '#FFA726',
  },
};

interface UserData {
  key: string;
  name: string;
  email: string;
  phone: string;
  status?: boolean;
}

const UserForm: React.FC = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const USERS_ENDPOINT = `${API_BASE_URL}/api/users`;

  const DEMO_USERS: UserData[] = [
    {
      key: '1',
      name: 'Usuario Demo',
      email: 'usuario@demo.com',
      phone: '123456789',
      status: true
    },
    {
      key: '2',
      name: 'Admin Demo',
      email: 'admin@demo.com',
      phone: '987654321',
      status: true
    }
  ];

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Por favor ingresa una contraseña'));
    }
    
    if (value.length < 8 || value.length > 50) {
      return Promise.reject(new Error('La contraseña debe tener entre 8 y 50 caracteres'));
    }
    
    if (!/[a-z]/.test(value)) {
      return Promise.reject(new Error('Debe contener al menos una minúscula'));
    }
    
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(new Error('Debe contener al menos una mayúscula'));
    }
    
    if (!/[0-9]/.test(value)) {
      return Promise.reject(new Error('Debe contener al menos un número'));
    }
    
    return Promise.resolve();
  };

  const fetchUsers = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await axios.get(USERS_ENDPOINT);
      
      const usersData = Array.isArray(response.data) ? response.data : 
                      Array.isArray(response.data?.userList) ? response.data.userList : [];
      
      const formattedUsers: UserData[] = usersData.map((user: any) => ({
        key: user._id || Math.random().toString(36).substr(2, 9),
        name: user.name || 'No especificado',
        email: user.email || 'No especificado',
        phone: user.phone || 'No especificado',
        status: user.status !== undefined ? user.status : true,
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      
      if (error.response?.status === 404) {
        setApiError("Endpoint de usuarios no encontrado. Mostrando datos de demostración.");
      } else {
        setApiError("Error al cargar usuarios. Mostrando datos de demostración.");
      }
      
      setUsers(DEMO_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        ...(!isEditing && { password: values.password }),
      };

      if (apiError) {
        message.warning("Modo demostración: los datos no se guardarán");
        form.resetFields();
        setEditingUser(null);
        setIsEditing(false);
        setIsModalVisible(false);
        return;
      }

      if (isEditing && editingUser) {
        await axios.patch(`${USERS_ENDPOINT}/${editingUser.key}`, payload);
        message.success("Usuario actualizado correctamente");
      } else {
        await axios.post(USERS_ENDPOINT, payload);
        message.success("Usuario registrado correctamente");
      }

      form.resetFields();
      setEditingUser(null);
      setIsEditing(false);
      setIsModalVisible(false);
      await fetchUsers();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      
      let errorMessage = "Error al guardar usuario";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Endpoint no encontrado";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableUser = async (key: string) => {
    try {
      if (apiError) {
        message.warning("Modo demostración: acción no realizada");
        return;
      }

      await axios.patch(`${USERS_ENDPOINT}/${key}/disable`);
      message.success("Usuario dado de baja correctamente");
      await fetchUsers();
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || "Error al dar de baja el usuario");
    }
  };

  const handleEditUser = (key: string) => {
    const userToEdit = users.find(user => user.key === key);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setIsEditing(true);
      setIsModalVisible(true);
      form.setFieldsValue({
        name: userToEdit.name,
        email: userToEdit.email,
        phone: userToEdit.phone,
      });
    }
  };

  const columns = [
    { 
      title: 'Nombre', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => <span>{text || 'No especificado'}</span>
    },
    { 
      title: 'Correo', 
      dataIndex: 'email', 
      key: 'email',
      render: (text: string) => <span>{text || 'No especificado'}</span>
    },
    { 
      title: 'Teléfono', 
      dataIndex: 'phone', 
      key: 'phone',
      render: (text: string) => <span>{text || 'No especificado'}</span>
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean | undefined) => (
        <span style={{ color: status !== false ? 'green' : 'red' }}>
          {status !== false ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: any, record: UserData) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            type="link" 
            onClick={() => handleEditUser(record.key)}
            style={{ padding: 0, color: '#FFA726' }}
          >
            Editar
          </Button>
          {record.status !== false && (
            <Popconfirm
              title="¿Dar de baja este usuario?"
              onConfirm={() => handleDisableUser(record.key)}
              okText="Sí"
              cancelText="No"
              okButtonProps={{ style: { backgroundColor: '#FFA726', borderColor: '#FFA726' } }}
            >
              <Button type="link" danger style={{ padding: 0 }}>
                Dar de baja
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider theme={orangeTheme}>
      <div style={{
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f0f2f5'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)'
        }}>
          {apiError && (
            <Alert
              message="Modo demostración"
              description={apiError}
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Gestión de Usuarios</h2>
            <Button
              type="primary"
              onClick={() => {
                setIsModalVisible(true);
                setEditingUser(null);
                setIsEditing(false);
                form.resetFields();
              }}
              style={{ backgroundColor: '#FFA726', borderColor: '#FFA726' }}
            >
              Nuevo Usuario
            </Button>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={users}
              pagination={{ pageSize: 10 }}
              rowKey="key"
              bordered
            />
          </Spin>

          <Modal
            title={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false);
              form.resetFields();
            }}
            footer={null}
            width={700}
            destroyOnClose
          >
            <Spin spinning={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  label="Nombre completo"
                  name="name"
                  rules={[
                    { required: true, message: 'Campo obligatorio' },
                    { min: 3, message: 'Mínimo 3 caracteres' }
                  ]}
                >
                  <Input placeholder="Ej: Juan Pérez" />
                </Form.Item>

                <Form.Item
                  label="Correo electrónico"
                  name="email"
                  rules={[
                    { required: true, message: 'Campo obligatorio' },
                    { type: 'email', message: 'Email inválido' }
                  ]}
                >
                  <Input placeholder="Ej: usuario@ejemplo.com" />
                </Form.Item>

                {!isEditing && (
                  <>
                    <Form.Item
                      label="Contraseña"
                      name="password"
                      rules={[
                        { validator: validatePassword }
                      ]}
                      hasFeedback
                    >
                      <Input.Password 
                        placeholder="Mínimo 8 caracteres, mayúsculas, minúsculas y números" 
                      />
                    </Form.Item>

                    <Form.Item
                      label="Confirmar contraseña"
                      name="confirmPassword"
                      dependencies={['password']}
                      hasFeedback
                      rules={[
                        { required: true, message: 'Confirma tu contraseña' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Las contraseñas no coinciden'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Repite la contraseña" />
                    </Form.Item>
                  </>
                )}

                <Form.Item
                  label="Teléfono"
                  name="phone"
                  rules={[
                    { required: true, message: 'Campo obligatorio' },
                    { pattern: /^[0-9+\- ]+$/, message: 'Teléfono inválido' }
                  ]}
                >
                  <Input placeholder="Ej: +51 987654321" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    style={{ backgroundColor: '#FFA726', borderColor: '#FFA726' }}
                  >
                    {isEditing ? "Actualizar Usuario" : "Crear Usuario"}
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default UserForm;