import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Button, Card, Divider, Affix } from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import DetailHome from './detailHome';

@connect(({ loading, LtExamInfoNaire }) => ({
  LtExamInfoNaire,
  loading: loading.models.LtExamInfoNaire,
}))
class Detail extends Component {
  render() {
    const { dispatch, loading } = this.props;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <Affix offsetTop={65} style={{ width: '100px' }}>
            <Button
              icon="rollback"
              type="primary"
              loading={loading}
              onClick={() =>
                dispatch({ type: 'LtExamInfoNaire/openView', view: 'home', op: '', currData: {} })
              }
            >
              <FormattedMessage id="global.back" />
            </Button>
          </Affix>
          <DetailHome />
          {/* <Divider /> */}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Detail;
