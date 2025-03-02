import { message } from 'antd';

export default {
  namespace: 'LoginQrCode',
  state: {
    qrCodeUrl: null,
    qrCodeStatus: null,
    deviceId: null
  },

  effects: {
    *fetchLoginUrl({ callback }, { call, put }) {
      try {
        console.log('开始调用 /scan/getScanUrl 接口获取二维码 URL');
        const response = yield call(() => fetch('/scan/getScanUrl', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }));

        // 验证响应状态
        if (!response.ok) {
          console.error('接口调用失败，状态码:', response.status);
          message.error('获取二维码 URL 失败，请稍后重试');
          return;
        }

        // 验证响应内容类型是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('接口返回的内容类型不是 JSON:', contentType);
          message.error('接口返回的数据格式错误，请联系管理员');
          return;
        }

        // 解析 JSON 数据
        const jsonData = yield call(() => response.json());
        console.log('获取二维码 URL 接口返回结果:', jsonData);

        if (jsonData.flg === 'success') {
          const { data } = jsonData;
          const { url, deviceId, state } = data;
          yield put({
            type: 'setQRCodeUrl',
            payload: { qrCodeUrl: url }
          });
          yield put({
            type: 'setDeviceId',
            payload: { deviceId }
          });
          yield put({
            type: 'setQRCodeStatus',
            payload: { qrCodeStatus: state }
          });
          if (callback) callback(jsonData);
        } else {
          console.error('接口返回数据格式不符合预期:', jsonData);
          message.error(jsonData.msg || '获取二维码 URL 失败，请稍后重试');
        }
      } catch (error) {
        console.error('调用 /scan/getScanUrl 接口时发生错误:', error);
        message.error('获取二维码 URL 失败，请检查网络连接');
      }
    },

    *fetchScanAuthState({ params, callback }, { call, put }) {
      try {
        console.log('开始调用 /scan/getScanAuthState 接口检查二维码状态，参数:', params);
        const response = yield call(() => fetch('/scan/getScanAuthState', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          // 将参数附加到 URL 查询字符串中
          body: new URLSearchParams(params)
        }));

        // 验证响应状态
        if (!response.ok) {
          console.error('接口调用失败，状态码:', response.status);
          message.error('检查二维码状态失败，请稍后重试');
          return;
        }

        // 验证响应内容类型是否为 JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('接口返回的内容类型不是 JSON:', contentType);
          message.error('接口返回的数据格式错误，请联系管理员');
          return;
        }

        // 解析 JSON 数据
        const jsonData = yield call(() => response.json());
        console.log('检查二维码状态接口返回结果:', jsonData);

        if (jsonData.flg === 'success') {
          const { data } = jsonData;
          const { state } = data;
          yield put({
            type: 'setQRCodeStatus',
            payload: { qrCodeStatus: state }
          });
          if (callback) callback(jsonData);
        } else {
          console.error('检查二维码状态接口返回数据格式不符合预期:', jsonData);
          message.error(jsonData.msg || '检查二维码状态失败，请稍后重试');
        }
      } catch (error) {
        console.error('调用 /scan/getScanAuthState 接口时发生错误:', error);
        message.error('检查二维码状态失败，请检查网络连接');
      }
    },

    *refreshQRCode({ callback }, { put, call }) {
      yield put({
        type: 'resetQRCodeState'
      });
      yield put({
        type: 'fetchLoginUrl',
        callback
      });
    }
  },

  reducers: {
    setQRCodeUrl(state, { payload }) {
      console.log('更新二维码 URL 为:', payload.qrCodeUrl);
      return {
        ...state,
        qrCodeUrl: payload.qrCodeUrl
      };
    },
    setQRCodeStatus(state, { payload }) {
      console.log('更新二维码状态为:', payload.qrCodeStatus);
      return {
        ...state,
        qrCodeStatus: payload.qrCodeStatus
      };
    },
    setDeviceId(state, { payload }) {
      console.log('更新 deviceId 为:', payload.deviceId);
      return {
        ...state,
        deviceId: payload.deviceId
      };
    },
    resetQRCodeState(state) {
      console.log('重置二维码状态');
      return {
        ...state,
        qrCodeUrl: null,
        qrCodeStatus: null,
        deviceId: null
      };
    }
  }
};
