import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import { message } from 'antd';
import { connect } from 'dva';
import { getLoginUrl, getScanAuthState, saveScanAuthState } from '@/services/api';
import successImg from '@/assets/images/qrcode/success.svg';
import warningImg from '@/assets/images/qrcode/warning.svg';

@connect(({ login, loading, LoginQrCode }) => ({
  login,
  LoginQrCode,
  submitting: loading.effects['login/login']
}))
class LoginJT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpired: false,
      isLoading: false
    };
    this.intervalId = null;
  }

  componentDidMount() {
    this.getLoginQrCode();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  getLoginQrCode = async () => {
    const { dispatch } = this.props;
    this.setState({ isLoading: true });
    try {
      const response = await getLoginUrl();
      if (response && response.flg === 'success') {
        const { data } = response;
        const { url, deviceId, state } = data;
        dispatch({
          type: 'LoginQrCode/setQRCodeUrl',
          payload: { qrCodeUrl: url }
        });
        dispatch({
          type: 'LoginQrCode/setDeviceId',
          payload: { deviceId }
        });
        dispatch({
          type: 'LoginQrCode/setQRCodeStatus',
          payload: { qrCodeStatus: state }
        });
        this.startPolling(deviceId);
      } else {
        message.error('获取登录二维码失败，请稍后重试');
      }
    } catch (error) {
      message.error('获取登录二维码失败，请检查网络或联系管理员');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  startPolling = (deviceId) => {
    this.intervalId = setInterval(() => {
      this.checkQrCodeStatus({ deviceId });
    }, 3000);
  };

  checkQrCodeStatus = async (params) => {
    const { dispatch } = this.props;
    try {
      const response = await getScanAuthState(params);
      if (response && response.flg === 'success') {
        const { data } = response;
        dispatch({
          type: 'LoginQrCode/setQRCodeStatus',
          payload: { qrCodeStatus: data.state }
        });
        if (data.state === '2') {
          clearInterval(this.intervalId);
          this.handleLoginConfirmation(params);
        } else if (data.state === '3') {
          this.setState({ isExpired: true });
          clearInterval(this.intervalId);
        }
      } else {
        message.error('检查二维码状态失败，请稍后重试');
      }
    } catch (error) {
      message.error('检查二维码状态失败，请检查网络或联系管理员');
    }
  };

  handleLoginConfirmation = async (params) => {
    this.setState({ isLoading: true });
    try {
      const loginParams = {
        username: params.userId,
        code: params.userId,
        token: params.token,
        appid: params.appid
      };
      const result = await saveScanAuthState(loginParams);
      if (result) {
        message.success('登录成功');
      }
    } catch (error) {
      message.error('登录确认失败，请稍后重试');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleRefresh = () => {
    clearInterval(this.intervalId);
    this.setState({ isExpired: false }, () => {
      this.getLoginQrCode();
    });
  };

  render() {
    const { LoginQrCode: { qrCodeUrl, qrCodeStatus }, submitting } = this.props;
    const { isExpired, isLoading } = this.state;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src="https://wwcdn.weixin.qq.com/node/wework/images/WWLogo.04d21e9183.svg"
            style={{ marginRight: '8px' }}
          />
          <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '400', lineHeight: '24px', margin: '40px 0' }}>
            企业微信扫码登录
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {isLoading ? (
            <div style={{ width: 210, height: 210, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              Loading...
            </div>
          ) : (
            <QRCode
              value={qrCodeUrl || 'https://www.bilibili.com'}
              size={210}
              fgColor="#000000"
              level="L"
              renderAs="svg"
            />
          )}
          {isExpired && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '210px',
                height: '210px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 200
              }}
              onClick={this.handleRefresh}
            >
              <img
                src={qrCodeStatus === '1' || qrCodeStatus === '2' ? successImg : warningImg}
                width={40}
                height={40}
                style={{ marginBottom: '10px' }}
                alt="二维码状态"
              />
              <span style={{ color: '#000', fontSize: '14px', fontWeight: '400', lineHeight: '140%' }}>
                                {qrCodeStatus === '1' || qrCodeStatus === '2' ? '已扫码' : '二维码已失效'}
                            </span>
              <span style={{ color: '#417ce8', fontSize: '14px', fontWeight: '400', marginTop: '10px', lineHeight: '140%' }}>
                                刷新
                            </span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '400', marginTop: '24px', marginBottom: '59px', lineHeight: '140%', color: 'rgba(11, 18, 26, .6)' }}>
          请使用企业微信扫码登录
        </div>
      </div>
    );
  }
}

export default LoginJT;
