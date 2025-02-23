import request from '@/utils/request';
import { message } from 'antd';
import fetch from 'dva/fetch';
import { saveAs } from 'file-saver';
import { stringify } from 'qs';
import { formatMessage, getLocale } from 'umi/locale';

const moment = require('moment-timezone'); // 引入 Moment.js 的时区版本

export async function queryActivities() {
  return request('/api/activities');
}

export async function queryRule(params) {
  return request(`/api/rule?${stringify(params)}`);
}

export async function removeRule(params) {
  return request('/api/rule', {
    method: 'POST',
    body: {
      ...params,
      method: 'delete',
    },
  });
}

export async function addRule(params) {
  return request('/api/rule', {
    method: 'POST',
    body: {
      ...params,
      method: 'post',
    },
  });
}

export async function updateRule(params = {}) {
  return request(`/api/rule?${stringify(params.query)}`, {
    method: 'POST',
    body: {
      ...params.body,
      method: 'update',
    },
  });
}

export async function fakeSubmitForm(params) {
  return request('/api/forms', {
    method: 'POST',
    body: params,
  });
}

export async function fakeChartData() {
  return request('/api/fake_chart_data');
}

export async function queryTags() {
  return request('/api/tags');
}

export async function queryBasicProfile(id) {
  return request(`/api/profile/basic?id=${id}`);
}

export async function queryAdvancedProfile() {
  return request('/api/profile/advanced');
}

export async function queryFakeList(params) {
  return request(`/api/fake_list?${stringify(params)}`);
}

export async function removeFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'delete',
    },
  });
}

export async function addFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'post',
    },
  });
}

export async function updateFakeList(params) {
  const { count = 5, ...restParams } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body: {
      ...restParams,
      method: 'update',
    },
  });
}

// 扫码登录
export async function scanLogin(params) {
  return request('/auth/scan/login', {
    method: 'POST',
    headers: {
      'X-Timestamp': params.timestamp,
    },
    body: params,
  });
}

// 登录，然后获取用户信息  在models下的login.js调用
export async function fakeAccountLogin(params) {
  return request('/auth/login', {
    method: 'POST',
    headers: {
      'X-Timestamp': params.timestamp,
    },
    body: params,
  });
}

// 退出登录
export async function fakeAccountLogout(params) {
  return request('/auth/logout', {
    method: 'POST',
    body: params,
  });
}

// 登录，然后获取用户信息  在models下的login.js调用
export async function getAccountInfo(params) {
  return request(`/api/queryLoginMessage?${stringify(params)}`);
}

export async function fakeRegister(params) {
  return request('/api/register', {
    method: 'POST',
    body: params,
  });
}

export async function queryNotices(params = {}) {
  return request(`/api/notices?${stringify(params)}`);
}

/**
 common methods
 */
// 下载文件
export async function down(url, values, filename) {
  const start = new Date().getTime();
  let service;
  if (url.startsWith('/api')) {
    service = `/tms-app${url}`;
  } else {
    service = url;
  }
  return fetch(service, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      // Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'X-Lang': getLocale(),
      'X-Device': 'web',
      'X-BranchType': sessionStorage.getItem('branchType'),
      'X-TimeZone': moment.tz.guess(),
      'X-Lable': localStorage.getItem('X-Lable'),
    },
    body: JSON.stringify(values),
  }).then(response => {
    if ((response.status !== 200 && response.status !== 201) || response == null) {
      message.error(formatMessage({ id: 'api.errorAndNoticeAdmin' }));
    } else {
      console.log('request down url ', service, ' take ', new Date().getTime() - start, ' ms ');
      const start2 = new Date().getTime();
      const key = 'updatable';
      response.blob().then(blob => {
        if (blob.size === 0) {
          message.error(formatMessage({ id: 'api.downloadFailAndNoticeAdmin' }));
        } else {
          message.loading({
            content: formatMessage({ id: 'api.backgroundProcessIsCompletedAndFrontStartDownload' }),
            duration: 0,
            key,
          });
          saveAs(blob, filename);
          const end = new Date().getTime();
          console.log(
            'request down url ',
            url,
            ' save as take ',
            end - start2,
            ' ms,total take ',
            end - start,
            ' ms'
          );
          message.success({
            content: formatMessage({ id: 'api.downloadSuccess' }),
            key,
            duration: 2,
          });
        }
      });
    }
  });
}
// 附件下载
export async function downLoad3(url, filename) {
  let service;
  if (url.startsWith('/api')) {
    service = `/tms-app${url}`;
  } else {
    service = url;
  }
  return fetch(service, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
      // Authorization: `Bearer ${sessionStorage.getItem('token')}`,
      'X-Lang': getLocale(),
      'X-Device': 'web',
      'X-BranchType': sessionStorage.getItem('branchType'),
      'X-TimeZone': moment.tz.guess(),
      'X-Lable': localStorage.getItem('X-Lable'),
    },
  }).then(response => {
    if (response.status !== 200 && response.status !== 201) {
      message.error('服务器出错');
    } else {
      response.blob().then(blob => {
        if (blob.size === 0) {
          message.error('文件损坏！');
        } else {
          saveAs(blob, filename);
        }
      });
    }
  });
}

