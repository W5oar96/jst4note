import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Collapse, List, Typography, Tabs } from 'antd';
import commonStyle from '@/assets/styles/project.less';

const { TabPane } = Tabs;
const { Panel } = Collapse;

@connect(({ LtStudentsSurveyInAnalysis, loading, CodeSelect }) => ({
  LtStudentsSurveyInAnalysis,
  CodeSelect,
  loading: loading.models.LtStudentsSurveyInAnalysis,
}))
class HomeTable extends PureComponent {
  // 页面加载时调用，经常用于初始化下拉选择的数据结构
  componentDidMount() {
    const { dispatch, examCode } = this.props;

    // 批量加载码表数据
    // 题目类型
    dispatch({
      type: 'CodeSelect/advancecodequery',
      queryPara: {
        codeType: 'questiontype',
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
  }

  showUserAnswer = data => {
    const showContent = [];
    let userAnswer = '';
    console.log('data.userAnswer:', data.userAnswer);
    if (data.userAnswer !== null) {
      const optionArray = data.userAnswer.split(',');
      const { options } = data;
      options.map((item, idx) => {
        if (optionArray.includes(item.id.toString())) {
          if (userAnswer === '') {
            userAnswer = String.fromCharCode(idx + 65);
          } else {
            userAnswer = `${userAnswer}、${String.fromCharCode(idx + 65)}`;
          }
        }
      });
    }

    showContent.push(<span>{userAnswer}</span>);
    return showContent;
  };

  render() {
    const { dataDetail, CodeSelect, type } = this.props;
    // console.log("surveyDetail",dataDetail)
    return (
      <Collapse>
        {dataDetail.map((data, idx) => (
          <Panel
            key={data.id}
            header={
              <div>
                {idx + 1}.({CodeSelect.questionTypeMap[data.questionType]}){data.questionContent}
              </div>
            }
          >
            <List
              header={null}
              footer={
                type !== 'surveyDetail' ? (
                  <div>
                    {data.questionType === 'completion' || data.questionType === 'open' ? (
                      <div>
                        <FormattedMessage id="LtExamQuestionStudent.userResult" />:{data.userAnswer}
                      </div>
                    ) : (
                      <div>
                        <FormattedMessage id="LtExamQuestionStudent.userResult" />:
                        {this.showUserAnswer(data)}
                      </div>
                    )}
                  </div>
                ) : null
              }
              dataSource={data.options}
              renderItem={(item, index) => (
                <List.Item>
                  <Typography.Text
                    type="secondary"
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    className={commonStyle.examTitle}
                  >
                    <div className={commonStyle.examOption}>
                      <div>
                        {String.fromCharCode(index + 65)}、{item.answerContent}
                      </div>
                    </div>
                    {type !== 'surveyDetail' ? (
                      <></>
                    ) : (
                      <>
                        <div>
                          {item.commitedCount}份({item.commitedNumPer}%)
                        </div>
                      </>
                    )}
                  </Typography.Text>
                </List.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>
    );
  }
}

export default HomeTable;
