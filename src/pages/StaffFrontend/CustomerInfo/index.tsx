import React, { useEffect, useState, useCallback } from 'react';
import { Spin, message, Empty, Button, Result } from 'antd';
import { UserAddOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './index.less';
import CustomerForm from './components/CustomerForm';
import CustomerSearch from './components/CustomerSearch';
import {
  getFieldConfigs,
  matchCustomer,
  getExternalContact,
  FieldConfig,
  CustomerInfo,
} from './service';

const CustomerInfoPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [externalUserID, setExternalUserID] = useState<string>('');
  const [showSearch, setShowSearch] = useState(false);

  // 加载字段配置
  const loadFieldConfigs = useCallback(async () => {
    try {
      const res = await getFieldConfigs();
      if (res.code === 0 && res.data?.fields) {
        setFieldConfigs(res.data.fields);
      }
    } catch (err) {
      console.error('加载字段配置失败', err);
    }
  }, []);

  // 获取外部联系人并匹配客户
  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCustomer(null);

    try {
      // 获取当前聊天的外部联系人ID
      let extUserID = '';
      try {
        extUserID = await getExternalContact();
        setExternalUserID(extUserID);
      } catch (err: any) {
        console.warn('获取外部联系人失败', err);
        // 在非企业微信环境下，显示提示
        setError('请在企业微信中打开侧边栏');
        setLoading(false);
        return;
      }

      if (!extUserID) {
        setError('未找到当前聊天的客户');
        setLoading(false);
        return;
      }

      // 根据外部联系人ID匹配客户
      const res = await matchCustomer(extUserID);
      if (res.code === 0) {
        if (res.data?.found && res.data?.customer) {
          setCustomer(res.data.customer);
        }
        // 未找到匹配的客户，显示关联入口
      } else {
        setError(res.message || '匹配客户失败');
      }
    } catch (err: any) {
      console.error('加载客户信息失败', err);
      setError(err.message || '加载客户信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadFieldConfigs();
    loadCustomer();
  }, [loadFieldConfigs, loadCustomer]);

  // 处理绑定成功
  const handleBindSuccess = useCallback(
    (newCustomer: CustomerInfo) => {
      setCustomer(newCustomer);
      setShowSearch(false);
      message.success('客户关联成功');
    },
    []
  );

  // 处理更新成功
  const handleUpdateSuccess = useCallback(() => {
    message.success('保存成功');
    // 重新加载客户信息
    if (customer?.row_id) {
      loadCustomer();
    }
  }, [customer, loadCustomer]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Result
          status="warning"
          title={error}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={loadCustomer}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  // 渲染搜索弹窗
  if (showSearch) {
    return (
      <CustomerSearch
        externalUserID={externalUserID}
        fieldConfigs={fieldConfigs}
        onCancel={() => setShowSearch(false)}
        onBindSuccess={handleBindSuccess}
      />
    );
  }

  // 未找到匹配的客户，显示关联入口
  if (!customer) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="未找到关联的客户信息" />
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          size="large"
          onClick={() => setShowSearch(true)}
          style={{ marginTop: 16 }}
        >
          关联客户
        </Button>
      </div>
    );
  }

  // 渲染客户信息表单
  return (
    <div className={styles.container}>
      <CustomerForm
        customer={customer}
        fieldConfigs={fieldConfigs}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default CustomerInfoPage;
