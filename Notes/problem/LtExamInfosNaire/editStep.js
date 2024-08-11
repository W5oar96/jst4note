import React, { Fragment, PureComponent } from 'react';
import { Steps } from 'antd';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import SEdit from './editForm';
import SEdit3 from './studentInfoPage/Index';
import commonStyle from '@/assets/styles/project.less';

@connect(({ LtExamInfoNaire }) => ({
  LtExamInfoNaire,
}))
class EditStep extends PureComponent {
  onStepChange = current => {
    const { dispatch } = this.props;

    dispatch({
      type: 'LtExamInfoNaire/stepState',
      current,
    });
  };

  render() {
    const {
      LtExamInfoNaire: { current, currData },
    } = this.props;
    const { Step } = Steps;

    const steps = [
      {
        title: formatMessage({ id: 'other.base' }),
        content: <SEdit stepFlag="1" />,
      },
      {
        title: formatMessage({ id: 'ResourceStudent.LtStudentInfo' }),
        content: <SEdit3 stepFlag="1" />,
      },
    ];

    return (
      <Fragment>
        <Steps
          current={current}
          style={{
            backgroundColor: '#fff',
            padding: '8px 40px',
            boxShadow: '0px -1px 0 0 #e8e8e8 inset',
          }}
          onChange={this.onStepChange}
          type="navigation"
        >
          {steps.map(item => (
            <Step key={item.title} title={item.title} disabled={currData.id === undefined} />
          ))}
        </Steps>
        <div className={commonStyle.stepsContent}>{steps[current].content}</div>
      </Fragment>
    );
  }
}

export default EditStep;
