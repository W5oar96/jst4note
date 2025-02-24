import React, { Component } from 'react';
import { getLoginUrl, getScanAuthState } from '@/services/api';
import { Form, message } from 'antd';
import QRCode from 'qrcode.react';
import { generateUniqueNumber } from '@/utils/utils';

@Form.create()
class LoginJT extends Component {
    state = {isExpired : false , qrCodeUrl : '', qrcodeInterval : false, deviceId :'', qrcode:'' };

  componentWillMount() {
    // 获取验证码
    this.getLoginLink();
  }

  // getLoginLink = async () => {
  //   getLoginUrl()
  //     .then((res) => {
  //       console.log('获取二维码link～～～', res);
  //       if (res.data && res.data.url) {
  //         this.setState({
  //           qrcodeInterval: true,
  //           qrCodeUrl: res.data.url,
  //           deviceId: res.data.deviceId,
  //         })
  //       } else {
  //         this.setState({
  //           qrcodeInterval: false,
  //         })
  //         message.error('获取二维码链接失败');
  //       }
  //     })
  //     .catch((err) => {
  //       this.setState({
  //         qrcodeInterval: false,
  //       })
  //       message.error('获取二维码链接失败');
  //     });
  // };

  getLoginLink = async () => {
    try {
      const res = await getLoginUrl();
      console.log('获取二维码link～～～', res);
      if (res && res.data && res.data.url) {
        this.setState({
          qrcodeInterval: true,
          qrCodeUrl: res.data.url,
          deviceId: res.data.deviceId
        });
      } else {
        this.setState({ qrcodeInterval: false });
        message.error('获取二维码链接失败');
      }
    } catch (err) {
      this.setState({ qrcodeInterval: false });
      message.error('获取二维码链接失败');
    }
  };

    getScanUrlStatus = async () => {
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

    refreshQrCode = () => {
      this.setState({
        isExpired: false,
        qrcodeInterval: false,
        qrcode: '4',
      })
     this.getLoginLink();
  };

    render() {
      const {isExpired, qrCodeUrl, qrcodeInterval, deviceId, qrcode } = this.state;
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

          <div style={{ display: 'flex', justifyContent: 'center' }}><QRCode
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
    }


}
export default LoginJT;
