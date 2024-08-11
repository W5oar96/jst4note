import * as services from '@/services/api';

export default {
  namespace: 'LtTestQuestionsSurvey',
  state: {
    visible: false,
    currView: 'home',
    currData: {},
    op: '',
    data: [],
    tableData: {
      list: [],
      pagination: {},
    },
    selectedIds: [], // 表格的复选框id集合
    selectedRows: [], // 表格的复选框行数据
    tableFormData: [],
    markData: [],
    queryPara: {},
    queryParaSize: 100000, // 导出时设置为该值
    isSimpleQuery: true,
    pageFunction: '',
    current: 0,
    numberQuestionType1: '0', // 单选题数量
    numberQuestionType2: '0', // 多选题数量
    paperMarks: '0', // 试卷总分
    passMarks: '0', // 试卷及格分
    questionMark1: '0', // 单选题分数
    questionMark2: '0', // 多选题分数
    // 维护功能表单的2种展示方式,编辑页面元素大于一定数量时则默认为3列编辑

    formLayout: 'inline',
  },

  effects: {
    *fetch({ queryPara, callback }, { call, put }) {
      const response = yield call(
        services.getByDto,
        '/api/ss/lt-question/get-survey-question',
        queryPara
      );
      if (response) {
        yield put({
          type: 'fetchSave',
          payload: response,
          queryPara,
        });
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
    setTableData(state, action) {
      let startIndex = 0;
      let endIndex = action.queryPara.size !== 1000 ? action.queryPara.size : 10;
      let { current } = state.data.pagination;
      if (action.queryPara.page) {
        current = action.queryPara.page + 1;
        startIndex = action.queryPara.size * action.queryPara.page;
        endIndex = startIndex + action.queryPara.size;
      }
      const tableData = {
        list: state.data.list.slice(startIndex, endIndex), // [,)
        pagination: {
          total: state.data.pagination.total,
          current,
        },
      };
      return {
        ...state,
        tableData,
      };
    },
  },
};
