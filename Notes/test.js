import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Card } from 'antd';
import AdvancedTable from '@/components/AdvancedTable';
import commonStyle from '@/assets/styles/project.less';
import { findValueByKey, isZh, moneyFormat } from '@/utils/utils';
import QuerySimple from './querySimple';
import moment from 'moment';
import { getBusiness } from '@/utils/envUtil';

const curBusiness = getBusiness();

@connect(({ PlanStatement, loading, CodeSelect, LtCourseProgram }) => ({
  PlanStatement,
  LtCourseProgram,
  CodeSelect,
  loading: loading.models.PlanStatement || loading.models.LtCourseProgram,
}))
class Home extends PureComponent {
  state = {
    // 月份数组
    allMonths: [],
  };

  // 页面加载时调用，经常用于初始化下拉选择的数据结构
  componentDidMount() {
    const { dispatch } = this.props;
    // 获取所有月份缩写名称的数组
    const shortMonthNames = moment.monthsShort();
    this.setState({
      allMonths: shortMonthNames,
    });
    // 批量加载码表数据
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'plantype,,traininglevel,assessmentmethod,trainingmethods',
      },
      callback: resp => {
        Object.keys(resp).forEach(key => {
          dispatch({
            type: 'CodeSelect/codequerycallback',
            payload: resp[key],
            queryPara: {
              codeType: key,
            },
          });
        });
      },
    });
    this.onRefresh();
  }

  onRefresh = () => {
    const {
      dispatch,
      LtCourseProgram: { currData },
      PlanStatement: { queryPara, queryParaSize },
    } = this.props;

    if (currData.id) {
      if (currData.monPlanCode) {
        // 已绑定班级的，则仅查询该班级的这个计划
        queryPara.planCode_equals = currData.monPlanCode;
        queryPara.nomanagecom = '123';
      } else {
        // 班级没有计划编码。但是已经有班级编码了，那这里计划查询结果应该为空(计划外开班)
        queryPara.planCode_equals = '2222';
      }
    } else {
      // 仅查询自己机构的计划
      queryPara.manageCom_equals = sessionStorage.getItem('managecom');
      // queryPara.planState_equals = '01'; // 默认查询未执行的
      delete queryPara.planCode_equals;
    }

    if (currData.trainState === '02' || currData.trainState === '03') {
      queryPara.manageCom_equals = sessionStorage.getItem('managecom');
      // queryPara.planState_equals = '01'; // 默认查询未执行的
      delete queryPara.planCode_equals;
    }
    if (queryPara.size === queryParaSize) {
      delete queryPara.size;
    }

    // 审批通过的
    queryPara.auditState_equals = '11';
    dispatch({
      type: 'PlanStatement/fetch',
      queryPara,
    });
  };

  // 查询表格的列定义
  getColumns = () => {
    const { CodeSelect } = this.props;
    const { allMonths } = this.state;
    const columns = [
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.planCode' }),
        dataIndex: 'planCode',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.planType' }),
        dataIndex: 'planType',
        render: text => {
          return findValueByKey(CodeSelect.planTypeMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.planTitle' }),
        dataIndex: 'planTitle',
        hideInTable: true,
      },

      {
        title: formatMessage({ id: 'LtTrainPlanStatement.trainingLevel' }),
        dataIndex: 'trainingLevel',
        render: text => {
          return findValueByKey(CodeSelect.trainingLevelMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.trainingObjectives' }),
        dataIndex: 'trainingObjectives',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.plannedCourses' }),
        dataIndex: 'plannedCourses',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.trainingMethods' }),
        dataIndex: 'trainingMethods',
        render: text => {
          return findValueByKey(CodeSelect.trainingMethodsMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.assessmentMethod' }),
        dataIndex: 'assessmentMethod',
        render: text => {
          return findValueByKey(CodeSelect.assessmentMethodMap, text);
        },
      },
      // {
      //   title: formatMessage({ id: 'LtTrainPlanStatement.planPeriod' }),
      //   dataIndex: 'planPeriod',
      // },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.periodStart' }),
        dataIndex: 'periodStart',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.periodEnd' }),
        dataIndex: 'periodEnd',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.responsibleCode' }),
        dataIndex: 'responsibleCode',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.responsibleName' }),
        dataIndex: 'responsibleName',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.responsibleCom' }),
        dataIndex: 'responsibleCom',
        render: text => {
          return findValueByKey(CodeSelect.manageComDataAllMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainSetCfg.typeName' }),
        dataIndex: 'categoryString',
        render: text => {
          return findValueByKey(CodeSelect.programTypeMap, text ? text.split(',')[0] : '');
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.programType' }),
        dataIndex: 'programType',
        width: 150,
        render: text => {
          return findValueByKey(CodeSelect.programTypeMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.dueTraineeNo' }),
        dataIndex: 'dueTraineeNo',
        align: 'right',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.duePeriodsNo' }),
        dataIndex: 'duePeriodsNo',
        align: 'right',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.executedNo' }),
        dataIndex: 'executedNo',
        align: 'right',
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.executedProcess' }),
        dataIndex: 'executedProcess',
        align: 'right',
        noSort: true,
        render: (text, record) => {
          return `${record.executedNo || 0} / ${record.duePeriodsNo}`;
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.dueMoney' }),
        dataIndex: 'dueMoney',
        hideInTable: true,
        align: 'right',
        render: text => {
          return moneyFormat(text);
        },
      },
      {
        title: formatMessage({ id: 'LtTrainPlanStatement.planState' }),
        dataIndex: 'planState',
        fixed: 'right',
        render: text => {
          return CodeSelect.planStateMap[text];
        },
      },
    ];
    return columns;
  };

  render() {
    const {
      PlanStatement: { data, queryPara, selectedIds },
      loading,
      LtCourseProgram: { currData },
    } = this.props;
    const rowSelection = {
      // 展示复选框的条件
      canSelectOption: !(currData.trainState === '02' || currData.trainState === '03'),
      // 选中的keys
      selectedRowKeys: selectedIds,
      // 不可选的条件
      disabledOption: record => ({
        // Column configuration not to be checked 根据实际情况处理   月度计划只能执行一次
        // disabled: record.planType === 'month' && record.planState === '02',
      }),
    };

    return (
      <div className={isZh() ? commonStyle.standardList : commonStyle.standardListUs}>
        <Fragment>
          {// 修改信息时不能仅看表格数据即可
            !(currData.trainState === '02' || currData.trainState === '03') && (
            <Card bordered={false}>
              <QuerySimple />
            </Card>
          )}
          <AdvancedTable
            namespace="PlanStatement"
            queryPara={queryPara}
            data={data}
            uniqueCode="planCode"
            columns={this.getColumns()}
            rowSelection={rowSelection}
            loading={loading}
            needCreatedBy
            rowSelectionType="radio"
          />
        </Fragment>
      </div>
    );
  }
}

export default Home;
