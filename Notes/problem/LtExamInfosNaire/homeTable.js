import commonStyle from '@/assets/styles/project.less';
import AdvancedTable from '@/components/AdvancedTable';
import AudienceCenter from '@/components/AudienceCenter';
import CourseTeacher from '@/components/CourseTeachersCenter/homeTable';
import { dateformat, isZh } from '@/utils/utils';
import { Button, Card, Divider, Modal, Switch,message } from 'antd';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import QuerySimple from './querySimple';
import QrCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { getBusiness, getEnv } from '@/utils/envUtil';

const curEnv = getEnv(); // curEnv：DEV\SIT\UAT\PRD
const curBusiness = getBusiness(); // curBusiness: TJ\JT    TJ表示铁军 、JT表示集团

const getWindowHeight = () => window.innerHeight || document.documentElement.clientHeight;
const screenHeight = getWindowHeight() - 200;

@connect(({ LtExamInfoNaire, loading, CodeSelect }) => ({
  LtExamInfoNaire,
  CodeSelect,
  loading: loading.models.LtExamInfoNaire,
}))
class Home extends PureComponent {
  state = {
    qrUrl: '',
    carQrUrl: '',
  };
  componentDidMount() {
    const {
      dispatch,
      LtExamInfoNaire: { queryPara, queryParaSize },
    } = this.props;
    // 根据不同的页面功能，加载数据
    if (queryPara.size === queryParaSize) {
      delete queryPara.size;
    }
    queryPara.dataCate_equals = 'survey';
    queryPara.sourceFrom_equals = 'common';
    queryPara.sort = 'createdDate,desc';
    dispatch({ type: 'LtExamInfoNaire/fetch', queryPara });
  }

