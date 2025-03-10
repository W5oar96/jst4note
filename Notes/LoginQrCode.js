import { getLoginUrl, getScanAuthState } from '@/services/api';

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
        const response = yield call(getLoginUrl);

        if (response && response.flg === 'success') {
          const { data } = response;
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
          console.log('成功获取二维码 URL、deviceId 和状态');
          if (callback) {
            callback(response);
          }
        } else {
          console.log('接口返回数据格式不符合预期:', response);
        }
      } catch (error) {
        console.log('调用 /scan/getScanUrl 接口时发生错误:', error);
      }
    },

    *fetchScanAuthState({ params, callback }, { call, put }) {
      try {
        console.log('开始调用 /scan/getScanAuthState 接口检查二维码状态，参数:', params);
        const response = yield call(getScanAuthState, params);

        if (response && response.flg === 'success') {
          const { data } = response;
          const { state } = data;
          yield put({
            type: 'setQRCodeStatus',
            payload: { qrCodeStatus: state }
          });
          console.log('成功更新二维码状态');
          if (callback) {
            callback(response);
          }
        } else {
          console.log('检查二维码状态接口返回数据格式不符合预期:', response);
        }
      } catch (error) {
        console.log('调用 /scan/getScanAuthState 接口时发生错误:', error);
      }
    },

    *refreshQRCode({ callback }, { put, call }) {
      try {
        console.log('开始刷新二维码状态');
        yield put({
          type: 'resetQRCodeState'
        });
        console.log('二维码状态已重置');
        yield put({
          type: 'fetchLoginUrl',
          callback
        });
      } catch (error) {
        console.log('刷新二维码状态时发生错误:', error);
      }
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
