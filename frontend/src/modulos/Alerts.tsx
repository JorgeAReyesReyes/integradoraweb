import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, Alert } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface Alerta {
  _id: string;
  salon: string;
  mensaje: string;
  fecha: string;
}

const Alerts: React.FC = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerAlertas = async () => {
      try {
        const response = await axios.get("/api/alertas");
        const data = response.data;

        // Ordenar por fecha descendente
        const ordenadas = data.sort(
          (a: Alerta, b: Alerta) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        setAlertas(ordenadas);
      } catch (err) {
        setError("Error al cargar el historial de alertas.");
      } finally {
        setLoading(false);
      }
    };

    obtenerAlertas();
  }, []);

  const columns = [
    {
      title: "Salón",
      dataIndex: "salon",
      key: "salon",
      width: "15%",
      sorter: (a: Alerta, b: Alerta) => a.salon.localeCompare(b.salon),
    },
    {
      title: "Mensaje",
      dataIndex: "mensaje",
      key: "mensaje",
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: "25%",
      render: (fecha: string) => dayjs(fecha).format("DD MMM YYYY HH:mm"),
      sorter: (a: Alerta, b: Alerta) =>
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <Typography.Title level={2} style={{ textAlign: "center", color: "#333" }}>
        Historial de Alertas
      </Typography.Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: "2rem" }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={alertas}
          columns={columns}
          rowKey="_id"
          bordered
          pagination={{ pageSize: 8 }}
        />
      )}
    </div>
  );
};

export default Alerts;