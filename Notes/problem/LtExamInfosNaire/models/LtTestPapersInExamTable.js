import * as services from '@/services/api';

export default {
  namespace: 'LtTestPapersInExamTable',

  state: {
    visible: false,
    currView: 'home',
    currData: {},
    op: '',
    data: {
      list: [],
      pagination: {},
    },
    selectedIds: [], // 表格的复选框
    selectedRows: [], // 表格的复选框
    tableFormData: [],
    queryPara: {},
    queryParaSize: 100000, // 导出时设置为该值
    isSimpleQuery: true,

    tempPublishType: undefined,
    pageFunction: '',
    current: 0,
  },

  effects: {
    *fetch({ queryPara, callback, exportFlag }, { call, put }) {
      const response = yield call(services.get, '/api/lt-test-papers', queryPara);
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
      const response = yield call(services.post, '/api/ss/lt-test-papers', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *adds({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/lt-test-papers-batch', payload); // 后台接口地址
      if (response.length) {
        yield put({
          type: 'addssave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *batchSubmit({ payload, callback }, { call }) {
      const response = yield call(services.post, '/api/lt-exam-infos/add-testPaper', payload);
      if (response) {
        if (callback) {
          callback(response);
        }
      }
    },

    *update({ payload, callback }, { call, put }) {
      const response = yield call(services.put, '/api/ss/lt-test-papers', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *remove({ payload, callback }, { call }) {
      const response = yield call(services.del, '/api/lt-test-papers', payload);
      if (response) {
        if (callback) callback(response);
      }
    },
    *isexist({ payload, callback }, { call }) {
      const response = yield call(services.put, '/api/lt-test-papers/isExist/', payload);
      if (response) {
        if (callback) callback(response);
      }
    },
    *updatetestPaperAndQuertions({ payloads, callback }, { call }) {
      const response = yield call(
        services.put,
        '/api/lt-test-papers/testPaperAndQuertions/',
        payloads
      );
      if (response) {
        if (callback) callback(response);
      }
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
        selectedIds: action.selectedIds,
      };
    },
    updateSelectedRows(state, action) {
      return {
        ...state,
        selectedRows: action.selectedRows,
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
    changePageFunction(state, action) {
      return {
        ...state,
        pageFunction: action.pageFunction,
        queryPara: {},
      };
    },
    changeTempPublishType(state, action) {
      return {
        ...state,
        tempPublishType: action.tempPublishType,
      };
    },
    stepState(state, action) {
      return {
        ...state,
        current: action.current,
      };
    },
    visibleState(state, action) {
      return {
        ...state,
        visible: action.visible,
      };
    },

    setCurrData(state, action) {
      return {
        ...state,
        currData: action.payload || state.currData,
      };
    },
  },
};
