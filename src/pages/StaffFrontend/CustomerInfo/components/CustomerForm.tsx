import React, { useState, useCallback, useMemo } from 'react';
import { Input, Select, DatePicker, Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import moment from 'moment';
import styles from '../index.less';
import { updateCustomer, FieldConfig, CustomerInfo, UpdateField } from '../service';

interface CustomerFormProps {
  customer: CustomerInfo;
  fieldConfigs: FieldConfig[];
  onUpdateSuccess: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  fieldConfigs,
  onUpdateSuccess,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // 检查是否有修改
  const hasChanges = useMemo(() => {
    return Object.keys(formValues).length > 0;
  }, [formValues]);

  // 获取字段显示值
  const getDisplayValue = useCallback(
    (fieldId: string, fieldConfig: FieldConfig) => {
      const rawValue = customer.fields[fieldId];
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return '-';
      }

      // 下拉选项类型，显示选项文字
      if (
        (fieldConfig.type === 'Dropdown' || fieldConfig.type === 'SingleSelect') &&
        fieldConfig.options
      ) {
        const option = fieldConfig.options.find((opt) => opt.key === rawValue);
        return option?.value || rawValue;
      }

      // 多选类型
      if (fieldConfig.type === 'MultipleSelect' && fieldConfig.options) {
        if (Array.isArray(rawValue)) {
          const values = rawValue
            .map((key: string) => {
              const option = fieldConfig.options?.find((opt) => opt.key === key);
              return option?.value || key;
            })
            .filter(Boolean);
          return values.join('、') || '-';
        }
        // 如果是JSON字符串
        if (typeof rawValue === 'string') {
          try {
            const keys = JSON.parse(rawValue);
            if (Array.isArray(keys)) {
              const values = keys
                .map((key: string) => {
                  const option = fieldConfig.options?.find((opt) => opt.key === key);
                  return option?.value || key;
                })
                .filter(Boolean);
              return values.join('、') || '-';
            }
          } catch {
            // 忽略解析错误
          }
        }
        return rawValue;
      }

      // 协作者类型
      if (fieldConfig.type === 'Collaborator') {
        if (typeof rawValue === 'object' && rawValue.name) {
          return rawValue.name;
        }
        if (Array.isArray(rawValue)) {
          return rawValue.map((item: any) => item.name || item).join('、') || '-';
        }
        return rawValue;
      }

      // 日期类型
      if (fieldConfig.type === 'Date' || fieldConfig.type === 'DateTime') {
        if (rawValue) {
          return moment(rawValue).format('YYYY-MM-DD');
        }
        return '-';
      }

      return String(rawValue);
    },
    [customer]
  );

  // 获取编辑值
  const getEditValue = useCallback(
    (fieldId: string) => {
      if (fieldId in formValues) {
        return formValues[fieldId];
      }
      return customer.fields[fieldId];
    },
    [customer, formValues]
  );

  // 处理字段值变化
  const handleValueChange = useCallback((fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  // 保存修改
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      return;
    }

    setSaving(true);
    try {
      const updates: UpdateField[] = Object.entries(formValues).map(([controlId, value]) => ({
        controlId,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
      }));

      const res = await updateCustomer(customer.row_id, updates);
      if (res.code === 0) {
        setFormValues({});
        onUpdateSuccess();
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (err: any) {
      console.error('保存失败', err);
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }, [customer, formValues, hasChanges, onUpdateSuccess]);

  // 渲染字段
  const renderField = useCallback(
    (fieldConfig: FieldConfig) => {
      const { id, name, type, editable, options } = fieldConfig;

      // 只读字段
      if (!editable) {
        return (
          <div key={id} className={styles.formItem}>
            <span className={styles.label}>{name}</span>
            <div className={styles.value}>
              <span className={styles.readonlyValue}>{getDisplayValue(id, fieldConfig)}</span>
            </div>
          </div>
        );
      }

      const value = getEditValue(id);

      // 可编辑字段 - 根据类型渲染不同组件
      let inputComponent: React.ReactNode;

      switch (type) {
        case 'Dropdown':
        case 'SingleSelect':
          inputComponent = (
            <Select
              value={value}
              onChange={(val) => handleValueChange(id, val)}
              placeholder={`请选择${name}`}
              style={{ width: '100%' }}
              allowClear
            >
              {options?.map((opt) => (
                <Select.Option key={opt.key} value={opt.key}>
                  {opt.value}
                </Select.Option>
              ))}
            </Select>
          );
          break;

        case 'MultipleSelect':
          const multiValue = Array.isArray(value)
            ? value
            : typeof value === 'string'
            ? (() => {
                try {
                  return JSON.parse(value);
                } catch {
                  return [];
                }
              })()
            : [];
          inputComponent = (
            <Select
              mode="multiple"
              value={multiValue}
              onChange={(val) => handleValueChange(id, val)}
              placeholder={`请选择${name}`}
              style={{ width: '100%' }}
              allowClear
            >
              {options?.map((opt) => (
                <Select.Option key={opt.key} value={opt.key}>
                  {opt.value}
                </Select.Option>
              ))}
            </Select>
          );
          break;

        case 'Date':
        case 'DateTime':
          inputComponent = (
            <DatePicker
              value={value ? moment(value) : null}
              onChange={(date) => handleValueChange(id, date?.format('YYYY-MM-DD') || '')}
              placeholder={`请选择${name}`}
              style={{ width: '100%' }}
            />
          );
          break;

        default:
          inputComponent = (
            <Input
              value={value ?? ''}
              onChange={(e) => handleValueChange(id, e.target.value)}
              placeholder={`请输入${name}`}
            />
          );
      }

      return (
        <div key={id} className={styles.formItem}>
          <span className={styles.label}>{name}</span>
          <div className={styles.value}>{inputComponent}</div>
        </div>
      );
    },
    [getDisplayValue, getEditValue, handleValueChange]
  );

  // 按分组渲染字段
  const basicFields = fieldConfigs.slice(0, 11); // 基本信息
  const profileFields = fieldConfigs.slice(11); // 客户画像

  return (
    <Spin spinning={saving}>
      <div className={styles.formCard}>
        <div className={styles.cardTitle}>基本信息</div>
        {basicFields.map((field) => renderField(field))}
      </div>

      <div className={styles.formCard}>
        <div className={styles.cardTitle}>客户画像</div>
        {profileFields.map((field) => renderField(field))}
      </div>

      {hasChanges && (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="large"
          block
          className={styles.saveButton}
          onClick={handleSave}
          loading={saving}
        >
          保存修改
        </Button>
      )}
    </Spin>
  );
};

export default CustomerForm;
