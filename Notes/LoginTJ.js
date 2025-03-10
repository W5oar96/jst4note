import React, { Component } from 'react';
import QRCode from 'qrcode.react';
import { Button, message } from 'antd';
import { connect } from 'dva';
import { getLoginUrl, getScanAuthState, fakeAccountLogin } from '@/services/api';
import successImg from '@/assets/images/qrcode/success.svg'; // 扫码成功
import warningImg from '@/assets/images/qrcode/warning.svg'; // 二维码失效

// 使用 connect 函数将组件与 dva 模型连接起来，获取所需的状态和 loading 信息
@connect(({ login, loading, LoginQrCode }) => ({
  login,
  LoginQrCode,
  submitting: loading.effects['login/login']
}))
class LoginJT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpired: false, // 二维码是否失效的标志
      isLoading: false // 是否正在加载的标志
    };
    this.intervalId = null; // 用于存储定时器的 ID，方便后续清除定时器
  }

  // 组件挂载后调用，开始获取登录二维码
  componentDidMount() {
    this.getLoginQrCode();
  }

  // 组件卸载前清除定时器，避免内存泄漏
  componentDidUnmount() {
    this.clearIntervalTimer();
  }

  // 清除定时器的方法
  clearIntervalTimer = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  };

  // 获取登录二维码的方法
  getLoginQrCode = async () => {
    const { dispatch } = this.props;
    this.setState({ isLoading: true }); // 设置加载状态为 true
    try {
      const response = await getLoginUrl();
      if (response && response.flg === 'success') {
        const { data } = response;
        const { url, deviceId, state } = data;
        // 调用 dva 模型的 action 更新二维码 URL、设备 ID 和状态
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
        this.startPolling(deviceId); // 开始轮询二维码状态
      } else {
        message.error('获取登录二维码失败，请稍后重试');
      }
    } catch (error) {
      message.error('获取登录二维码失败，请稍后重试');
    }
    this.setState({ isLoading: false }); // 无论成功与否，都将加载状态设置为 false
  };

  // 开始轮询二维码状态的方法
  startPolling = (deviceId) => {
    this.clearIntervalTimer(); // 清除之前可能存在的定时器
    this.intervalId = setInterval(() => {
      this.checkQrCodeStatus({ deviceId });
    }, 5000);
  };

  // 检查二维码状态的方法
  checkQrCodeStatus = async (params) => {
    const { dispatch } = this.props;
    try {
      const response = await getScanAuthState(params);
      if (response) {
        if (response.flg === 'error' && response.msg === '二维码已失效') {
          this.handleQrCodeExpired();
          return;
        }
        if (response.flg === 'success') {
          const { data } = response;
          if (!data) { // 如果 data 为空，认为二维码失效
            this.handleQrCodeExpired();
            return;
          }
          // 调用 dva 模型的 action 更新二维码状态
          dispatch({
            type: 'LoginQrCode/setQRCodeStatus',
            payload: { qrCodeStatus: data.state }
          });

          switch (data.state) {
            case '1':
              break;
            case '3':
              this.handleQrCodeExpired();
              break;
            case '2':
              this.clearIntervalTimer();
              this.handleLoginConfirmation(params);
              break;
            default:
              console.log(`未知的二维码状态: ${data.state}`);
              break;
          }
        } else {
          message.error('检查二维码状态失败，请稍后重试');
        }
      }
    } catch (error) {
      message.error('检查二维码状态失败，请稍后重试');
    }
  };

  // 处理登录确认的方法
  handleLoginConfirmation = async (params) => {
    this.setState({ isLoading: true }); // 设置加载状态为 true
    const timestamp = new Date().getTime();
    const loginParams = {
      ...params,
      timestamp
    };
    try {
      const result = await fakeAccountLogin(loginParams);
      if (result && result.flg === 'success') {
        message.success('登录成功');
      } else {
        message.error('登录确认失败，请稍后重试');
      }
    } catch (error) {
      message.error('登录确认失败，请稍后重试');
    }
    this.setState({ isLoading: false }); // 无论成功与否，都将加载状态设置为 false
  };

  // 处理二维码失效的方法
  handleQrCodeExpired = () => {
    this.setState({ isExpired: true });
    this.clearIntervalTimer();
  };

  // 处理刷新二维码的方法
  handleRefresh = () => {
    this.clearIntervalTimer(); // 清除定时器
    this.setState({ isExpired: false }, () => {
      this.getLoginQrCode(); // 重新获取登录二维码
    });
  };

  // 组件渲染方法
  render() {
    const { LoginQrCode: { qrCodeUrl, qrCodeStatus }, submitting } = this.props;
    const { isExpired, isLoading } = this.state;

    const overlayStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 210,
      height: 210,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      border: '1px solid #ccc',
      borderRadius: '4px'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src="https://wwcdn.weixin.qq.com/node/wework/images/WWLogo.04d21e9183.svg"
            style={{ marginRight: '8px' }}
            onError={(e) => {
              console.log('加载企业微信 logo 图片出错:', e);
              e.target.src = "https://wwcdn.weixin.qq.com/node/wework/images/WWLogo.04d21e9183.svg"; // 可以替换为默认图片的 URL
            }}
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
              value={qrCodeUrl || 'https://example.com'}
              size={210}
              fgColor="#000000"
              level="L"
              renderAs="svg"
            />
          )}
          {isExpired && (
            <div style={overlayStyle}>
              <img
                src={qrCodeStatus === '1' || qrCodeStatus === '2' ? successImg : warningImg}
                width={40}
                height={40}
                style={{ marginBottom: '10px' }}
                alt="二维码状态"
              />
              <span style={{ color: '#000', fontSize: '14px', fontWeight: '400', lineHeight: '140%', marginBottom: '10px' }}>
                {qrCodeStatus === '1' || qrCodeStatus === '2' ? '已扫码' : '二维码已失效'}
              </span>
              <Button
                type="primary"
                onClick={this.handleRefresh}
                style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3868c2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                刷新
              </Button>
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
