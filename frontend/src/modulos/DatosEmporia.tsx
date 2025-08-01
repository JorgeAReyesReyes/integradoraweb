import React, { useEffect, useState } from "react";
import { Table, Typography, Card, Space, Tag, message } from "antd";
import axios from "axios";

const { Title } = Typography;

interface DatoEnergia {
  _id: string;
  timestamp: string;
  device_gid: number;
  channel_num: number;
  channel_name: string;
  usage_kWh: number;
  usage_W: number;
  percentage: number;
}

// 🔹 Canales esperados para mostrar en caso de datos vacíos
const canalesEsperados = [
  { channel_num: 1, channel_name: "C14" },
  { channel_num: 2, channel_name: "C13" },
  { channel_num: 3, channel_name: "C10" },
  { channel_num: 4, channel_name: "C8" },
  { channel_num: 5, channel_name: "C7" },
  { channel_num: 6, channel_name: "C9" },
  { channel_num: 7, channel_name: "C6" },
  { channel_num: 8, channel_name: "C11" },
  { channel_num: 9, channel_name: "Lab1" },
  { channel_num: 10, channel_name: "Lab2" }
];

// 🔹 Generar datos de ejemplo con ceros
const generarDatosCero = (): DatoEnergia[] => {
  const ahora = new Date().toISOString();
  return canalesEsperados.map((canal, index) => ({
    _id: `fake-${index}`,
    timestamp: ahora,
    device_gid: 0,
    channel_num: canal.channel_num,
    channel_name: canal.channel_name,
    usage_kWh: 0,
    usage_W: 0,
    percentage: 0
  }));
};

const DatosEmporia: React.FC = () => {
  const [datos, setDatos] = useState<DatoEnergia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await axios.get("/api/emporia/datos");

        // Validación moderna y compatibilidad con versiones anteriores
        const data = response.data?.success !== undefined
          ? (response.data.success && Array.isArray(response.data.data) ? response.data.data : [])
          : (Array.isArray(response.data) ? response.data : response.data?.data || []);

        if (Array.isArray(data) && data.length > 0) {
          setDatos(data);
        } else {
          setDatos(generarDatosCero());
        }
      } catch (error: any) {
        console.error("❌ Error al obtener datos Emporia:", error);
        message.error(
          error.response?.data?.message ||
          error.message ||
          "Error al cargar los datos de energía"
        );
        setDatos(generarDatosCero());
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const columnas = [
    {
      title: "Canal",
      dataIndex: "channel_name",
      key: "channel_name",
      sorter: (a: DatoEnergia, b: DatoEnergia) =>
        a.channel_num - b.channel_num,
    },
    {
      title: "Fecha",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (fecha: string) => new Date(fecha).toLocaleString(),
      sorter: (a: DatoEnergia, b: DatoEnergia) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "kWh",
      dataIndex: "usage_kWh",
      key: "usage_kWh",
      sorter: (a: DatoEnergia, b: DatoEnergia) => a.usage_kWh - b.usage_kWh,
      render: (value: number) => value?.toFixed(4) ?? 'N/A',
    },
    {
      title: "Watt",
      dataIndex: "usage_W",
      key: "usage_W",
      sorter: (a: DatoEnergia, b: DatoEnergia) => a.usage_W - b.usage_W,
      render: (value: number) => value?.toFixed(2) ?? 'N/A',
    },
    {
      title: "%",
      dataIndex: "percentage",
      key: "percentage",
      render: (valor: number) => (
        <Tag color={valor > 75 ? "red" : valor > 50 ? "orange" : "green"}>
          {valor?.toFixed(1)}%
        </Tag>
      ),
      sorter: (a: DatoEnergia, b: DatoEnergia) => a.percentage - b.percentage,
    },
  ];

  return (
    <Card
      styles={{
        body: {
          margin: "20px",
        },
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={3}>Consumo de energía</Title>
        <Table
          dataSource={datos}
          columns={columnas}
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 11,
            showSizeChanger: false,
          }}
          scroll={{ x: true }}
        />
      </Space>
    </Card>
  );
};

export default DatosEmporia;