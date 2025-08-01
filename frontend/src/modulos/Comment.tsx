import React, { useEffect, useState } from "react";
import { Layout, Input, List, Button, Typography, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface CommentItem {
  id: string;
  text: string;
}

const Comment: React.FC = () => {
  const STORAGE_KEY = "comentarios-salon"; 

  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: CommentItem[] = JSON.parse(stored);
        setComments(parsed);
      } catch (_) {
        console.error("Error parsing stored comments");
      }
    }
  }, []);

 
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }, [comments]);

 
  const addComment = () => {
    if (!comment.trim()) return message.warning("Escribe algo primero");
    setComments([{ id: Date.now().toString(), text: comment.trim() }, ...comments]);
    setComment("");
    message.success("Comentario agregado");
  };

  const removeComment = (id: string) => {
    setComments(comments.filter((c) => c.id !== id));
    message.info("Comentario eliminado");
  };
  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <Header style={{ background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>
          Comentarios
        </Title>
      </Header>

      <Content style={{ padding: "1.5rem 16px" }}>
        {/* Input redondeado */}
        <Input.Search
          placeholder="Escribe tu comentario..."
          enterButton="Agregar"
          size="large"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onSearch={addComment}
          style={{ backgroundColor: "yellow", color: "#ffa500", border: "none" }}
          
        />


        {/* Lista */}
        <List
          dataSource={comments}
          locale={{ emptyText: "Sin comentarios" }}
          style={{ marginTop: 12 }}
          renderItem={(item) => (
         <List.Item
  style={{
    background: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <Text>{item.text}</Text>

  <Button
    danger
    shape="circle"
    icon={<DeleteOutlined />}
    onClick={() => removeComment(item.id)}
    style={{
      backgroundColor: "yellow",
      color: "#000",
      border: "2px solid yellow",
    }}
  />
</List.Item>
          )}
        />
      </Content>
    </Layout>
  );
};

export default Comment;