// 上传文件.不包含数据
export async function upload(url, values) {
  return request(url, {
    method: 'POST',
    body: values,
  });
}

// GET方式和后台交互（动态查询的get方式。
export async function get(url, params) {
  // 下边的这个方法实现key值得转换
  //  约定，在view层写查询表单时用_然后这里把key值替换为.便于后台构建动态查询
  const params1 = params;
  if (
    !params1.audienceUser &&
    (params1.dataRange === undefined ||
      params1.dataRange === null ||
      params1.dataRange === 'myManage')
  ) {
    // 我管辖的
    if (params1.noManageCom === undefined) {
      // 如果包含了 createdByManageCom_condition 此key  则追加 createdByManageCom 此条件过滤
      if (params1.createdByManageCom_value === undefined) {
        params1.createdByManageCom_value = sessionStorage.getItem('managecom');
      }
    }
    // 如果有了createdByManageCom_value，则看数据匹配模式
    if (params1.createdByManageCom_value !== undefined) {
      if (params1.createdByManageCom_condition === 'equals') {
        params1.createdByManageCom_equals = params1.createdByManageCom_value;
        delete params1.createdByManageCom_contains;
      } else {
        params1.createdByManageCom_contains = params1.createdByManageCom_value;
        delete params1.createdByManageCom_equals;
      }
    }
    // 按照机构查询 删除我创建的和授权给我的条件
    params1.audienceUser = false;
    delete params1.createdBy_equals;
  }
  if (params1.dataRange === 'myCreated') {
    // 我创建的
    params1.audienceUser = false;
    params1.createdBy_equals = sessionStorage.getItem('user');
    delete params1.createdByManageCom_value;
    delete params1.createdByManageCom_contains;
    delete params1.createdByManageCom_equals;
  }
  // console.log("ccccc",params1);
  if (params1.audienceUser || params1.dataRange === 'authorize') {
    // 授权给我的
    params1.audienceUser = true;
    if(params1.notDelQuery !== 'not'){
      delete params1.createdBy_equals;
      delete params1.createdByManageCom_value;
      delete params1.createdByManageCom_contains;
      delete params1.createdByManageCom_equals;
    }else{
      // 如果有了createdByManageCom_value，则看数据匹配模式
      if (params1.createdByManageCom_value !== undefined) {
        if (params1.createdByManageCom_condition === 'equals') {
          params1.createdByManageCom_equals = params1.createdByManageCom_value;
          delete params1.createdByManageCom_contains;
        } else {
          params1.createdByManageCom_contains = params1.createdByManageCom_value;
          delete params1.createdByManageCom_equals;
        }
      }
    }
  }

  // 涉及人员查询的使用管理机构（学员，讲师，班主任，和与学员关联产生的数据（考生、班级学员等））
  if (params1.manageCom_value !== undefined) {
    if (params1.manageCom_condition === 'equals') {
      params1.manageCom_equals = params1.manageCom_value;
      delete params1.manageCom_contains;
    } else {
      params1.manageCom_contains = params1.manageCom_value;
      delete params1.manageCom_equals;
    }
  }

  const keys = Object.keys(params1);
  if (keys.includes('createdDate_RangePicker')) {
    // 如果包含了 createdDate_RangePicker 此key  则追加 createdDate 此条件过滤
    if (
      params1.createdDate_RangePicker !== undefined &&
      params1.createdDate_RangePicker !== null &&
      params1.createdDate_RangePicker !== '' &&
      params1.createdDate_RangePicker.length > 0 &&
      params1.createdDate_RangePicker !== 'tms'
    ) {
      const v2 = params1.createdDate_RangePicker;
      params1.createdDate_greaterOrEqualThan = v2[0].startOf('day').toISOString();
      params1.createdDate_lessOrEqualThan = v2[1].endOf('day').toISOString();
      params1.createdDate_RangePicker = 'tms'; // 这里随便写一个，用来减少get的url的长度，此处是为了解决too large的错误
    }
  }

  if (params1.noBranchType === undefined) {
    if (!params1.branchType_equals && !params1.branchType_contains) {
      params1.branchType_equals = sessionStorage.getItem('branchType'); // 在CodeSelect里进行处理
    }
  }
  if (params1.noBranchTypeIn === undefined) {
    if (
      params1.branchType_in === undefined &&
      !params1.branchType_contains &&
      !params1.branchType_equals
    ) {
      params1.branchType_in = sessionStorage.getItem('branchTypeArray'); // 用户的渠道集合 逗号分割的字符串
    }
  }
  const params2 = {};
  Object.keys(params1).map(key => {
    if (params1[key] !== null && params1[key] !== undefined && params1[key] !== '') {
      if (typeof params1[key] === 'string') {
        params2[key.replace('_', '.')] = params1[key].trim();
      } else {
        params2[key.replace('_', '.')] = params1[key];
      }
    }
    return params2;
  });
  // 先取出来排序的信息
  const sortStr = params2.sort;
  if (!params2.size) params2.size = 10;
  // 删除排序信息（多个字段排序时有&符号，stringify会转化，所以先删除，转换完后再拼接）
  delete params2.sort;
  const str = stringify(params2);
  let newUrl = url;
  if (str) {
    newUrl = `${url}?${str}`;
  }
  if (sortStr) {
    newUrl = `${newUrl}&sort=${sortStr}`;
  } else if (!params2.noSort) {
    // 如果查询条件没有设定不排序（自定义查询），则默认按照id倒叙
    newUrl = `${newUrl}&sort=createdDate,desc`;
  }
  // 第二个参数有什么用呢？
  return request(newUrl, params2);
}

