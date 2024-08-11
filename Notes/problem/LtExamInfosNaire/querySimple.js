import { Button, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import CommonQuery from '@/components/CommonQuery';
import moment from 'moment';

const FormItem = Form.Item;
const InputGroup = Input.Group;

@connect(({ LtExamInfoNaire, loading, CodeSelect }) => ({
  LtExamInfoNaire,
  CodeSelect,
  loading: loading.models.LtExamInfoNaire,
}))
@Form.create()
class Query extends PureComponent {
  // 查询方法
  handleSearch = e => {
    e.preventDefault();

    const { dispatch, form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const values = fieldsValue;

      const {
        LtExamInfoNaire: { queryPara, queryParaSize },
      } = this.props;
      if (queryPara.size === queryParaSize) {
        delete values.size;
      } else {
        values.size = queryPara.size;
      }
      values.dataCate_equals = 'survey';
      values.sourceFrom_equals = 'common';
      values.sort = 'createdDate,desc';
      dispatch({
        type: 'LtExamInfoNaire/fetch',
        queryPara: values,
      });
    });
  };

  // 重置方法
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    dispatch({
      type: 'LtExamInfoNaire/reSet',
    });
  };

  render() {
    const {
      form: { getFieldValue, getFieldDecorator },
      CodeSelect,
      loading,
      LtExamInfoNaire: { queryPara },
    } = this.props;

    return (
      <Form {...CodeSelect.formItemLayout} onSubmit={this.handleSearch} layout="inline">
        <Row type="flex" justify="space-around" align="middle">
          <Col span={22}>
            <FormItem label={<FormattedMessage id="LtExamInfoNaire.examName" />}>
              {getFieldDecorator('examName_contains', {
                initialValue: queryPara.examName_contains,
              })(
                <Input
                  placeholder={
                    formatMessage({ id: 'global.input.placeholder' }) +
                    formatMessage({ id: 'LtExamInfoNaire.examName' })
                  }
                  allowClear
                  autoComplete="off"
                />
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtExamInfoNaire.examCode" />}>
              {getFieldDecorator('examCode_equals', {
                initialValue: queryPara.examCode_equals,
              })(
                <Input
                  placeholder={
                    formatMessage({ id: 'global.input.placeholder' }) +
                    formatMessage({ id: 'LtExamInfoNaire.examCode' })
                  }
                  allowClear
                  autoComplete="off"
                />
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtExamInfoNaire.status" />}>
              {getFieldDecorator('status_equals', {
              })(
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  placeholder={
                    formatMessage({ id: 'global.select.placeholder' }) +
                    formatMessage({ id: 'LtExamInfoNaire.status' })
                  }
                >
                  {CodeSelect.status.map(item => (
                    <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                  ))}
                </Select>
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtExamInfoNaire.examOpenTime" />}>
              {getFieldDecorator('StartTime_RangePicker', {
                initialValue: queryPara.StartTime_RangePicker
                  ? [
                    moment(queryPara.examBeginTime_greaterOrEqualThan),
                    moment(queryPara.examEndTime_lessOrEqualThan),
                  ]
                  : undefined,
              })(
                <DatePicker.RangePicker
                  allowClear
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={[
                    formatMessage({ id: 'LtExamInfoNaire' }) +
                    formatMessage({ id: 'global.datepicker.start' }),
                    formatMessage({ id: 'LtExamInfoNaire' }) +
                    formatMessage({ id: 'global.datepicker.end' }),
                  ]}
                />
              )}
            </FormItem>
            <CommonQuery
              queryPara={queryPara}
              CodeSelect={CodeSelect}
              getFieldValue={getFieldValue}
              getFieldDecorator={getFieldDecorator}
            />
          </Col>
          <Col span={2}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Button
                htmlType="submit"
                style={{ margin: '4px' }}
                type="primary"
                icon="search"
                loading={loading}
              >
                <FormattedMessage id="global.query" />
              </Button>
              <Button
                style={{ margin: '4px' }}
                type="dashed"
                icon="reload"
                onClick={this.handleFormReset}
                loading={loading}
              >
                <FormattedMessage id="global.reset" />
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    );
  }
}

export default Query;
