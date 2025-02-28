import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import { message } from 'antd';
import { connect } from 'dva';

@connect(({ login, loading, LoginQrCode }) => ({
  login,
  LoginQrCode,
  submitting: loading.effects['login/login']
}))
class LoginJT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpired: false // 二维码是否过期
    };
    this.intervalId = null;
  }

  componentDidMount() {
    this.getLoginQrCode();
    this.startPolling();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  getLoginQrCode = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'LoginQrCode/fetchLoginUrl',
      callback: (response) => {
        if (response && response.flg === 'success') {
          console.log('回调函数接收到的数据:', response.data);
        } else {
          message.error('获取登录二维码失败，请稍后重试');
        }
      }
    });
  };

  startPolling = () => {
    const { LoginQrCode: { deviceId } } = this.props;
    if (deviceId) {
      this.intervalId = setInterval(() => {
        this.checkQrCodeStatus({ deviceId });
      }, 3000); // 每3秒轮询一次
    }
  };

  checkQrCodeStatus = (params) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'LoginQrCode/fetchScanAuthState',
      params,
      callback: (response) => {
        if (response && response.flg === 'success') {
          const { data } = response;
          if (data.state === '2') {
            // 处理登录逻辑
            clearInterval(this.intervalId);
            message.success('登录成功');
          } else if (data.state === '3') { // 假设 3 表示二维码过期
            this.setState({ isExpired: true });
            clearInterval(this.intervalId);
          }
        } else {
          message.error('检查二维码状态失败，请稍后重试');
        }
      }
    });
  };

  handleRefresh = () => {
    clearInterval(this.intervalId);
    this.setState({ isExpired: false }, () => {
      this.getLoginQrCode();
      this.startPolling();
    });
  };

  render() {
    const { LoginQrCode: { qrCodeUrl, qrCodeStatus }, submitting } = this.props;
    const { isExpired } = this.state;

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

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <QRCode
            value={qrCodeUrl || 'https://www.bilibili.com'}
            size={210}
            fgColor="#000000"
            level="L"
            renderAs="svg"
          />
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
                src={qrCodeStatus === '1' || qrCodeStatus === '2' ? 'success.svg' : 'warning.svg'}
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
