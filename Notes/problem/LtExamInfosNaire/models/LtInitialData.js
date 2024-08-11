import * as services from '@/services/api';

export default {
  namespace: 'LtInitialData',

  state: {
    currView: 'home',
    currData: {},
    op: '',
    data: [],
    tableFormData: [],
    queryPara: {},
    queryParaSize: 100000, // 导出时设置为该值
    pageFunction: '',
    current: 0,
  },

  effects: {
    *fetch({ queryPara }, { call, put }) {
      const response = yield call(services.get, '/api/ss/lt-getQuestionMap', queryPara);
      if (response) {
        // 导出查询时，后台返回的数据不回写state
        yield put({
          type: 'fetchSave',
          payload: response,
        });
      }
    },
  },
  reducers: {
    fetchSave(state, action) {
      return {
        ...state,
        data: action.payload || [],
      };
    },
    reSet(state) {
      return {
        ...state,
        data: [],
        queryPara: {},
      };
    },
    openView(state, action) {
      return {
        ...state,
        currView: action.view,
        currData: action.op === 'add' ? {} : action.currData || state.currData,
        op: action.op || state.op,
        current: 0,
        selectedIds: action.view === 'edit' ? [] : state.selectedIds,
      };
    },
  },
};