  // 查询表格的列定义
  getColumns = () => {
    const { loading, dispatch } = this.props;
    const date = new Date()
    const columns = [
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examCode' }),
        dataIndex: 'examCode',
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examName' }),
        dataIndex: 'examName',
        width: 300,
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examNote' }),
        dataIndex: 'examNote',
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examBeginTime' }),
        dataIndex: 'examBeginTime',
        render: text => {
          return dateformat(text);
        },
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.examEndTime' }),
        dataIndex: 'examEndTime',
        render: text => {
          return dateformat(text);
        },
      },
      // {
      //   title: formatMessage({ id: 'LtExamInfoNaire.testPaperCode' }),
      //   dataIndex: 'testPaperCode',
      // },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.sourceFrom' }),
        dataIndex: 'sourceFrom',
        render: text => {
          if (text === 'common') {
            return formatMessage({ id: 'LtExamInfosNaire.conventionQuestion' });
          }
          if (text === 'train') {
            return formatMessage({ id: 'LtExamInfosNaire.classQuestion' });
          }
          return '';
        },
      },
      {
        title: formatMessage({ id: 'LtExamInfoNaire.status' }),
        dataIndex: 'status',
        fixed: 'right',
        render: (text, record) =>
          record.sourceFrom === 'common' ? (
            <Fragment>
              <Switch
                checked={text === '1'}
                loading={loading}
                checkedChildren={formatMessage({ id: 'global.enable' })}
                unCheckedChildren={formatMessage({ id: 'global.disable' })}
                onChange={e => this.handleSubmit(e, record)}
              />
            </Fragment>
          ) : text === '0' ? (
            formatMessage({ id: 'global.disable' })
          ) : (
            formatMessage({ id: 'global.enable' })
          ),
        export: text => {
          return text === '0'
            ? formatMessage({ id: 'global.disable' })
            : formatMessage({ id: 'global.enable' });
        },
      },
      {
        title: formatMessage({ id: 'global.operate' }),
        dataIndex: 'global.operate',
        width: 250,
        fixed: 'right',
        render: (text, record) => (
          <Fragment>
            {record.sourceFrom === 'common' && record.status === '0' && (
              <>
                <a
                  onClick={() =>
                    dispatch({
                      type: 'LtExamInfoNaire/openView',
                      view: 'edit',
                      currData: record,
                    })
                  }
                >
                  <FormattedMessage id="global.edit" />
                </a>
                <Divider type="vertical" />
              </>
            )}

            <a onClick={() => this.showModal1(record)}>
              <FormattedMessage id="AudienceCenter.audience" />
            </a>
            <Divider type="vertical" />
            <a
              onClick={() =>
                dispatch({
                  type: 'LtExamInfoNaire/openView',
                  view: 'detail',
                  currData: record,
                })
              }
            >
              <FormattedMessage id="global.analysis" />
            </a>
            {record.status == '1' && date<new Date(record.examEndTime)? (
                <>
                  <Divider type="vertical" />
                  <a onClick={() => this.showModal(record)}>
                    <FormattedMessage id="global.QrCode" />
                  </a>
                </>
              ) : null}
          </Fragment>
        ),
      },
    ];
    return columns;
  };

  showModal = record => {
    const { dispatch } = this.props;
    dispatch({ type: 'LtExamInfoNaire/changeVisible', visible: true, currData: record });
    const currentUrl = window.location.href;
    const urlParams = {
      testPaperCode: record.testPaperCode,
      examCode: record.examCode,
      // requestType: 'qrCode',
    };
    if (curBusiness === 'JT') {
      if (curEnv === 'PRD') {
        this.setState({
          qrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww5614ccf1c02e6d99&redirect_uri=https%3a%2f%2fweixin.byd.com%2fadmin%2fapp%2fauth?backurl=https%3A%2F%2Fweixin.byd.com%3A13918%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=bb71686b76c945899b6e03bc3c869fda#wechat_redirect`,
        });
        // 国际版
        this.setState({
          carQrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww14bb84b99b9c6fed&redirect_uri=https%3a%2f%2fwecom-th.byd.com%2fapi%2fauth?backurl=https%3A%2F%2Flms.byd.com%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=f354a511e0774f8f8160f85b66be6d82#wechat_redirect`,
        });
      } else {
        this.setState({
          qrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww5614ccf1c02e6d99&redirect_uri=https%3a%2f%2fweixin.byd.com%2fadmin%2fapp%2fauth?backurl=https%3A%2F%2Fweixin.byd.com%3A13917%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=bb71686b76c945899b6e03bc3c869fda#wechat_redirect`,
        });
        // 国际版
        this.setState({
          carQrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww14bb84b99b9c6fed&redirect_uri=https%3a%2f%2fwecom-th.byd.com%2fapi%2fauth?backurl=https%3A%2F%2Flms.byd.com%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=f354a511e0774f8f8160f85b66be6d82#wechat_redirect`,
        });
      }
    } else {
      if (curEnv === 'PRD') {
        this.setState({
          qrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww5614ccf1c02e6d99&redirect_uri=https%3a%2f%2fweixin.byd.com%2fadmin%2fapp%2fauth?backurl=https%3A%2F%2Fweixin.byd.com%3A13920%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=bb71686b76c945899b6e03bc3c869fda#wechat_redirect`,
        });
        // 汽车企微
        this.setState({
          carQrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx7a22c6916657c82e&redirect_uri=https%3A%2F%2Fe-lms.byd.com%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=TJ#wechat_redirect`,
        });
      } else {
        this.setState({
          qrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=ww5614ccf1c02e6d99&redirect_uri=https%3a%2f%2fweixin.byd.com%2fadmin%2fapp%2fauth?backurl=https%3A%2F%2Fweixin.byd.com%3A13919%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=bb71686b76c945899b6e03bc3c869fda#wechat_redirect`,
        });
        // 汽车企微
        this.setState({
          carQrUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx7a22c6916657c82e&redirect_uri=https%3A%2F%2Fe-lms-uat.byd.com%2Fmob%2F%3FredirectUrl%3DexamNaire%2Fexam?data=${encodeURIComponent(
            encodeURIComponent(JSON.stringify(urlParams))
          )}&response_type=code&scope=snsapi_userinfo&state=TJ#wechat_redirect`,
        });
      }
    }
  };

  // 提交
  handleSubmit = (checked, record) => {
    const { dispatch } = this.props;
    const newRecord = JSON.parse(JSON.stringify(record));
    newRecord.status = checked ? '1' : '0';

    dispatch({
      type: 'LtExamInfoNaire/update',
      payload: newRecord,
      callback: () => {
        this.componentDidMount();
      },
    });
  };

  showModalem = record => {
    const {
      dispatch,
      LtExamInfoNaire: { modalVisible },
    } = this.props;
    modalVisible[record.id] = true;

    dispatch({
      type: 'LtExamInfoNaire/visibleChange',
      visible: modalVisible,
      currData: record,
    });
  };

  handleCancel = record => {
    const {
      dispatch,
      LtExamInfoNaire: { modalVisible },
    } = this.props;
    modalVisible[record.id] = false;

    dispatch({ type: 'LtExamInfoNaire/visibleChange', visible: modalVisible, currData: {} });
  };
  handleCancel1 = record => {
    const {
      dispatch,
    } = this.props;
    dispatch({ type: 'LtExamInfoNaire/audienceVisibleChange', visible: false, currData: {} });
  };

  // 模态框
  showModal1 = record => {
    const { dispatch } = this.props;

    dispatch({
      type: 'LtExamInfoNaire/audienceVisibleChange',
      visible: true,
      currData: record,
    });
  };

  // 弹出关闭按钮
  handleCancel4 = () => {
    console.log(2313)
    const { dispatch } = this.props;
    dispatch({ type: 'LtExamInfoNaire/changeVisible', visible: false, currData: {} });
  };

  render() {
    const {
      LtExamInfoNaire: { selectedIds, queryPara, data, modalVisible, currData, audienceVisible,visible },
      loading,
    } = this.props;
    const { qrUrl, carQrUrl } = this.state;
    const rowSelection = {
      // 展示复选框的条件
      canSelectOption: false,
      // 选中的keys
      selectedRowKeys: selectedIds,
      // 不可选的条件
      disabledOption: () => ({
        // Column configuration not to be checked 根据实际情况处理
      }),
    };

    return (
      <div className={isZh() ? commonStyle.standardList : commonStyle.standardListUs}>
        <Fragment>
          <Modal
            title={formatMessage({ id: 'AudienceCenter.audience' })}
            width="80%"
            destroyOnClose
            visible={audienceVisible}
            bodyStyle={{ height: screenHeight, overflowY: 'auto' }}
            maskClosable={false}
            footer={null}
            closable
            onCancel={() => this.handleCancel1(currData)}
          >
            <AudienceCenter
              parentPara={{
                resourceType: 'survey',
                resourceCode: currData.examCode,
              }}
              callback={() => this.handleCancel1(currData)}
              inProgress={loading}
              hideType={['student']}
            />
          </Modal>

          <Modal
            title="问卷授权"
            width="80%"
            destroyOnClose
            visible={modalVisible[currData.id] ? modalVisible[currData.id] : false}
            maskClosable={false}
            footer={[
              <Button key="back" onClick={() => this.handleCancel(currData)}>
                <FormattedMessage id="global.closeup" />
              </Button>,
            ]}
            closable
            onCancel={() => this.handleCancel(currData)}
          >
            <CourseTeacher canEdit teacherCode={currData.teacherCode} />
          </Modal>
          <Modal
            title={formatMessage({ id: 'global.QrCode' })}
            width="80%"
            destroyOnClose
            visible={visible}
            onCancel={this.handleCancel4}
            footer={[
              <Button key="back" onClick={this.handleCancel4}>
                <FormattedMessage id="global.closeup" />
              </Button>,
            ]}
            maskClosable={false}
          >
            <div
              style={{
                borderRadius: '10px',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                <div>
                  {formatMessage({ id: 'LtExamInfoNaire.examName' })}: {currData.examName}
                </div>
                {/* <div
                  style={{
                    marginTop: '20px',
                  }}
                >
                  {formatMessage({ id: 'LtExamInfo.examOpenTime' })}:{' '}
                  {`${dateformat(currData.examBeginTime)} - ${dateformat(currData.examEndTime)}`}
                </div> */}
              </div>
              <div style={{ display: 'flex' }}>
                <div>
                  <QrCode value={qrUrl} size={270} style={{ margin: '10px' }} />
                  <div
                    style={{
                      margin: '0 auto',
                      textAlign: 'center',
                      marginTop: '20px',
                    }}
                  >
                    <CopyToClipboard
                      text={qrUrl}
                      onCopy={() =>
                        message.success(formatMessage({ id: 'app.setting.copysuccess' }))
                      }
                    >
                      <a>
                        <FormattedMessage id="CourseMeeting.copyUrl" />
                      </a>
                    </CopyToClipboard>
                  </div>
                </div>
                {curBusiness === 'TJ' ? (
                  <div>
                    <QrCode value={carQrUrl} size={270} style={{ margin: '10px' }} />
                    <div
                      style={{
                        margin: '0 auto',
                        textAlign: 'center',
                        marginTop: '20px',
                      }}
                    >
                      <CopyToClipboard
                        text={carQrUrl}
                        onCopy={() =>
                          message.success(formatMessage({ id: 'app.setting.copysuccess' }))
                        }
                      >
                        <a>
                          <FormattedMessage id="CourseMeeting.copyUrl.car" />
                        </a>
                      </CopyToClipboard>
                    </div>
                  </div>
                ) : (
                  <div>
                    <QrCode value={carQrUrl} size={270} style={{ margin: '10px' }} />
                    <div
                      style={{
                        margin: '0 auto',
                        textAlign: 'center',
                        marginTop: '20px',
                      }}
                    >
                      <CopyToClipboard
                        text={carQrUrl}
                        onCopy={() =>
                          message.success(formatMessage({ id: 'app.setting.copysuccess' }))
                        }
                      >
                        <a>
                          <FormattedMessage id="CourseMeeting.copyInternationalUrl" />
                        </a>
                      </CopyToClipboard>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal>
          <Card bordered={false}>
            <QuerySimple />
          </Card>
          <AdvancedTable
            namespace="LtExamInfoNaire"
            queryPara={queryPara}
            data={data}
            columns={this.getColumns()}
            rowSelection={rowSelection}
            loading={loading}
            canSingleAdd
            needCreatedBy
          />
        </Fragment>
      </div>
    );
  }
}

export default Home;
