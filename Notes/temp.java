package com.sinosoft.ss.controller;

import cn.hutool.core.util.ObjectUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinosoft.cache.UserCache;
import com.sinosoft.commonutil.BeanCopyUtil;
import com.sinosoft.domain.LtQuestionAnswer;
import com.sinosoft.repository.LtQuestionBankRepository;
import com.sinosoft.repository.LtQuestionRepository;
import com.sinosoft.service.LtQuestionQueryService;
import com.sinosoft.service.dto.LtQuestionBankDTO;
import com.sinosoft.service.dto.LtQuestionCriteria;
import com.sinosoft.service.dto.LtQuestionDTO;
import com.sinosoft.service.mapper.LtQuestionBankMapper;
import com.sinosoft.commonutil.MapToBeanUtil;
import com.sinosoft.service.vo.PubRespInfoModel;
import com.sinosoft.ss.service.SsLtQuestionService;
import com.sinosoft.ss.vo.LtQuestionAndAnswersVO;
import com.sinosoft.util.MessageUtil;
import com.sinosoft.util.StringUtil;
import com.sinosoft.web.rest.errors.BadRequestAlertException;
import com.sinosoft.web.rest.errors.BusinessErrorException;
import io.github.jhipster.service.filter.StringFilter;
import io.github.jhipster.web.util.HeaderUtil;
import io.github.jhipster.web.util.PaginationUtil;
import io.micrometer.core.annotation.Timed;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import springfox.documentation.annotations.ApiIgnore;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing {@link com.sinosoft.domain.LtQuestion}.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@RestController
@Api(tags = "题目信息")
@RequestMapping("/api/ss")
public class SsLtQuestionResource {
    private final Logger log = LoggerFactory.getLogger(SsLtQuestionResource.class);

    private static final String ENTITY_NAME = "ssLtQuestion";

    @Value("${spring.application.name}")
    private String applicationName;

    private final SsLtQuestionService ssLtQuestionService;

    private final LtQuestionQueryService ltQuestionQueryService;

    private final LtQuestionRepository ltQuestionRepository;

    private final LtQuestionBankRepository ltQuestionBankRepository;

    private final LtQuestionBankMapper ltQuestionBankMapper;

    private final UserCache userCache;

    public SsLtQuestionResource(SsLtQuestionService ssLtQuestionService, LtQuestionQueryService ltQuestionQueryService, LtQuestionRepository ltQuestionRepository, LtQuestionBankRepository ltQuestionBankRepository, LtQuestionBankMapper ltQuestionBankMapper, UserCache userCache) {
        this.ssLtQuestionService = ssLtQuestionService;
        this.ltQuestionQueryService = ltQuestionQueryService;
        this.ltQuestionRepository = ltQuestionRepository;
        this.ltQuestionBankRepository = ltQuestionBankRepository;
        this.ltQuestionBankMapper = ltQuestionBankMapper;
        this.userCache = userCache;
    }
    @Autowired
    private MessageUtil messageUtil;

    /**
     * 校验问题
     * @param questionCode
     * @return
     */
    @ApiOperation(value = "校验问题")
    @GetMapping("/lt-question/check-question")
    @Timed
    public ResponseEntity<PubRespInfoModel> checkQuestion(@RequestParam String questionCode) {
        log.info("REST request to checkQuestion by questionCode : {}", questionCode);
        PubRespInfoModel pubRespInfoModel = ssLtQuestionService.checkQuestionBindTestPaper(questionCode);
        return ResponseEntity.ok().body(pubRespInfoModel);
    }

