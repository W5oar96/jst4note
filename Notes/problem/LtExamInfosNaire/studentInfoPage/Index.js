import commonStyle from '@/assets/styles/project.less';
import { message, Row } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi/locale';
import LtExamStudents from './LtExamStudents/homeTable';

// eslint-disable-next-line no-shadow
@connect(({ loading, LtExamStudentsSurvey, LtExamStudentStep, LtExamInfoNaire }) => ({
  LtExamInfoNaire,
  LtExamStudentsSurvey,
  LtExamStudentStep,
  loading: loading.models.LtExamStudentsSurvey,
}))
class Index extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: 'LtExamStudentStep/visibleState', visible: false });
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'initgrade,sex,agentgrade,agentstate,jobposition,stuflag,idnotype,tradesource',
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

  showModal = () => {
    const { dispatch } = this.props;
    dispatch({ type: 'LtExamStudentStep/visibleState', visible: true });
  };

  // 弹出关闭按钮
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({ type: 'LtExamStudentStep/visibleState', visible: false });
    // 刷新主界面的数据
    const {
      LtExamInfoNaire: { currData },
    } = this.props;

    const values = {};
    values.examCode = currData.examCode; // 根据班级编码查询出这个班级有哪些培训编码list
    dispatch({
      type: 'LtExamStudentsSurvey/fetchBingStudent',
      queryPara: values,
    });
  };

  next = () => {
    const {
      dispatch,
      LtExamStudentsSurvey: { data },
      LtExamInfoNaire: { current },
    } = this.props;
    console.log(data);
    if (data.list.length === 0) {
      message.error(formatMessage({ id: 'LtExamInfos.pleaseAddStudent' }));
      return;
    }
    // dispatch({
    //   type: 'LtTestQuestion/fetchMarks',
    //   payload: {
    //     testPaperCode: LtExamInfoNaire.currData.testPaperCode,
    //   },
    // });
    dispatch({ type: 'LtExamInfoNaire/stepState', current: current + 1 });
  };

  render() {
    const {
      LtExamInfoNaire: { currData },
      LtExamStudentStep: { visible },
      stepFlag,
      loading,
    } = this.props;

    return (
      <div className={commonStyle.cardStyle}>
        <LtExamStudents />
        {stepFlag === '1' ? (
          <Row
            style={{
              marginTop: 32,
              textAlign: 'center',
            }}
          >
            {/* <Button style={{ marginLeft: 8 }} type="primary" loading={loading} onClick={this.next}></Button> */}
          </Row>
        ) : null}
      </div>
    );
  }
}

export default Index;