// getByDto 适用于非动态查询。通过后台通过dto的方式进行接受。
export async function getByDto(url, params) {
  const params1 = params;

  if (params1.noManageCom === undefined) {
    // 如果包含了 createdByManageCom_condition 此key  则追加 createdByManageCom 此条件过滤
    if (!params1.manageCom) {
      params1.createdByManageCom = sessionStorage.getItem('managecom');
    }
  }

  if (params1.noBranchType === undefined) {
    if (!params1.branchType) {
      params1.branchType = sessionStorage.getItem('branchType'); // 在CodeSelect里进行处理
    }
  }

  const params2 = {};
  Object.keys(params1).map(key => {
    if (params1[key] !== null && params1[key] !== undefined && params1[key] !== '') {
      if (typeof params1[key] === 'string') {
        params2[key] = params1[key].trim();
      } else {
        params2[key] = params1[key];
      }
    }
    return params2;
  });
  // 先取出来排序的信息
  const sortStr = params2.sort;
  if (!params2.size) params2.size = 10;
  // 删除排序信息（多个字段排序时有&符号，stringify会转化，所以先删除，转换完后再拼接）
  delete params2.sort;
  const str = stringify(params2);
  let newUrl = url;
  if (str) {
    newUrl = `${url}?${str}`;
  }
  if (sortStr) {
    newUrl = `${newUrl}&sort=${sortStr}`;
  } else if (!params2.noSort) {
    // 如果查询条件没有设定不排序（自定义查询），则默认按照id倒叙
    // newUrl = `${newUrl}&sort=createdDate,desc`;
  }
  // 第二个参数有什么用呢？
  return request(newUrl, params2);
}

