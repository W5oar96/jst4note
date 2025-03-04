import Login from '@/components/Login';
import { generateUniqueNumber } from '@/utils/utils';
import { Form, Modal, Tabs, Button } from 'antd';
import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { getBusiness, getEnv } from '@/utils/envUtil';
import LoginWeCom from './LoginWeCom';
import styles from './Login.less';
import LoginJT from '@/pages/User/LoginJT';

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
          </Login> : curLoginType === 'JT' ? (
            <LoginJT />
          ) : (
            <LoginWeCom curLoginType={curLoginType} key={LoginWeComkey} />
          )
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
