import {Button, Row, Col, Modal, Tree, Collapse, Affix, Popconfirm, message, Radio} from 'antd';
import { connect } from 'dva';
import React, {Fragment, PureComponent, useState} from 'react';
import { FormattedMessage, formatMessage } from 'umi/locale';
import commonStyle from '@/assets/styles/project.less';
import AdvancedTable from '@/components/AdvancedTable';
import {dateformat, findValueByKey} from '@/utils/utils';

const { Panel } = Collapse;

const defaultAlign = 'left';
const defaultColWith = 170;

@connect(({ CodeSelect, ResourceUseAuth, loading }) => ({
  CodeSelect,
  ResourceUseAuth,
  loading: loading.models.ResourceUseAuth,
}))
class Index extends PureComponent {
  constructor(props) {
    super(props);
    const { dispatch } = this.props;
    dispatch({
      type: 'LtMasterProgramEnrollRule/reset',
    });
    this.state = {
      authedComs: [],
      isSubManageCom: 'N'
    };
  }

  showModal = () => {
    const { dispatch } = this.props;

    dispatch({
      type: 'ResourceUseAuth/switchVisible',
      visible: true,
    });

    this.refresh();
  };

  handleCancel = type => {
    const { dispatch, afterSubmit } = this.props;
    dispatch({
      type: 'ResourceUseAuth/switchVisible',
      visible: false,
    });
    this.setState({
      authedComs: [],
    });
    // 数据授权完成后的回调
    if (type === '1' && afterSubmit) {
      afterSubmit();
    }
  };

  handleChange = e => {
    this.setState({
      isSubManageCom: e.target.value
    });
  };

  refresh = () => {
    const { dispatch, resourceType, resourceCode } = this.props;
    dispatch({
      type: 'ResourceUseAuth/fetch',
      queryPara: {
        resourceType,
        resourceCode: resourceCode.length === 1 ? resourceCode[0] : '---', // 选中了一个，则查询出已授权的机构;选中了多个，则不加载已授权的机构，本次批量授权会覆盖之前已授权的机构
      },
    });
  };

  onCheck = v => {
    this.setState({
      authedComs: v.checked,
    });
  };

  /**
   * 授权动作(添加或追加授权)
   */
  dealData = () => {
    const { dispatch, resourceCode, resourceType } = this.props;
    const { authedComs, isSubManageCom } = this.state;

    const submitData = [];
    if (authedComs.length > 0) {
      resourceCode.map(item => {
        for (let i = 0; i < authedComs.length; i += 1) {
          submitData.push({
            isSubManageCom,
            resourceCode: item,
            resourceType,
            authedCom: authedComs[i],
          });
        }
        return submitData;
      });
    }
    dispatch({
      type: 'ResourceUseAuth/useAuthBatch',
      payload: submitData,
      callback: () => {
        this.handleCancel('1');
      },
    });
  };

