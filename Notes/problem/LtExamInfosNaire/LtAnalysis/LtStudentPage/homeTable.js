import commonStyle from '@/assets/styles/project.less';
import AdvancedTable from '@/components/AdvancedTable';
import SurveyResult from '@/pages/LtCourseProgram/EnrollVO/survey/surveyDetail/surveyResult';
import { dateformat, findValueByKey, isZh } from '@/utils/utils';
import { Card, Form, Modal, Spin } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import QuerySimple from './querySimple';

@connect(({ LtStudentsSurveyInAnalysis, LtExamInfoNaire, loading, CodeSelect }) => ({
  LtStudentsSurveyInAnalysis, // 中间表
  LtExamInfoNaire, // 试卷表

  CodeSelect, // 查询表格列
  loading: loading.models.LtStudentsSurveyInAnalysis,
}))
@Form.create()
class Home extends PureComponent {
  // 页面加载时调用
  componentDidMount() {}

  // 获取已经存在的题目
  // 查询表格的列定义
  getColumns = () => {
    const { dispatch, CodeSelect, loading } = this.props;

    return [
      {
        title: formatMessage({ id: 'LtStudentInfo.staffCode' }),
        dataIndex: 'staffCode',
        noSort: true,
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.name' }),
        dataIndex: 'studentName',
        noSort: true,
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.manageCom' }),
        dataIndex: 'manageCom',
        width: 260,
        render: text => {
          return findValueByKey(CodeSelect.manageComDataAllMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examBeginTime' }),
        dataIndex: 'startTime',
        render: text => {
          return text ? dateformat(text) : null;
        },
        noSort: true,
      },
      {
        title: formatMessage({ id: 'LtExamStudent.surveyEndTime' }),
        dataIndex: 'endTime',
        render: text => {
          return text ? dateformat(text) : null;
        },
        noSort: true,
      },
      {
        title: formatMessage({ id: 'LtExamStudent.examState' }),
        dataIndex: 'examState',
        fixed: 'right',
        render: (text, record) => {
          return findValueByKey(CodeSelect.surveyStateMap, text);
        },
      },
      {
        title: formatMessage({ id: 'global.operate' }),
        dataIndex: 'global.operate',
        width: 150,
        fixed: 'right',
        render: (text, record) => (
          <Fragment>
            {record.examState === '02' ? (
              <a onClick={() => this.showModal(record)}>
                <FormattedMessage id="LtTrainProgram.surveyDetail" />
              </a>
            ) : (
              <></>
            )}
          </Fragment>
        ),
      },
    ];
  };

  // 模态框
  showModal = record => {
    const { dispatch } = this.props;

    dispatch({
      type: 'LtStudentsSurveyInAnalysis/visibleChange',
      visibleResult: true,
      currData: record,
    });

    dispatch({
      type: 'LtStudentsSurveyInAnalysis/fetchResult',
      queryPara: {
        examCode: record.examCode,
        testPaperCode: record.testPaperCode,
        trainCode: record.trainCode,
      },
    });
  };

  // 弹出关闭按钮
  handleCancel = record => {
    const { dispatch } = this.props;

    dispatch({
      type: 'LtStudentsSurveyInAnalysis/visibleChange',
      visibleResult: false,
      currData: {},
    });
  };

  render() {
    const {
      LtStudentsSurveyInAnalysis: {
        data,
        selectedIds,
        queryPara,
        visibleResult,
        currData,
        dataResult,
      },
      loading,
    } = this.props;

    const rowSelection = {
      // 展示复选框的条件
      canSelectOption: false,
      // 选中的keys
      selectedRowKeys: selectedIds,
    };

    return (
      <div className={isZh() ? commonStyle.standardList : commonStyle.standardListUs}>
        <Fragment>
          <Spin
            spinning={loading === undefined ? false : loading}
            tip={<FormattedMessage id="global.spin.tips" />}
          >
            <Modal
              title={`${formatMessage({ id: 'LtTrainProgram.surveyResult' })}`}
              width="80%"
              height="70%"
              destroyOnClose
              visible={visibleResult}
              maskClosable={false}
              footer={null}
              closable
              onCancel={() => this.handleCancel(currData)}
            >
              <SurveyResult dataDetail={dataResult} type="surveyResult" />
            </Modal>
            <Card bordered={false}>
              <QuerySimple />
            </Card>
            <AdvancedTable
              namespace="LtStudentsSurveyInAnalysis"
              queryPara={queryPara}
              data={data}
              columns={this.getColumns()}
              rowSelection={rowSelection}
              loading={loading}
            />
          </Spin>
        </Fragment>
      </div>
    );
  }
}

export default Home;
