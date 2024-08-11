import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Card, Tabs } from 'antd';
import ResultAnalysis from './LtStudentPage/index';
import QuestionPage from './LtTestQuestions/index';
import InitialData from './LtInitialData/index';

const { TabPane } = Tabs;

@connect(({ LtExamInfo, CodeSelect }) => ({
  LtExamInfo,
  CodeSelect,
}))
class Index extends Component {
  // 页面加载时调用，经常用于初始化下拉选择的数据结构
  componentDidMount() {
    const { dispatch } = this.props;

    // 批量加载码表数据
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'testpaperclassify,composetype,status',
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
  }

  onTabChange = (key, type) => {
    this.setState({ [type]: key });
  };

  render() {
    return (
      <Fragment>
        <Card
          bordered={false}
          onTabChange={key2 => {
            this.onTabChange(key2, 'key');
          }}
        >
          <Tabs style={{ marginTop: 20 }} defaultActiveKey="1">
            <TabPane tab={formatMessage({ id: 'LtExamInfosNaire.questionAnalysis' })} key="1">
              <QuestionPage />
            </TabPane>
            <TabPane tab={formatMessage({ id: 'LtExamInfosNaire.resultAnalysis' })} key="2">
              <ResultAnalysis />
            </TabPane>
            <TabPane tab={formatMessage({ id: 'LtExamInfosNaire.originalData' })} key="3">
              <InitialData />
            </TabPane>
          </Tabs>
        </Card>
      </Fragment>
    );
  }
}

export default Index;
