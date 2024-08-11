import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Pie } from '@/components/Charts';

@connect(({ LtStudentsSurveyInAnalysis }) => ({
  LtStudentsSurveyInAnalysis, // 中间表
}))
class ExamAnalysis extends Component {
  render() {
    const {
      LtStudentsSurveyInAnalysis: { data },
    } = this.props;
    const realdata = [
      { x: formatMessage({ id: 'LtExamInfosNaire.notExam' }), y: 0 },
      { x: formatMessage({ id: 'LtExamInfosNaire.stopExam' }), y: 0 },
      { x: formatMessage({ id: 'LtExamInfosNaire.examNot' }), y: 0 },
    ];
    data.list.forEach(item => {
      if (item.examState === '01' && item.score) {
        realdata[2].y += 1;
      } else if (item.examState === '01') {
        realdata[0].y += 1;
      } else {
        realdata[1].y += 1;
      }
    });
    console.log(realdata, 'realdata');
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pie
          padding={[80, 100, 80, 100]}
          tooltip
          hasLabel
          hasLegend
          // subTitle={'性别'}
          total={() => {
            realdata.reduce((pre, now) => now.y + pre, 0);
          }}
          data={realdata}
          valueFormat={value => {
            value;
          }}
          height={400}
          width={600}
          lineWidth={4}
          inner={0}
          style={{
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            // boxShadow: '2px 0 6px rgba(0, 21, 41, 0.35)',
            // borderRadius: '10px',
          }}
        />
      </div>
    );
  }
}

export default ExamAnalysis;
