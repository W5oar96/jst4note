/* eslint-disable no-undef */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { Card, Affix, Button } from 'antd';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import REdit from './editStep'; // 可调整为多步操作(./editStep)

@connect(({ LtExamInfoNaire, loading }) => ({
  LtExamInfoNaire,
  loading: loading.models.LtExamInfoNaire,
}))
class EditForm extends PureComponent {
  render() {
    const { LtExamInfoNaire, dispatch, loading } = this.props;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <Affix offsetTop={65} style={{ width: '100px' }}>
            <Button
              type="primary"
              icon="rollback"
              loading={loading}
              style={{ margin: '24px' }}
              onClick={() =>
                dispatch({ type: 'LtExamInfoNaire/openView', view: 'home', op: '', currData: {} })
              }
            >
              <FormattedMessage id="global.back" />
            </Button>
          </Affix>
          <REdit />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default EditForm;
