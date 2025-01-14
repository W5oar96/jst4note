import { Button, Col, Drawer, Form, Input, message, Progress, Row, Select } from 'antd';
import React, { Fragment } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import Upload from '@/components/Upload';
import COS from 'cos-js-sdk-v5';
import OSS from 'ali-oss';
import moment from 'moment';
import { generateStr } from '@/utils/utils';

const FormItem = Form.Item;

@connect(({ CodeSelect, MicroVideo, uploadOss, loading, FileInfoTree }) => ({
  CodeSelect,
  MicroVideo,
  uploadOss,
  submitting: loading.models.MicroVideo || loading.models.uploadOss,
  FileInfoTree,
}))
class AddFileInfo extends React.Component {
  state = {
    visible1: false,
    progress: 0,
    fileUploadLoading: false,
  };

  /**
   * handle submit
   */
  handleSubmit = e => {
    e.preventDefault();
    const { form, dispatch, afterSubmit } = this.props;
    form.validateFieldsAndScroll((err, values) => {
      if (err) return;
      const { files } = values;

      //  https://cloud.tencent.com/document/product/436/11459
      // normal upload
      if (files && files.length > 0) {
        // 不合法的文件个数
        let validCount = 0;
        for (let i = 0; i < files.length; i += 1) {
          if (!files[i].type.startsWith('video/')) {
            message.error(files[i].name + formatMessage({ id: 'MicroVideo.formatNotSupported' }));
            validCount += 1;
            break;
          }

          if (files[i].type.startsWith('video/') && files[i].type !== 'video/mp4') {
            message.error(files[i].name + formatMessage({ id: 'FileInfo2.notMp4NotUpload' }));
            validCount += 1;
            break;
          }
        }

        if (validCount === 0) {
          dispatch({
            type: 'uploadOss/getCredential',
            callback: res => {
              const ossClient = new OSS({
                SecretId: res.result.secretId,
                SecretKey: res.result.secretKey,
              });


              const fileObjs = files && files.map(f => f.originFileObj);

              this.setState({ fileUploadLoading: true });

              // https://cloud.tencent.com/document/product/436/13324
              const yearMonth = moment().format('YYYYMM');

              // 定义key指向的原文件对象，便于后边返回的数据匹配文件大小和文件原始名称
              const fileKey = {};
              const uploadFileList = [...fileObjs].map(file => {
                const suffix = file.name.substring(file.name.lastIndexOf('.'));
                const objectName = `tms/${yearMonth}/${generateStr(30)}${suffix}`;
                fileKey[objectName] = file;
                return {
                  Bucket: res.result.bucket /* 填写自己的 bucket，必须字段 */,
                  Region: res.result.region /* 存储桶所在地域，必须字段 */,
                  Key: objectName /* 存储在桶里的对象键（例如:1.jpg，a/b/test.txt，图片.jpg）支持中文，必须字段 */,
                  Body: file, // 上传文件对象
                };
              });

              ossClient.uploadFiles(
                {
                  files: uploadFileList,
                  SliceSize: 1024 * 1024 * 10 /* 设置大于10MB采用分块上传  可自行设置，非必须  */,
                  onProgress: this.uploadprocess,
                },
                (err1, data) => {
                  if (err1) {
                    message.error(formatMessage({ id: 'global.uploadFail' }), err1);
                  } else {
                    console.log(data);
                    // 文件上传成功，
                    const fileInfoList = [];
                    data.files.forEach(everyFile => {
                      if (everyFile.error) {
                        message.error(everyFile.error.message);
                        return;
                      }
                      const item = everyFile.options;

                      console.log(item);
                      console.log(fileKey);
                      console.log(fileKey[item.Key]);
                      const fileInfo = {};
                      // 取得原来的文件名
                      const fileName = fileKey[item.Key].name;
                      // 去掉后缀后的文件名
                      fileInfo.fileName = fileName.substring(0, fileName.lastIndexOf('.'));
                      // fileInfo.type =   // 在后台处理
                      // fileInfo.duration
                      fileInfo.status =
                        sessionStorage.getItem('managecom').length === 3 ? '1' : '9'; // 总公司上传的默认启用，非总公司上传的默认待审核
                      fileInfo.path = item.Key;
                      const url = ossClient.getObjectUrl({
                        Bucket: res.result.bucket /* 填入您自己的存储桶，必须字段 */,
                        Region: res.result.region /* 存储桶所在地域，例如 ap-beijing，必须字段 */,
                        Key: item.Key /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），支持中文，必须字段 */,
                        Sign: true,
                        Expires: 3600 * 24 * 365 * 30, // 单位秒  30年有效期
                      });
                      fileInfo.url = url.replace('http://', 'https://');
                      // fileInfo.imageScale = '原始尺寸';
                      console.log(fileInfo);

                      fileInfoList.push(fileInfo);
                    });

                    if (fileInfoList.length) {
                      dispatch({
                        type: 'MicroVideo/addNew',
                        payload: fileInfoList,
                        callback: () => {
                          this.setState({ fileUploadLoading: false });
                          if (afterSubmit) {
                            afterSubmit();
                          }
                        },
                      });
                    }
                  }
                }
              );
            },
          });
        }
      }
    });
  };

  uploadprocess = info => {
    // console.log(info)
    this.setState({ progress: info.percent });
  };

  render() {
    const { submitting, CodeSelect } = this.props;
    const { progress, fileUploadLoading } = this.state;

    const {
      form: { getFieldDecorator },
    } = this.props;

    return (
      <Fragment>
        <Form
          {...CodeSelect.formItemLayoutCol1}
          onSubmit={this.handleSubmit}
          style={{ marginTop: 8 }}
        >
          <FormItem label={<FormattedMessage id="MicroVideo.uploadVideo" />}>
            {getFieldDecorator('files', {
              initialValue: [],
              rules: [
                {
                  required: true,
                  message: formatMessage({ id: 'LtCourseProgramSchedule.courseFile' }),
                },
              ],
              valuePropName: 'fileList',
            })(
              <Upload
                maxCount={6}
                lazyUpload
                title={<FormattedMessage id="MicroVideo.onlyUploadVideo" />}
              />
            )}
          </FormItem>
          {/* */}
          <FormItem label={<FormattedMessage id="LtTeacherKnowLedgeAnnex.uploadProgress" />}>
            <Progress
              style={{ width: '100%' }}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              percent={Number((progress * 100).toFixed(0))}
            />
          </FormItem>
          <Row style={{ marginTop: 32, textAlign: 'center' }}>
            <Button type="primary" htmlType="submit" loading={submitting || fileUploadLoading}>
              <FormattedMessage id="global.upload" />
            </Button>
          </Row>
        </Form>
      </Fragment>
    );
  }
}
const AddFileInfoCom = Form.create()(AddFileInfo);

export default AddFileInfoCom;
