import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import RHome from './homeTable'; // 这里默认为查询表格
// import RHome from './homeList';  // 可调整为标准列表。homeList

@connect(({ LtExamInfoNaire }) => ({
  LtExamInfoNaire,
}))
class List extends PureComponent {
  render() {
    return (
      <PageHeaderWrapper title={<FormattedMessage id="LtExamInfoNaire" />}>
        <RHome />
      </PageHeaderWrapper>
    );
  }
}

export default List;