// 不添加任何附件参数
export async function pureGet(url, values) {
  return request(url, values);
}


// 不添加任何附件参数，带异常回调
export async function pureGetWhitCatch(url, values, onError) {
  return request(url, values, onError);
}

// POST方式和后台交互。
export async function post(url, values = {}) {
  const data = values;
  if (Array.isArray(data)) {
    // 数组里每个对象增加这几个信息
    Object.keys(data).map(key => {
      data[key] = data[key];
      if (data[key].manageCom === undefined) {
        data[key].manageCom = sessionStorage.getItem('managecom');
      }
      if (data[key].branchType === undefined) {
        data[key].branchType = sessionStorage.getItem('branchType');
      }
      return data;
    });
  } else {
    if (data.manageCom === undefined) {
      data.manageCom = sessionStorage.getItem('managecom');
    }
    if (data.branchType === undefined) {
      data.branchType = sessionStorage.getItem('branchType');
    }
  }

  // 输入框的前后空格去掉
  const trimData = data;
  Object.keys(data).map(key => {
    if (typeof data[key] === 'string') {
      trimData[key] = data[key].trim();
    }
    return trimData;
  });

  return request(url, {
    method: 'POST',
    body: trimData,
  });
}

// PUT方式和后台交互
export async function put(url, values = {}) {
  // 输入框的前后空格去掉
  const trimData = values;
  Object.keys(values).map(key => {
    if (typeof values[key] === 'string') {
      trimData[key] = values[key].trim();
    }
    return trimData;
  });

  return request(url, {
    method: 'PUT',
    body: trimData,
  });
}

// DELETE方式和后台交互(修改deleted(如果有该字段，如果没有该字段则完全删除))
export async function del(url, values = {}) {
  return request(`${url}/${values.id}`, {
    method: 'DELETE',
    body: values,
  });
}

// DELETE方式和后台交互(完全删除，delete操作)
export async function completeDel(url, values = {}) {
  return request(`${url}/${values.id}/1`, {
    method: 'DELETE',
    body: values,
  });
}

// DELETE方式和后台交互
export async function del2(url, values) {
  return request(url, {
    method: 'DELETE',
    body: values,
  });
}



import Login from '@/components/Login';
import { generateUniqueNumber } from '@/utils/utils';
import { Form, Modal, Tabs, Button } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { getBusiness, getEnv } from '@/utils/envUtil';
import LoginWeCom from './LoginWeCom';
import styles from './Login.less';
const { confirm } = Modal;
const FormItem = Form.Item;
const { TabPane } = Tabs;

const { Tab, UserName, Password, CheckCode, Name, IdCard, Submit } = Login;
const curEnv = getEnv(); // 当前环境 PRD --生产
const curBusiness = getBusiness(); // curBusiness: TJ\JT    TJ表示铁军 、JT表示集团

@connect(({ login, loading, LoginCheckCode }) => ({
  login,
  LoginCheckCode,
  submitting: loading.effects['login/login'],
}))
@Form.create()
class LoginPage extends Component {
  state = {
    type: 'admin',
    LoginWeComkey: 0,
    curLoginType: 'verificationCode', // 默认验证码  ，铁军 支持二维码,  腾势：TS，集团：JT , 汽车：QC, 方程豹：FCB
  };

  componentWillMount() {
    generateUniqueNumber();
    // 获取验证码
    this.getCheckCode();
  }

  onTabChange = type => {
    this.setState({ type });
  };

  b64encode = str => {
    // 得到utf-8编码
    const utf8 = encodeURIComponent(str);
    // %xx对应的每字节转换成字符串
    const utf8Str = utf8.replace(/%(\w{2})/g, (m, a) => String.fromCharCode(`0x${a}`));
    return btoa(utf8Str);
  };