  render() {
    const {
      ResourceUseAuth: { visible, data, queryPara },
      CodeSelect: { allManageComTreeData, allManageComTopTree , yesOrNo, yesOrNoMap},
      resourceCode,
      loading,
      isDropDown,
      isButton, // 有该值是button模式
      dispatch,
    } = this.props;

    const { authedComs, isSubManageCom } = this.state;

    return (
      <Fragment>
        <Modal
          width="80%"
          bodyStyle={{ overflowY: 'scroll', maxHeight: '80vh' }}
          centered
          destroyOnClose
          title={formatMessage({ id: 'DataAuthorization' })}
          visible={visible}
          onCancel={() => this.handleCancel('0')}
          footer={[
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={authedComs.length === 0}
              key={`B_${Math.random() * 100}`}
              onClick={() => this.dealData()}
            >
              <FormattedMessage id="ResourceUseAuth.addAuth" />(
              {authedComs.length ? authedComs.length : 0})
            </Button>,
            <Button onClick={() => this.handleCancel('0')}>
              <FormattedMessage id="global.closeup" />
            </Button>,
          ]}
        >
          <Collapse defaultActiveKey={['2']}>
            {data.list.length > 0 && (
              <Panel header={formatMessage({ id: 'ResourceUseAuth.authTrace' })} key="1">
                <AdvancedTable
                  namespace="ResourceUseAuth"
                  queryPara={queryPara}
                  data={data}
                  columns={[
                    {
                      title: formatMessage({ id: 'ResourceUseAuth.authedComName' }),
                      dataIndex: 'authedComName',
                      width: 150,
                    },
                    {
                      title: formatMessage({ id: 'ResourceUseAuth.components.isSubManageCom' }),
                      dataIndex: 'isSubManageCom',
                      width: 50,
                      align: 'center',
                      render: text => {
                        return findValueByKey(yesOrNoMap, text);
                      },
                    },
                    {
                      title: formatMessage({ id: 'ResourceUseAuth.createdByManageComName' }),
                      dataIndex: 'createdByManageComName',
                      align: defaultAlign,
                      width: 300,
                    },
                    {
                      title: formatMessage({ id: 'ResourceUseAuth.createdByName' }),
                      dataIndex: 'createdByName',
                      align: defaultAlign,
                      width: defaultColWith,
                      render: (text, record) => {
                        if (record.createdByStaffCode) {
                          return `${record.createdByStaffCode}-${record.createdByName}`;
                        }
                        return `${record.createdByName}`;
                      },
                    },
                    {
                      title: formatMessage({ id: 'ResourceUseAuth.createdDate' }),
                      dataIndex: 'createdDate',
                      align: defaultAlign,
                      width: defaultColWith,
                      render: text => {
                        return dateformat(text);
                      },
                    },
                    {
                      title: formatMessage({ id: 'global.operate' }),
                      dataIndex: 'global.operate',
                      align: defaultAlign,
                      width: 120,
                      render: (text, record) => (
                        <Fragment>
                          <a
                            onClick={() =>
                              dispatch({
                                type: 'ResourceUseAuth/removeAuth',
                                payload: record,
                                callback: () => {
                                  this.refresh();
                                },
                              })
                            }
                          >
                            <FormattedMessage id="ResourceUseAuth.removeAuth" />
                          </a>
                        </Fragment>
                      ),
                    },
                  ]}
                  rowSelection={{
                    // 展示复选框的条件
                    canSelectOption: false,
                    // 选中的keys
                    selectedRowKeys: [],
                    // 不可选的条件
                    disabledOption: () => ({
                      // Column configuration not to be checked 根据实际情况处理
                    }),
                  }}
                  loading={loading}
                  hideTitle
                  hideExtra
                  disabledSort
                />
              </Panel>
            )}
            <Panel header={formatMessage({ id: 'ResourceUseAuth.addAuth' })} key="2">
              <Row gutter={10}>
                <Col span={8}>
                  <div className={commonStyle.desc} style={{ padding: 10 }}>
                    <h4>{formatMessage({ id: 'ResourceUseAuth.components.desc' })}</h4>
                    <ul>
                      <li>
                        <p>{formatMessage({ id: 'ResourceUseAuth.components.p1' })}</p>
                      </li>
                      <li>
                        {formatMessage({ id: 'ResourceUseAuth.components.isSubManageCom' })}：
                        <Radio.Group value={isSubManageCom} onChange={this.handleChange}>
                          {yesOrNo.map(item => (
                            <Radio key={item.codeValue} value={item.codeValue}>
                              {item.codeName}
                            </Radio>
                          ))}
                        </Radio.Group>
                      </li>
                    </ul>
                  </div>
                </Col>
                <Col span={10}>
                  <Tree
                    checkable
                    checkStrictly
                    onCheck={this.onCheck}
                    defaultExpandedKeys={allManageComTopTree}
                    checkedKeys={authedComs}
                    treeData={allManageComTreeData}
                  />
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Modal>
        {isDropDown ? (
          <>
            {isButton ? (
              <Button
                type="primary"
                loading={loading}
                disabled={resourceCode.length === 0}
                key={`B_${Math.random() * 1001}`}
                onClick={() => this.showModal()}
              >
                {<FormattedMessage id="DataAuthorization" />}({resourceCode.length})
              </Button>
            ) : (
              <a onClick={() => this.showModal()}>
                <FormattedMessage id="DataAuthorization" />({resourceCode.length})
              </a>
            )}
          </>
        ) : (
          <Button
            style={{ margin: '0 4px' }}
            icon="cluster"
            type="primary"
            key={`B_${Math.random() * 100}`}
            disabled={resourceCode.length === 0}
            onClick={() => this.showModal()}
          >
            <FormattedMessage id="DataAuthorization" />({resourceCode.length})
          </Button>
        )}
      </Fragment>
    );
  }
}

export default Index;
