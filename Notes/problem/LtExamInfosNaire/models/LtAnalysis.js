import * as services from '@/services/api';

export default {
  namespace: 'LtAnalysis',

  state: {
    currView: 'home',
    currData: {},
    op: '',
    data: {
      list: [],
      pagination: {},
    },
    selectedIds: [], // 表格的复选框id集合
    selectedRows: [], // 表格的复选框行数据
    tableFormData: [],
    queryPara: {},
    queryParaSize: 100000, // 导出时设置为该值
    isSimpleQuery: true,

    pageFunction: '',
    current: 0,
  },

  effects: {
    *fetch({ queryPara, callback, exportFlag }, { call, put }) {
      const response = yield call(services.get, '/api/lt-exam-question-students', queryPara);
      if (response) {
        if (exportFlag === undefined) {
          // 导出查询时，后台返回的数据不回写state
          yield put({
            type: 'fetchSave',
            payload: response,
            queryPara,
          });
        }
        if (callback) callback(response);
      }
    },

    *add({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/lt-exam-question-students', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *adds({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/lt-exam-question-students-batch', payload); // 后台接口地址
      if (response.length) {
        yield put({
          type: 'addssave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *update({ payload, callback }, { call, put }) {
      const response = yield call(services.put, '/api/lt-exam-question-students', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *remove({ payload, callback }, { call }) {
      const response = yield call(services.del, '/api/lt-exam-question-students', payload);
      if (callback) callback(response);
    },
  },
  reducers: {
    fetchSave(state, action) {
      return {
        ...state,
        data: action.payload || state.data,
        queryPara: action.queryPara || state.queryPara,
        tableFormData: action.payload.list || state.tableFormData,
      };
    },
    addsave(state, action) {
      return {
        ...state,
        currData: action.payload || state.currData,
      };
    },
    addssave(state, action) {
      return {
        ...state,
        tableFormData: action.payload || state.tableFormData,
      };
    },
    switchQuery(state) {
      return {
        ...state,
        isSimpleQuery: !state.isSimpleQuery,
      };
    },
    reSet(state) {
      return {
        ...state,
        data: {
          list: [],
          pagination: {},
        },
        selectedIds: [],
        selectedRows: [],
        tableFormData: [],
        queryPara: {},
      };
    },
    updateSelectedIds(state, action) {
      return {
        ...state,
        selectedIds: action.selectedIds || state.selectedIds,
      };
    },
    updateSelectedRows(state, action) {
      return {
        ...state,
        selectedRows: action.selectedRows || state.selectedRows,
      };
    },
    openView(state, action) {
      return {
        ...state,
        currView: action.view,
        currData: action.op === 'add' ? {} : action.currData || state.currData,
        op: action.op || state.op,
        current: 0,
        selectedIds: action.view === 'home' ? [] : state.selectedIds,
        selectedRows: action.view === 'home' ? [] : state.selectedRows,
      };
    },
    changePageFunction(state, action) {
      return {
        ...state,
        pageFunction: action.pageFunction,
        queryPara: {},
      };
    },
    stepState(state, action) {
      return {
        ...state,
        current: action.current,
      };
    },
  },
};