  handleSubmit = (err, values) => {
    const { type } = this.state;
    if (!err) {
      const {
        dispatch,
        LoginCheckCode: { uuid },
      } = this.props;
      if (type === 'admin') {
        dispatch({
          type: 'login/login',
          payload: {
            ...values,
            password: this.b64encode(values.password),
            role: type,
            uuid,
          },
          callback: response => {
            if (response.code === 'SUCCESS' && response.initial === 'Y') {
              confirm({
                centered: true,
                content: formatMessage({ id: 'app.login.message-invalid-check-password' }),
                okText: formatMessage({ id: 'global.modifyPassword' }),
                cancelText: formatMessage({ id: 'global.ignore' }),
                onOk() {
                  document.location.href = '/admin/platform/changePwd';
                },
                onCancel() {
                  document.location.href = '/admin/';
                },
              });
            }
            if (response.code === 'SUCCESS' && response.initial !== 'Y') {
              document.location.href = '/admin/';
            }
          },
          callback1: () => {
            // 刷新验证码
            this.getCheckCode();
          },
        });
      } else {
        dispatch({
          type: 'login/login',
          payload: {
            username: values.name,
            password: values.idcard,
            role: type,
          },
          callback: response => {
            if (response.code === 'SUCCESS' && response.initial === 'Y') {
              // 初始密码
              confirm({
                centered: true,
                content: formatMessage({ id: 'app.login.message-invalid-check-password' }),
                okText: formatMessage({ id: 'global.modifyPassword' }),
                cancelText: formatMessage({ id: 'global.ignore' }),
                onOk() {
                  document.location.href = '/platform/changePwd';
                },
                onCancel() {
                  document.location.href = '/';
                },
              });
            } else {
              document.location.href = '/';
            }
          },
        });
      }
    }
  };

  // 获取验证码
  getCheckCode = () => {
    const { dispatch } = this.props;
    // dispatch({
    //   type: 'login/logout',
    // });
    const type = 'data:image/jpg;base64,';
    dispatch({
      type: 'LoginCheckCode/getCheckCode',
      queryPara: {},
      callback: resp => {
        dispatch({
          type: 'LoginCheckCode/setImgBytes',
          imgBytesUrl: `${type}${resp.imgBytes}`,
        });
        dispatch({
          type: 'LoginCheckCode/setUUID',
          uuid: resp.uuid,
        });
      },
    });
  };

  setCurLoginType = (type) => {
    this.setState({
      curLoginType: type,
    })
    this.setState(prevState => ({
      LoginWeComkey: prevState.LoginWeComkey + 1,
    }));
  }

