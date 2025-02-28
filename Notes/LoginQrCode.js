import * as services from '@/services/api';

export default {
  namespace: 'LoginQrCode',
  state: {
    qrCodeUrl: null,
    qrCodeStatus: null,
    deviceId: null
  },

  effects: {
    // 获取登录二维码 URL 的 effect
    *fetchLoginUrl({ callback }, { call, put }) {
      const response = yield call(services.get, '/scan/getScanUrl', { method: 'get' });
      if (response && response.flg === 'success') {
        const { data } = response;
        const { url, deviceId } = data;
        yield put({
          type: 'setQRCodeUrl',
          qrCodeUrl: url
        });
        yield put({
          type: 'setDeviceId',
          deviceId
        });
        if (callback) callback(response);
      }
    },

    // 获取二维码状态的 effect
    *fetchScanAuthState({ params, callback }, { call, put }) {
      const response = yield call(services.get, '/scan/getScanAuthState', {
        method: 'get',
        params
      });
      if (response && response.flg === 'success') {
        const { data } = response;
        const { state } = data;
        yield put({
          type: 'setQRCodeStatus',
          qrCodeStatus: state
        });
        if (callback) callback(response);
      }
    }
  },

  reducers: {
    // 更新二维码 URL 的 reducer
    setQRCodeUrl(state, action) {
      return {
        ...state,
        qrCodeUrl: action.qrCodeUrl
      };
    },
    // 更新二维码状态的 reducer
    setQRCodeStatus(state, action) {
      return {
        ...state,
        qrCodeStatus: action.qrCodeStatus
      };
    },
    // 更新 deviceId 的 reducer
    setDeviceId(state, action) {
      return {
        ...state,
        deviceId: action.deviceId
      };
    }
  }
};
