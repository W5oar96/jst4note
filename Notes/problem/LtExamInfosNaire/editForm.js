import commonStyle from '@/assets/styles/project.less';
import CoverCenter from '@/components/CoverCenter';
import TestPapersCenter from '@/components/TestPapersCenter/index';
import { generateStr } from '@/utils/utils';
import { Button, Col, DatePicker, Drawer, Form, Input, message, Row, Spin } from 'antd';
import { connect } from 'dva';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';

const FormItem = Form.Item;
const { TextArea } = Input;

@connect(({ LtExamInfoNaire, loading, CodeSelect }) => ({
  LtExamInfoNaire,
  CodeSelect,
  submitting: loading.models.LtExamInfoNaire,
}))
@Form.create()
class EditForm extends PureComponent {
  state = {
    visible1: false,
  };

  // 提交
  handleSubmit = e => {
    const { dispatch, form, LtExamInfoNaire, stepFlag } = this.props;
    const { currData, current } = LtExamInfoNaire;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      const data = JSON.parse(JSON.stringify(currData || {}));
      if (!err) {
        // 将表单里的数据，同key覆盖
        Object.keys(values).map(key => {
          data[key] = values[key];
          return data;
        });

        const v2 = form.getFieldValue('dueStartTimeAndDueFinishTime');
        if (v2 == null) {
          message.error(formatMessage({ id: 'LtExamInfos.timeNoEmpty' }));
          return;
        }
        // eslint-disable-next-line prefer-destructuring
        data.examBeginTime = v2[0];
        // eslint-disable-next-line prefer-destructuring
        data.examEndTime = v2[1];
        data.minExamDuration = 0;

        const curTime = moment();

        if (data.examBeginTime === data.examEndTime && data.examBeginTime < curTime) {
          message.error(formatMessage({ id: 'LtExamInfos.endPassStart' }));
          return;
        }

        if (data.examBeginTime < curTime) {
          message.error(formatMessage({ id: 'LtExamInfos.startThenEnd' }));
          return;
        }
        data.dataCate = 'survey';
        data.examDuration = 0;
        delete data.dueStartTimeAndDueFinishTime;
        let type = '';
        if (LtExamInfoNaire.op === 'update' || data.id > 0) {
          type = 'LtExamInfoNaire/update';
        } else {
          // 新增时为常规考试
          data.sourceFrom = 'common';
          data.examCode = generateStr();
          data.status = '0';
          type = 'LtExamInfoNaire/add';
        }

        dispatch({
          type,
          payload: data,
          callback: resp => {
            if (stepFlag === '1') {
              if (resp.flg === 'error') {
                message.error(resp.msg);
              } else {
                message.success(formatMessage({ id: 'global.save.success' }));
                dispatch({ type: 'LtExamInfoNaire/stepState', current: current + 1 });
              }
            } else {
              dispatch({
                type: 'LtExamInfoNaire/openView',
                view: 'home',
                op: '',
                currData: {},
              });
            }
          },
        });
      }
    });
  };

  // 设置试卷
  setTestPaper = selectedRows => {
    const { form, CodeSelect } = this.props;
    form.setFieldsValue({ testPaperCode: selectedRows[0].testPaperCode });
    form.setFieldsValue({ testPaperName: selectedRows[0].testPaperName });
    this.setState({ visible1: false });
  };

  // 重置试卷
  clearTestPaper = () => {
    const { form } = this.props;
    form.setFieldsValue({ testPaperCode: undefined, testPaperName: undefined });
  };

  onClose1 = () => {
    this.setState({ visible1: false });
  };

  disabledDate = current => {
    // Can not select days before today
    return (
      current &&
      current <
        moment()
          .subtract(1, 'days')
          .endOf('day')
    );
  };

  render() {
    const {
      form: { getFieldDecorator, getFieldValue },
      submitting,
      LtExamInfoNaire,
      CodeSelect,
    } = this.props;
    const { Search } = Input;
    const { currData } = LtExamInfoNaire;
    const { visible1 } = this.state;

    // 试卷
    const selectRow1 = [];
    if (getFieldValue('testPaperCode')) {
      selectRow1.push(getFieldValue('testPaperCode'));
    }

    return (
      <div>
        <Fragment>
          <Spin
            spinning={submitting === undefined ? false : submitting}
            tip={<FormattedMessage id="global.spin.tips" />}
          >
            <Form
              {...CodeSelect.formItemLayoutCol1}
              onSubmit={this.handleSubmit}
              style={{ marginTop: 8 }}
              layout="horizontal"
            >
              <FormItem
                label={
                  <>
                    <span className={commonStyle.redStar}>*</span>
                    <FormattedMessage id="LtExamInfoNaire.examCover" /> &nbsp;&nbsp;
                    <br />
                    (750x420) &nbsp;&nbsp;
                    <br />
                    (16:9)
                  </>
                }
              >
                <CoverCenter
                  namespace="LtExamInfoNaire"
                  inFile={currData.examCover}
                  setMethod="setCurrImg"
                />
              </FormItem>
              <FormItem label={<FormattedMessage id="LtExamInfo.publishUnit" />}>
                {getFieldDecorator('publishUnit', {
                  initialValue: currData.publishUnit,
                })(
                  <Input
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtExamInfo.publishUnit' })
                    }
                    allowClear
                    autoComplete="off"
                    maxLength={100}
                  />
                )}
              </FormItem>
              {/* <FormItem label={<FormattedMessage id="LtExamInfo.examType" />}>
                {getFieldDecorator('examType', {
                  initialValue:
                    currData.examType === undefined
                      ? CodeSelect.examTypeDefault
                      : currData.examType,
                })(
                  <Select
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    placeholder={
                      formatMessage({ id: 'global.select.placeholder' }) +
                      formatMessage({ id: 'LtExamInfo.examType' })
                    }
                  >
                    {CodeSelect.surveyType.map(item => (
                      <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                    ))}
                  </Select>
                )}
              </FormItem> */}
              <FormItem label={<FormattedMessage id="LtExamInfoNaire.examName" />}>
                {getFieldDecorator('examName', {
                  initialValue: currData.examName,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'LtExamInfoNaire.examName',
                      }),
                    },
                  ],
                })(
                  <Input
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtExamInfoNaire.examName' })
                    }
                    allowClear
                    autoComplete="off"
                    maxLength={100}
                  />
                )}
              </FormItem>
              <FormItem label={<FormattedMessage id="LtExamInfosNaire.questionTime" />}>
                {getFieldDecorator('dueStartTimeAndDueFinishTime', {
                  initialValue: currData.examBeginTime
                    ? [moment(currData.examBeginTime), moment(currData.examEndTime)]
                    : [moment().add(10, 'minutes'), moment().add(70, 'minutes')],
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'LtExamInfosNaire.questionTime' }),
                    },
                  ],
                })(
                  <DatePicker.RangePicker
                    disabledDate={this.disabledDate}
                    showTime={{ format: 'HH:mm', minuteStep: 10 }}
                    allowClear
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder={[
                      formatMessage({ id: 'LtExamInfoNaire.examBeginTime' }),
                      formatMessage({ id: 'LtExamInfoNaire.examEndTime' }),
                    ]}
                  />
                )}
              </FormItem>
              {getFieldDecorator('testPaperCode', { initialValue: currData.testPaperCode })},
              <FormItem label={<FormattedMessage id="LtExamInfosNaire.questionResource" />}>
                <Row gutter={8}>
                  <Col span={20}>
                    {getFieldDecorator('testPaperName', {
                      initialValue: currData.testPaperName,
                      rules: [
                        {
                          required: true,
                          message: formatMessage({ id: 'LtExamInfosNaire.questionResource' }),
                        },
                      ],
                    })(
                      <Search
                        readOnly
                        placeholder={
                          formatMessage({ id: 'global.select.placeholder' }) +
                          formatMessage({ id: 'LtExamInfoNaire.testPaperCode' })
                        }
                        enterButton={formatMessage({ id: 'LtExamInfosNaire.selectQuestion' })}
                        onSearch={() => this.setState({ visible1: true })}
                      />
                    )}
                  </Col>
                  <Col span={4}>
                    <Button
                      type="primary"
                      onClick={this.clearTestPaper}
                      key={`B_${Math.random() * 100}`}
                    >
                      <FormattedMessage id="global.reset" />
                    </Button>
                  </Col>
                </Row>
              </FormItem>
              <FormItem label={<FormattedMessage id="LtExamInfoNaire.examNote" />}>
                {getFieldDecorator('examNote', {
                  initialValue: currData.examNote,
                })(
                  <TextArea
                    rows={4}
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtExamInfoNaire.examNote' })
                    }
                    allowClear
                    autoComplete="off"
                  />
                )}
              </FormItem>
              <Row style={{ marginTop: 32, textAlign: 'center' }}>
                <Button style={{ margin: 8 }} type="primary" loading={submitting} htmlType="submit">
                  <FormattedMessage id="global.save" />
                </Button>
              </Row>
            </Form>
            <Drawer
              width="80%"
              title={formatMessage({ id: 'LtExamInfosNaire.selectQuestion' })}
              placement="right"
              onClose={this.onClose1}
              visible={visible1}
              destroyOnClose
            >
              {
                <TestPapersCenter
                  selectType="radio"
                  bindingCallBack={{
                    bindingMethod: null,
                    // bindingPara 在公共页面增加选中的试卷清单
                    bindingPara: {
                      examCode: currData.examCode, // 绑定编码
                      dataCate: 'survey',
                    },
                  }}
                  selectRow={selectRow1}
                  callback={this.setTestPaper}
                />
              }
            </Drawer>
          </Spin>
        </Fragment>
      </div>
    );
  }
}

export default EditForm;