  render() {
    const {
      submitting,
      LoginCheckCode: { imgBytesUrl },
    } = this.props;

    const { type, curLoginType, LoginWeComkey } = this.state;
    return (
      <div className={styles.main}>
        {
          curLoginType == 'verificationCode' ? <Login defaultActiveKey={type} onTabChange={this.onTabChange} onSubmit={this.handleSubmit}>
            <UserName name="username" />
            <Password name="password" />
            <CheckCode name="checkCode" initImg={imgBytesUrl} getCheckCode={this.getCheckCode} />
            <Submit loading={submitting}>
              <FormattedMessage id="app.login.login" />
            </Submit>
          </Login> : <LoginWeCom curLoginType={curLoginType} key={LoginWeComkey} />
        }
        <>
          {curBusiness == 'TJ' ?
            <div style={{ display: 'grid', gridTemplateRows: '36px 36px', gridTemplateColumns: '1fr 1fr', gridGap: '20px 10px', marginBottom: '20px' }} >
              <Button loading={submitting} size="middle" style={{ height: '36px', margin: '0 0 30px', background: curLoginType === 'verificationCode' ? '#fff' : '#d70c19', color: curLoginType === 'verificationCode' ? '#000' : '#fff', marginBottom: '10px',  cursor: curLoginType === 'verificationCode' ? 'default' : 'pointer', fontSize: '16px', opacity: curLoginType === 'verificationCode' ? 0.5 : 1  }} disabled={curLoginType == 'verificationCode'} onClick={() => this.setCurLoginType('verificationCode')}>使用账号密码登录</Button>
              <Button loading={submitting} size="middle" style={{ height: '36px', margin: '0 0 30px', background: curLoginType === 'JT' ? '#fff' : '#d70c19', color: curLoginType === 'JT' ? '#000' : '#fff', marginBottom: '10px',  cursor: curLoginType === 'JT' ? 'default' : 'pointer', fontSize: '16px', opacity: curLoginType === 'JT' ? 0.5 : 1 }} disabled={curLoginType == 'JT'} onClick={() => this.setCurLoginType('JT')}>集团企业微信登录</Button>
              <Button loading={submitting} size="middle" style={{ height: '36px', margin: '0 0 30px', background: curLoginType === 'TS' ? '#fff' : '#d70c19', color: curLoginType === 'TS' ? '#000' : '#fff', marginBottom: '10px',  cursor: curLoginType === 'TS' ? 'default' : 'pointer', fontSize: '16px', opacity: curLoginType === 'TS' ? 0.5 : 1 }} disabled={curLoginType == 'TS'} onClick={() => this.setCurLoginType('TS')}>腾势企业微信登录</Button>
              <Button loading={submitting} size="middle" style={{ height: '36px', margin: '0 0 30px', background: curLoginType === 'QC' ? '#fff' : '#d70c19', color: curLoginType === 'QC' ? '#000' : '#fff', marginBottom: '10px',  cursor: curLoginType === 'QC' ? 'default' : 'pointer', fontSize: '16px', opacity: curLoginType === 'QC' ? 0.5 : 1 }} disabled={curLoginType == 'QC'} onClick={() => this.setCurLoginType('QC')}>汽车企业微信登录</Button>
              <Button loading={submitting} size="middle" style={{ height: '36px', margin: '0 0 30px', background: curLoginType === 'FCB' ? '#fff' : '#d70c19', color: curLoginType === 'FCB' ? '#000' : '#fff', marginBottom: '10px',  cursor: curLoginType === 'FCB' ? 'default' : 'pointer', fontSize: '16px', opacity: curLoginType === 'FCB' ? 0.5 : 1 }} disabled={curLoginType == 'FCB'} onClick={() => this.setCurLoginType('FCB')}>方程豹企业微信登录</Button>
            </div>
            : null}
        </>
      </div>
    );
  }
}

export default LoginPage;




import { Form, Modal, Tabs, Button } from 'antd';
import { connect } from 'dva';
import React, { Component, createRef } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { getBusiness, getEnv } from '@/utils/envUtil';
import styles from './Login.less';
const curEnv = getEnv(); // 当前环境 PRD --生产
const curBusiness = getBusiness(); // curBusiness: TJ\JT    TJ表示铁军 、JT表示集团
const appIdqc = 'wx7a22c6916657c82e'; // 汽车
const appIdts = 'ww196ba22526320e01'; // 腾势
const appIdFcb = 'ww382681cbb6405c7d'; // 方程豹
const uatUrl = 'https://e-lms-uat.byd.com/admin/user/login';
const prodUrl = 'https://e-lms.byd.com/admin/user/login';

@connect(({ login, loading, LoginCheckCode }) => ({
  login,
  LoginCheckCode,
  submitting: loading.effects['login/login'],
}))

class LoginWeCom extends Component {

  constructor(props) {
    super(props);
    // 创建ref
    this.wwLoginRef = createRef();
  }

  state = {
    // 扫码登录参数
    wwLoginParams: {
      redirectUri: '',
      agentid: '',
      appId: '',
    }
  };

  componentDidMount() {
    const { wwLoginParams } = this.state;
    if (wwLoginParams.redirectUri != '') {
      this.setState({
        wwLoginParams: {
          redirectUri: '',
          agentid: '',
          appId: '',
        }
      })
    }
    this.setLoginParams();
  }

  componentDidUpdate(preProps) {
    const { curLoginType } = this.props;
    if (curLoginType !== preProps.curLoginType) {
      //  发现二维码登录类型切换 重新赋值参数
      this.setLoginParams();
    }
  }

