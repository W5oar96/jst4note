import { connect } from 'dva';
import React, { PureComponent } from 'react';
import Edit from './edit';
import Home from './home';
import Detail from './LtAnalysis/detail';

@connect(({ LtExamInfoNaire, loading, CodeSelect }) => ({
  LtExamInfoNaire,
  CodeSelect,
  loading: loading.models.LtExamInfoNaire,
}))
class Index extends PureComponent {
  componentWillMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'LtExamInfoNaire/changePageFunction',
      pageFunction: '',
    });
  }

  componentDidMount() {
    const { dispatch } = this.props;

    // 每次点击菜单进入home页面
    dispatch({ type: 'LtExamInfoNaire/openView', view: 'home', op: '', currData: {} });
    dispatch({ type: 'LtExamInfoNaire/reset' });

    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType:
          'surveypaperclassify,composetype,status,publishtype,answerauthority,examtype,surveytype,surveystate',
      },
      callback: resp2 => {
        Object.keys(resp2).forEach(key2 => {
          dispatch({
            type: 'CodeSelect/codequerycallback',
            payload: resp2[key2],
            queryPara: {
              codeType: key2,
            },
          });
        });
      },
    });
  }

  getView = () => {
    const {
      LtExamInfoNaire: { currView },
    } = this.props;

    let result = <Home />;
    if (currView === 'edit') {
      result = <Edit />;
    } else if (currView === 'detail') {
      result = <Detail />;
    }
    return result;
  };

  render() {
    return <div>{this.getView()}</div>;
  }
}

export default Index;