    /**
     * {@code GET  /lt-questions} : get all the ltQuestions.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of ltQuestions in body.
     */
    @GetMapping("/lt-questions")
    @ApiIgnore
    public ResponseEntity<List<LtQuestionAndAnswersVO>> getAllLtQuestions(LtQuestionCriteria criteria, Pageable pageable) {
        log.debug("REST request to get LtQuestions by criteria: {}", criteria);
        Page<LtQuestionDTO> page = ltQuestionQueryService.findByCriteria(criteria, pageable);
        List<LtQuestionDTO> questionDTOS = page.getContent();
        List<LtQuestionAndAnswersVO> list = new ArrayList<>();
        for (LtQuestionDTO ltQuestionDTO:questionDTOS){
            LtQuestionAndAnswersVO ltQuestionAndAnswersVO = new LtQuestionAndAnswersVO();
            BeanCopyUtil.copyPropertiesIgnoreNull(ltQuestionDTO,ltQuestionAndAnswersVO);
/*            List<LtQuestionAnswer> answers = ltQuestionAnswerRepository.findAllByQuestionCodeAndCompanyAndDeleted(ltQuestionDTO.getQuestionCode(),company,false);
            List<LtQuestionAnswerVO> answersVOS = new ArrayList<>();
            answers.forEach(item->{
                LtQuestionAnswerVO ltQuestionAnswerVO = new LtQuestionAnswerVO();
                BeanCopyUtil.copyPropertiesIgnoreNull(item,ltQuestionAnswerVO);
                answersVOS.add(ltQuestionAnswerVO);
            });
            ltQuestionAndAnswersVO.setOptions(answersVOS);*/
            list.add(ltQuestionAndAnswersVO);
        }
        Page<LtQuestionAndAnswersVO> newPage = new PageImpl<>(list,pageable,page.getTotalElements());
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), newPage);
        return ResponseEntity.ok().headers(headers).body(newPage.getContent());
    }

    @GetMapping("/lt-getQuestionBankDetail")
    @ApiOperation(value = "题库明细下载")
    public ResponseEntity<PubRespInfoModel> fetchQuestionBankDetail(@RequestParam(value = "questionBankCode") String questionBankCode) {
        log.debug("REST get questionBankCode : {}", questionBankCode);
        if (questionBankCode == null) {
            throw new BadRequestAlertException("questionBankCode", ENTITY_NAME, "questionBankCodeNull");
        }
        PubRespInfoModel infoModel = ssLtQuestionService.fetchQuestionBankDetail(questionBankCode);
        return ResponseEntity.ok(infoModel);
    }

    /**新增、修改题目内容
     *
     * @param map
     * @return
     * @throws Exception
     */
    @PostMapping("/lt-questions")
    @ApiOperation(value = "新增/修改题目内容")
    public ResponseEntity modifyLtQuestion(@RequestBody Map<String,Object> map) throws Exception {
        log.debug("REST request to save map : {}", map);
        Map<String, Object> ltQuestionMap = (Map<String, Object>) map.get("ltQuestionDTO");

        String operaType = (String)map.get("operaType");
        Boolean bindStatus = ObjectUtils.isEmpty((Boolean) map.get("bindStatus"))?false:(Boolean) map.get("bindStatus");
        String oldQuestionCode = (String)map.get("oldQuestionCode");
        String branchType = (String)map.get("branchType");
        String manageCom = (String)map.get("manageCom");
        List<Map<String,Object>> ltQuestionAnswerMap =  (List<Map<String,Object>>) ltQuestionMap.get("options");
        LtQuestionDTO ltQuestionDTO = MapToBeanUtil.mapToBean(ltQuestionMap,LtQuestionDTO.class);

        /**增加题目的时候校验**/
        PubRespInfoModel pubRespInfoModel = this.checkAddLtQuestionMessage(ltQuestionDTO);
        if (pubRespInfoModel != null) {
            return ResponseEntity.ok().body(pubRespInfoModel);
        }

        List<LtQuestionAnswer> ltQuestionAnswers = new ArrayList<>();
        if (ltQuestionAnswerMap != null){
            for (Map<String, Object> item:ltQuestionAnswerMap){
                LtQuestionAnswer ltQuestionAnswer = MapToBeanUtil.mapToBean(item,LtQuestionAnswer.class);
                ltQuestionAnswers.add(ltQuestionAnswer);
            }
        }
        LtQuestionBankDTO ltQuestionBankDTO = ltQuestionBankMapper.toDto(ltQuestionBankRepository.findTopByQuestionBankCode(ltQuestionDTO.getBankCode()));
        if (ObjectUtil.isNotNull(ltQuestionBankDTO)){
            ltQuestionDTO.setCategoryString(ltQuestionBankDTO.getCategoryString());
        }
        ltQuestionDTO.setBranchType(branchType);
        ltQuestionDTO.setManageCom(manageCom);
        log.info("修改题目内容: {} 修改题目选项: {}", ltQuestionDTO ,ltQuestionAnswers);
        LtQuestionDTO result = ssLtQuestionService.modifyLtQuestionInfo(ltQuestionDTO,operaType,oldQuestionCode,ltQuestionAnswers,bindStatus);
        log.info("修改题目结果: {}", result);
        return ResponseEntity.created(new URI("/api/ss/lt-questions/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    private PubRespInfoModel checkAddLtQuestionMessage(LtQuestionDTO ltQuestionDTO) {

        //增加题目类型校验规则
        String questionType = ltQuestionDTO.getQuestionType();

        //题干
        String questionContent = ltQuestionDTO.getQuestionContent();
        //答案/答案关键字
        String openQuestionKey = ltQuestionDTO.getOpenQuestionKey();

        //填空题校验规则
        if ("completion".equals(questionType)) {
            //将题干中文括号替换成英文
            String replaceQuestionContent = questionContent.replaceAll("（", "(").replaceAll("）", ")");

            // 统计 questionContent 中的（）的个数
            int countBrackets = StringUtil.countOccurrences(replaceQuestionContent, "(", ")");

            //多个填空题的时候再判断
            if (countBrackets > 1) {
                //将答案中中文逗号替换为英文逗号
                String replaceOpenQuestionKey = openQuestionKey.replaceAll("，", ",");
                // 统计, 的个数需要+1
                int countCommas = StringUtil.countStringOccurrences(replaceOpenQuestionKey, ",") + 1;
                // 比较两个计数结果
                if (countBrackets != countCommas) {
//                    pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
//                    pubRespInfoModel.setMsg(messageUtil.getMessage("SsLtQuestionResource.modifyLtQuestion.questionType"));
//                    return pubRespInfoModel;
                    throw new BusinessErrorException(messageUtil.getMessage("SsLtQuestionResource.modifyLtQuestion.questionType"));
                }
            }
        }
        return null;
    }
//    /**
//     * 删除题目信息
//     */
//    @ApiOperation(value = "删除题目信息")
//    @DeleteMapping("/lt-questions/delete/{id}")
//    @Timed
//    public ResponseEntity<PubRespInfoModel> deleteLtQuestion(@RequestBody Map<String, String> map) {
//        PubRespInfoModel pubRespInfoModel = ssLtQuestionService.deleteLtQuestion(map);
//        return ResponseEntity.ok()
//            .body(pubRespInfoModel);
//    }
//


    /**
     * 批量移动、删除
     * @param map
     * @return
     */
    @PostMapping("/lt-question/batch-operate")
    @ApiOperation(value = "题库批量操作")
    public ResponseEntity<PubRespInfoModel> batchOperator(@RequestBody Map map) {
        log.info("Request data batchOperator: {}", map);
        PubRespInfoModel infoModel = ssLtQuestionService.batchOperator(map);
        return ResponseEntity.ok().body(infoModel);
    }

    /**
     * 复制问题信息
     *
     * @param map
     * @return
     */
    @PostMapping("/lt-questions/copy-question")
    public ResponseEntity<PubRespInfoModel> copyQuestion(@RequestBody Map<String, String> map) throws Exception {
        PubRespInfoModel pubRespInfoModel = ssLtQuestionService.copyQuestion(map);
        return ResponseEntity.ok().body(pubRespInfoModel);
    }

    /**
     * 展示各个题型的有效题目数量统计
     * @param queryMap
     * @return
     */
    @ApiOperation(value = "展示各个题型的有效题目数量统计")
    @GetMapping("/lt-question/statistics-question")
    @Timed
    public ResponseEntity<List<Map<String, Object>>> statisticsQuestion(@RequestParam Map<String,Object> queryMap) {
        log.info("REST request to statisticsQuestion by queryMap : {}", queryMap);
        List<Map<String, Object>> map = ssLtQuestionService.statisticsQuestion(queryMap);
        return ResponseEntity.ok().body(map);
    }



    /**
     * 根据问卷获取题目及其选项
     * @param examCode
     * @return
     */
    @ApiOperation(value = "根据问卷获取题目及其选项")
    @GetMapping("/lt-question/get-survey-question")
    @Timed
    public ResponseEntity<List<LtQuestionAndAnswersVO>> getQuestionAnswersAna(String examCode) {
        log.info("REST request to getQuestionAnswersAna by examCode : {}", examCode);

        List<LtQuestionAndAnswersVO> list = ssLtQuestionService.fetchQuestionAnswersAna(examCode);
        return ResponseEntity.ok().body(list);
    }

    /**
     * 批量提交至审核中  批量启用  批量停用
     */
    @ApiOperation(value = "批量修改状态")
    @PutMapping("/lt-question/batch-status")
    public ResponseEntity<PubRespInfoModel> batchStatus(@RequestBody Map<String, String> map) throws URISyntaxException {
        log.debug("REST request to batchApproveData : {}", map);
        PubRespInfoModel pubRespInfoModel = ssLtQuestionService.batchStatus(map);
        return ResponseEntity.ok()
            .body(pubRespInfoModel);
    }

    /**
     * 批量删除
     */
    @ApiOperation(value = "批量修改状态")
    @PutMapping("/lt-question/batch-remove")
    public ResponseEntity<PubRespInfoModel> batchRemove(@RequestBody Map<String, String> map) throws URISyntaxException {
        log.debug("REST request to batchApproveData : {}", map);
        PubRespInfoModel pubRespInfoModel = ssLtQuestionService.batchRemove(map);
        return ResponseEntity.ok()
            .body(pubRespInfoModel);
    }


    /**
     * {@code GET  /lt-questions} : get all the ltQuestions.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of ltQuestions in body.
     */
    @GetMapping("/lt-questions-bank")
    @ApiIgnore
    public ResponseEntity<List<LtQuestionDTO>> getAllLtQuestionsByBank(LtQuestionCriteria criteria, Pageable pageable) {
        log.debug("REST request to get LtQuestions by criteria: {}", criteria);

        List<String> questionBankCodeList = ltQuestionBankRepository.findAllQuestionBankCodeByStatus();

        StringFilter statusFilter = new StringFilter();
        statusFilter.setEquals("1");
        criteria.setStatus(statusFilter);


        Page<LtQuestionDTO> page = ltQuestionQueryService.findByCriteria(criteria, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());

    }
}




package com.sinosoft.repository;

import com.sinosoft.domain.LtQuestion;
import com.sinosoft.domain.LtQuestionBank;

import com.sinosoft.service.dto.LtQuestionBankDTO;
import com.sinosoft.util.NError;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data  repository for the LtQuestionBank entity.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@SuppressWarnings("unused")
@Repository
public interface LtQuestionBankRepository extends JpaRepository<LtQuestionBank, Long>, JpaSpecificationExecutor<LtQuestionBank> {
    List<LtQuestionBank> findAllByQuestionBankCode(String questionBankCode);

    List<LtQuestionBank> findAllByQuestionBankCodeAndCompany(String questionBankCode, String company);

    List<LtQuestionBank> findAllByQuestionBankCodeAndDeleted(String foreignCode, boolean b);

    @Modifying
    @Query(value = "update lt_question_bank  set status = ?2 where id in (?1)   ", nativeQuery = true)
    void updateStatus(List<Long> questionBankCodeList, String status);

    @Query(value = "select a.* from lt_question_bank a where a.category_string =?1 and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2))",nativeQuery = true)
    List<LtQuestionBank> findAllByCategoryStringAndPrivateStateOrderByCreatedDateDesc(String categoryString, String trainCode);

    @Query(value = "select a.* from lt_question_bank a where a.category_string =?1 and a.status ='1' and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2))",
        countQuery = "select count(1) from lt_question_bank a where a.category_string =?1 and a.status ='1' and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2))",nativeQuery = true)
    Page<LtQuestionBank> findAllByCategoryStringAndPrivateStateAndStatusOrderByCreatedDateDesc(String categoryString, String trainCode,Pageable pageable);

    LtQuestionBank findTopByQuestionBankCodeAndDeleted(String bankCode, boolean b);

    Page<LtQuestionBank> findAllByCategoryStringAndStatusOrderByCreatedDateDesc(String categoryString, String s, Pageable pageable);

    Page<LtQuestionBank> findAllByStatusOrderByCreatedDateDesc(String s, Pageable pageable);

    @Query(value = "select a.* from lt_question_bank a where a.status =?2 and (?1 is null or a.category_string = ?1) and (?3 is null or a.question_bank_code = ?3) and (?4 is null or a.created_by_staff_code = ?4) and (?5 is null or a.created_by_name like ?5 ) and (?6 is null or a.question_bank_name like concat('%',?6,'%') ) and (?7 is null or a.created_by_manage_com like ?7)",
        countQuery = "select count(1) from lt_question_bank a where a.status =?2 and (?1 is null or a.category_string = ?1) and (?3 is null or a.question_bank_code = ?3) and (?4 is null or a.created_by_staff_code = ?4) and (?5 is null or a.created_by_name like ?5 ) and (?6 is null or a.question_bank_name like concat('%',?6,'%') ) and (?7 is null or a.created_by_manage_com like ?7)" ,nativeQuery = true)
    Page<LtQuestionBank> findAllByCategoryStringAndStatusAndQuestionBankCodeAndCreatedByStaffCodeAndCreatedByNameOrderByCreatedDateDesc(String categoryString, String s, String questionBankCode, String createdByStaffCode, String createdByName, String bankName,String manageCom,Pageable pageable);

    @Query(value = "select a.* from lt_question_bank a where (?1 is null or a.category_string =?1) and a.status ='1' and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2)) and (?3 is null or a.question_bank_code = ?3) and (?4 is null or a.created_by_staff_code =?4) and (?5 is null or a.created_by_name like concat('%',?5,'%')) and (?6 is null or a.question_bank_name like concat('%',?6,'%') ) and (?7 is null or a.created_by_manage_com like ?7)",
        countQuery = "select count(1) from lt_question_bank a where (?1 is null or a.category_string =?1) and a.status ='1' and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2)) and (?3 is null or a.question_bank_code = ?3) and (?4 is null or a.created_by_staff_code =?4) and (?5 is null or a.created_by_name like concat('%',?5,'%')) and (?6 is null or a.question_bank_name like concat('%',?6,'%') ) and (?7 is null or a.created_by_manage_com like ?7)",nativeQuery = true)
    Page<LtQuestionBank> findAllByCategoryStringAndPrivateStateAndStatusAndQuestionBankCodeAndCreatedByStaffCodeAndCreatedByNameOrderByCreatedDateDesc(String categoryString, String trainCode, String questionBankCode, String createdByStaffCode, String createdByName, String bankName,String manageCom, Pageable pageable);

    LtQuestionBank findTopByQuestionBankCode(String bankCode);

    @Query(value = "select a.* from lt_question_bank a where a.category_string =?1 and a.status ='1' and (a.private_state = 'public' or (a.private_state = 'private' and a.created_by_staff_code = ?2))",nativeQuery = true)
    List<LtQuestionBank> findAllByCategoryStringAndPrivateStateAndStatusOrderByCreatedDateDesc(String categoryString, String trainCode);


    List<LtQuestionBank> findAllByCategoryStringAndStatusOrderByCreatedDateDesc(String categoryString, String s);

    @Query(value = "select a.question_bank_code from lt_question_bank a where a.status ='1' ",nativeQuery = true)
    List<String> findAllQuestionBankCodeByStatus();
}



import React, { Fragment, PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage, FormattedMessage } from 'umi/locale';
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Spin,
  TreeSelect,
  Rate,
  Cascader,
  message,
} from 'antd';
import TableForm from './TableForm';
import { generateStr } from '@/utils/utils';
import EditQuestionTipForm from './editQuestionTipForm';
import CompletionForm from './CompletionForm'
import BraftEditor from 'braft-editor';
import BraftEditorLanguageFn from '@/utils/BraftEditorLanguage.js';
import { myUploadFn } from '@/services/braft';
import commonStyle from '@/assets/styles/project.less';
import 'braft-editor/dist/index.css';
import { isZh, processRichText } from '@/utils/utils';
const FormItem = Form.Item;

