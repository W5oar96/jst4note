import * as services from '@/services/api';

export default {
  namespace: 'LtStudentsSurveyInAnalysis',

  state: {
    currView: 'home',
    currData: {},
    op: '',
    data: {
      list: [],
      pagination: {},
    },
    tableData: {
      list: [],
      pagination: {},
    },
    selectedIds: [], // 表格的复选框id集合
    selectedRows: [], // 表格的复选框行数据
    tableFormData: [],
    queryPara: {},
    dataResult: [],
    queryParaSize: 100000, // 导出时设置为该值
    isSimpleQuery: true,
    visibleResult: false,
    pageFunction: '',
    current: 0,
  },

  effects: {
    *fetch({ queryPara, callback, exportFlag }, { call, put }) {
      const response = yield call(services.get, '/api/ss/lt-exam-students', queryPara);
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

    *fetchResult({ queryPara, callback, exportFlag }, { call, put }) {
      const response = yield call(
        services.get,
        '/api/ss/lt-exam-info/fetch-survey-result',
        queryPara
      );
      console.log('res,', response);
      if (response) {
        if (exportFlag === undefined) {
          // 导出查询时，后台返回的数据不回写state
          yield put({
            type: 'fetchSaveResult',
            payload: response,
            queryPara,
          });
        }
        if (callback) callback(response);
      }
    },
  },
  reducers: {
    fetchSave(state, action) {
      console.log(state, action, 'fetchStudentAnaly');
      return {
        ...state,
        data: action.payload || state.data,
        queryPara: action.queryPara || state.queryPara,
        tableFormData: action.payload.list || state.tableFormData,
      };
    },
    fetchSaveResult(state, action) {
      return {
        ...state,
        dataResult: action.payload || state.dataResult,
        queryPara: action.queryPara || state.queryPara,
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
    visibleChange(state, action) {
      return {
        ...state,
        visibleResult: action.visibleResult,
        currData: action.currData,
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
