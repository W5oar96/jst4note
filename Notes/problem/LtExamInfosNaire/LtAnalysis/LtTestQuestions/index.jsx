import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import Home from './homeTable';
import QuestionAnalysis from './questionAnalysis';

@connect(({ LtTestQuestionsSurvey, LtExamInfoNaire, loading }) => ({
  LtTestQuestionsSurvey,
  LtExamInfoNaire,
  loading: loading.models.LtTestQuestionsSurvey,
}))
class Index extends PureComponent {
  componentDidMount() {
    const { dispatch, LtExamInfoNaire } = this.props;
    // 每次点击菜单进入home页面
    dispatch({ type: 'LtTestQuestionsSurvey/openView', view: 'home', op: '', currData: {} });
    // 批量加载码表数据
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'questionclassify,questiontype,questiondegree,difficultylevel',
      },
      callback: resp => {
        Object.keys(resp).forEach(key => {
          dispatch({
            type: 'CodeSelect/codequerycallback',
            payload: resp[key],
            queryPara: {
              codeType: key,
            },
          });
        });
      },
    });

    const values = {};
    values.testPaperCode = LtExamInfoNaire.currData.testPaperCode; // XXX业务主键查询数据库,初始化基本表格数据
    values.examCode = LtExamInfoNaire.currData.examCode; // XXX业务主键查询数据库,初始化基本表格数据
    values.size = 1000;
    dispatch({
      type: 'LtTestQuestionsSurvey/fetch',
      queryPara: values,
    });
  }

  render() {
    return (
      <div>
        <QuestionAnalysis />
        <Home />
      </div>
    );
  }
}

export default Index;