  setLoginParams = () => {
    const { curLoginType } = this.props;
    // curLoginType 验证码：verificationCode， 腾势：TS， 汽车：QC 方程豹：FCB
    if (curEnv == "PRD") {
      // prod
      if (curLoginType == 'TS') {
        let param = {
          redirectUri: prodUrl,
          agentid: '1000098',
          appId: appIdts,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      } else if (curLoginType == 'QC') {
        let param = {
          redirectUri: prodUrl,
          agentid: '1000350',
          appId: appIdqc,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      } else if (curLoginType == 'FCB') {
        let param = {
          redirectUri: prodUrl,
          agentid: '1000052',
          appId: appIdFcb,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      }
    } else {
      // uat
      if (curLoginType == 'TS') {
        let param = {
          redirectUri: uatUrl,
          agentid: '1000096',
          appId: appIdts,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      } else if (curLoginType == 'QC') {
        let param = {
          redirectUri: uatUrl,
          agentid: '1000349',
          appId: appIdqc,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      } else if (curLoginType == 'FCB') {
        let param = {
          redirectUri: uatUrl,
          agentid: '1000052',
          appId: appIdFcb,
        }
        this.setState({
          wwLoginParams: param
        })
        this.ininWWlogin(param)
      }
    }
  }

  // 初始化登录组件
  ininWWlogin = (param) => {
    console.log('企微扫码初始化组件参数', param)
    const { curLoginType, dispatch } = this.props;
    const { redirectUri, agentid, appId } = param;
    // console.log('wwLoginRef---->', this.wwLoginRef.current)
    const wwLogin = ww.createWWLoginPanel({
      el: this.wwLoginRef.current,
      params: {
        login_type: 'CorpApp',
        appid: appId,
        agentid: agentid,
        redirect_uri: redirectUri,
        state: 'loginState',
        redirect_type: 'callback',
        // expire_seconds: 60 * 2,
      },
      // 获取企业微信桌面端登录状态回调
      onCheckWeComLogin({ isWeComLogin }) {
        console.log('获取企业微信桌面端登录状态回调', isWeComLogin)
      },
      // 企业微信登录成功回调
      onLoginSuccess({ code }) {
        console.log('扫码后，企业微信登录成功回调code===>', code, 'curLoginType--->', curLoginType)
        // 调系统登录 然后存储一些列值
        if (curLoginType == 'TS') {
          const paramss = { scanCode: code, role: 'admin', state: 'TS' };
          // this.weLoginPage(paramss);
          dispatch({
            type: 'login/wwScanlogin',
            payload: paramss,
            callback: response => {
              console.log('腾势企微扫码成功后，培训系统的登录接口调取成功___>', response)
            },

          });
        } else if (curLoginType == 'QC') {
          const paramss = { scanCode: code, role: 'admin', state: 'LW' };
          // this.weLoginPage(paramss);
          dispatch({
            type: 'login/wwScanlogin',
            payload: paramss,
            callback: response => {
              console.log('汽车企微扫码成功后，培训系统的登录接口调取成功___>', response)
            },

          });
        } else if (curLoginType == 'FCB') {
          const paramss = { scanCode: code, role: 'admin', state: 'FCB' };
          // this.weLoginPage(paramss);
          dispatch({
            type: 'login/wwScanlogin',
            payload: paramss,
            callback: response => {
              console.log('方程豹企微扫码成功后，培训系统的登录接口调取成功___>', response)
            },

          });
        }
      },
      // 	企业微信登录错误回调
      onLoginFail(err) {
        console.log('企业微信登录错误回调', err)
      },
    })
  }

  // 登录
  weLoginPage = (params) => {
    console.log('培训系统的登录接口调取params---->', params)
    const {
      dispatch,
    } = this.props;
    dispatch({
      type: 'login/wwScanlogin',
      payload: params,
      callback: response => {
        console.log('培训系统的登录接口调取成功___>', response)
      },

    });
  }

  render() {
    const { curLoginType } = this.props;
    const { wwLoginParams } = this.state;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} ref={this.wwLoginRef} id="ww_login">
      </div>
    );
  }
}

export default LoginWeCom;

