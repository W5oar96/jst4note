import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import Home from './homeTable';

@connect(({ LtInitialData, LtExamInfoNaire, loading }) => ({
  LtInitialData,
  LtExamInfoNaire,
  loading: loading.models.LtInitialData || loading.models.LtExamInfoNaire,
}))
class Index extends PureComponent {
  componentDidMount() {
    const { dispatch, LtExamInfoNaire } = this.props;
    // 每次点击菜单进入home页面
    dispatch({ type: 'LtInitialData/openView', view: 'home', op: '', currData: {} });
    const values = {};
    values.examCode = LtExamInfoNaire.currData.examCode; // XXX业务主键查询数据库,初始化基本表格数据
    values.size = 1000;
    dispatch({
      type: 'LtInitialData/fetch',
      queryPara: values,
    });
  }

  render() {
    return (
      <div>
        <Home />
      </div>
    );
  }
}

export default Index;
