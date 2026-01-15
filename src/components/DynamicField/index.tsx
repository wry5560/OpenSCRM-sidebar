/**
 * DynamicField - 明道云动态字段渲染组件
 * 根据字段类型动态渲染对应的表单组件
 */
import React from 'react';
import { Input, Select, DatePicker, InputNumber, Typography, Divider, Rate, Switch, Tag, Avatar } from 'antd';
import type { FieldConfig, FieldOption } from '@/pages/StaffFrontend/CustomerInfo/service';
import moment from 'moment';
import styles from './index.less';

const { Text } = Typography;
const { TextArea } = Input;

export interface DynamicFieldProps {
  field: FieldConfig;
  value: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
}

/**
 * 格式化字段值用于显示
 */
function formatDisplayValue(field: FieldConfig, value: any): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <Text type="secondary">-</Text>;
  }

  switch (field.type) {
    case 'Date':
    case 'DateTime':
      return moment(value).format(field.type === 'Date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm');

    case 'Dropdown':
      const option = field.options?.find(opt => opt.key === value);
      return option ? (
        <Tag color={option.color || 'default'}>{option.value}</Tag>
      ) : value;

    case 'MultipleSelect':
      if (Array.isArray(value)) {
        return (
          <span>
            {value.map((v: string, i: number) => {
              const opt = field.options?.find(o => o.key === v);
              return (
                <Tag key={i} color={opt?.color || 'default'} style={{ marginBottom: 4 }}>
                  {opt?.value || v}
                </Tag>
              );
            })}
          </span>
        );
      }
      return value;

    case 'Collaborator':
      if (Array.isArray(value)) {
        return (
          <span>
            {value.map((member: any, i: number) => (
              <span key={i} className={styles.collaborator}>
                <Avatar size="small" src={member.avatar}>
                  {member.fullname?.[0]}
                </Avatar>
                <span className={styles.collaboratorName}>{member.fullname}</span>
              </span>
            ))}
          </span>
        );
      }
      return value;

    case 'Number':
    case 'Money':
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return value;
      const formatted = field.precision !== undefined
        ? num.toFixed(field.precision)
        : num.toString();
      return field.unit ? `${formatted} ${field.unit}` : formatted;

    case 'Rollup':
      // 汇总字段通常是数值
      return typeof value === 'number' ? value.toLocaleString() : value;

    case 'AutoNumber':
      return <Text strong>{value}</Text>;

    case 'Rating':
      return <Rate disabled value={value} count={5} />;

    case 'Switch':
      return value ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>;

    case 'Attachment':
      if (Array.isArray(value)) {
        return (
          <span>
            {value.map((file: any, i: number) => (
              <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                {file.name || '附件'}
              </a>
            ))}
          </span>
        );
      }
      return value;

    default:
      return value?.toString() || <Text type="secondary">-</Text>;
  }
}

/**
 * 渲染可编辑的表单控件
 */
function renderEditableField(
  field: FieldConfig,
  value: any,
  onChange: (value: any) => void
): React.ReactNode {
  switch (field.type) {
    case 'Text':
      return (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`请输入${field.name}`}
          allowClear
        />
      );

    case 'RichText':
    case 'Textarea':
      return (
        <TextArea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`请输入${field.name}`}
          rows={3}
          allowClear
        />
      );

    case 'Dropdown':
      return (
        <Select
          value={value}
          onChange={onChange}
          placeholder={`请选择${field.name}`}
          allowClear
          style={{ width: '100%' }}
        >
          {field.options?.map(opt => (
            <Select.Option key={opt.key} value={opt.key}>
              {opt.color ? (
                <Tag color={opt.color} style={{ marginRight: 0 }}>{opt.value}</Tag>
              ) : opt.value}
            </Select.Option>
          ))}
        </Select>
      );

    case 'MultipleSelect':
      return (
        <Select
          mode="multiple"
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          placeholder={`请选择${field.name}`}
          allowClear
          style={{ width: '100%' }}
        >
          {field.options?.map(opt => (
            <Select.Option key={opt.key} value={opt.key}>
              {opt.color ? (
                <Tag color={opt.color} style={{ marginRight: 0 }}>{opt.value}</Tag>
              ) : opt.value}
            </Select.Option>
          ))}
        </Select>
      );

    case 'Date':
      return (
        <DatePicker
          value={value ? moment(value) : null}
          onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
          placeholder={`请选择${field.name}`}
          style={{ width: '100%' }}
        />
      );

    case 'DateTime':
      return (
        <DatePicker
          showTime
          value={value ? moment(value) : null}
          onChange={(date) => onChange(date ? date.format('YYYY-MM-DD HH:mm:ss') : '')}
          placeholder={`请选择${field.name}`}
          style={{ width: '100%' }}
        />
      );

    case 'Number':
      return (
        <InputNumber
          value={value}
          onChange={onChange}
          placeholder={`请输入${field.name}`}
          precision={field.precision}
          addonAfter={field.unit}
          style={{ width: '100%' }}
        />
      );

    case 'Money':
      return (
        <InputNumber
          value={value}
          onChange={onChange}
          placeholder={`请输入${field.name}`}
          precision={field.precision || 2}
          prefix="¥"
          style={{ width: '100%' }}
        />
      );

    case 'Rating':
      return (
        <Rate
          value={value}
          onChange={onChange}
          count={5}
        />
      );

    case 'Switch':
      return (
        <Switch
          checked={!!value}
          onChange={onChange}
        />
      );

    default:
      // 不支持的类型降级为文本显示
      return (
        <Input
          value={value?.toString() || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`请输入${field.name}`}
          allowClear
        />
      );
  }
}

/**
 * DynamicField 组件
 * 根据字段配置动态渲染表单控件或只读显示
 */
const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  readonly = false,
}) => {
  // 分隔线类型特殊处理
  if (field.type === 'Divider' || field.type === 'Section') {
    return (
      <Divider orientation="left" className={styles.divider}>
        {field.name}
      </Divider>
    );
  }

  // 只读模式或字段不可编辑
  if (readonly || !field.editable) {
    return <div className={styles.readonlyValue}>{formatDisplayValue(field, value)}</div>;
  }

  // 可编辑模式
  if (onChange) {
    return renderEditableField(field, value, onChange);
  }

  // 默认只读显示
  return <div className={styles.readonlyValue}>{formatDisplayValue(field, value)}</div>;
};

export default DynamicField;
