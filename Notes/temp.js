import { defaultComParams, request } from '@/utils/request';

export const TableQueryParams = {
  id: 'equals',
  labelName: 'equals',
  status: 'equals',
  category: 'equals',
  classify: 'equals',
};

export function fiterQueryRule(params: any) {
  const keys = typeof params === 'object' ? Object.keys(params) : [];
  if (keys.length <= 0) {
    return [];
  }
  let newParams: any = {
    page: params.current - 1,
    size: params.pageSize,
    filter: params.filter,
    sorter: params.sorter,
    ...params,
  };
  delete newParams.current;
  delete newParams.pageSize;
  let columnCondition: any = TableQueryParams;
  keys.forEach((kk) => {
    if (Object.keys(columnCondition).includes(kk)) {
      newParams[`${kk}.${columnCondition[kk]}`] = params[kk];
    }
  });
  if (newParams.productName) {
    delete newParams.productName;
  }
  if (newParams.productRemark) {
    delete newParams.productRemark;
  }
  return newParams;
}

/** 获取当前的用户 */
export async function currentUser(options?: { [key: string]: any }) {
  return request<API.CurrentUser>('/api/sys-user-manage/fetch-current-user', {
    method: 'GET',
    ...(options || {}),
  });
}

// export async function currentUserMenu(options?: { [key: string]: any }) {
//   const { companyCode, manageCom } = defaultComParams;
//   const remoteData = await request('/api/sys-menus-list', {
//     method: 'GET',
//     params: {
//       'companyCode.equals': companyCode || 'A86',
//       'manageCom.contains': manageCom || 'A86',
//       size: 20
//     }
//   });

//   // console.log('remoteData', remoteData);
//   const levelOneRoutes = remoteData.filter(item => item.menuType === '0').map(item => {
//     let children = remoteData.filter(son => son.pMenuCode === item.menuCode).map(sonRoute => ({
//       name: sonRoute.menuName,
//       path: sonRoute.address,
//       hideInMenu: sonRoute.seqNo == '-1' ? true : false,
//     }))
//     return {
//       name: item.menuName,
//       path: item.address,
//       icon: item.icons,
//       routes: children,
//     };
//   });
//   return Promise.resolve(levelOneRoutes);

// }

/** 获取当前用户菜单 */
export async function currentUserMenu(roles: any) {
  if (!roles) {
    return Promise.resolve({
      menu: [],
      button: [],
    });
  }
  const { companyCode, manageCom } = defaultComParams;
  // console.log('defaultComParams:',defaultComParams);
  const remoteData = await request(`/api/user-menus-list/${roles}`, {
    method: 'GET',
    params: {
      'companyCode.equals': companyCode || 'A86',
      'manageCom.contains': manageCom || 'A86',
      size: 20,
    },
  });
  const routeSetting = (route) => {
    const {
      menuCode,
      menuName,
      menuNameEn: name,
      address: path,
      icons: icon,
      hideInMenu,
      showHeaderReder: headerRender,
      showFooterRender: footerRender,
      showMenuHeaderRender: menuHeaderRender,
      showMenuRender: menuRender,
      fixedHeader,
      fixSiderbar,
      navTheme,
      layout,
      headerTheme,
    } = route;
    return {
      name,
      path,
      icon,
      menuCode,
      menuName,
      fixedHeader: Boolean(fixedHeader != 0),
      fixSiderbar: Boolean(fixSiderbar != 0),
      hideInMenu: hideInMenu == '1' ? true : false,
      navTheme,
      layout,
      headerTheme,
    };
  };

  // console.log('remoteData', remoteData);
  const levelOneRoutes = remoteData
    .filter((item) => item.pMenuCode === '0')
    .map((item) => {
      let children = remoteData
        .filter((son) => son.pMenuCode === item.menuCode)
        .map((sonRoute) => {
          return routeSetting(sonRoute);
        });
      let newRoute = routeSetting(item);
      return {
        ...newRoute,
        routes: children,
      };
    });

  const buttons = remoteData
    .filter((item) => item.menuType === '03')
    .map((item) => item.menuCode);
  // console.log('levelOneRoutes:',levelOneRoutes)
  return Promise.resolve({
    menu: levelOneRoutes,
    button: buttons,
  });
}

