import { Button, Col, Form, Input, Row, Select, TreeSelect } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';

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
        LtExamInfoNaire: { queryPara, currData, queryParaSize },
      } = this.props;
      if (queryPara.size === queryParaSize) {
        delete values.size;
      } else {
        values.size = queryPara.size;
      }
      values.examCode_equals = currData.examCode; // XXX业务主键查询数据库,初始化基本表格数据
      dispatch({
        type: 'LtStudentsSurveyInAnalysis/fetch',
        queryPara: values,
      });
    });
  };

  // 重置方法
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    form.setFieldsValue({ manageComCondition: 'contains' });
    dispatch({
      type: 'LtStudentsSurveyInAnalysis/reSet',
    });
  };

  render() {
    const {
      form: { getFieldDecorator },
      CodeSelect,
      loading,
      LtExamInfoNaire: { queryPara },
    } = this.props;

    return (
      <Form {...CodeSelect.formItemLayout} onSubmit={this.handleSearch} layout="inline">
        <Row type="flex" justify="space-around" align="middle">
          <Col span={22}>
            <FormItem label={<FormattedMessage id="LtStudentInfo.staffCode" />}>
              {getFieldDecorator('staffCode', {
                initialValue: queryPara.staffCode,
              })(
                <Input
                  placeholder={
                    formatMessage({ id: 'global.input.placeholder' }) +
                    formatMessage({ id: 'LtStudentInfo.staffCode' })
                  }
                  allowClear
                  autoComplete="off"
                />
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtStudentInfo.name" />}>
              {getFieldDecorator('name', {
                initialValue: queryPara.name,
              })(
                <Input
                  placeholder={
                    formatMessage({ id: 'global.input.placeholder' }) +
                    formatMessage({ id: 'LtStudentInfo.name' })
                  }
                  allowClear
                  autoComplete="off"
                />
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtStudentInfo.manageCom" />}>
              <Input.Group compact>
                {getFieldDecorator('manageCom', {
                  initialValue: queryPara.manageCom,
                  rules: [
                    {
                      required: false,
                      message:
                        formatMessage({ id: 'global.select.placeholder' }) +
                        formatMessage({ id: 'LtStudentInfo.manageCom' }),
                    },
                  ],
                })(
                  <TreeSelect
                    style={{ width: '57%' }}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    treeData={CodeSelect.allManageComTreeData}
                    treeDefaultExpandedKeys={CodeSelect.allManageComTopTree}
                    placeholder={
                      formatMessage({ id: 'global.select.placeholder' }) +
                      formatMessage({ id: 'LtStudentInfo.manageCom' })
                    }
                  />
                )}
                {getFieldDecorator('manageComCondition', {
                  initialValue: queryPara.manageComCondition
                    ? queryPara.manageComCondition
                    : 'contains',
                })(
                  <Select style={{ width: '43%' }}>
                    <Select.Option key="equals">
                      {formatMessage({ id: 'global.query.equals' })}
                    </Select.Option>
                    <Select.Option key="contains">
                      {formatMessage({ id: 'global.query.contains' })}
                    </Select.Option>
                  </Select>
                )}
              </Input.Group>
            </FormItem>
            <FormItem label={<FormattedMessage id="LtExamStudent.examState" />}>
              {getFieldDecorator('examState_equals', {
                initialValue: queryPara.examState_equals,
              })(
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  placeholder={
                    formatMessage({ id: 'global.select.placeholder' }) +
                    formatMessage({ id: 'LtExamStudent.examState' })
                  }
                >
                  {CodeSelect.surveyState.map(item => (
                    <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                  ))}
                </Select>
              )}
            </FormItem>
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
