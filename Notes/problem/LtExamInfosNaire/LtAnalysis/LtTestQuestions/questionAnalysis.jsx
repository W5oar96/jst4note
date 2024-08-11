import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { GroupBar } from '@/components/Charts';

@connect(({ LtTestQuestionsSurvey, CodeSelect }) => ({
  LtTestQuestionsSurvey,
  CodeSelect,
}))
class QuestionAnalysis extends Component {
  render() {
    const {
      LtTestQuestionsSurvey: { data },
    } = this.props;
    const realData = [{ name: '参与人数' }, { name: '未参与人数' }];

    console.log('data：', data);
    const data5 = [];
    data.forEach((item, index) => {
      data5.push(`第${index + 1}题`);
      realData[0][`第${index + 1}题`] = item.joinCount;
      realData[1][`第${index + 1}题`] = item.noJoinCount;
    });
    return (
      <div>
        <GroupBar
          height={295}
          title={<FormattedMessage id="app.analysis.sales-trend" defaultMessage="Sales Trend" />}
          fieldsData={data5}
          data={realData}
        />
      </div>
    );
  }
}

export default QuestionAnalysis;
