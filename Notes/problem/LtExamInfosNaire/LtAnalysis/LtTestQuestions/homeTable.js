import commonStyle from '@/assets/styles/project.less';
import { findValueByKey } from '@/utils/utils';
import { Collapse, Form, List, Tabs, Typography } from 'antd';
import { connect } from 'dva';
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi/locale';
const { TabPane } = Tabs;
const { Panel } = Collapse;

@connect(({ LtTestQuestionsSurvey, LtExamInfo, loading, CodeSelect }) => ({
  LtTestQuestionsSurvey, // 中间表
  LtExamInfo, // 试卷表

  CodeSelect, // 查询表格列
  loading: loading.models.LtTestQuestionsSurvey,
}))
@Form.create()
class Home extends PureComponent {
  // 页面加载时调用
  componentDidMount() {}

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

  // 获取已经存在的题目
  getPaperQuestion = () => {
    const { CodeSelect } = this.props;
    return [
      // {
      //   title: formatMessage({ id: 'LtQuestion.questionContent' }),
      //   dataIndex: 'questionContent',
      //   width: 300,
      //   render: (text, record) => (
      //     <div dangerouslySetInnerHTML={{ __html: record.questionContent }} />
      //   ),
      //   export: text => {
      //     return text;
      //   },
      // },
      {
        title: formatMessage({ id: 'LtQuestion.questionClassify' }),
        dataIndex: 'questionClassify',
        width: 150,
        render: text => {
          // eslint-disable-next-line no-undef
          return findValueByKey(CodeSelect.questionClassifyMap, text);
        },
      },
      {
        title: formatMessage({ id: 'LtQuestion.questionType' }),
        dataIndex: 'questionType',
        width: 150,
        render: text => {
          // eslint-disable-next-line no-undef
          return findValueByKey(CodeSelect.questionTypeMap, text);
        },
      },

      {
        title: formatMessage({ id: 'LtExamInfos.correctPeople' }),
        dataIndex: 'rightCount',
      },
      {
        title: formatMessage({ id: 'LtExamInfos.errorPeople' }),
        dataIndex: 'errorCount',
      },
    ];
  };

  render() {
    const {
      LtTestQuestionsSurvey: { data },
      CodeSelect,
      type,
    } = this.props;
    // console.log("surveyDetail",dataDetail)
    return (
      <Collapse>
        {data.map((e, idx) => (
          <Panel
            key={e.id}
            header={
              <div>
                {idx + 1}.({CodeSelect.questionTypeMap[e.questionType]}){e.questionContent}
              </div>
            }
          >
            <List
              header={null}
              footer={
                <div>
                  {e.questionType === 'open' ? (
                    <div>
                      <div>
                        {formatMessage({ id: 'LtSurveyQuestionVO.answerRequire' })}:
                        {CodeSelect.answerRequireMap[e.answerRequire]}
                      </div>
                      <div>
                        {formatMessage({ id: 'LtSurveyQuestionVO.answerRule' })}:{e.answerRule}
                      </div>
                    </div>
                  ) : (
                    <></>
                  )}
                </div>
              }
              dataSource={e.options}
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
                    <div>
                      {item.commitedCount}份({item.commitedNumPer}%)
                    </div>
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

export default Home;
