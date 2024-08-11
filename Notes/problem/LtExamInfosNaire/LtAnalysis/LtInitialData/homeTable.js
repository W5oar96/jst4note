import { dateformat, second2time } from '@/utils/utils';
import { Button, Card, Form, Spin, Table } from 'antd';
import { connect } from 'dva';
import ExportJsonExcel from 'js-export-excel';
import React, { Fragment, PureComponent } from 'react';
import { formatMessage, FormattedMessage } from 'umi/locale';
import QuerySimple from './querySimple';
@connect(({ LtInitialData, LtExamInfoNaire, loading, CodeSelect }) => ({
  LtInitialData,
  LtExamInfoNaire, // 试卷表

  CodeSelect, // 查询表格列
  loading: loading.models.LtInitialData,
}))
@Form.create()
class Home extends PureComponent {
  // 页面加载时调用
  componentDidMount() {}

  handleExport = () => {
    const {
      LtInitialData: { data },
    } = this.props;
    const newcolumns = this.getColumns();
    const option = {};
    option.datas = [
      {
        sheetData: data.map(item => {
          const result = {};
          newcolumns.forEach(c => {
            result[c.dataIndex] = item[c.dataIndex];
          });
          return result;
        }), // excel 数据
        sheetFilter: newcolumns.map(item => item.dataIndex), // 列过滤(只有在数据为object下起作用)(可有可无)
        sheetHeader: newcolumns.map(item => item.title), // 标题（excel第一行数据）
        columnWidths: newcolumns.map(() => 5), // 列宽 需与列顺序对应 非必须
      },
    ];
    const toExcel = new ExportJsonExcel(option);
    toExcel.saveExcel();
  };

  getColumns = () => {
    const {
      LtInitialData: { data },
    } = this.props;
    if (data.length === 0) {
      return [];
    }
    const col = [];
    const item = data[0];
    Object.keys(item).forEach(key => {
      col.push({
        title:
          `${key}` === 'LtExamInfosNaire.submitTime' || `${key}` === 'LtExamInfosNaire.answerDuration'
            ? formatMessage({ id: `${key}` })
            : `${key}`,
        dataIndex: `${key}`,
        align: 'center',
        width: `${key}` === 'LtExamInfosNaire.submitTime' ? 260 : 160,
        render: text => {
          return `${key}` === 'LtExamInfosNaire.submitTime' ?  dateformat(text) : `${key}` === 'LtExamInfosNaire.answerDuration' ? second2time(text) : text ;
        },
      });
    });
    return col;
  };

  render() {
    const {
      LtInitialData: { data },
      loading,
    } = this.props;
    return (
      <Fragment>
        <Spin
          spinning={loading === undefined ? false : loading}
          tip={<FormattedMessage id="global.spin.tips" />}
        >
          <Card bordered={false}>
            <QuerySimple />
          </Card>
          <Button
            style={{ marginLeft: 8 }}
            type="primary"
            onClick={() => this.handleExport()}
            loading={loading}
          >
            <FormattedMessage id="global.export" />
          </Button>
          <Table
            dataSource={data}
            columns={this.getColumns()}
            rowKey={record => record.id}
            pagination={false}
            loading={loading}
            size="small"
            bordered
            scroll={{ x: 1100, y: 550 }}
          />
        </Spin>
      </Fragment>
    );
  }
}

export default Home;
