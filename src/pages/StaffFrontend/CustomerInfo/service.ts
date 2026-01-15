import request from '@/utils/request';
import { StaffFrontendApiPrefix } from '../../../../config/constant';

// 字段配置
export interface FieldConfig {
  id: string;
  name: string;
  type: string;
  editable: boolean;
  options?: { key: string; value: string }[];
}

// 客户信息
export interface CustomerInfo {
  row_id: string;
  fields: Record<string, any>;
}

// 获取字段配置响应
export interface GetFieldConfigsResponse {
  code: number;
  message: string;
  data: {
    fields: FieldConfig[];
  };
}

// 匹配客户响应
export interface MatchCustomerResponse {
  code: number;
  message: string;
  data: {
    found: boolean;
    customer?: CustomerInfo;
  };
}

// 搜索客户响应
export interface SearchCustomersResponse {
  code: number;
  message: string;
  data: {
    items: CustomerInfo[];
    total: number;
  };
}

// 获取客户详情响应
export interface GetCustomerResponse {
  code: number;
  message: string;
  data: {
    customer: CustomerInfo;
  };
}

// 更新字段
export interface UpdateField {
  controlId: string;
  value: string;
}

// 获取字段配置
export async function getFieldConfigs(): Promise<GetFieldConfigsResponse> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/fields`, {
    method: 'GET',
  });
}

// 根据企微外部联系人ID匹配客户
export async function matchCustomer(externalUserID: string): Promise<MatchCustomerResponse> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/match`, {
    method: 'GET',
    params: { external_user_id: externalUserID },
  });
}

// 搜索客户
export async function searchCustomers(
  keyword: string,
  pageSize: number = 10,
  pageIndex: number = 1
): Promise<SearchCustomersResponse> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/search`, {
    method: 'GET',
    params: { keyword, page_size: pageSize, page_index: pageIndex },
  });
}

// 获取客户详情
export async function getCustomer(rowId: string): Promise<GetCustomerResponse> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/${rowId}`, {
    method: 'GET',
  });
}

// 更新客户信息
export async function updateCustomer(rowId: string, fields: UpdateField[]): Promise<any> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/${rowId}`, {
    method: 'PUT',
    data: { fields },
  });
}

// 绑定客户
export async function bindCustomer(
  rowId: string,
  externalUserID: string,
  staffId?: string
): Promise<any> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/${rowId}/bind`, {
    method: 'POST',
    data: { external_user_id: externalUserID, staff_id: staffId },
  });
}

// 更改客户绑定
export async function changeBinding(
  newRowId: string,
  oldRowId: string,
  externalUserID: string,
  staffId?: string
): Promise<any> {
  return request(`${StaffFrontendApiPrefix}/mingdao/customer/${newRowId}/change-binding`, {
    method: 'POST',
    data: { old_row_id: oldRowId, external_user_id: externalUserID, staff_id: staffId },
  });
}

// 等待企业微信SDK初始化完成（包括agentConfig）
function waitForWxSdk(maxRetries: number = 20, interval: number = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      // @ts-ignore
      if (window.__wxAgentConfigReady) {
        resolve();
      } else if (retries >= maxRetries) {
        reject(new Error('企业微信JSSDK初始化超时'));
      } else {
        retries++;
        setTimeout(check, interval);
      }
    };
    check();
  });
}

// 获取当前聊天的外部联系人ID
export async function getExternalContact(): Promise<string> {
  // 先等待SDK加载完成
  await waitForWxSdk();

  return new Promise((resolve, reject) => {
    // @ts-ignore
    window.wx.invoke('getCurExternalContact', {}, (res: any) => {
      if (res.err_msg === 'getCurExternalContact:ok') {
        resolve(res.userId);
      } else {
        reject(new Error(res.err_msg || '获取外部联系人失败'));
      }
    });
  });
}
