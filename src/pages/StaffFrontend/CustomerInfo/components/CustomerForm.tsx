import React, { useState, useCallback, useMemo } from 'react';
import { Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import styles from '../index.less';
import { updateCustomer, FieldConfig, CustomerInfo, UpdateField } from '../service';
import DynamicField from '@/components/DynamicField';

interface CustomerFormProps {
  customer: CustomerInfo;
  fieldConfigs: FieldConfig[];
  onUpdateSuccess: () => void;
}

/**
 * 将字段列表按 Divider/Section 类型分组
 */
function groupFieldsBySections(fields: FieldConfig[]): {
  title: string;
  fields: FieldConfig[];
}[] {
  const sections: { title: string; fields: FieldConfig[] }[] = [];
  let currentSection: { title: string; fields: FieldConfig[] } = {
    title: '基本信息',
    fields: [],
  };

  fields.forEach((field) => {
    if (field.type === 'Divider' || field.type === 'Section') {
      // 保存当前分组（如果有字段）
      if (currentSection.fields.length > 0) {
        sections.push(currentSection);
      }
      // 开始新分组
      currentSection = {
        title: field.name,
        fields: [],
      };
    } else {
      currentSection.fields.push(field);
    }
  });

  // 保存最后一个分组
  if (currentSection.fields.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  fieldConfigs,
  onUpdateSuccess,
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // 按分隔符分组字段
  const sections = useMemo(() => groupFieldsBySections(fieldConfigs), [fieldConfigs]);

  // 检查是否有修改
  const hasChanges = useMemo(() => {
    return Object.keys(formValues).length > 0;
  }, [formValues]);

  // 获取字段值（优先使用编辑中的值，其次使用客户数据）
  const getFieldValue = useCallback(
    (field: FieldConfig) => {
      // 如果有编辑中的值，使用编辑值
      if (field.id in formValues) {
        return formValues[field.id];
      }

      // 尝试用字段ID获取原始值
      let rawValue = customer.fields[field.id];

      // 如果没有，尝试用别名获取
      if ((rawValue === null || rawValue === undefined) && field.alias) {
        rawValue = customer.fields[field.alias];
      }

      // 处理明道云返回的特殊格式
      if (rawValue !== null && rawValue !== undefined) {
        // Dropdown 可能返回 [{key, value}] 格式
        if ((field.type === 'Dropdown' || field.type === 'SingleSelect') &&
            Array.isArray(rawValue) && rawValue.length > 0 && rawValue[0]?.key) {
          return rawValue[0].key;
        }
        // MultipleSelect 可能返回 [{key, value}] 格式
        if (field.type === 'MultipleSelect' &&
            Array.isArray(rawValue) && rawValue.length > 0 && rawValue[0]?.key) {
          return rawValue.map((item: any) => item.key);
        }
      }

      return rawValue;
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
        value: Array.isArray(value)
          ? JSON.stringify(value)
          : typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : String(value ?? ''),
      }));

      const res = await updateCustomer(customer.row_id, updates);
      if (res.code === 0) {
        message.success('保存成功');
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

  // 渲染单个字段
  const renderField = useCallback(
    (field: FieldConfig) => {
      const value = getFieldValue(field);
      const isEditable = field.editable;

      return (
        <div key={field.id} className={styles.formItem}>
          <span className={styles.label}>{field.name}</span>
          <div className={styles.value}>
            <DynamicField
              field={field}
              value={value}
              onChange={isEditable ? (val) => handleValueChange(field.id, val) : undefined}
              readonly={!isEditable}
            />
          </div>
        </div>
      );
    },
    [getFieldValue, handleValueChange]
  );

  return (
    <Spin spinning={saving}>
      {sections.map((section, index) => (
        <div key={index} className={styles.formCard}>
          <div className={styles.cardTitle}>{section.title}</div>
          {section.fields.map((field) => renderField(field))}
        </div>
      ))}

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
