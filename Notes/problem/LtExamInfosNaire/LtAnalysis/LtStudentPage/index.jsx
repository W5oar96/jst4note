import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import Home from './homeTable';
import ExamAnalysis from './examAnalysis';

@connect(({ LtStudentsSurveyInAnalysis, LtExamInfoNaire, loading }) => ({
  LtStudentsSurveyInAnalysis,
  LtExamInfoNaire,
  loading: loading.models.LtStudentsSurveyInAnalysis,
}))
class Index extends PureComponent {
  componentDidMount() {
    const { dispatch, LtExamInfoNaire } = this.props;
    // 每次点击菜单进入home页面
    dispatch({ type: 'LtStudentsSurveyInAnalysis/openView', view: 'home', op: '', currData: {} });
    // 批量加载码表数据
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'examState',
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
    values.examCode_equals = LtExamInfoNaire.currData.examCode; // XXX业务主键查询数据库,初始化基本表格数据
    values.size = 10;
    dispatch({
      type: 'LtStudentsSurveyInAnalysis/fetch',
      queryPara: values,
    });
  }

  render() {
    return (
      <div>
        {/* <ExamAnalysis /> */}
        <Home />
      </div>
    );
  }
}

export default Index;
