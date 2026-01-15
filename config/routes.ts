export default [
  {
    path: '/',
    component: '../layouts/BlankLayout',
    routes: [
      // 公开路由
      {
        name: '员工登录',
        path: '/login',
        component: './StaffFrontend/Login/index',
      },
      {
        path: '/login-callback',
        routes: [
          {
            name: '员工登录回调',
            path: '/login-callback',
            component: './StaffFrontend/Login/callback',
          },
        ],
      },
      {
        path: '/',
        exact: true,
        redirect: '/login',
      },

      // 侧边栏员工登录后授权路由
      {
        name:'侧边栏员工登录后授权路由',
        path: '/',
        component: '../layouts/StaffFrontendSecurityLayout',
        routes: [
          {
            path: '/',
            component: '../layouts/BasicLayout',
            routes: [
              {
                path: '/',
                exact: true,
                redirect: '/customer-info',
              },
              {
                path: '/customer-info',
                name: '客户信息',
                component: './StaffFrontend/CustomerInfo/index',
              },
              {
                name: '话术库',
                path: '/script-library',
                component: './StaffFrontend/ScriptLibrary/index',
              },
              {
                name: '素材库',
                path: '/material-library',
                component: './StaffFrontend/MaterialLibrary/index',
              },
              {
                path: '/welcome',
                name: '首页',
                component: './Welcome',
              },
              {
                component: './404',
              },
            ],
          },
          {
            component: './404',
          },
        ],
      },

      //缺省路由
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
];
