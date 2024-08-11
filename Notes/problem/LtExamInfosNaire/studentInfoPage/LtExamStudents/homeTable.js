import commonStyle from '@/assets/styles/project.less';
import AdvancedTable from '@/components/AdvancedTable';
import ExcelDragFileUpload from '@/components/ExcelDragFileUpload';
import StudentCenter from '@/components/StudentCenter/homeTable';
import TemplateDown from '@/components/TemplateDown';
import { dateformat2, findValueByKey, isZh } from '@/utils/utils';
import { Button, Icon, message, Modal } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
@connect(({ LtExamStudentsSurvey, loading, CodeSelect, pubfile, LtExamInfoNaire }) => ({
  LtExamStudentsSurvey,
  pubfile,
  LtExamInfoNaire,
  CodeSelect,
  loading: loading.models.LtExamStudentsSurvey || loading.models.pubfile,
}))
class Home extends PureComponent {
  // 页面加载时调用，经常用于初始化下拉选择的数据结构
  componentDidMount() {
    this.onRefresh();
  }

  onRefresh = () => {
    const {
      dispatch,
      LtExamInfoNaire: { currData },
    } = this.props;

    const values = {};
    values.examCode = currData.examCode; // 根据班级编码查询出这个班级有哪些培训编码list
    dispatch({
      type: 'LtExamStudentsSurvey/fetchBingStudent',
      queryPara: values,
    });
  };

  // 关闭弹窗。type为1的时候刷新数据
  handleCancel = type => {
    const { dispatch } = this.props;
    dispatch({
      type: 'LtExamStudentsSurvey/visibleState',
      visible: false,
      modalType: undefined,
      modalTitle: undefined,
    });
    this.onRefresh();
  };

  // 打开弹窗，根据不同的modalType渲染弹窗内容
  showModal = (modalType, modalTitle) => {
    const {
      dispatch,
      LtExamInfoNaire: { currData },
    } = this.props;
    dispatch({ type: 'LtExamStudentsSurvey/visibleState', visible: true, modalType, modalTitle });
  };

