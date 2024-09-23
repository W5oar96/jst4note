1. ITELS
2. React
3. Ant-design
4. Vue
5. k8s
6. Docker
7. project 1,2,3

雪花算法

import commonStyle from '@/assets/styles/project.less';
import CoverCenter from '@/components/CoverCenter/index';
import { myUploadFn } from '@/services/braft';
import BraftEditorLanguageFn from '@/utils/BraftEditorLanguage.js';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Select,
  Spin
} from 'antd';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';
import { connect } from 'dva';
import moment from 'moment';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { getBusiness } from '@/utils/envUtil';
import SuperSelect from 'antd-virtual-select';

const FormItem = Form.Item;

@connect(({ LtCourseSet, loading, CodeSelect }) => ({
  LtCourseSet,
  CodeSelect,

  submitting: loading.models.LtCourseSet,
}))
@Form.create()
class EditForm extends PureComponent {
  // 提交
  handleSubmit = e => {
    const { dispatch, form, LtCourseSet } = this.props;
    const { currData, current } = LtCourseSet;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      const data = JSON.parse(JSON.stringify(currData || {}));

      if (!err) {
        // 将表单里的数据，同key覆盖
        Object.keys(values).map(key => {
          if (key === 'courseSetDetails') {
            data[key] = values[key].toHTML();
          } else {
            data[key] = values[key];
          }
          return data;
        });

        if (data.src === null || data.src === '' || data.src === undefined) {
          message.error('请选择专题封面');
          return;
        }

        // if (form.getFieldValue('courseSetKeys').length > 2) {
        //   message.error('专题标签选择不能超过2个');
        //   return;
        // }
        if (form.getFieldValue('courseSetKeys').length) {
          data.courseSetKeys = values.courseSetKeys.toString();
        } else {
          delete data.courseSetKeys;
        }
        const v2 = form.getFieldValue('startTimeAndEndTime');
        if (v2 !== undefined && v2 !== null) {
          data.startTime = v2[0].startOf('day');
          data.endTime = v2[1].endOf('day');
          delete data.startTimeAndEndTime;
        }

        let type = '';
        let formData = null;
        if (!currData.id) {
          // 新增操作
          type = 'LtCourseSet/add';
          formData = data;
        }
        if (currData.id) {
          // 修改操作
          type = 'LtCourseSet/update';
          formData = data;
        }
        formData = { ...formData };
        dispatch({
          type,
          payload: formData,
          callback: resp => {
            dispatch({ type: 'LtCourseSet/stepState', current: current + 1 });

            dispatch({
              type: 'CodeSelect/advancecodequery',
              queryPara: {
                codeType: 'coursekeys',
              },
              callback: resp2 => {
                Object.keys(resp2).forEach(key => {
                  dispatch({
                    type: 'CodeSelect/codequerycallback',
                    payload: resp2[key],
                    queryPara: {
                      codeType: key,
                    },
                  });
                });
              },
            });
          },
        });
      }
    });
  };

  render() {
    const { form, submitting, LtCourseSet, CodeSelect } = this.props;
    const { currData, teachWay, formLayout, pageFunction } = LtCourseSet;
    const { getFieldDecorator } = form;
    const curBusiness = getBusiness();

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
              {/* 公共封面查询组件使用，2个参数，namespace为点击选用后调用哪个namespace下的方法，inFile为初始化图片 */}
              <FormItem
                label={
                  <>
                    <span className={commonStyle.redStar}>*</span>
                    {formatMessage({ id: 'LtCourseSet.src' })} &nbsp;&nbsp;
                    <br />
                    (750x420) &nbsp;&nbsp;
                    <br />
                    (16:9)
                  </>
                }
              >
                <CoverCenter namespace="LtCourseSet" inFile={currData.src} setMethod="setCurrImg" />
              </FormItem>

              <FormItem label={<FormattedMessage id="LtCourseSet.title" />}>
                {getFieldDecorator('title', {
                  initialValue: currData.title,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'LtCourseSet.title',
                      }),
                    },
                  ],
                })(
                  <Input
                    maxLength={200}
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtCourseSet.title' })
                    }
                    allowClear
                    autoComplete="off"
                  />
                )}
              </FormItem>
              <FormItem label={<FormattedMessage id="LtCourseSet.courseSetKeys" />}>
                {getFieldDecorator('courseSetKeys', {
                  initialValue: currData.courseSetKeys ? currData.courseSetKeys.split(',') : [],
                  rules: [
                    {
                      required: curBusiness === "JT",
                      message: formatMessage({ id: 'LtCourseSet.courseSetKeys' }),
                    },
                  ],
                })(
                  <SuperSelect
                    mode="tags"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    placeholder={
                      formatMessage({ id: 'global.select.placeholder' }) +
                      formatMessage({ id: 'LtCourseSet.courseSetKeys' })
                    }
                  >
                    {CodeSelect.courseKeys.map(item => (
                      <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                    ))}
                  </SuperSelect>
                )}
              </FormItem>
              <FormItem label={<FormattedMessage id="LtCourseSet.whetherOrderLearn" />}>
                {getFieldDecorator('learnOrder', {
                  initialValue: currData.learnOrder
                    ? currData.learnOrder
                    : CodeSelect.yesOrNoDefaultN,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'LtCourseProgram.isImportant' }),
                    },
                  ],
                })(
                  <Radio.Group>
                    {CodeSelect.yesOrNo.map(item => (
                      <Radio key={item.codeValue} value={item.codeValue}>
                        {item.codeName}
                      </Radio>
                    ))}
                  </Radio.Group>
                )}
              </FormItem>
              <FormItem label={<FormattedMessage id="LtCourseSet.courseSetIntroduce" />}>
                {getFieldDecorator('courseSetIntroduce', {
                  initialValue: currData.courseSetIntroduce,
                })(
                  <Input
                    maxLength={200}
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtCourseSet.courseSetIntroduce' })
                    }
                    allowClear
                    autoComplete="off"
                  />
                )}
              </FormItem>
              {curBusiness === "TJ" && (
                <FormItem label={<FormattedMessage id="LtCourseSet.limitedDays" />}>
                  {getFieldDecorator('limitedDays', {
                    initialValue: currData.limitedDays,
                    rules: [
                      {
                        required: false,
                        message: formatMessage({ id: 'LtCourseSet.limitedDays', }),
                      },
                    ],
                  })(
                    <InputNumber
                      min={1}
                      max={10000}
                      step={1}
                      placeholder={
                        formatMessage({ id: 'global.input.placeholder' }) +
                        formatMessage({ id: 'LtCourseSet.limitedDays' })
                      }
                      allowClear
                      autoComplete="off"
                      precision={0}
                      style={{ width: '100%' }}
                    />
                  )}
                </FormItem>
              )}
              <FormItem label={<FormattedMessage id="LtCourseSet.studyTime" />}>
                {getFieldDecorator('startTimeAndEndTime', {
                  initialValue: currData.startTime
                    ? [moment(currData.startTime), moment(currData.endTime)]
                    : undefined,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({ id: 'LtCourseSet.studyTime' }),
                    },
                  ],
                })(
                  <DatePicker.RangePicker
                    disabledDate={this.disabledDate}
                    allowClear
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                    placeholder={[
                      formatMessage({ id: 'LtCourseSet.startTime' }),
                      formatMessage({ id: 'LtCourseSet.endTime' }),
                    ]}
                  />
                )}
              </FormItem>
              <Row>
                <FormItem label={<FormattedMessage id="LtCourseSet.courseSetDetails" />}>
                  {getFieldDecorator('courseSetDetails', {
                    initialValue:
                      currData.courseSetDetails === ''
                        ? undefined
                        : BraftEditor.createEditorState(currData.courseSetDetails),
                    validateTrigger: 'onBlur',
                  })(
                    <BraftEditor
                      media={{ uploadFn: myUploadFn }}
                      contentStyle={{ height: 200, border: '1px solid lightgray' }}
                      className={commonStyle.braftStyle}
                      placeholder={
                        formatMessage({ id: 'global.input.placeholder' }) +
                        formatMessage({ id: 'LtCourseSet.courseSetDetails' })
                      }
                      language={BraftEditorLanguageFn}
                    />
                  )}
                </FormItem>
              </Row>
              <Row style={{ margin: 32, textAlign: 'center' }}>
                <Button
                  style={{ margin: 8 }}
                  type="primary"
                  htmlType="submit"
                  icon="save"
                  loading={submitting}
                >
                  <FormattedMessage id="global.save" />
                </Button>
              </Row>
            </Form>
          </Spin>
        </Fragment>
      </div>
    );
  }
}

export default EditForm;