/** 退出登录接口 POST*/
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST */
export async function login(
  body: API.LoginParams,
  options?: { [key: string]: any },
) {
  return request<API.LoginResult>('/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

// 验证码
export async function getVerifyImg() {
  return request('/api/users/getcheckcode', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// 获取角色
export async function getUserRole() {
  return request('/clouddev/api/dev-roles/getAllRolesByLogin?login=admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// 数据字典查询
export async function codequery(body: { [key: string]: any }) {
  const data = {
    branchType: sessionStorage.getItem('branchType') || '01',
    branchType2: sessionStorage.getItem('branchType2') || '01',
    companyCode: sessionStorage.getItem('company') || 'A86',
    manageCom: sessionStorage.getItem('managecom') || 'A86',
  };
  // 智营演示数据暂时未代理
  if (
    String(body?.codeType).startsWith('ais') ||
    String(body?.codeType) == 'publicFlag' ||
    String(body?.codeType) == 'validType'
  ) {
    return [];
  }
  let res = await request('/api/lt-code-selects/codequery', {
    method: 'POST',
    data: { ...data, ...body },
  });
  return res;
  // return res.map((item:any)=>({
  //   item.codeValue:{text:item.codeName,}
  // }));
}

// 数据字典查询数组
export async function codeQueryOptions(type: string) {
  const body = {
    branchType: sessionStorage.getItem('branchType') || '01',
    branchType2: sessionStorage.getItem('branchType2') || '01',
    codeType: type,
    companyCode: sessionStorage.getItem('company') || 'A86',
    manageCom: sessionStorage.getItem('managecom') || 'A86',
  };

  let result = await request('/api/lt-code-selects/codequery', {
    method: 'POST',
    data: body,
  });

  return result.map((item: any) => ({
    label: item.codeName,
    value: item.codeValue,
  }));
}
// 8.26:8081
// 数据字典高级查询
export async function advancedCodeQuery(types: string) {
  let result = await request(
    '/api/mobile/sys-code-selects/advance-code-query',
    {
      method: 'GET',
      params: {
        codeTypeString: types,
      },
    },
  );
  return result;
}

export async function changePassword(body: any) {
  return request('/api/account/change-password', {
    method: 'POST',
    data: {
      ...body,
      // ...defaultComParams,
    },
  });
}

// 获取登录二维码链接
export async function getLoginUrl() {
  return request('/scan/getScanUrl', {
    method: 'get',
  });
}

// 获取二维码状态
export async function getScanAuthState(params: any) {
  return request('/scan/getScanAuthState', {
    method: 'get',
    params,
  });
}

// 获取二维码状态
export async function saveScanAuthState(params: any) {
  return request('/scan/saveScanAuthState', {
    method: 'get',
    params,
  });
}

// 获取osstoken
export async function getCredential() {
  return request('/api/mobile/credential', {
    method: 'get',
  });
}

// 上传文件
export async function getUrlByKey(params: any) {
  return request('/api/mobile/getUrlByKey', {
    method: 'get',
    params,
  });
}

// 图片以及表单上传
export async function formdata(values: any) {
  // const data = values;
  // if (Array.isArray(data)) {
  //   // 数组里每个对象增加这几个信息
  //   Object.keys(data).map(key => {
  //     data[key] = data[key];
  //     if (data[key].manageCom === undefined) {
  //       data[key].manageCom = sessionStorage.getItem('managecom');
  //     }
  //     if (data[key].branchType === undefined) {
  //       data[key].branchType = '01';
  //     }
  //     data[key].companyCode = sessionStorage.getItem('company');
  //     data[key].branchType2 = '01';
  //     data[key].createdBy = sessionStorage.getItem('user');
  //     data[key].createdDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
  //     data[key].lastModifiedBy = sessionStorage.getItem('user');
  //     data[key].lastModifiedDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
  //     return data;
  //   });
  // } else {
  //   if (data.manageCom === undefined) {
  //     data.manageCom = sessionStorage.getItem('managecom');
  //   }
  //   if (data.branchType === undefined) {
  //     data.branchType = '01';
  //   }
  //   data.companyCode = sessionStorage.getItem('company');
  //   data.branchType2 = '01';
  //   data.createdBy = sessionStorage.getItem('user');
  //   data.createdDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
  //   data.lastModifiedBy = sessionStorage.getItem('user');
  //   data.lastModifiedDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
  // }

  // // 输入框的前后空格去掉
  // const trimData = data;
  // Object.keys(data).map(key => {
  //   if (typeof data[key] === 'string') {
  //     trimData[key] = data[key].trim();
  //   }
  //   return trimData;
  // });

  // return request('/api/ais-pro-infos-formdata', {
  //   method: 'POST',
  //   body: trimData,
  // });
  return request('/api/ais-pro-infos-formdata', {
    method: 'POST',
    data: values,
  });
}

/* 获取部门树形结构数据 */
export async function getManagecomTreeData() {
  const body = {
    branchType: '01',
    branchType2: '01',
    createdBy: sessionStorage.getItem('user'),
    lastModifiedBy: sessionStorage.getItem('user'),
  };
  return Promise.resolve([]);
  return request('/api/lt-managecoms/treenodes', {
    method: 'POST',
    data: {
      ...body,
      ...defaultComParams,
    },
  });
}


import sueccess from '@/assets/byd/e-lms/success.svg';
import wariningSvg from '@/assets/byd/e-lms/warning.svg';
import { getLoginUrl } from '@/services/api';
import { message } from 'antd';
import QRCode from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useIntl, useModel } from 'umi';

const QRCodeScanner = () => {
  // let qrCodeUrl = null
  const intl = useIntl();
  const [isExpired, setIsExpired] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { qrcodeInterval, setQrCodeInterval } = useModel('index');
  const { deviceId, setDeviceId } = useModel('index');
  const { qrcode, setQrcode } = useModel('index');
  // const url = 'http://192.168.8.197:8001/pc/errorQrcode?bankurl=https://weixin.byd.com/app/login?deviceid=6489624b2b0d441480b8d1de003203ca&appid=bb71686b76c945899b6e03bc3c869fda'
  const getLoginLink = async () => {
    getLoginUrl()
      .then((res) => {
        console.log('获取二维码link～～～', res);
        if (res.data && res.data.url) {
          setQrCodeInterval(true);
          setQrCodeUrl(res.data.url);
          setDeviceId(res.data.deviceId);
        } else {
          setQrCodeInterval(false);
          message.error('获取二维码链接失败');
        }
      })
      .catch((err) => {
        setQrCodeInterval(false);
        message.error('获取二维码链接失败');
      });
  };

  const refreshQrCode = () => {
    // 清除过期状态，并重新获取二维码 URL
    setIsExpired(false);
    getLoginLink();
    setQrcode('4');
    // fetchQrCodeUrl().then(url => {
    // setQrCodeUrl(url);
    // });
  };
  useEffect(() => {
    getLoginLink();
  }, []);

  useEffect(() => {
    if (qrcode == '1' || qrcode == '2' || qrcode == '3') {
      setIsExpired(true);
    }
    // getLoginLink()
  }, [qrcode]);
  // // 生成一个包含后端接收扫描事件的URL的二维码
  // const qrCodeUrl = 'https://e-lms-uat.byd.com/pc/user/login';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img
          src="https://wwcdn.weixin.qq.com/node/wework/images/WWLogo.04d21e9183.svg"
          style={{ marginRight: '8px' }}
        ></img>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '16px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '24px',
            margin: '40px 0',
          }}
        >
          企业微信扫码登录
        </h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <QRCode
          value={qrCodeUrl}
          size={210}
          // style={{margin: '0 auto'}}
          fgColor="#000000"
          bgColor="#FFFFFF"
          level="L"
          renderAs="svg"
        />
        {isExpired && (
          <div
            style={{
              // position: 'absolute',
              top: 0,
              left: 0,
              width: '210px',
              height: '210px',
              marginLeft: '-210px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // 白色背景，50% 不透明度
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 200,
            }}
            onClick={refreshQrCode}
          >
            {qrcode == '1' || qrcode == '2' ? (
              <img
                src={sueccess}
                width={40}
                height={40}
                style={{ marginBottom: '10px' }}
                alt="加载失败"
              />
            ) : (
              <img
                src={wariningSvg}
                width={40}
                height={40}
                style={{ marginBottom: '10px' }}
                alt="加载失败"
              />
            )}

            <span
              style={{
                color: '#000', // 文字颜色改为黑色，以便在白色背景下可见
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: '400',
                lineHeight: '140%',
              }}
            >
              {qrcode == '1' || qrcode == '2' ? '已扫码' : '二维码已失效'}
            </span>
            <span
              style={{
                color: '#417ce8', // 文字颜色改为黑色，以便在白色背景下可见
                fontSize: '14px',
                fontStyle: 'normal',
                marginTop: '10px',
                fontWeight: '400',
                lineHeight: '140%',
              }}
            >
              刷新
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: '14px',
          fontStyle: 'normal',
          fontWeight: '400',
          marginTop: '24px',
          marginBottom: '59px',
          lineHeight: '140%',
          color: 'var(--ww_base_gray_060, rgba(11, 18, 26, .6))',
        }}
      >
        请使用企业微信二维码扫码登录
      </div>
    </div>
  );
};

export default QRCodeScanner;



import {
    accountLogin,
    accountLogout,
    getLoginMessage,
    getVerifyImg,
  } from '@/services/home';
  import {
    IndexLocation,
    langMap,
    navigateTo,
    removeToken,
    setSession,
    setToken,
  } from '@/utils/common';
  import {
    LoadingOutlined,
    LockOutlined,
    SafetyOutlined,
    UserOutlined,
  } from '@ant-design/icons';
  import { useGetState } from 'ahooks';
  import {
    Button,
    Checkbox,
    Form,
    Input,
    message,
    Modal,
    Select,
    Space,
  } from 'antd';
  import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
  import { getLocale, history, useIntl, useModel } from 'umi';
  
  import Lang from '@/components/Lang';
  import BrazilPrivacyPolicy from '@/pages/student/cookies/brazil';
  import MexicoPrivacyPolicy from '@/pages/student/cookies/mexico';
  import ChangePasswordBox from '@/pages/user/components/ChangePassword';
  import { getScanAuthState } from '@/services/api';
  import PrivacyContext from '../privacy/index';
  import Cookies from './cookies/cookies';
  import Forgotpassword from './forgotpassword';
  import styles from './login.less';
  import LoginJT from './loginJT';
  import LoginWeCom from './LoginWeCom';
  
  const { Option } = Select;
  
  interface Lparams {
    title?: string;
  }
  
  const LoginComPage = (props: Lparams) => {
    const intl = useIntl();
    const { setUserInfo } = useModel('user');
    const [agreementChecked, setAgreementChecked] = useState<boolean>(true);
    const [openChangeVisible, setOpenChangeVisible] = useGetState(false);
    const latestQueryTime = useRef(0);
    const [verifyLoading, setVerfyLoading] = useState(false);
    const [loginType, setLoginType] = useState(false);
  
    const [isJTLogin, setIsJTLogin] = useState(false); //集团二维码
    const [drawerBottomOpen, setDrawerBottomOpen] = useState(false); // 底部弹窗
    const [changeSettings, setChangeSettings] = useState(false); // 修改设置弹窗
    const currentUrl = window.location.href; // 当前地址
    const curHostname = window.location.hostname; //当前域名
    const { deviceId, setDeviceId } = useModel('index');
    const {
      qrcodeInterval,
      setQrCodeInterval,
      setLoginManegeType,
      loginManegeType,
    } = useModel('index');
  
    // 协议规则： 点击拒绝，cookies协议关闭，输入完账号密码，点击登录，再次弹出，如果还是点击拒绝cookies继续弹出，只有点击同意才可以登录
    const loginTypeList = [
      {
        mode: 'mobile',
        title: intl.formatMessage({
          id: 'login.type.mobile',
          defaultMessage: '手机号登录',
        }),
      },
      {
        mode: 'email',
        title: intl.formatMessage({
          id: 'login.type.email',
          defaultMessage: '用户名登录',
        }),
      },
    ];
  
    const [open, setOpen] = useState(false);
    // 隐私弹出框
    const [privacyShow, setPrivacyShow] = useState(false);
  
    const { title } = props;
  
    const [loginForm] = Form.useForm();
    const [loginMode, setLoginMode] = useState('email');
    const { qrcode, setQrcode } = useModel('index');
    const [phoneType, setPhoneType] = useState<'code' | 'password'>('password');
    const [loading, setLoading] = useState<boolean>(false);
    const [country, setCountry] = useState<
      { codeName: string; codeValue: string }[]
    >([{ codeName: 'default', codeValue: '01' }]);
  
    const [verifyState, setVerifyState] = useState({
      imgBytes:
        'data:image/jpg;base64,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',
      uuid: '',
    });
    console.log('curHostname: ', curHostname);
    let fileNameLang = intl.formatMessage({
      id: 'login.agreement.filename',
      defaultMessage: '协议名称',
    });
    let filePrefix = intl.formatMessage({
      id: 'login.agreement.readandagree',
      defaultMessage: '协议阅读',
    });
    let agreementConfirm = intl.formatMessage({
      id: 'login.agreement.confirm',
      defaultMessage: '协议确认',
    });
  
    useEffect(() => {
      removeToken();
      getVerify();
      let timer = setInterval(() => {
        console.log('latestQueryTime:', latestQueryTime.current);
        if (new Date().getTime() - latestQueryTime.current > 50000) {
          getVerify();
        }
      }, 60 * 1000);
      return () => {
        clearInterval(timer);
      };
    }, []);
  
    // 二维码返回登录
    const ssoLogin = useCallback(async (values: any) => {
      console.log('微信回来登录');
      try {
        const response = await accountLogin(values);
        console.log('登录返回信息', response);
        if (response?.access_token) {
          setToken(response?.access_token);
          let response2 = await getLoginMessage({});
          console.log('返回个人信息', response2);
          const { code, id_token, sys_student, currentBranchType, initial } =
            response2;
          if (code !== 'SUCCESS') {
            message.error(response2?.message);
            // getVerify();
          } else {
            setToken(id_token);
            // userInfo session model 透传用，勿删 2023/12/26
            setSession('userInfo', {
              currentBranchType,
              initial,
              ...sys_student,
            });
            setUserInfo({
              user: sys_student,
              role: 'student',
              currentBranchType: currentBranchType,
              initial,
            });
            setTimeout(() => {
              // setLoading(false);
              navigateTo('index');
              setQrcode('4');
            }, 100);
          }
        }
      } catch (error) {
        // 处理错误的情况
        message.error('请求登录失败');
        console.error('登录失败:', error);
      }
    }, []);
    useEffect(() => {
      let interval: any;
      let timeoutId: any;
  
      if (!loginType || !isJTLogin || !qrcodeInterval) {
        // 不在集团二维码清除定时器
        if (interval) {
          clearInterval(interval);
          clearTimeout(timeoutId);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } else {
        const param = {
          deviceId: deviceId,
        };
  
        // 每秒获取二维码状态
        const getScanUrlStatus = async () => {
          try {
            console.log('元神定时启动');
            // 获取二维码状态
            const response = await getScanAuthState(param);
            if (response.flg === 'success' && response.data) {
              if (response.data.state === '1') {
                console.log('已扫码未登录');
                setQrcode(response.data.state);
              } else if (response.data.state === '2') {
                console.log('已登录');
                clearInterval(interval);
                clearTimeout(timeoutId);
                const param = {
                  username: response.data.userId,
                  code: response.data.userId,
                  token: response.data.token,
                  appid: response.data.appid,
                };
                ssoLogin(param);
              }
            } else {
              setQrcode('4');
              // setIsError(true);
              clearInterval(interval);
              clearTimeout(timeoutId); // 清除超时定时器
            }
          } catch (error) {
            console.error('Error fetching data:', error);
            setQrcode('4');
            // setIsError(true);
            clearInterval(interval);
            clearTimeout(timeoutId); // 清除超时定时器
          }
        };
  
        // 设置定时器，每秒调用一次 getScanUrlStatus 函数
        interval = setInterval(getScanUrlStatus, 1000);
        // 当两分钟分钟过去后，清除定时器
        timeoutId = setTimeout(() => {
          setQrcode('3');
          clearInterval(interval);
        }, 120 * 1000);
  
        // 清理函数，当组件卸载时清除定时器
        return () => {
          clearInterval(interval);
          clearTimeout(timeoutId);
        };
      }
    }, [deviceId, loginType, isJTLogin, qrcodeInterval]);
  
    useEffect(() => {
      accountLogout();
      const bodyElement = document.body;
      if (getLocale() == 'zh-CN') {
        bodyElement.style.fontFamily = 'PingFang SC';
      } else if (getLocale() == 'en-US') {
        bodyElement.style.fontFamily = 'Calibri, san francisco';
      }
    }, [getLocale()]);
  
    // qrCode 扫描状态
    useEffect(() => {
      accountLogout();
      const bodyElement = document.body;
      if (getLocale() == 'zh-CN') {
        bodyElement.style.fontFamily = 'PingFang SC';
      } else if (getLocale() == 'en-US') {
        bodyElement.style.fontFamily = 'Calibri, san francisco';
      }
    }, []);
  
    // cookies 协议是否展示
    useEffect(() => {
      let pc_cookie_policy_Allow = localStorage.getItem(
        curHostname + '_pc_cookie_policy_Allow',
      );
  
      if (
        pc_cookie_policy_Allow != null &&
        pc_cookie_policy_Allow != undefined &&
        pc_cookie_policy_Allow != ''
      ) {
        setDrawerBottomOpen(false);
      } else {
        // 亚太不弹
        // if (
        //   currentUrl.includes('d-lms-sg-uat.byd.com') ||
        //   currentUrl.includes('sg-academy.byd.com') ||
        //   currentUrl.includes('d-lms-sg-sit.byd.com')
        //   // ||
        //   // currentUrl.includes('localhost')
        // ) {
        //   console.log('cookies没有弹出', currentUrl);
        //   setDrawerBottomOpen(false);
        // } else {
        console.log('cookies弹出了', currentUrl);
        setDrawerBottomOpen(true);
        // }
      }
    }, []);
  
    // cookies底部弹窗
    const drawerOnClose = () => {
      setDrawerBottomOpen(false);
    };
  
    const onFinish = async (values: any) => {
      let pc_cookie_policy_Allow = localStorage.getItem(
        curHostname + '_pc_cookie_policy_Allow',
      );
      console.log('pc_cookie_policy_Allow登录点击', pc_cookie_policy_Allow);
  
      if (
        pc_cookie_policy_Allow == '' ||
        pc_cookie_policy_Allow == null ||
        pc_cookie_policy_Allow == undefined
      ) {
        setDrawerBottomOpen(true); // 发现没有同意协议 再次弹出
        return false;
      }
      // if (
      //   !currentUrl.includes('d-lms-sg-uat.byd.com') &&
      //   !currentUrl.includes('sg-academy.byd.com') &&
      //   !currentUrl.includes('d-lms-sg-sit.byd.com')
      // ) {
      //   if (
      //     pc_cookie_policy_Allow == '' ||
      //     pc_cookie_policy_Allow == null ||
      //     pc_cookie_policy_Allow == undefined
      //   ) {
      //     setDrawerBottomOpen(true); // 发现没有同意协议 再次弹出
      //     return false;
      //   }
      // }
  
      if (!agreementChecked) {
        message.error(`${agreementConfirm}-${fileNameLang}`);
        return false;
      }
      setLoading(true);
      // console.log('value:', values);
      // values.password = btoa(values.password);
      values.uuid = verifyState.uuid;
      values.role = 'student';
      values.password = btoa(values.password);
      // console.log('values:', values);
      try {
        let res = await accountLogin({ ...values });
        console.log('res------', res);
        if (res?.access_token) {
          setToken(res?.access_token);
          let res2 = await getLoginMessage({});
          const { code, id_token, sys_student, currentBranchType, initial } =
            res2;
          if (code !== 'SUCCESS') {
            message.error(res?.message);
            getVerify();
          } else {
            setToken(id_token);
            // userInfo session model 透传用，勿删 2023/12/26
            setSession('userInfo', {
              currentBranchType,
              initial,
              ...sys_student,
            });
            setUserInfo({
              user: sys_student,
              role: 'student',
              currentBranchType: currentBranchType,
              initial,
            });
            if (initial == 'Y') {
              // history.push('/user/modification');
              setOpenChangeVisible(true);
              setLoading(false);
              getVerify();
            } else {
              // 登录成功响应提示 2024.01.30
              // message.success(res?.message);
              setTimeout(() => {
                setLoading(false);
                history.push(IndexLocation);
              }, 1000);
            }
          }
        } else {
          message.error(res?.message);
          getVerify();
        }
        return;
      } catch (e: any) {
        // 用户名密码错误提示
        if (e?.code == 'ERR_BAD_REQUEST' && e?.response?.data?.detail) {
          message.error(e?.response?.data?.detail);
        }
        getVerify();
        setLoading(false);
        console.log('e---', e);
      }
      setLoading(false);
    };
  
    const getVerify = async () => {
      setVerfyLoading(true);
      getVerifyImg()
        .then((res) => {
          // console.log('verify res:', res);
          if (res.result == 'SUCCESS') {
            latestQueryTime.current = new Date().getTime();
            // 清空上一个验证码输入
            loginForm.setFieldsValue({
              checkCode: '',
            });
  
            setVerifyState({
              ...verifyState,
              imgBytes: `data:image/jpg;base64,${res.imgBytes}`,
              uuid: res.uuid,
            });
          } else {
            message.error(
              intl.formatMessage({
                id: 'login.error.verifyCode',
                defaultMessage: '获取验证码失败',
              }),
            );
          }
          setVerfyLoading(false);
        })
        .catch((err) => {
          message.error(
            intl.formatMessage({
              id: 'login.error.verifyCode',
              defaultMessage: '获取验证码失败',
            }),
          );
        });
    };
  
    const linkList = (type: string, param: object) => {
      // history.push({
      //   pathname:
      //     type == '1' ? '/user/register' : type == '2' ? '/user/retrieve' : '/',
      // });
      setOpen(true);
    };
  
    let lanItems = Object.entries(langMap).map((item) => ({
      key: item[0],
      label: item[1],
    }));
  
    const child = useMemo(
      () => <Forgotpassword open={open} onCancel={() => setOpen(false)} />,
      [open],
    );
    localStorage.setItem(curHostname + '_pc_cookie_policy_Allow', 'AllowAll');
  
    // 显示二维码
    const changeLoginType = () => {
      setLoginType(!loginType);
    };
    // 汽车登录二维码
    const toQrCodeLogin = (type) => {
      if (!loginType) {
        setLoginType(!loginType);
      }
      setIsJTLogin(false);
      setLoginManegeType(type);
    };
    //集团登录二维码
    const toQrCodeLoginJT = () => {
      if (!loginType) {
        setLoginType(!loginType);
      }
      setIsJTLogin(true);
      setLoginManegeType('');
    };
    // const qrLogin = false
    return (
      <div className={styles['content']}>
        <div className={styles['langChangeBox']}>
          <Lang />
        </div>
        <div className={styles['title-english']}>HELLO</div>
        <div className={styles['system-title']}>
          <span>
            {/* {intl.formatMessage({ id: 'login.welcome', defaultMessage: '欢迎' })} */}
            {intl.formatMessage({
              id: 'login.welcome.TJtitle',
              defaultMessage: '使用培训学习平台',
            })}
            &nbsp;
          </span>
        </div>
        <div className={styles['login-content']}>
          {/* 登录方式 */}
          {loginType ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isJTLogin ? <LoginJT></LoginJT> : <LoginWeCom />}
              {/* <LoginJT ></LoginJT>
              <LoginWeCom /> */}
            </div>
          ) : (
            // <LoginWeCom /> :
            <Form
              form={loginForm}
              name="basic"
              layout="vertical"
              // labelCol={{ span: 8 }}
              // wrapperCol={{ span: 16 }}
              // initialValues={{ remember: true }}
              onFinish={onFinish}
              // onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              {loginMode == 'mobile' ? (
                <>
                  <Form.Item
                    label="手机号"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: '请输入正确的手机号',
                        pattern: new RegExp(/^1(3|4|5|6|7|8|9)\d{9}$/, 'g'),
                      },
                    ]}
                  >
                    <Input placeholder="请输入手机号" bordered={false} />
                  </Form.Item>
  
                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password placeholder="请输入密码" bordered={false} />
                  </Form.Item>
                </>
              ) : (
                <>
                  {/* 国家选择 */}
                  {/* <Form.Item
                  label={intl.formatMessage({
                    id: 'login.country',
                    defaultMessage: '站点',
                  })}
                  name="country"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'login.country.placeholder',
                        defaultMessage: '请选择国家',
                      }),
                    },
                  ]}
                >
                  <Select
                    placeholder={intl.formatMessage({
                      id: 'login.country.placeholder',
                      defaultMessage: '请选择国家',
                    })}
                  >
                    {country.map((item) => (
                      <Option key={item.codeName} value={item.codeValue}>
                        {item.codeName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item> */}
                  {/* 邮箱登录 */}
                  {/* <Form.Item
                  label={intl.formatMessage({
                    id: 'login.email',
                    defaultMessage: '邮箱',
                  })}
                  name="eMail"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'login.email.placeholder',
                        defaultMessage: '请输入邮箱',
                      }),
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className="site-form-item-icon" />}
                    bordered={false}
                    placeholder={intl.formatMessage({
                      id: 'login.email.placeholder',
                      defaultMessage: '请输入邮箱',
                    })}
                  />
                </Form.Item> */}
                  <Form.Item
                    label={intl.formatMessage({
                      id: 'login.account',
                      defaultMessage: '用户名',
                    })}
                    name="eMail"
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'login.account.placeholder',
                          defaultMessage: '请输入帐号',
                        }),
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="site-form-item-icon" />}
                      bordered={false}
                      placeholder={intl.formatMessage({
                        id: 'login.account.placeholder',
                        defaultMessage: '请输入帐号',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({
                      id: 'login.password',
                      defaultMessage: '密码',
                    })}
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'login.password.placeholder',
                          defaultMessage: '密码',
                        }),
                      },
                      {
                        min: 6,
                        message: intl.formatMessage({
                          id: 'login.password.length',
                          defaultMessage: '密码长度最少6位',
                        }),
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="site-form-item-icon" />}
                      bordered={false}
                      placeholder={intl.formatMessage({
                        id: 'login.password.placeholder',
                        defaultMessage: '密码',
                      })}
                    />
                  </Form.Item>
                  <Form.Item
                    label={intl.formatMessage({
                      id: 'login.verifycode',
                      defaultMessage: '验证码',
                    })}
                    required
                  >
                    <Space className={styles.checkcode_box}>
                      <Form.Item
                        name="checkCode"
                        rules={[
                          {
                            required: true,
                            message: intl.formatMessage({
                              id: 'login.verifycode.placeholder',
                              defaultMessage: '请输入验证码',
                            }),
                          },
                        ]}
                      >
                        <Input
                          style={{ flex: '1 1', minWidth: '300px' }}
                          prefix={
                            <SafetyOutlined className="site-form-item-icon" />
                          }
                          bordered={false}
                          placeholder={intl.formatMessage({
                            id: 'login.verifycode.placeholder',
                            defaultMessage: '请输入验证码',
                          })}
                        />
                      </Form.Item>
                      {verifyLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <img
                          src={verifyState.imgBytes}
                          style={{ width: 75, marginTop: 10 }}
                          onClick={() => {
                            getVerify();
                          }}
                        />
                      )}
                    </Space>
                  </Form.Item>
                </>
              )}
  
              <div className={styles['login-change']}>
                <div
                  onClick={() =>
                    setPhoneType(phoneType == 'password' ? 'code' : 'password')
                  }
                >
                  {/* <span>{phoneType == 'password' ? '密码登录' : '验证码登录'}</span> */}
                  <span> &nbsp; </span>
                </div>
                <div className={styles['register']}>
                  <span onClick={() => linkList('2', {})}>
                    {intl.formatMessage({
                      id: 'login.forgetPassword',
                      defaultMessage: '忘记密码',
                    })}
                  </span>{' '}
                  {/* |{' '}
                <span onClick={() => linkList('1', '')}>
                  {intl.formatMessage({
                    id: 'login.accountLogin',
                    defaultMessage: '账户注册',
                  })}
                </span> */}
                </div>
              </div>
              {/* 登录按钮 */}
              {/* <div className={styles['btn']}>登录</div> */}
              <Button
                className={styles['btn']}
                htmlType="submit"
                shape="round"
                loading={loading}
              >
                {' '}
                {intl.formatMessage({
                  id: 'login.submit',
                  defaultMessage: '登 录',
                })}{' '}
              </Button>
            </Form>
          )}
  
          {/* 忘记密码 */}
          {child}
          {/* 协议 */}
          {/* <div className={styles['agreement']}>
              <Checkbox
                // onChange={onChange}
                name="agreeStatus"
              >
                <div>
                {intl.formatMessage({id: 'login.agreement', defaultMessage: '我已阅读并同意'})}
                  <Button type="link" style={{ padding: '0' }}>
                    《 服务协议 》
                  </Button>
                  、
                  <Button type="link" style={{ padding: '0' }}>
                    《隐私政策》
                  </Button>
                </div>
              </Checkbox>
            </div> */}
        </div>
        <ChangePasswordBox
          open={openChangeVisible}
          onClose={() => {
            setOpenChangeVisible(false);
          }}
        />
        {loginType ? (
          <>
            <Button
              style={{ margin: '0 0 30px' }}
              className={styles['btn']}
              onClick={changeLoginType}
              // htmlType="submit"
              shape="round"
              loading={loading}
            >
              使用帐号密码登录
            </Button>
            <div className={styles['channel-wrap']}>
              <Button
                style={{ margin: '0 0 30px' }}
                className={isJTLogin ? styles['btn'] : styles['btn1']}
                onClick={toQrCodeLoginJT}
                // htmlType="submit"
                shape="round"
                loading={loading}
              >
                集团企业微信登录
              </Button>
              <Button
                style={{ margin: '0 0 30px' }}
                className={
                  !isJTLogin
                    ? loginManegeType == 'qc'
                      ? styles['btn']
                      : ''
                    : styles['btn1']
                }
                onClick={() => {
                  toQrCodeLogin('qc');
                }}
                // htmlType="submit"
                shape="round"
                loading={loading}
              >
                汽车企业微信登录
              </Button>
              <Button
                style={{ margin: '0 0 30px' }}
                className={
                  !isJTLogin
                    ? loginManegeType == 'ts'
                      ? styles['btn']
                      : ''
                    : styles['btn1']
                }
                onClick={() => {
                  toQrCodeLogin('ts');
                }}
                // htmlType="submit"
                shape="round"
                loading={loading}
              >
                腾势企业微信登录
              </Button>
              <Button
                style={{ margin: '0 0 30px' }}
                className={
                  !isJTLogin
                    ? loginManegeType == 'fcb'
                      ? styles['btn']
                      : ''
                    : styles['btn1']
                }
                onClick={() => {
                  toQrCodeLogin('fcb');
                }}
                // htmlType="submit"
                shape="round"
                loading={loading}
              >
                方程豹企业微信登录
              </Button>
            </div>
          </>
        ) : (
          <div className={styles['channel-wrap']}>
            <Button
              style={{ margin: '0 0 30px' }}
              className={styles['btn']}
              onClick={toQrCodeLoginJT}
              // htmlType="submit"
              shape="round"
              loading={loading}
            >
              集团企业微信登录
            </Button>
            <Button
              style={{ margin: '0 0 30px' }}
              className={styles['btn']}
              onClick={() => {
                toQrCodeLogin('qc');
              }}
              // htmlType="submit"
              shape="round"
              loading={loading}
            >
              汽车企业微信登录
            </Button>
            <Button
              style={{ margin: '0 0 30px' }}
              className={styles['btn']}
              onClick={() => {
                toQrCodeLogin('ts');
              }}
              // htmlType="submit"
              shape="round"
              loading={loading}
            >
              腾势企业微信登录
            </Button>
            <Button
              style={{ margin: '0 0 30px' }}
              className={styles['btn']}
              onClick={() => {
                toQrCodeLogin('fcb');
              }}
              // htmlType="submit"
              shape="round"
              loading={loading}
            >
              方程豹企业微信登录
            </Button>
          </div>
        )}
  
        <div className={styles['aggree-mement']}>
          <Checkbox
            checked={agreementChecked}
            onChange={() => setAgreementChecked(!agreementChecked)}
          />
          <span style={{ marginLeft: 5 }}>
            {filePrefix}{' '}
            <a href="#" onClick={() => setPrivacyShow(true)}>
              {fileNameLang}
            </a>
          </span>
        </div>
        <Modal
          open={privacyShow}
          onCancel={() => setPrivacyShow(false)}
          width="80%"
          title={fileNameLang}
          footer={null}
        >
          <div
            style={{
              maxHeight: 500,
              overflowY: 'scroll',
              padding: '20px',
              background: '#fff',
            }}
          >
            {/* <BrazilPrivacyPolicy /> */}
            {/* <MexicoPrivacyPolicy /> */}
            <>
              {curHostname.includes('br-training.byd.com') ? (
                <BrazilPrivacyPolicy />
              ) : curHostname.includes('mx-training.byd.com') ? (
                <MexicoPrivacyPolicy />
              ) : (
                <PrivacyContext />
              )}
            </>
          </div>
        </Modal>
        <div className={styles.cookiesModal}>
          <Cookies
            drawerOnClose={drawerOnClose}
            drawerBottomOpen={drawerBottomOpen}
            setChangeSettings={setChangeSettings}
            changeSettings={changeSettings}
          ></Cookies>
        </div>
      </div>
    );
  };
  
  export default LoginComPage;
  