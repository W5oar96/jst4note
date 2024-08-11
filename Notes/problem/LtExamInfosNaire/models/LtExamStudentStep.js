import * as services from '@/services/api';

export default {
  namespace: 'LtExamStudentStep',

  state: {
    visible: false,
  },

  effects: {
    *fetch({ queryPara, callback }, { call }) {
      const response = yield call(services.get, '/api/lt-train-enrolls', queryPara);
      if (response) {
        if (callback) callback(response);
      }
    },
  },
  reducers: {
    visibleState(state, action) {
      return {
        ...state,
        visible: action.visible,
      };
    },
  },
};
