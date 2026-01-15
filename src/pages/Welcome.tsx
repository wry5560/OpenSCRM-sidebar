import React, { useEffect } from 'react';
import { history } from 'umi';
import { Card, Row, Col } from 'antd';
import { FileTextOutlined, FolderOutlined } from '@ant-design/icons';
import styles from './Welcome.less';

const Welcome: React.FC = () => {
  // 自动跳转到客户信息页面
  useEffect(() => {
    history.replace('/customer-info');
  }, []);
  const menuItems = [
    {
      title: '话术库',
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      description: '快速发送预设话术',
      path: '/script-library',
    },
    {
      title: '素材库',
      icon: <FolderOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      description: '发送图片、视频、文档等素材',
      path: '/material-library',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>极星SCRM</h2>
        <p>企业微信SCRM侧边栏</p>
      </div>
      <Row gutter={[16, 16]} className={styles.menuGrid}>
        {menuItems.map((item) => (
          <Col span={12} key={item.path}>
            <Card
              hoverable
              className={styles.menuCard}
              onClick={() => history.push(item.path)}
            >
              <div className={styles.cardContent}>
                {item.icon}
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Welcome;
