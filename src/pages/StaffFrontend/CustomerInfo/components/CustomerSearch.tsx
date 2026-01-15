import React, { useState, useCallback } from 'react';
import { Input, Button, Spin, message, Empty, Tag } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons';
import styles from '../index.less';
import { searchCustomers, bindCustomer, changeBinding, FieldConfig, CustomerInfo } from '../service';

interface CustomerSearchProps {
  externalUserID: string;
  fieldConfigs: FieldConfig[];
  onCancel: () => void;
  onBindSuccess: (customer: CustomerInfo) => void;
  // 更改绑定模式：传入原客户ID
  oldCustomerRowId?: string;
}

// 企微外部用户ID字段ID
const WECOM_EXTERNAL_USERID_FIELD = '692f976f7001b729cd1c01ca';

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  externalUserID,
  fieldConfigs,
  onCancel,
  onBindSuccess,
  oldCustomerRowId,
}) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [binding, setBinding] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerInfo[]>([]);
  const [searched, setSearched] = useState(false);

  // 是否是更改绑定模式
  const isChangeMode = !!oldCustomerRowId;

  // 获取字段名称映射
  const fieldNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    fieldConfigs.forEach((field) => {
      map[field.id] = field.name;
    });
    return map;
  }, [fieldConfigs]);

  // 搜索客户
  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键字');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await searchCustomers(keyword.trim(), 20, 1);
      if (res.code === 0) {
        setResults(res.data?.items || []);
      } else {
        message.error(res.message || '搜索失败');
        setResults([]);
      }
    } catch (err: any) {
      console.error('搜索失败', err);
      message.error(err.message || '搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  // 检查客户是否已绑定微信
  const isCustomerBound = useCallback((customer: CustomerInfo): boolean => {
    const fields = customer.fields || {};
    const boundExternalUserId = fields[WECOM_EXTERNAL_USERID_FIELD] || fields['wecomExternalUserid'];
    return !!boundExternalUserId && boundExternalUserId !== '';
  }, []);

  // 绑定客户
  const handleBind = useCallback(
    async (customer: CustomerInfo) => {
      if (!externalUserID) {
        message.error('无法获取当前聊天的外部联系人信息');
        return;
      }

      // 检查是否已绑定
      if (isCustomerBound(customer)) {
        message.warning('该客户已有微信关联，请选择其他客户');
        return;
      }

      setBinding(customer.row_id);
      try {
        let res;
        if (isChangeMode && oldCustomerRowId) {
          // 更改绑定模式
          res = await changeBinding(customer.row_id, oldCustomerRowId, externalUserID);
        } else {
          // 首次绑定模式
          res = await bindCustomer(customer.row_id, externalUserID);
        }

        if (res.code === 0) {
          onBindSuccess(customer);
        } else {
          message.error(res.message || '关联失败');
        }
      } catch (err: any) {
        console.error('关联失败', err);
        message.error(err.message || '关联失败');
      } finally {
        setBinding(null);
      }
    },
    [externalUserID, onBindSuccess, isChangeMode, oldCustomerRowId, isCustomerBound]
  );

  // 获取客户显示信息
  const getCustomerDisplay = (customer: CustomerInfo) => {
    const fields = customer.fields || {};
    // 客户编号字段ID: 693660e95326c71216b1b87a
    // 号码字段ID: 692f976f7001b729cd1c01c1
    const customerNo = fields['693660e95326c71216b1b87a'] || '';
    const phone = fields['692f976f7001b729cd1c01c1'] || '';
    // 客户抖音名称字段ID: 692f976f7001b729cd1c01be
    const douyinName = fields['692f976f7001b729cd1c01be'] || '';

    return { customerNo, phone, douyinName };
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          className={styles.backButton}
          onClick={onCancel}
        />
        <span className={styles.title}>{isChangeMode ? '更改客户绑定' : '关联客户'}</span>
      </div>

      <Input.Search
        className={styles.searchInput}
        placeholder="输入手机号搜索客户"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onSearch={handleSearch}
        enterButton={<SearchOutlined />}
        allowClear
        size="large"
      />

      {loading ? (
        <div className={styles.loadingMore}>
          <Spin tip="搜索中..." />
        </div>
      ) : searched && results.length === 0 ? (
        <div className={styles.noResult}>
          <Empty description="未找到匹配的客户" />
        </div>
      ) : (
        <div className={styles.searchResults}>
          {results.map((customer) => {
            const { customerNo, phone, douyinName } = getCustomerDisplay(customer);
            const isBinding = binding === customer.row_id;
            const isBound = isCustomerBound(customer);

            return (
              <div
                key={customer.row_id}
                className={`${styles.resultItem} ${isBound ? styles.resultItemDisabled : ''}`}
                onClick={() => !isBinding && !isBound && handleBind(customer)}
              >
                {isBinding ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <div className={styles.resultItemHeader}>
                      {customerNo && <span className={styles.customerNo}>客户编号: {customerNo}</span>}
                      {isBound && (
                        <Tag icon={<LinkOutlined />} color="warning" className={styles.boundTag}>
                          已有关联
                        </Tag>
                      )}
                    </div>
                    {phone && <div className={styles.phone}>手机号: {phone}</div>}
                    {douyinName && <div className={styles.info}>抖音名称: {douyinName}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