@connect(({ LtQuestionAnswer, LtQuestions, ClassifyTree, loading, CodeSelect }) => ({
  LtQuestionAnswer,
  LtQuestions,
  ClassifyTree,
  CodeSelect,
  submitting: loading.models.LtQuestionAnswer || loading.models.LtQuestions,
}))
@Form.create()
class EditForm extends PureComponent {
  componentDidMount() {
    const {
      dispatch,
      form,
      LtQuestions: { currData, op },
      LtQuestionAnswer: { queryPara },
    } = this.props;

    // 根据不同的页面功能，加载数据
    if (op !== 'add') {
      queryPara.size = 10000;
      queryPara.questionCode_equals = currData.questionCode;
      dispatch({
        type: 'LtQuestionAnswer/fetch',
        queryPara,
        callback: res => {
          console.log(res);
          form.setFieldsValue({ options: res.list });
        },
      });
    } else {

    }
  }

  // 提交
  handleSubmit = e => {
    const { dispatch, form, LtQuestions } = this.props;
    const { currData, checkQuestion } = LtQuestions;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      const data = JSON.parse(JSON.stringify(currData || {}));
      const tableData = values.options;
      const compleData = values.openQuestionKey; // 填空标准答案
      console.log('aaaaaa填空答案', compleData);
      console.log('提交的数据:', data);
      if (!err) {
        // 将表单里的数据，同key覆盖
        Object.keys(values).map(key => {
          if (key === 'questionContent') {
            data[key] = values[key].toHTML();
          } else {
            data[key] = values[key];
          }
          return data;
        });

        if (form.getFieldValue('openQuestionKey') !== undefined) {
          const validCompleData = compleData.map(item => item.standardAnswer.trim()).filter(s => s);
          data.openQuestionKey = validCompleData.join(',');
        } else {
          delete data.openQuestionKey;
        }

        /* if (data.questionClassify) {
          // 课程分类
          data.categoryString = values.questionClassify.toString();
          // eslint-disable-next-line prefer-destructuring
          data.category = values.questionClassify[0];
          // eslint-disable-next-line prefer-destructuring
          data.subcategory = values.questionClassify[1];
        } */
        data.questionClassify = 'common';

        if (form.getFieldValue('questionKeys').length > 3) {
          message.error(formatMessage({ id: 'LtQuestion.selectLabel' }));
          return;
        }
        if (form.getFieldValue('questionKeys').length) {
          data.questionKeys = values.questionKeys.toString();
        } else {
          delete data.questionKeys;
        }

        if (
          form.getFieldValue('questionType') !== 'completion' &&
          form.getFieldValue('questionType') !== 'open'
        ) {
          // 正确答案
          const count1 = [];
          // 所有选项
          const count2 = [];
          const counts = (arr, value) => arr.reduce((a, v) => (v === value ? a + 1 : a + 0), 0);
          for (let i = 0; i < tableData.length; i += 1) {
            count2.push(tableData[i].answerContent);
            if (tableData[i].isCorrect === 'Y') {
              count1.push(tableData[i].isCorrect);
            }
          }
          if (new Set(count2).size !== count2.length) {
            message.error(formatMessage({ id: 'LtQuestion.message1' }));
            return;
          }
          if (data.questionType === 'single') {
            if (counts(count1, 'Y') !== 1) {
              message.error(formatMessage({ id: 'LtQuestion.message2' }));
              return;
            }
          }
          if (data.questionType === 'multiple') {
            if (counts(count1, 'Y') < 2) {
              message.error(formatMessage({ id: 'LtQuestion.message3' }));
              return;
            }
          }
          if (data.questionType === 'judge') {
            if (counts(count1, 'Y') !== 1) {
              message.error(formatMessage({ id: 'LtQuestion.message4' }));
              return;
            }
          }
          if (tableData.length === 0) {
            message.error(formatMessage({ id: 'LtQuestion.message5' }));
            return;
          }
          if (tableData.findIndex(item => item.editable === true) !== -1) {
            message.error(formatMessage({ id: 'LtQuestion.message6' }));
            return;
          }
        }
        let type = '';
        if (currData.id && checkQuestion) {
          delete data.createdDate;
          delete data.lastModifiedDate;
          const editObj = {
            type: 'LtQuestions/updateWithConfig',
            data: {
              ltQuestionDTO: data,
            },
          };
          dispatch({
            type: 'LtQuestions/editQuestionModel',
            changeQuestionModel: true,
            hideModelNeedSubmit: JSON.parse(JSON.stringify(editObj)),
          });
        } else {
          if (currData.id) {
            delete data.createdDate;
            delete data.lastModifiedDate;
          } else {

            data.status = '0';
            data.dataCate = 'question';
            data.questionCode = generateStr();
          }
          dispatch({
            type: 'LtQuestions/submit',
            payload: {
              ltQuestionDTO: data,
              bindStatus: checkQuestion,
            },
            callback: () => {
              dispatch({
                type: 'LtQuestions/openView',
                view: 'home',
                op: '',
                currData: {},
              });
            },
          });
        }
      }
    });
  };

  // 弹出关闭按钮
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch({ type: 'LtQuestions/editQuestionModel', changeQuestionModel: false });
    dispatch({ type: 'LtQuestions/openView', view: 'home', op: '', currData: {} });
  };

  // 填空题转
  getQues = (valuess) => {
    //填空用 $$ 替换,
    if (valuess) {
      if (valuess.includes(',')) {
        const standardAnswersArray = valuess.split(',').map((answer, index) => ({
          key: `OLD_TEMP_ID_${index}`,
          standardAnswer: answer,
        }));
        console.log(standardAnswersArray);
        return standardAnswersArray;
      } else {
        return [{
          key: `OLD_TEMP_ID_00`,
          standardAnswer: valuess,
        }]
      }
    } else {
      return []
    }
  }

  render() {
    const {
      form,
      submitting,
      LtQuestions,
      LtQuestionAnswer,
      ClassifyTree,
      CodeSelect,
    } = this.props;
    const { tableFormData } = LtQuestionAnswer;
    const { currData, changeQuestionModel } = LtQuestions;
    const { getFieldDecorator } = form;
    const { TextArea } = Input;
    const data = tableFormData;
    // 数组里每个对象增加key信息
    data.map((key, idx) => {
      data[idx] = data[idx];
      data[idx].key = `OLD_TEMP_ID_${idx}`;
      return data;
    });
    console.log('data,', data);
    console.log('tableFormData,', tableFormData);

    return (
      <Fragment>
        <Spin
          spinning={submitting === undefined ? false : submitting}
          tip={<FormattedMessage id="global.spin.tips" />}
        >
          <Form
            onSubmit={this.handleSubmit}
            {...CodeSelect.formItemLayoutCol1}
            style={{ marginTop: 8 }}
            layout="horizontal"
          >
            {/* <FormItem label={<FormattedMessage id="LtQuestion.questionClassify" />}>
              {getFieldDecorator('questionClassify', {
                initialValue: currData.categoryString
                  ? currData.categoryString.split(',')
                  : undefined,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'LtQuestion.questionClassify',
                    }),
                  },
                ],
              })(
                <Cascader
                  options={ClassifyTree.questionClassifyTreeData}
                  allowClear
                  showSearch
                  expandTrigger="hover"
                  changeOnSelect
                  placeholder={
                    formatMessage({ id: 'global.select.placeholder' }) +
                    formatMessage({ id: 'LtQuestion.questionClassify' })
                  }
                />
              )}
            </FormItem> */}
            {form.getFieldValue('questionClassify') === 'course' && (
              <FormItem label={<FormattedMessage id="LtQuestion.sourceCode" />}>
                {getFieldDecorator('sourceCode', {
                  initialValue: currData.sourceCode,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'LtQuestion.sourceCode',
                      }),
                    },
                  ],
                })(
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    disabled
                    placeholder={
                      formatMessage({ id: 'global.select.placeholder' }) +
                      formatMessage({ id: 'LtQuestion.sourceCode' })
                    }
                  >
                    {CodeSelect.courseCode.map(item => (
                      <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                    ))}
                  </Select>
                )}
              </FormItem>
            )}
            <FormItem label={<FormattedMessage id="LtQuestion.questionType" />}>
              {getFieldDecorator('questionType', {
                initialValue: currData.questionType ? currData.questionType : 'single',
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: 'LtQuestion.questionType',
                    }),
                  },
                ],
              })(
                <Radio.Group disabled={currData.id}>
                  {CodeSelect.questionType.map(item => (
                    <Radio key={item.codeValue} value={item.codeValue}>
                      {item.codeName}
                    </Radio>
                  ))}
                </Radio.Group>
              )}
            </FormItem>
            <FormItem label={<FormattedMessage id="LtQuestion.questionKeys" />}>
              {getFieldDecorator('questionKeys', {
                initialValue: currData.questionKeys ? currData.questionKeys.split(',') : [],
              })(
                <Select
                  mode="tags"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  placeholder={
                    formatMessage({ id: 'global.select.placeholder' }) +
                    formatMessage({ id: 'LtQuestion.questionKeys' })
                  }
                >
                  {CodeSelect.questionKeys.map(item => (
                    <Select.Option key={item.codeValue}>{item.codeName}</Select.Option>
                  ))}
                </Select>
              )}
            </FormItem>
            <Row>
              {form.getFieldValue('questionType') !== 'completion' && (
                <FormItem label={<FormattedMessage id="LtQuestion.questionContent" />}>
                  {getFieldDecorator('questionContent', {
                    initialValue:
                      currData.questionContent === ''
                        ? undefined
                        : BraftEditor.createEditorState(currData.questionContent),
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'LtQuestion.questionContent' }),
                      },
                    ],
                  })(
                    <BraftEditor
                      media={{ uploadFn: myUploadFn }}
                      controls={['bold','italic','underline','font-size','text-color','text-align','list-ul','list-ol','media']}
                      contentStyle={{ height: 200, border: '1px solid lightgray' }}
                      className={commonStyle.braftStyle}
                      placeholder={
                        formatMessage({ id: 'global.input.placeholder' }) +
                        formatMessage({ id: 'LtQuestion.questionContent' })
                      }
                      language={BraftEditorLanguageFn}
                    />
                  )}
                </FormItem>
              )}
              {form.getFieldValue('questionType') === 'completion' && (
                <FormItem
                  label={<FormattedMessage id="LtQuestion.questionContent" />}
                  extra={<FormattedMessage id="LtQuestion.questionContentPrompt" />}
                >
                  {getFieldDecorator('questionContent', {
                    initialValue:
                      currData.questionContent === ''
                        ? undefined
                        : BraftEditor.createEditorState(currData.questionContent),
                    rules: [
                      {
                        required: true,
                        message: formatMessage({ id: 'LtQuestion.questionContent' }),
                      },
                    ],
                  })(
                    <BraftEditor
                      media={{ uploadFn: myUploadFn }}
                      controls={['bold','italic','underline','font-size','text-color','text-align','list-ul','list-ol','media']}
                      contentStyle={{ height: 200, border: '1px solid lightgray' }}
                      className={commonStyle.braftStyle}
                      placeholder={
                        formatMessage({ id: 'global.input.placeholder' }) +
                        formatMessage({ id: 'LtQuestion.questionContent' })
                      }
                      language={BraftEditorLanguageFn}
                    />
                  )}
                </FormItem>
              )}
            </Row>
            {/*标准答案*/}
            {form.getFieldValue('questionType') == 'completion' && (
              <FormItem label={<FormattedMessage id="LtExamQuestionStudent.standardAnswer" />}>
                {getFieldDecorator('openQuestionKey', {
                  initialValue: this.getQues(currData.openQuestionKey),
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'LtExamQuestionStudent.standardAnswer',
                      }),
                    },
                  ],
                })(<CompletionForm />)}
              </FormItem>
            )}
            {/* {form.getFieldValue('questionType') === 'completion' && (
              <FormItem label={<FormattedMessage id="LtExamQuestionStudent.standardAnswer" />}
                extra={<FormattedMessage id='LtExamQuestionStudent.standardAnswerPrompt' />}>
                {getFieldDecorator('openQuestionKey', {
                  initialValue: currData.openQuestionKey,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: 'LtExamQuestionStudent.standardAnswer',
                      }),
                    },
                  ],
                })(
                  <Input
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtExamQuestionStudent.standardAnswer' })
                    }
                    allowClear
                    autoComplete="off"
                    maxLength={200}
                  />
                )}
              </FormItem>
            )} */}
            {form.getFieldValue('questionType') === 'open' && (
              <FormItem
                label={<FormattedMessage id="LtQuestion.openQuestionKey" />}
                // extra={<FormattedMessage id="LtQuestions.participle" />}
              >
                {getFieldDecorator('openQuestionKey', {
                  initialValue: currData.openQuestionKey ? currData.openQuestionKey.split(',').map(s => s.trim()).filter(Boolean) : [],
                  onChange: (value) => {
                    console.log('openQuestionKey changed:', value);
                  },
                })(
                  <Select
                    mode="tags"
                    tokenSeparators={[',', '，']}
                    // placeholder={formatMessage({ id: 'LtQuestions.participle1' })}
                  />
                )}
              </FormItem>
            )}
            {/*{form.getFieldValue('id') !== null && (*/}
            {/*  <FormItem label={<FormattedMessage id="LtQuestion.isNecessary" />}>*/}
            {/*    {getFieldDecorator('isNecessary', {*/}
            {/*      initialValue: currData.isNecessary*/}
            {/*        ? currData.isNecessary*/}
            {/*        : CodeSelect.yesOrNoDefaultN,*/}
            {/*      // rules: [*/}
            {/*      //   {*/}
            {/*      //     required: true,*/}
            {/*      //     message: formatMessage({*/}
            {/*      //       id: 'LtActivity.needEnroll',*/}
            {/*      //     }),*/}
            {/*      //   },*/}
            {/*      // ],*/}
            {/*    })(*/}
            {/*      <Radio.Group>*/}
            {/*        {CodeSelect.yesOrNo.map(item => (*/}
            {/*          <Radio key={item.codeValue} value={item.codeValue}>*/}
            {/*            {item.codeName}*/}
            {/*          </Radio>*/}
            {/*        ))}*/}
            {/*      </Radio.Group>*/}
            {/*    )}*/}
            {/*  </FormItem>*/}
            {/*)}*/}

            <FormItem label={<FormattedMessage id="LtQuestion.difficultyLevel" />}>
              {getFieldDecorator('difficultyLevel', {
                initialValue: currData.difficultyLevel ? currData.difficultyLevel : '03',
              })(
                <Radio.Group>
                  {CodeSelect.difficultyLevel.map(item => (
                    <Radio key={item.codeValue} value={item.codeValue}>
                      {item.codeName}
                    </Radio>
                  ))}
                </Radio.Group>
              )}
            </FormItem>
            <Row>
              <FormItem label={<FormattedMessage id="LtQuestion.questionAnalysis" />}>
                {getFieldDecorator('questionAnalysis', {
                  initialValue: currData.questionAnalysis,
                })(
                  <TextArea
                    rows={4}
                    placeholder={
                      formatMessage({ id: 'global.input.placeholder' }) +
                      formatMessage({ id: 'LtQuestion.questionAnalysis' })
                    }
                    allowClear
                    autoComplete="off"
                  />
                )}
              </FormItem>
            </Row>
            {form.getFieldValue('questionType') !== 'completion' &&
              form.getFieldValue('questionType') !== 'open' && (
                <FormItem label={<FormattedMessage id="LtQuestion.option" />}>
                  {getFieldDecorator('options', {
                    initialValue: currData.options || [],
                  })(<TableForm />)}
                </FormItem>
              )}
            <Row
              style={{
                display: LtQuestions.op === 'view' ? 'none' : 'block',
                marginTop: 32,
                textAlign: 'center',
              }}
            >
              <Button
                style={{ marginLeft: 8 }}
                type="primary"
                htmlType="submit"
                icon="save"
                loading={submitting}
              >
                <FormattedMessage id="global.save" />
              </Button>
            </Row>
          </Form>
          <Modal
            title={formatMessage({ id: 'LtQuestions.changeQuestionMessage' })}
            width="60%"
            destroyOnClose
            visible={changeQuestionModel}
            footer={[
              <Button key="back" onClick={this.handleCancel}>
                <FormattedMessage id="global.closeup" />
              </Button>,
            ]}
            maskClosable={false}
            closable={false}
          >
            <EditQuestionTipForm />
          </Modal>
        </Spin>
      </Fragment>
    );
  }
}