  // 查询表格的列定义
  getColumns = () => {
    const {
      CodeSelect,
      dispatch,
      LtExamInfoNaire: { currData, currView },
    } = this.props;

    const columns = [
      {
        title: formatMessage({ id: 'LtStudentInfo.staffCode' }),
        dataIndex: 'staffCode',
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.name' }),
        dataIndex: 'name',
        fixed: 'left',
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.branchType' }),
        dataIndex: 'branchType',
        hideInTable: true,
        render: text => {
          return findValueByKey(CodeSelect.branchTypeMap, text);
        },
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
        title: formatMessage({ id: 'LtStudentInfo.sex' }),
        dataIndex: 'sex',
        hideInTable: true,
        render: text => {
          return findValueByKey(CodeSelect.sexMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.birthday' }),
        dataIndex: 'birthday',
        hideInTable: true,
        render: text => {
          return dateformat2(text);
        },
      },
      // {
      //   title: formatMessage({ id: 'LtStudentInfo.agentGrade' }),
      //   dataIndex: 'agentGrade',
      //   render: text => {
      //     return findValueByKey(CodeSelect.agentGradeMap, text);
      //   },
      // },
      // {
      //   title: formatMessage({ id: 'LtStudentInfo.agentGroup' }),
      //   dataIndex: 'agentGroup',
      //   render: text => {
      //     return CodeSelect.agentGroupMap[text];
      //   },
      // },
      {
        title: formatMessage({ id: 'LtStudentInfo.employDate' }),
        dataIndex: 'employDate',
        hideInTable: true,
        render: text => {
          return dateformat2(text);
        },
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.idNoType' }),
        dataIndex: 'idNoType',
        hideInTable: true,
        render: text => {
          return findValueByKey(CodeSelect.idNoTypeMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.idNo' }),
        dataIndex: 'idNo',
        hideInTable: true,
      },
      {
        title: formatMessage({ id: 'LtStudentInfo.phone' }),
        dataIndex: 'phone',
        hideInTable: true,
      },

      {
        title: formatMessage({ id: 'LtStudentInfo.mulAuth' }),
        dataIndex: 'mulAuth',
        hideInTable: true,
        render: text => {
          return findValueByKey(CodeSelect.yesOrNoMap, text);
        },
      },
      {
        title: formatMessage({ id: 'global.operate' }),
        dataIndex: 'global.operate',
        width: 135,
        fixed: 'right',
        render: (text, record) => (
          <Fragment>
            {currView !== 'detail' ? (
              <span>
                <a
                  onClick={() =>
                    dispatch({
                      type: 'LtExamStudentsSurvey/batchRemoveBinding',
                      payload: {
                        studentId: record.id,
                        examCode: currData.examCode, // 考试编码
                      },
                      callback: () => {
                        // 重置下
                        dispatch({
                          type: 'LtExamStudentsSurvey/reSet',
                        });
                        // 查询一次
                        const values = {};
                        values.examCode = currData.examCode; // 根据考试编码查询出这个班级有哪些学员编码list
                        dispatch({
                          type: 'LtExamStudentsSurvey/fetchBingStudent',
                          queryPara: values,
                        });
                      },
                    })
                  }
                >
                  <Icon type="delete" /> <FormattedMessage id="global.remove" />
                </a>
              </span>
            ) : (
              '/'
            )}
          </Fragment>
        ),
      },
    ];
    return columns;
  };

  meetingBoard = () => {
    const {
      dispatch,
      LtExamStudentsSurvey: { data, queryPara, queryParaSize },
    } = this.props;

    if (data.list.length === 0) {
      message.error(formatMessage({ id: 'global.resultNullNotGenerate' }));
      return;
    }
    queryPara.size = queryParaSize;
    dispatch({
      type: 'pubfile/createFileAndDown',
      queryPara,
      payload: { serviceType: 'meetingBoard', queryParam: queryPara },
      filename: `${queryPara.examCode}-MeetingBoard.pdf`,
    });
  };

  render() {
    const {
      LtExamStudentsSurvey: { data, queryPara, selectedIds, modalTitle, modalType, visible },
      LtExamInfoNaire: { currData },
      loading,
    } = this.props;

    const rowSelection = {
      // 展示复选框的条件
      canSelectOption: false,
      // 选中的keys
      selectedRowKeys: selectedIds,
      // 不可选的条件
      disabledOption: record => ({
        // Column configuration not to be checked 根据实际情况处理
        disabled: record.status === '01',
      }),
    };

    return (
      <div className={isZh() ? commonStyle.standardList : commonStyle.standardListUs}>
        <Fragment>
          <Modal
            title={modalTitle}
            width="70%"
            destroyOnClose
            visible={visible}
            onCancel={this.handleCancel}
            footer={[
              <Button key="back" onClick={this.handleCancel}>
                <FormattedMessage id="global.closeup" />
              </Button>,
            ]}
            maskClosable={false}
            // closable={false}
            closable
          >
            {(modalType === 'addStudent' && (
              <StudentCenter
                bindingCallBack={{
                  bindingMethod: 'LtExamInfosNaire/batchBinding',
                  // bindingPara 在公共页面增加选中的培训清单
                  bindingPara: {
                    examCode: currData.examCode, // 群组编码
                    testPaperCode: currData.testPaperCode,
                  },
                }}
                callback={this.handleCancel}
                spin={loading}
              />
            )) ||
              (modalType === 'importStudent' && (
                <>
                  <TemplateDown
                    templateType="考试学员导入"
                    templateName={formatMessage({ id: 'LtExamInfosNaire.studyImport' })}
                  />
                  <ExcelDragFileUpload
                    serviceType="LtSurveyStudent"
                    foreignCodeObj={{ foreignCode: currData.examCode }}
                    callback={() => this.handleCancel('1')}
                  />
                </>
              ))}
          </Modal>
          <AdvancedTable
            namespace="LtExamStudentsSurvey"
            queryPara={queryPara}
            data={data}
            columns={this.getColumns()}
            rowSelection={rowSelection}
            loading={loading}
            queryMethod="fetchBingStudent"
            canSingleAdd
            singleAddButtonTitle={formatMessage({ id: 'global.addStudent' })}
            singleAddMethod={() =>
              this.showModal('addStudent', formatMessage({ id: 'global.addStudent' }))
            }
            canExcelAdd
            excelAddButtonTitle={formatMessage({ id: 'LtCourseProgramEnroll.importStudy' })}
            excelAddMethod={() =>
              this.showModal('importStudent', formatMessage({ id: 'global.batchImport' }))
            }
          />
        </Fragment>
      </div>
    );
  }
}

export default Home;