export default EditForm;



import * as services from '@/services/api';
import { formatMessage } from 'umi/locale';
import { Modal,notification } from 'antd';

export default {
    namespace: 'LtQuestions',

  state: {
    currView: 'home',
    currData: {},
    op: '',
    data: {
      list: [],
      pagination: {},
    },
    selectedIds: [], // 表格的复选框id集合
    selectedRows: [], // 表格的复选框行数据
    tableFormData: [],
    queryPara: {},
    queryParaSize: 100000, // 导出时设置为该值
    isSimpleQuery: true,

    pageFunction: '',
    current: 0,

    leftTreeCollapse: false,

    formLayout: 'horizontal',
    branchTypeCode: '',
    visible: false,
    selectKey: undefined,
    changeQuestionModel: false,
    hideModelNeedSubmit: {},
    StatisticsData: [{}, {}, {}, {}, {}], // 各个分类的的各个题型数量统计
    checkQuestion: undefined,
  },

  effects: {
    *fetch({ queryPara, callback, exportFlag }, { call, put }) {
      const newQueryParam = {
        ...queryPara,
      };
      const response = yield call(services.get, '/api/ss/lt-questions', newQueryParam);
      if (response) {
        if (exportFlag === undefined) {
          // 导出查询时，后台返回的数据不回写state
          yield put({
            type: 'fetchSave',
            payload: response,
            queryPara,
          });
        }
        if (callback) callback(response);
      }
    },

    *submit({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/ss/lt-questions', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *add({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/lt-questions', payload);
      if (response.id) {
        yield put({
          type: 'addsave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *adds({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/lt-questions-batch', payload); // 后台接口地址
      if (response.length) {
        yield put({
          type: 'addssave',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *update({ payload, callback }, { call, put }) {
      const response = yield call(services.put, '/api/lt-questions', payload);
      if (response.id) {
        if (callback) callback(response);
      }
    },

    *updateWithConfig({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/ss/lt-questions', payload);
      if (response.id) {
        if (callback) callback(response);
      }
    },
    // 批量更改状态
    *batchSubmit({ payload, callback }, { call }) {
      const response = yield call(services.put, '/api/ss/lt-question/batch-status', payload);
      if (response) {
        if (callback) callback(response);
      }
    },

    // 批量更改状态
    *batchRemove({ payload, callback }, { call }) {
      const response = yield call(services.put, '/api/ss/lt-question/batch-remove', payload);
      if (response) {
        if (callback) callback(response);
      }
    },

    *remove({ payload, callback }, { call }) {
      const response = yield call(services.del, '/api/lt-questions', payload);
      if (response.flg === 'success') {
        Modal.warning({
          centered: true,
          content: response.msg,
          okText: formatMessage({ id: 'global.ok' }),
          onOk: () => {
            Modal.destroyAll();
          },
        });
      } else if (response.flg !== 'error') {
        if (callback) callback(response);
      }
    },

    *copyQuestion({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/ss/lt-questions/copy-question', payload);
      if (callback) callback(response);
    },

    *batch({ payload, callback }, { call, put }) {
      const response = yield call(services.post, '/api/ss/lt-question/batch-operate', payload);
      if (callback) callback(response);
    },

    *statistics({ queryPara, callback }, { call, put }) {
      let newQueryPara = {};
      let oldQueryPara = JSON.parse(JSON.stringify(queryPara));
      for (let i in oldQueryPara) {
        if (i.indexOf('categoryString') !== -1) {
          newQueryPara[i.split('_')[0]] = oldQueryPara[i];
        }
        if (
          (i.indexOf('in') == -1 && (i.indexOf('equals') !== -1 || i.indexOf('value') !== -1)) ||
          (i.indexOf('contains') == -1 && (i.indexOf('equals') !== -1 || i.indexOf('value') !== -1))
        ) {
          if (i.indexOf('_') !== -1) {
            newQueryPara[i.split('_')[0]] = oldQueryPara[i];
          } else {
            newQueryPara[i] = oldQueryPara[i];
          }
        }
      }
      const response = yield call(
        services.getByDto,
        '/api/ss/lt-question/statistics-question',
        newQueryPara
      );
      yield put({
        type: 'saveStatistics',
        payload: response,
      });
      if (callback) callback(response);
    },

    *checkQuestion({ queryPara, callback, exportFlag }, { call, put }) {
      const response = yield call(services.get, '/api/ss/lt-question/check-question', queryPara);
      if (response) {
        // 导出查询时，后台返回的数据不回写state
        yield put({
          type: 'saveCheckQuestion',
          payload: response,
        });
        if (callback) callback(response);
      }
    },

    *export({ queryPara ,callback}, { call, put }) {
      const response = yield call(services.get, '/api/ss/lt-getQuestionBankDetail', queryPara);
      if (response) {
        console.log('题库下载:',response)
        if (response.flg == 'error') {
          notification.warning({
            message: `后台处理中`,
            description: response.msg,
          });
        } else {
          if (callback) callback(response.data);
        }
      }
    },

  },
  reducers: {
    fetchSave(state, action) {
      return {
        ...state,
        data: action.payload || state.data,
        queryPara: action.queryPara || state.queryPara,
        tableFormData: action.payload.list || state.tableFormData,
      };
    },
    saveStatistics(state, action) {
      return {
        ...state,
        StatisticsData:
          (action.payload.length ? action.payload : [{}, {}, {}, {}, {}]) || state.StatisticsData,
      };
    },
    saveCheckQuestion(state, action) {
      return {
        ...state,
        checkQuestion: action.payload.data,
      };
    },
    addsave(state, action) {
      return {
        ...state,
        currData: action.payload || state.currData,
      };
    },
    addssave(state, action) {
      return {
        ...state,
        tableFormData: action.payload || state.tableFormData,
      };
    },
    switchQuery(state) {
      return {
        ...state,
        isSimpleQuery: !state.isSimpleQuery,
      };
    },
    reSet(state) {
      return {
        ...state,
        data: {
          list: [],
          pagination: {},
        },
        selectedIds: [],
        selectedRows: [],
        tableFormData: [],
        queryPara: {},
        branchTypeCode: '',
        checkQuestion:undefined,
        selectKey: undefined,
      };
    },

    updateSelectedIds(state, action) {
      return {
        ...state,
        selectedIds: action.selectedIds || state.selectedIds,
      };
    },
    updateSelectedRows(state, action) {
      return {
        ...state,
        selectedRows: action.selectedRows || state.selectedRows,
      };
    },
    openView(state, action) {
      if (action.view === 'edit' && action.currData.options) {
        action.currData.options = action.currData.options.map(item => {
          if (!item.key) {
            item.key = `NEW_TEMP_ID_${Math.ceil(Math.random() * 10) + 10}`;
          }
          return item;
        });
      }
      return {
        ...state,
        currView: action.view,
        currData: action.op === 'add' ? { bankCode:action.currData.bankCode,options: [] } : action.currData || state.currData,
        op: action.op || state.op,
        current: 0,
        checkQuestion:undefined,
        selectedIds: action.view === 'home' ? [] : state.selectedIds,
      };
    },

    setBranchTypeCode(state, action) {
      return {
        ...state,
        branchTypeCode: action.branchTypeCode || state.branchTypeCode,
      };
    },
    changePageFunction(state, action) {
      return {
        ...state,
        pageFunction: action.pageFunction,
        queryPara: {},
      };
    },
    stepState(state, action) {
      return {
        ...state,
        current: action.current,
      };
    },
    visibleState(state, action) {
      return {
        ...state,
        visible: action.visible,
      };
    },
    editQuestionModel(state, action) {
      return {
        ...state,
        changeQuestionModel: action.changeQuestionModel,
        hideModelNeedSubmit: action.hideModelNeedSubmit,
      };
    },
    changeLeftTreeCollapse(state, { payload }) {
      return {
        ...state,
        leftTreeCollapse: payload,
      };
    },
    initSelectedIds(state) {
      return {
        ...state,
        selectedIds: [],
        selectedRows: [],
      };
    },
  },
};
