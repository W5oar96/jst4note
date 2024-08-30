package com.sinosoft.ss.controller;


import com.sinosoft.cache.UserCache;
import com.sinosoft.commonutil.BeanCopyUtil;
import com.sinosoft.commonutil.SnowUtils;
import com.sinosoft.config.MaxNoServer;
import com.sinosoft.domain.LtExamInfo;
import com.sinosoft.domain.LtTestPaper;
import com.sinosoft.enums.ResouceEnum;
import com.sinosoft.repository.LtExamInfoRepository;
import com.sinosoft.repository.LtExamStudentRepository;
import com.sinosoft.repository.LtTestPaperQuestionRepository;
import com.sinosoft.repository.LtTestPaperRepository;
import com.sinosoft.service.AsyncMethods;
import com.sinosoft.service.BatchService;
import com.sinosoft.service.LtExamInfoQueryService;
import com.sinosoft.service.LtExamInfoService;
import com.sinosoft.service.constants.RedisConstants;
import com.sinosoft.service.dto.LtExamInfoCriteria;
import com.sinosoft.service.dto.LtExamInfoDTO;
import com.sinosoft.service.dto.LtExamStudentDTO;
import com.sinosoft.service.dto.LtTestPaperDTO;
import com.sinosoft.service.mapper.LtExamInfoMapper;
import com.sinosoft.service.mapper.LtExamStudentMapper;
import com.sinosoft.service.util.PubFun;
import com.sinosoft.service.util.RedisUtil;
import com.sinosoft.service.vo.PubRespInfoModel;
import com.sinosoft.ss.service.SsLtExamInfoService;
import com.sinosoft.ss.vo.LtExamInfoVO;
import com.sinosoft.ss.vo.LtPracticeVO;
import com.sinosoft.ss.vo.LtQuestionAndAnswersVO;
import com.sinosoft.util.EncodingRulesUtils;
import com.sinosoft.util.MessageUtil;
import com.sinosoft.web.rest.errors.BadRequestAlertException;
import com.sinosoft.web.rest.errors.BusinessErrorException;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import springfox.documentation.annotations.ApiIgnore;

import javax.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing {@link com.sinosoft.domain.LtExamInfo}.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@RestController
@Api(tags = "考试安排")
@RequestMapping("/api/ss")
public class SsLtExamInfoResource {

    private final Logger log = LoggerFactory.getLogger(SsLtExamInfoResource.class);

    @Value("${spring.application.name}")
    private String applicationName;

    private static final String ENTITY_NAME = "SsLtExamInfo";

    private final SsLtExamInfoService ssLtExamInfoService;

    private final LtExamInfoService ltExamInfoService;

    private final LtExamInfoQueryService ltExamInfoQueryService;

    private final BatchService batchService;

    private final UserCache userCache;

    private final LtTestPaperRepository ltTestPaperRepository;

    private final LtTestPaperQuestionRepository ltTestPaperQuestionRepository;

    private final LtExamInfoRepository ltExamInfoRepository;

    private final LtExamStudentRepository ltExamStudentRepository;

    private final LtExamInfoMapper ltExamInfoMapper;

    private final LtExamStudentMapper ltExamStudentMapper;

    private final MessageUtil messageUtil;

    private final RedisUtil redisUtil;

    private final MaxNoServer maxNoServer;

    private final EncodingRulesUtils encodingRulesUtils;

    @Autowired
    private AsyncMethods asyncMethods;

    public SsLtExamInfoResource(SsLtExamInfoService ssLtExamInfoService, LtExamInfoService ltExamInfoService, LtExamInfoQueryService ltExamInfoQueryService, UserCache userCache, LtTestPaperRepository ltTestPaperRepository, LtTestPaperQuestionRepository ltTestPaperQuestionRepository, LtExamInfoRepository ltExamInfoRepository, LtExamStudentRepository ltExamStudentRepository, LtExamInfoMapper ltExamInfoMapper, LtExamStudentMapper ltExamStudentMapper, MessageUtil messageUtil, RedisUtil redisUtil, MaxNoServer maxNoServer, EncodingRulesUtils encodingRulesUtils, BatchService batchService) {
        this.ssLtExamInfoService = ssLtExamInfoService;
        this.ltExamInfoService = ltExamInfoService;
        this.ltExamInfoQueryService = ltExamInfoQueryService;
        this.batchService = batchService;
        this.userCache = userCache;
        this.ltTestPaperRepository = ltTestPaperRepository;
        this.ltTestPaperQuestionRepository = ltTestPaperQuestionRepository;
        this.ltExamInfoRepository = ltExamInfoRepository;
        this.ltExamStudentRepository = ltExamStudentRepository;
        this.ltExamInfoMapper = ltExamInfoMapper;
        this.ltExamStudentMapper = ltExamStudentMapper;
        this.messageUtil = messageUtil;
        this.redisUtil = redisUtil;
        this.maxNoServer = maxNoServer;
        this.encodingRulesUtils = encodingRulesUtils;
    }

    /**
     * {@code POST  /lt-exam-infos} : Create a new ltExamInfo.
     *
     * @param ltExamInfoDTO the ltExamInfoDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new ltExamInfoDTO, or with status {@code 400 (Bad Request)} if the ltExamInfo has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("/lt-exam-infos")
    @ApiOperation(value = "新增考试安排")
    public ResponseEntity<LtExamInfoDTO> createLtExamInfo(@Valid @RequestBody LtExamInfoDTO ltExamInfoDTO) throws URISyntaxException {
        log.debug("REST request to save LtExamInfo : {}", ltExamInfoDTO);
        String company = userCache.getCurrentUserCompany();
        if (ltExamInfoDTO.getId() != null) {
            throw new BadRequestAlertException("A new ltExamInfo cannot already have an ID", ENTITY_NAME, "idexists");
        }
        if ("survey".equals(ltExamInfoDTO.getDataCate())) {
            ltExamInfoDTO.setMinExamDuration(0);
            ltExamInfoDTO.setRepeatCounts(1);
            ltExamInfoDTO.setNeedReview("N");
            ltExamInfoDTO.setViewExamProcess("Y");
            ltExamInfoDTO.setIsOnlyWrong("N");
            ltExamInfoDTO.setAnswerAuth("Y");
            ltExamInfoDTO.setAnalysisAuth("Y");
        }
        // 如果是亚太，则由亚太规则生成编码
        if ("YT".equals(maxNoServer.getCode())) {
            ltExamInfoDTO.setExamCode(encodingRulesUtils.encodingRules("考试编码",
                maxNoServer.getSite(),
                encodingRulesUtils.extractAndConvertToUpperCase(company),
                encodingRulesUtils.getYearMonth()
            ));
        } else {
            ltExamInfoDTO.setExamCode(SnowUtils.strKey());
        }
        LtExamInfoDTO result = ltExamInfoService.save(ltExamInfoDTO);
        return ResponseEntity.created(new URI("/api/lt-exam-infos/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    /**
     * {@code PUT  /lt-exam-infos} : Updates an existing ltExamInfo.
     *
     * @param ltExamInfoDTO the ltExamInfoDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated ltExamInfoDTO,
     * or with status {@code 400 (Bad Request)} if the ltExamInfoDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the ltExamInfoDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/lt-exam-infos")
    @ApiOperation(value = "修改考试安排")
    public ResponseEntity<PubRespInfoModel> updateLtExamInfo(@Valid @RequestBody LtExamInfoDTO ltExamInfoDTO) throws URISyntaxException {
        log.debug("REST request to update LtExamInfo : {}", ltExamInfoDTO);
        String company = userCache.getCurrentUserCompany();
        PubRespInfoModel pubRespInfoModel = new PubRespInfoModel();
        pubRespInfoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
        String examAnalysis = "CACHE_PAPERQUESTION_analysis_";
        String examDetail = "CACHE_PAPERQUESTION_detail_";
        String examStudentKey = RedisConstants.EXAM_STUDENT;

        if (ltExamInfoDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        LtExamInfoDTO result = new LtExamInfoDTO();
        try {
            LtExamInfoDTO old = ltExamInfoService.findOne(ltExamInfoDTO.getId()).get();
            result = ltExamInfoService.save(ltExamInfoDTO);


            List<LtExamStudentDTO> examStudentDTOS = ltExamStudentMapper.toDto(ltExamStudentRepository.findAllByExamCodeAndDeletedAndCompanyAndDeletedOrderByCreatedDateDesc(ltExamInfoDTO.getExamCode(), false, company, false));
            List<String> itemKeys = new ArrayList<>();
            List<String> examStudentValues = new ArrayList<>();
            List<LtExamStudentDTO> ltExamStudentDTOList = new ArrayList<>();
            for (LtExamStudentDTO ltExamStudentDTO : examStudentDTOS) {

                String itemKey = ltExamInfoDTO.getExamCode() + "_" + ltExamInfoDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode() + "_" + ltExamStudentDTO.getExamCount();
                itemKeys.add(itemKey);
                String examStudentValue = ltExamStudentDTO.getExamCode() + "_" + ltExamStudentDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode();
                examStudentValues.add(examStudentValue);
                //TODO后期优化
            /*if ("03".equals(ltExamStudentDTO.getExamState()) && ltExamInfoDTO.getExamEndTime().isAfter(PubFun.getCurrentDate())){
                ltExamStudentDTO.setExamState("01");
                ltExamInfoService.save(ltExamInfoDTO);
            }*/
                if (PubFun.getCurrentDate().isBefore(ltExamInfoDTO.getExamEndTime()) && "10".equals(ltExamStudentDTO.getExamState())) {
                    ltExamStudentDTO.setExamState("01");
                    ltExamStudentDTOList.add(ltExamStudentDTO);
                }
                redisUtil.del(examAnalysis + itemKey);
                redisUtil.del(examDetail + itemKey);
                redisUtil.del(examStudentKey + "_" + examStudentValue);


            }

            if (itemKeys.size() > 0) {
//                String examAnalysis = "CACHE_PAPERQUESTION_analysis_";
//                String examDetail = "CACHE_PAPERQUESTION_detail_";
                String examKey = RedisConstants.EXAM;
                redisUtil.hdel(examKey, ltExamInfoDTO.getExamCode());
//                redisUtil.hdel(examAnalysis, itemKeys.toArray());
//                redisUtil.hdel(examDetail, itemKeys.toArray());
            }


            if (ltExamStudentDTOList.size() > 0) {
                batchService.batchUpdate(ltExamStudentMapper.toEntity(ltExamStudentDTOList));
            }

            // 目前考试支持复制。复制完毕后这个字段是null的。这里需要先判定不为null
            if (old.getExamEndTime() != null && !old.getExamEndTime().equals(ltExamInfoDTO.getExamEndTime())) {
                asyncMethods.examSendMessage(ltExamInfoDTO, company);
            }

            if (ResouceEnum.SURVEY.getCode().equals(ltExamInfoDTO.getDataCate())) {
                // 调查问卷
                asyncMethods.surveyMessage(ltExamInfoDTO, company);
            }
            pubRespInfoModel.setData(result);
            pubRespInfoModel.setMsg(messageUtil.getMessage("ssLtExamInfoResource.updateLtExamInfo.updateSuccess"));


        } catch (Exception e) {
            pubRespInfoModel.setData(result);
            pubRespInfoModel.setMsg(messageUtil.getMessage("ssLtExamInfoResource.updateLtExamInfo.updateFailed"));
            pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
            e.printStackTrace();

        }

        return ResponseEntity.ok().body(pubRespInfoModel);
    }


    /**
     * {@code GET  /lt-exam-infos} : get all the ltExamInfos.
     *
     * @param pageable the pagination information.
     * @param criteria the criteria which the requested entities should match.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of ltExamInfos in body.
     */
    @GetMapping("/lt-exam-infos")
    @ApiIgnore
    public ResponseEntity<List<LtExamInfoVO>> getAllLtExamInfos(LtExamInfoCriteria criteria, Pageable pageable) {
        log.debug("REST request to get LtExamInfos by criteria: {}", criteria);
        Page<LtExamInfoDTO> page = ltExamInfoQueryService.findByCriteria(criteria, pageable);
        List<LtExamInfoDTO> examInfoDTOS = page.getContent();
        List<LtExamInfoVO> examInfoVOS = new ArrayList<>();
        String company = userCache.getCurrentUserCompany();
        for (LtExamInfoDTO examInfoDTO : examInfoDTOS) {
            LtExamInfoVO ltExamInfoVO = new LtExamInfoVO();
            BeanCopyUtil.copyPropertiesIgnoreNull(examInfoDTO, ltExamInfoVO);
            List<LtTestPaper> testPapers = ltTestPaperRepository.findAllByTestPaperCodeAndCompanyAndDeleted(examInfoDTO.getTestPaperCode(), company, false);
            if (testPapers.size() > 0) {
                LtTestPaper ltTestPaper = testPapers.get(0);
                ltExamInfoVO.setRuleTime(ltTestPaper.getRuleTime());
            }
            examInfoVOS.add(ltExamInfoVO);
        }

        Page<LtExamInfoVO> newpage = new PageImpl<>(examInfoVOS, pageable, page.getTotalElements());
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), newpage);
        return ResponseEntity.ok().headers(headers).body(newpage.getContent());
    }


    @PostMapping("/lt-exam-infos/pubilsh")
    @ApiOperation(value = "修改考试发布状态")
    public ResponseEntity<LtExamInfoDTO> updateLtExamInfo(@RequestParam String examCode, @RequestParam String status) throws URISyntaxException {
        log.debug("REST request to update examCode : {}", examCode);
        String company = userCache.getCurrentUserCompany();
        List<LtExamInfo> list = ltExamInfoRepository.findAllByExamCodeAndCompany(examCode, company);
        if (list.size() != 1) {
            throw new BusinessErrorException(messageUtil.getMessage("ssLtExamStudentService.notification.fetchExamError"));
        }
        LtExamInfo ltExamInfo = list.get(0);
        ltExamInfo.setStatus(status);

        LtExamInfoDTO result = ltExamInfoService.save(ltExamInfoMapper.toDto(ltExamInfo));

        Map<String, String> map = new HashMap<>();
        map.put("examCode", result.getExamCode());
        map.put("status", result.getStatus());
        ssLtExamInfoService.notification("01", map, company);

        String examKey = RedisConstants.EXAM;
        redisUtil.hdel(examKey, ltExamInfo.getExamCode());

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }


    @ApiOperation(value = "根据课程编码获取考试")
    @GetMapping("/lt-course-exams/get-testPaper-by-course")
    @Timed
    public ResponseEntity<List<LtTestPaperDTO>> getTestPaperByCourse(String courseCode, String source, String sourceCode, Pageable pageable) {
        log.debug("REST request to get getTestPaperByCourse : {} {} {} ", courseCode, source, sourceCode);
        Page<LtTestPaperDTO> page = ssLtExamInfoService.getTestPaperByCourse(courseCode, source, sourceCode, pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * 添加考试到课程中
     */
    @ApiOperation(value = "添加考试到课程中")
    @PostMapping("/lt-course-exams/add-exam")
    @Timed
    public ResponseEntity<PubRespInfoModel> addExamToCourse(@RequestBody Map<String, String> map) {
        PubRespInfoModel pubRespInfoModel = ssLtExamInfoService.addExamToCourse(map);
        return ResponseEntity.ok()
            .body(pubRespInfoModel);
    }

    /**
     * {@code POST  /lt-questions} : get questions by examCode
     *
     * @param examCode examCode
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new ltQuestionDTO, or with status {@code 400 (Bad Request)} if the ltQuestion has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @GetMapping("/lt-getQuestionMap")
    @ApiOperation(value = "获取考试题目")
    public ResponseEntity<Object> fetchQuestionsList(@RequestParam(value = "examCode") String examCode,
                                                     @RequestParam(value = "staffCode", required = false) String staffCode,
                                                     @RequestParam(value = "name", required = false) String name,
                                                     @RequestParam(value = "manageComCondition", required = false) String manageComCondition,
                                                     @RequestParam(value = "manageCom", required = false) String manageCom
    ) throws URISyntaxException {
        log.debug("REST get examCode : {},staffCode : {},name : {},manageComCondition : {},examCode : {}", examCode, staffCode, name, manageComCondition, manageCom);
        if (examCode == null) {
            throw new BadRequestAlertException("examCode", ENTITY_NAME, "examCodenull");
        }
        Object result = ssLtExamInfoService.fetchQuestionsList(examCode, staffCode, name, manageComCondition, manageCom);
        return ResponseEntity.ok(result);

    }

    /**
     * 复制班级信息及其课程
     *
     * @param map
     * @return
     */
    @PostMapping("/lt-course-exams/copy-examInfo")
    public ResponseEntity<PubRespInfoModel> copyExamInfo(@RequestBody Map<String, String> map) throws Exception {
        PubRespInfoModel pubRespInfoModel = ssLtExamInfoService.copyExamInfo(map);
        return ResponseEntity.ok().body(pubRespInfoModel);
    }


    /**
     * 根据问卷获取题目及其选项
     *
     * @param examCode
     * @return
     */
    @ApiOperation(value = "根据问卷获取题目及其填写结果")
    @GetMapping("/lt-exam-info/fetch-survey-result")
    @Timed
    public ResponseEntity<List<LtQuestionAndAnswersVO>> fetchSurveyResult(String trainCode, String examCode, String testPaperCode) {
        log.info("REST request to fetchSurveyResult by trainCode,examCode,testPaperCode : {},{},{}", trainCode, examCode, testPaperCode);
        long startMillis = System.currentTimeMillis();
        List<LtQuestionAndAnswersVO> list = ssLtExamInfoService.fetchSurveyResult(trainCode, examCode, testPaperCode);
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取考试列表结束，耗时{}ms", usedTime);
        return ResponseEntity.ok().body(list);
    }

    /**
     * 根据问卷获取填写原始数据表头
     *
     * @param testPaperCode
     * @return
     */
    @ApiOperation(value = "根据问卷获取填写原始数据表头")
    @GetMapping("/lt-exam-info/fetch-survey-header")
    @Timed
    public ResponseEntity<List<String>> fetchSurveyHeader(String testPaperCode) {
        log.info("REST request to fetchSurveyHeader by testPaperCode : {}", testPaperCode);
        long startMillis = System.currentTimeMillis();
        List<String> list = ssLtExamInfoService.fetchSurveyHeader(testPaperCode);
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取问卷获取填写原始数据列表结束，耗时{}ms", usedTime);
        return ResponseEntity.ok().body(list);
    }

    /**
     * @param criteria
     * @param pageable
     * @return
     */
    @GetMapping("/lt-practice-infos")
    @ApiIgnore
    public ResponseEntity<List<LtPracticeVO>> getAllLtPracticeInfos(LtExamInfoCriteria criteria, Pageable pageable) {
        log.debug("REST request to get LtPracticeInfos by criteria: {}", criteria);
        Page<LtExamInfoDTO> page = ltExamInfoQueryService.findByCriteria(criteria, pageable);
        List<LtExamInfoDTO> examInfoDTOS = page.getContent();
        List<LtPracticeVO> practiceVOS = new ArrayList<>();
        String company = userCache.getCurrentUserCompany();
        for (LtExamInfoDTO examInfoDTO : examInfoDTOS) {
            LtPracticeVO ltPracticeVO = new LtPracticeVO();
            BeanCopyUtil.copyPropertiesIgnoreNull(examInfoDTO, ltPracticeVO);
//            List<LtTestPaperQuestion> testPaperQuestions = ltTestPaperQuestionRepository.findAllByTestPaperCodeAndCompanyAndDeleted(examInfoDTO.getTestPaperCode(), company, false);
//            if (testPaperQuestions.size() > 0) {
//                String questionCodes = testPaperQuestions.stream().map(LtTestPaperQuestion::getQuestionCode).collect(Collectors.joining(","));
//                ltPracticeVO.setBindTestQuestions(questionCodes);
//            }
            practiceVOS.add(ltPracticeVO);
        }

        Page<LtPracticeVO> newpage = new PageImpl<>(practiceVOS, pageable, page.getTotalElements());
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), newpage);
        return ResponseEntity.ok().headers(headers).body(newpage.getContent());
    }

    /**
     * @param ltPracticeVO
     * @return
     * @throws URISyntaxException
     */
    @PostMapping("/lt-practice-infos")
    @ApiOperation(value = "新增/编辑练习")
    public ResponseEntity<LtPracticeVO> createLtPracticeInfo(@RequestBody LtPracticeVO ltPracticeVO) throws URISyntaxException {
        log.debug("REST request to save LtExamInfo : {}", ltPracticeVO);
        if (ltPracticeVO.getTestPaperCode() == null) {
            throw new BadRequestAlertException("testPaperCode", ENTITY_NAME, "testPaperCode is null");
        }
        LtPracticeVO result = ssLtExamInfoService.save(ltPracticeVO);
        return ResponseEntity.created(new URI("/api/ss/lt-practice-infos/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    /**
     * 催考通知
     *
     * @param map
     * @return
     */
    @PostMapping("/lt-exam-info/notification")
    public ResponseEntity<PubRespInfoModel> notification(@RequestBody Map<String, String> map) throws Exception {
        String company = userCache.getCurrentUserCompany();
        ssLtExamInfoService.notification("02", map, company);
        return ResponseEntity.ok(PubRespInfoModel.ok(messageUtil.getMessage("messageUtils.successMessage")));
    }

    /**
     *
     * @param ltExamInfoDTO
     * @return
     * @throws URISyntaxException
     */
    @PostMapping("/lt-exam-each-days")
    @ApiOperation(value = "新增/编辑每日一题")
    public ResponseEntity<LtExamInfoDTO> createLtExamEachDays(@RequestBody LtExamInfoDTO ltExamInfoDTO) throws URISyntaxException {
        log.debug("REST request to save LtExamInfo : {}", ltExamInfoDTO);

        LtExamInfoDTO result = ssLtExamInfoService.createLtExamEachDays(ltExamInfoDTO);
        return ResponseEntity.created(new URI("/api/ss/lt-exam-each-days/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }


}

-------------------------

package com.sinosoft.web.mobile;

import cn.hutool.core.util.ObjectUtil;
import com.alibaba.fastjson.JSONObject;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import com.sinosoft.cache.UserCache;
import com.sinosoft.commonutil.BeanCopyUtil;
import com.sinosoft.domain.LtExamStudent;
import com.sinosoft.domain.LtExamStudentSubmit;
import com.sinosoft.domain.LtTestPaperQuestion;
import com.sinosoft.repository.LtCourseChapterRepository;
import com.sinosoft.repository.LtExamStudentRepository;
import com.sinosoft.repository.LtExamStudentSubmitRepository;
import com.sinosoft.repository.LtTestPaperQuestionRepository;
import com.sinosoft.service.LtExamStudentService;
import com.sinosoft.service.LtTestPaperService;
import com.sinosoft.service.TmsCacheQueryService;
import com.sinosoft.service.constants.CodeConstants;
import com.sinosoft.service.constants.RedisConstants;
import com.sinosoft.service.dto.*;
import com.sinosoft.service.mapper.LtCourseChapterMapper;
import com.sinosoft.service.mapper.LtExamStudentMapper;
import com.sinosoft.service.mapper.LtTestPaperQuestionMapper;
import com.sinosoft.service.util.PubFun;
import com.sinosoft.service.util.RedisUtil;
import com.sinosoft.service.vo.*;
import com.sinosoft.ss.service.*;
import com.sinosoft.util.MessageUtil;
import com.sinosoft.util.StringUtil;
import com.sinosoft.web.rest.errors.BusinessErrorException;
import io.github.jhipster.web.util.PaginationUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Instant;
import java.util.*;


/**
 * @author sinosoft
 * @date 2020/01/01
 * REST controller for managing LtBanner.
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */

/**
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@RestController
@Api(tags = "移动端试卷信息接口")
@ApiSort(value = 100)
@RequestMapping("/api/mobile")
public class LtTestPaperMobileResource {

    private final Logger log = LoggerFactory.getLogger(LtTestPaperMobileResource.class);

    @Autowired
    private SsLtExamInfoService ssLtExamInfoService;

    @Autowired
    private TmsCacheQueryService tmsCacheQueryService;

    @Autowired
    private LtExamStudentService ltExamStudentService;

    @Autowired
    private SsLtExamStudentService ssLtExamStudentService;

    @Autowired
    private SsLtCourseProgramEnrollService ssLtCourseProgramEnrollService;

    @Autowired
    private LtTestPaperService ltTestPaperService;

    @Autowired
    private LtExamStudentMapper ltExamStudentMapper;

    @Autowired
    private SsLtTestPaperService ssLtTestPaperService;

    @Autowired
    private SsLtExamInfoService ssltExamInfoService;

    @Autowired
    private LtCourseChapterRepository ltCourseChapterRepository;

    @Autowired
    private LtCourseChapterMapper ltCourseChapterMapper;

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private UserCache userCache;

    @Autowired
    private MessageUtil messageUtil;

    @Autowired
    private LtExamStudentSubmitRepository ltExamStudentSubmitRepository;

    @Autowired
    private LtExamStudentRepository ltExamStudentRepository;

    @Autowired
    private LtTestPaperQuestionRepository ltTestPaperQuestionRepository;

    @Autowired
    private SsLtQuestionService ssLtQuestionService;

    @Autowired
    private SsLtExamQuestionStudentService ssLtExamQuestionStudentService;

    @Autowired
    private LtTestPaperQuestionMapper ltTestPaperQuestionMapper;

    /**
     * 获取考试列表
     * trainCode 学员编码
     * 必须是已发布的试卷
     * examState 01-待考试，02-已考试
     **/
    @ApiOperation(value = "获取考试列表")
    @ApiOperationSupport(order = 10)
    @GetMapping("/lt-test-papers-list")
    public ResponseEntity<List<TestPaperAndExamVO>> getLtTestPapersList(@RequestParam(value = "name", required = false) @ApiParam(name = "name", value = "考试名称", required = false) String name,
                                                                        @RequestParam @ApiParam(name = "examType", value = "考试类别(notexam未考试,overexam已考试)", required = true) String examType,
                                                                        @RequestParam @ApiParam(name = "dataCate", value = "数据类别(test考试,survey问卷,practice练习)", required = true) String dataCate, Pageable pageable) {
        long startMillis = System.currentTimeMillis();
        log.info("获取考试列表开始: {}", examType);

        String userCode = PubFun.getCurrentUser();
        Page<LtExamInfoDTO> examPage = new PageImpl<>(new ArrayList<>(), pageable, 0);
        if("notexam".equals(examType)){
            // 未考试的列表时才刷新受众
            ssltExamInfoService.updateExamInfoStudent(dataCate,null);
            log.info("获取考试列表处理未考试列表的受众绑定耗时 {} ms",System.currentTimeMillis() - startMillis);
        }


        // 01:未完成  09:可重考   05:批阅中  06:批阅中   10:已失效   02:已通过  03:未通过
        Pageable newPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "isImportant").and(Sort.by(Sort.Direction.DESC, "examBeginTime")).and(Sort.by(Sort.Direction.DESC, "createdDate")));
        switch (examType) {
            case "notexam":
                String[] noStateArray = {"01", "03", "10", "09"};
                examPage = ssltExamInfoService.findAllByTrainCodeAndExamState3(userCode, noStateArray, dataCate, name, newPageable);
                break;
            case "overexam":
                String[] overStateArray = {"02", "05", "06"};
                examPage = ssltExamInfoService.findAllByTrainCodeAndExamState3(userCode, overStateArray, dataCate, name, newPageable);
                break;
            default:
                break;
        }
        List<LtExamInfoDTO> examList = examPage.getContent();
        log.info("获取考试列表信息: {}", examList);
        List<TestPaperAndExamVO> testPaperAndExamVOS = new ArrayList<>();
        try {
            for (LtExamInfoDTO ltExamInfoDTO : examList) {
                TestPaperAndExamVO vo = new TestPaperAndExamVO();
                BeanCopyUtil.copyPropertiesIgnoreNull(ltExamInfoDTO, vo);

                /*绑定试卷随机出*/
                List<LtExamStudent> ltExamStudents = ssLtExamStudentService.findAllByTrainCodeAndExamCode(userCode, ltExamInfoDTO.getExamCode());
                String paperCodes = vo.getTestPaperCode();
                String[] paperCodeArray = paperCodes.split(",");
                String paperCode = "";
                int arrnum = new Random().nextInt(paperCodeArray.length);
                if (ltExamStudents.size() >= 1 && ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                    paperCode = paperCodeArray[arrnum];
                } else if (ltExamStudents.size() >= 1 && !ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                    paperCode = ltExamStudents.get(0).getTestPaperCode();
                }

                if ("train".equals(vo.getSourceFrom())) {
                    vo.setSourceName("培训班的名称");
                }
                if ("course".equals(vo.getSourceFrom())) {
                    vo.setSourceName("课程名称");
                }
                if ("chapter".equals(vo.getSourceFrom())) {
                    vo.setSourceName("课程下的节");
                }
                if ("common".equals(vo.getSourceFrom())) {
                    if ("test".equals(dataCate)) {
                        vo.setSourceName("常规摸底考试");
                    } else if("practice".equals(dataCate)){
                        vo.setSourceName("常规练习");
                    }else{
                        vo.setSourceName("常规问卷");
                    }
                }
                LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(paperCode);
                if(testPaperDTO == null){
                    log.info("用户{} 获取考试列表信息,考试编码 {} 试卷编码 {} 不存在，跳过",userCode, ltExamInfoDTO.getExamCode(),paperCode);
                    continue;
                }

                /*学员绑定试卷*/
                if (ltExamStudents.size() == 0) {
                    throw new BusinessErrorException("ltExamStudents is fail");
                } else if (ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                    LtExamStudentDTO ltExamStudentDTO = ltExamStudentMapper.toDto(ltExamStudents.get(0));
                    ltExamStudentDTO.setPassMark(testPaperDTO.getPassMark());
                    ltExamStudentDTO.setPaperMark(testPaperDTO.getPaperMark());
                    ltExamStudentDTO.setTestPaperCode(paperCode);
                    ltExamStudentDTO.setSurplusExamCount(ltExamInfoDTO.getRepeatCounts());
                    log.info("ltExamStudentDTO:{}", ltExamStudentDTO);
                    if (("00".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && ltExamInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                        ltExamStudentDTO.setExamState("10");
                    }
                    ltExamStudentService.save(ltExamStudentDTO);
                    vo.setTestPaperCode(ltExamStudentDTO.getTestPaperCode());
                    vo.setSurplusExamCount(ltExamStudentDTO.getSurplusExamCount());
                } else if (ltExamStudents.size() >= 1 && !ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                    LtExamStudentDTO ltExamStudentDTO = ltExamStudentMapper.toDto(ltExamStudents.get(0));
                    if (("09".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && ltExamInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                        ltExamStudentDTO.setExamState("10");
                        ltExamStudentService.save(ltExamStudentDTO);
                        redisUtil.del(RedisConstants.EXAM_STUDENT + "_"+ltExamStudentDTO.getExamCode() + "_" + ltExamStudentDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode());

                    }
                    if((!"practice".equals(dataCate) &&
                        !ltExamInfoDTO.getTestPaperCode().equals(ltExamStudentDTO.getTestPaperCode()) &&
                        !("10".equals(ltExamStudentDTO.getExamState()) ||"02".equals(ltExamStudentDTO.getExamState()) ||"03".equals(ltExamStudentDTO.getExamState()) || "05".equals(ltExamStudentDTO.getExamState())))
                    ){
                        LtExamStudentDTO newExamStudentDTO = new LtExamStudentDTO();
                        BeanCopyUtil.copyPropertiesIgnoreNull(ltExamStudentDTO,newExamStudentDTO);
                        newExamStudentDTO.setId(null);
                        newExamStudentDTO.setCreatedBy(null);
                        newExamStudentDTO.setRandomNum(null);
                        newExamStudentDTO.setCreatedByName(null);
                        newExamStudentDTO.setSubmitType(null);
                        newExamStudentDTO.setCreatedByStaffCode(null);
                        newExamStudentDTO.setCreatedDate(null);
                        newExamStudentDTO.setLastModifiedDate(null);
                        newExamStudentDTO.setLastModifiedBy(null);
                        newExamStudentDTO.setTestPaperCode(ltExamInfoDTO.getTestPaperCode());
                        ltExamStudentService.save(newExamStudentDTO);
                        ltExamStudentDTO.setDeleted(true);
                        ltExamStudentService.save(ltExamStudentDTO);

                    }


                    vo.setTestPaperCode(ltExamStudents.get(0).getTestPaperCode());
                    vo.setSurplusExamCount(ObjectUtils.isEmpty(ltExamStudents.get(0).getSurplusExamCount()) ? 0 : ltExamStudents.get(0).getSurplusExamCount());
                    vo.setWrongQuestionCount(ObjectUtils.isEmpty(ltExamStudents.get(0).getWrongQuestionCount()) ? 0 : ltExamStudents.get(0).getWrongQuestionCount());
                }

                if (testPaperDTO != null) {
                    vo.setPaperMark(ObjectUtils.isEmpty(testPaperDTO.getPaperMark()) ? 0 : testPaperDTO.getPaperMark());
                    vo.setPassMark(ObjectUtils.isEmpty(testPaperDTO.getPassMark()) ? 0 : testPaperDTO.getPassMark());
                    vo.setSingleChoiceCount(ObjectUtils.isEmpty(testPaperDTO.getSingleChoiceCount()) ? 0 : testPaperDTO.getSingleChoiceCount());
                    vo.setEverySingleScore(ObjectUtils.isEmpty(testPaperDTO.getEverySingleScore()) ? 0 : testPaperDTO.getEverySingleScore());
                    vo.setMultipleChoiceCount(ObjectUtils.isEmpty(testPaperDTO.getMultipleChoiceCount()) ? 0 : testPaperDTO.getMultipleChoiceCount());
                    vo.setEveryMultipleScore(ObjectUtils.isEmpty(testPaperDTO.getEveryMultipleScore()) ? 0 : testPaperDTO.getEveryMultipleScore());
                    vo.setJudgmentalCount(ObjectUtils.isEmpty(testPaperDTO.getJudgmentalCount()) ? 0 : testPaperDTO.getJudgmentalCount());
                    vo.setEveryJudgmentalScore(ObjectUtils.isEmpty(testPaperDTO.getEveryJudgmentalScore()) ? 0 : testPaperDTO.getEveryJudgmentalScore());
                    vo.setCompletionCount(ObjectUtils.isEmpty(testPaperDTO.getCompletionCount()) ? 0 : testPaperDTO.getCompletionCount());
                    vo.setEveryCompletionScore(ObjectUtils.isEmpty(testPaperDTO.getEveryCompletionScore()) ? 0 : testPaperDTO.getEveryCompletionScore());
                    vo.setTestPaperName(ObjectUtils.isEmpty(testPaperDTO.getTestPaperName()) ? "" : testPaperDTO.getTestPaperName());
                    vo.setOpenCount(ObjectUtils.isEmpty(testPaperDTO.getOpenCount()) ? 0 : testPaperDTO.getOpenCount());
                    vo.setEveryOpenScore(ObjectUtils.isEmpty(testPaperDTO.getEveryOpenScore()) ? 0 : testPaperDTO.getEveryOpenScore());

                }
                LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(vo.getExamCode(), vo.getTestPaperCode(), userCode);
                if (examStudentDTO != null) {
                    vo.setStartTime(examStudentDTO.getStartTime());
                    vo.setEndTime(examStudentDTO.getEndTime());
                    vo.setScore(ObjectUtils.isEmpty(examStudentDTO.getScore()) ? 0 : examStudentDTO.getScore());
                    vo.setExamState(examStudentDTO.getExamState());
                    vo.setExamCount(ObjectUtils.isEmpty(examStudentDTO.getExamCount()) ? 0 : examStudentDTO.getExamCount());
                }
                if("practice".equals(dataCate)){
                    List<LtExamStudent> examStudents = ltExamStudentRepository.findAllByExamCodeAndTrainCodeAndExamStateInAndCompanyAndDeletedOrderByCreatedDateDesc(vo.getExamCode(),userCode, new String[]{"02", "03"},vo.getCompany(),false);
                    if (examStudents.size() > 1){
                        LtExamStudent lastExamStudent = examStudents.get(1);
                        vo.setHasRecord("Y");
                        if("01".equals(examStudentDTO.getExamState()) && examStudentDTO.getExamCount() > 0){
                            vo.setLastExamCode(examStudentDTO.getExamCode());
                            vo.setLastTestPaperCode(examStudentDTO.getTestPaperCode());
                            vo.setLastExamCount(examStudentDTO.getExamCount());
                        }else{
                            vo.setLastExamCode(lastExamStudent.getExamCode());
                            vo.setLastTestPaperCode(lastExamStudent.getTestPaperCode());
                            vo.setLastExamCount(lastExamStudent.getExamCount());
                        }

                    }else if(examStudents.size() <= 1){
                        vo.setHasRecord("N");
                    }
                }


                testPaperAndExamVOS.add(vo);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取考试列表结束，耗时【{}】ms",usedTime);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), examPage);
        return ResponseEntity.ok().headers(headers).body(testPaperAndExamVOS);

    }

    /**
     * 获取考试详情 . 系统记录开始考试时间
     * examCode 考试编码
     * testPaperCode 试卷编码
     * 返回参数为消息类型，无须对返回类型进行修改
     **/
    @ApiOperation(value = "查看考试详情(未考试或重新考试时调用，即开始考试)")
    @ApiOperationSupport(order = 20)
    @GetMapping("/lt-test-papers-detail")
    public ResponseEntity<List<LtTestPaperQuestionVO>> getTestPaperDetail(@RequestParam @ApiParam(name = "examCode", value = "考试编码", required = true) String examCode,
                                                                          @RequestParam @ApiParam(name = "examCount", value = "考试次数", required = true) Integer examCount,
                                                                          @RequestParam(value = "randomNum", required = false) @ApiParam(name = "randomNum", value = "随机系数") Integer randomNum,
                                                                          @RequestParam @ApiParam(name = "testPaperCode", value = "试卷编码", required = true) String testPaperCode) {
        long startMillis = System.currentTimeMillis();
        log.info("获取考试详情开始: {} {} {} {}", examCode,testPaperCode,examCount,randomNum);
        String userCode = PubFun.getCurrentUser();
        LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(testPaperCode);
        if (testPaperDTO == null) {
            log.info("testPaperDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
        }
        LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(examCode, testPaperCode, userCode);
        //  每日一题  examCode  初始化每日一题绑定关系
        if(examStudentDTO == null){
            LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(examCode);
            if(examInfoDTO != null && "eachQuestion".equals(examInfoDTO.getDataCate()) ) {
                List<LtExamStudentDTO> ltExamStudentDTOS = ltExamStudentMapper.toDto(ssLtExamStudentService.findAllByTrainCodeAndExamCodeAndRandomNum(userCode, examCode, randomNum));
                if (ltExamStudentDTOS.size() > 0) {
                    log.info("每日一题更新testpapercode  {} {} {} {}", examCode, testPaperCode, userCode, randomNum);
                    examStudentDTO = ltExamStudentDTOS.get(0);
                    examStudentDTO.setTestPaperCode(examInfoDTO.getTestPaperCode());
                    examStudentDTO.setSurplusExamCount(examInfoDTO.getRepeatCounts());
                    examStudentDTO.setPassMark(testPaperDTO.getPassMark());
                    examStudentDTO.setPaperMark(testPaperDTO.getPaperMark());
                    ltExamStudentService.save(examStudentDTO);
                } else {
                    log.info("每日一题更新testpapercode  {} {} {} {} size=0", examCode, testPaperCode, userCode, randomNum);
                }
            }
        }
        if (testPaperDTO == null) {
            log.info("testPaperDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
        }
        if (examStudentDTO == null) {
            log.info("examStudentDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
        }
        List<LtTestPaperQuestionVO> testPaperQuestionVOS = new ArrayList<>();
        int randomIndex = 0;
        if ("test".equals(testPaperDTO.getDataCate()) &&  "random".equals(testPaperDTO.getComposeType()) && "exam".equals(testPaperDTO.getRuleTime())){
            Random random = new Random();
            LtTestPaperQuestion ltTestPaperQuestion = ltTestPaperQuestionRepository.findTopByTestPaperCodeAndDeletedAndRandomNumIsNotNullOrderByRandomNumDesc(testPaperCode,false);
            if (ltTestPaperQuestion == null) {
                log.info("ltTestPaperQuestion is null");
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage9"));
            }
            do {
                randomIndex = random.nextInt(ltTestPaperQuestion.getRandomNum());
            } while (randomIndex == 0);
            if(ObjectUtil.isNull(examStudentDTO.getRandomNum()) || examStudentDTO.getRandomNum() == 0){
                examStudentDTO.setRandomNum(randomIndex);
                ltExamStudentService.save(examStudentDTO);
                redisUtil.del(RedisConstants.EXAM_STUDENT +"_"+ examCode + "_" + testPaperCode + "_" + userCode + "_" + examStudentDTO.getExamCount());

            }
        }
        try{

            // 记录学员开始考试时间
            LtExamInfoDTO ltEXamInfoDTO = tmsCacheQueryService.redisQueryExam(examCode);
            if (examStudentDTO != null) {
                if ("09".equals(examStudentDTO.getExamState())) {
                    examStudentDTO.setExamState("03");
                    examStudentDTO.setStatus("0");
                    ltExamStudentService.save(examStudentDTO);

                    LtExamStudent newExamStudent = new LtExamStudent();
                    BeanCopyUtil.copyPropertiesIgnoreNull(examStudentDTO, newExamStudent);
                    newExamStudent.setId(null);
                    newExamStudent.setScore(0);
                    newExamStudent.setExamState("01");
                    newExamStudent.setSurplusExamCount(examStudentDTO.getSurplusExamCount());
                    newExamStudent.setReviewTime(null);
                    newExamStudent.setReviseScore(null);
                    newExamStudent.setSubmitType(null);
                    newExamStudent.setReviewer(null);
                    newExamStudent.setCreatedBy(null);
                    newExamStudent.setCreatedDate(null);
                    newExamStudent.setLastModifiedBy(null);
                    newExamStudent.setLastModifiedDate(null);
                    newExamStudent.setWrongQuestionCount(null);
                    newExamStudent.setStartTime(PubFun.getCurrentDate());
                    newExamStudent.setEndTime(null);
                    newExamStudent.setStatus("1");
                    newExamStudent.setScoreLevel(null);
                    newExamStudent.setSignNameUrl(null);
                    newExamStudent.setRandomNum(randomIndex==0?null:randomIndex);
                    ltExamStudentService.save(ltExamStudentMapper.toDto(newExamStudent));
                } else if ("01".equals(examStudentDTO.getExamState()) || "00".equals(examStudentDTO.getExamState())) {
                    examStudentDTO.setStartTime(PubFun.getCurrentDate());

                    if ("00".equals(examStudentDTO.getExamState())) {
                        examStudentDTO.setExamState("01");
                        examStudentDTO.setStatus("1");
                    }
                    ltExamStudentService.save(examStudentDTO);
                } else if(("practice".equals(ltEXamInfoDTO.getDataCate()) || ("map".equals(ltEXamInfoDTO.getSourceFrom()) && "Y".equals(ltEXamInfoDTO.getReTestFlag()))) && ("02".equals(examStudentDTO.getExamState()) || "03".equals(examStudentDTO.getExamState()))){
                    examStudentDTO.setStatus("0");
                    ltExamStudentService.save(examStudentDTO);

                    LtExamStudent newExamStudent = new LtExamStudent();
                    BeanCopyUtil.copyPropertiesIgnoreNull(examStudentDTO, newExamStudent);
                    newExamStudent.setId(null);
                    newExamStudent.setScore(0);
                    newExamStudent.setExamState("01");
                    newExamStudent.setSubmitType(null);
                    newExamStudent.setSurplusExamCount(examStudentDTO.getSurplusExamCount());
                    newExamStudent.setReviewTime(null);
                    newExamStudent.setReviseScore(null);
                    newExamStudent.setReviewer(null);
                    newExamStudent.setCreatedBy(null);
                    newExamStudent.setCreatedDate(null);
                    newExamStudent.setLastModifiedBy(null);
                    newExamStudent.setLastModifiedDate(null);
                    newExamStudent.setWrongQuestionCount(null);
                    newExamStudent.setStartTime(PubFun.getCurrentDate());
                    newExamStudent.setEndTime(null);
                    newExamStudent.setStatus("1");
                    newExamStudent.setScoreLevel(null);
                    newExamStudent.setSignNameUrl(null);
                    newExamStudent.setRandomNum(randomIndex==0?null:randomIndex);
                    ltExamStudentService.save(ltExamStudentMapper.toDto(newExamStudent));
                }
                // 同时删除下缓存
                redisUtil.del(RedisConstants.EXAM_STUDENT+ "_" +examCode + "_" + testPaperCode + "_" + userCode);

                testPaperQuestionVOS = ssLtTestPaperService.getTestPaperDetail(examCode, testPaperDTO, "detail", userCode, examCount,randomNum);
                if(testPaperQuestionVOS.size() == 0){
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage0"));
                }
                for (LtTestPaperQuestionVO vo : testPaperQuestionVOS) {
                    // 返回前端时将标准答案置空
                    vo.setStandardAnswer(null);

                    //题目类型为填空题时，根据题干中一共有多少对（）处理填空题答案个数字段
                    String questionType = vo.getQuestionType();
                    if ("completion".equals(questionType)) {
                        //答案/答案关键字
                        String openQuestionKey = vo.getOpenQuestionKey();
                        if(StringUtil.isNull(openQuestionKey)){
                            vo.setCompletionNumber(1);
                        }else {
                            //将答案中中文逗号替换为英文逗号
                            String replaceOpenQuestionKey = openQuestionKey.replaceAll("，", ",");
                            // 统计, 的个数需要+1
                            int countCommas = StringUtil.countStringOccurrences(replaceOpenQuestionKey, ",") + 1;
                            vo.setCompletionNumber(countCommas);
                        }

                    }
                }
            }
        }catch (Exception e){
            e.printStackTrace();
        }

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取试卷详情结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(testPaperQuestionVOS);
    }

    @ApiOperation(value = "学员提交试卷")
    @ApiOperationSupport(order = 30)
    @PostMapping("/lt-test-papers-submit")
    public ResponseEntity<LtExamStudentVO> submitTestPaper(@RequestBody LtExamTestPaperQuestionVO examTestPaperQuestionVO) {
        long startMillis = System.currentTimeMillis();
        String userCode = PubFun.getCurrentUser();

        log.info("提交试卷开始:{},{}", userCode,examTestPaperQuestionVO);
        LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(examTestPaperQuestionVO.getExamCode());
        if (examInfoDTO == null) {
            log.info("examInfoDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage1"));
        }
        LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(examTestPaperQuestionVO.getTestPaperCode());
        if (testPaperDTO == null) {
            log.info("testPaperDTO is null");

            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
        }
        LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(examTestPaperQuestionVO.getExamCode(), examTestPaperQuestionVO.getTestPaperCode(), userCode);
        if (examStudentDTO == null) {
            log.info("examStudentDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
        }
        // examInfoDTO.getExamEndTime()  理论上不会为null
        if (examInfoDTO.getExamEndTime() == null || examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate()) && examStudentDTO.getStartTime().isAfter(examInfoDTO.getExamEndTime())) {
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
        }

        if (examStudentDTO.getSurplusExamCount() == null || examStudentDTO.getSurplusExamCount() < 1) {
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage5"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage5"));
        }

        if(!ssLtExamStudentService.compareQuestions(examInfoDTO.getTestPaperCode(),examTestPaperQuestionVO.getTestPaperQuestionVOS())){
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage6"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage6"));
        }


        LtExamStudentVO ltExamStudentVO = null;
        try{
            log.info("------------》开始提交");
            log.info("examInfoDTO:{}",examInfoDTO);
            log.info("testPaperDTO:{}",testPaperDTO);
            log.info("examStudentDTO:{}",examStudentDTO);
            ltExamStudentVO =  ssLtTestPaperService.submitTestPaper(examInfoDTO, testPaperDTO, examTestPaperQuestionVO.getTestPaperQuestionVOS(), examStudentDTO, examTestPaperQuestionVO.getSignNameUrl(), PubFun.getCurrentUser(), PubFun.getCurrentDate(), userCache.getCurrentUserCompany(),examTestPaperQuestionVO.getSubmitType(),examTestPaperQuestionVO.getRandomNum());
        }catch (Exception e){
            e.printStackTrace();
        }

        if (ObjectUtil.isNotNull(ltExamStudentVO) && ObjectUtil.isNotNull(ltExamStudentVO.getErrorMessage())) {
            log.info(ltExamStudentVO.getErrorMessage());
            throw new BusinessErrorException(ltExamStudentVO.getErrorMessage());
        }

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("提交试卷结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(ltExamStudentVO);
    }


    @ApiOperation(value = "学员提交试卷-异步")
    @ApiOperationSupport(order = 31)
    @PostMapping("/lt-test-papers-submit-async")
    public ResponseEntity<PubRespInfoModel> submitTestPaperAsync(@RequestBody LtExamTestPaperQuestionVO examTestPaperQuestionVO) {
        long startMillis = System.currentTimeMillis();
        log.info("提交试卷-异步开始: {}", examTestPaperQuestionVO);
        String userCode = PubFun.getCurrentUser();
        LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(examTestPaperQuestionVO.getExamCode());
        if (examInfoDTO == null) {
            return ResponseEntity.ok().body(PubRespInfoModel.no(messageUtil.getMessage("ExamStudent.submit.errorMessage1")));
        }
        LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(examTestPaperQuestionVO.getTestPaperCode());
        if (testPaperDTO == null) {
            return ResponseEntity.ok().body(PubRespInfoModel.no(messageUtil.getMessage("ExamStudent.submit.errorMessage2")));
        }
        LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(examTestPaperQuestionVO.getExamCode(), examTestPaperQuestionVO.getTestPaperCode(), userCode);
        if (examStudentDTO == null) {
            return ResponseEntity.ok().body(PubRespInfoModel.no(messageUtil.getMessage("ExamStudent.submit.errorMessage3")));
        }
        if (examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate()) && examStudentDTO.getStartTime().isAfter(examInfoDTO.getExamEndTime())) {
            return ResponseEntity.ok().body(PubRespInfoModel.no(messageUtil.getMessage("ExamStudent.submit.errorMessage4")));
        }

        if (examStudentDTO.getSurplusExamCount() == null || examStudentDTO.getSurplusExamCount() < 1) {
            return ResponseEntity.ok().body(PubRespInfoModel.no(messageUtil.getMessage("ExamStudent.submit.errorMessage5")));
        }
        LtExamStudentSubmit ltExamStudentSubmit = new LtExamStudentSubmit();
        ltExamStudentSubmit.setExamStudentId(examStudentDTO.getId());
        ltExamStudentSubmit.setExamCode(examStudentDTO.getExamCode());
        ltExamStudentSubmit.setTestPaperCode(examStudentDTO.getTestPaperCode());
        ltExamStudentSubmit.setAnswerRecord(JSONObject.toJSONString(examTestPaperQuestionVO.getTestPaperQuestionVOS()));
        ltExamStudentSubmit.setSignNameUrl(examTestPaperQuestionVO.getSignNameUrl());
        ltExamStudentSubmit.setStatus("00");
        ltExamStudentSubmitRepository.save(ltExamStudentSubmit);
        examStudentDTO.setExamState("06");// 批阅中
        ssLtExamStudentService.save(examStudentDTO);
        redisUtil.del(RedisConstants.EXAM_STUDENT+ "_" + examStudentDTO.getExamCode() + "_" + examStudentDTO.getTestPaperCode() + "_" + examStudentDTO.getTrainCode());
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("提交试卷-异步结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(PubRespInfoModel.ok(messageUtil.getMessage("ExamStudent.submit.successMessage1")));
    }

    /**
     * 查看考试结果
     *
     * @param examCode
     * @return
     */
    @ApiOperation(value = "查看考试结果")
    @ApiOperationSupport(order = 20)
    @GetMapping("/lt-test-papers-result")
    public ResponseEntity<LtExamStudentVO> getTestPaperResult(@RequestParam @ApiParam(name = "examCode", value = "考试编码") String examCode) {
        log.info("获取考试结果详情开始: {}", examCode);
        if (examCode == null) {
            log.info("examCode is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getTestPaperResult.noExamCode"));
        }
        LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(examCode);
        if (examInfoDTO == null || examInfoDTO.getTestPaperCode() == null) {
            log.info("testPaperCode is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getTestPaperResult.noTestPaperCode"));
        }
        String trainCode = PubFun.getCurrentUser();
        // 记录学员开始考试时间
        LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(examCode, examInfoDTO.getTestPaperCode(), trainCode);
        if(examStudentDTO == null){
            log.info("异常的考试数据哦: {}", trainCode);
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getTestPaperResult.noExamStudent"));
        }
        LtExamStudentVO ltExamStudentVO = new LtExamStudentVO();
        try{
            //班级学员查看他们考试结果时，更新一下他们的进度
            if ("train".equals(examInfoDTO.getSourceFrom()) && "02".equals(examStudentDTO.getExamState())){
                ssLtCourseProgramEnrollService.finishSchedule(examInfoDTO.getSourceCode(), examCode, trainCode);
            }
            ltExamStudentVO = ssLtTestPaperService.getTestPaperResult(examStudentDTO, ltExamStudentVO, examInfoDTO);
        }catch (Exception e){
            e.getStackTrace();
        }

        return ResponseEntity.ok().body(ltExamStudentVO);
    }

    /**
     * 查看考试结果
     *
     * @param ltExamStudentVO
     * @return
     */
    @ApiOperation(value = "查看考试详情信息")
    @ApiOperationSupport(order = 20)
    @GetMapping("/lt-exam-info")
    public ResponseEntity<TestPaperAndExamVO> fetchExamInfo(LtExamStudentVO ltExamStudentVO) {
        log.info("获取考试详情开始: {}", ltExamStudentVO);
        String company = userCache.getCurrentUserCompany();
        String trainCode = PubFun.getCurrentUser();
        Instant nowTime = PubFun.getCurrentDate();

        LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(ltExamStudentVO.getExamCode());
        log.info("fetchExamInfo-examInfoDTO: {}", examInfoDTO);
        if (examInfoDTO == null) {
            log.info("examInfoDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage1"));
        }
        if(examInfoDTO.getExamBeginTime() == null){
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage10"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage10"));
        }

        if ( nowTime.isBefore(examInfoDTO.getExamBeginTime())) {
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage8"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage8"));
        }

        if (examInfoDTO.getExamEndTime() == null || examInfoDTO.getExamEndTime().isBefore(nowTime) && nowTime.isAfter(examInfoDTO.getExamEndTime())) {
            log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
        }

        ssltExamInfoService.updateExamInfoStudent(examInfoDTO.getDataCate(),examInfoDTO.getExamCode());

        List<LtExamStudentDTO> ltExamStudentDTOS = new ArrayList<>();
        if ("eachQuestion".equals(examInfoDTO.getDataCate())){
            ltExamStudentDTOS = ltExamStudentMapper.toDto(ssLtExamStudentService.findAllByTrainCodeAndExamCodeAndRandomNum(ltExamStudentVO.getTrainCode(), ltExamStudentVO.getExamCode(),ltExamStudentVO.getRandomNum()));
        }else{
            ltExamStudentDTOS = ltExamStudentMapper.toDto(ssLtExamStudentService.findAllByTrainCodeAndExamCode(ltExamStudentVO.getTrainCode(), ltExamStudentVO.getExamCode()));
        }
        log.info("fetchExamInfo-ltExamStudentDTOS: {}", ltExamStudentDTOS);
        LtExamStudentDTO ltExamStudentDTO = new LtExamStudentDTO();
        if (ltExamStudentDTOS.size() == 0 ) {
            log.info("ltExamStudentDTOS is null");
            if (CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType())){
                LtExamStudentDTO  newExamStudentDTO = ssLtExamStudentService.addExamStudent(trainCode,ltExamStudentVO.getExamCode(),examInfoDTO.getDataCate(),examInfoDTO.getRepeatCounts());
                List<LtExamStudentDTO> examStudentDTOS = ltExamStudentMapper.toDto(ltExamStudentRepository.findAllByExamCodeAndTestPaperCodeAndTrainCodeAndStatusAndCompanyAndDeletedOrderByExamCountDesc(ltExamStudentVO.getExamCode(),ltExamStudentVO.getTestPaperCode(),trainCode,"1",company,false));

                if (ObjectUtil.isNull(newExamStudentDTO) || examStudentDTOS.size() == 0){
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
                }else{
                    ltExamStudentDTO = examStudentDTOS.get(0);
                }
            }else if("eachQuestion".equals(examInfoDTO.getDataCate())){
                ltExamStudentDTO = null;
                ssltExamInfoService.updateExamInfoStudent(examInfoDTO.getDataCate(),null);
            } else{
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
            }
        }else{
            ltExamStudentDTO = ltExamStudentDTOS.get(0);
        }
        TestPaperAndExamVO testPaperAndExamVO = new TestPaperAndExamVO();



        LtTestPaperDTO ltTestPaperDTO = tmsCacheQueryService.redisQueryTestPaper(CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType())?examInfoDTO.getTestPaperCode():ltExamStudentVO.getTestPaperCode());
        log.info("fetchExamInfo-ltTestPaperDTO: {}", ltTestPaperDTO);

        if (ltTestPaperDTO == null) {
            log.info("ltTestPaperDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
        }

        if ( !"eachQuestion".equals(examInfoDTO.getDataCate()) && ("--".equals(ltExamStudentDTO.getTestPaperCode()))){
            ltExamStudentVO.setTestPaperCode(examInfoDTO.getTestPaperCode());
            ltExamStudentDTO.setTestPaperCode(examInfoDTO.getTestPaperCode());
            ltExamStudentDTO.setSurplusExamCount(examInfoDTO.getRepeatCounts());
            ltExamStudentDTO.setPassMark(ltTestPaperDTO.getPassMark());
            ltExamStudentDTO.setPaperMark(ltTestPaperDTO.getPaperMark());
            if (("00".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                ltExamStudentDTO.setExamState("10");
            }
            ltExamStudentService.save(ltExamStudentDTO);
        }else if (CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType()) && ltExamStudentDTOS.size() >= 1 && !ltExamStudentDTOS.get(0).getTestPaperCode().equals("--")) {
            if (("09".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                ltExamStudentDTO.setExamState("10");
                ltExamStudentService.save(ltExamStudentDTO);
                redisUtil.del(RedisConstants.EXAM_STUDENT+"_"+ ltExamStudentDTO.getExamCode() + "_" + ltExamStudentDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode());
            }else if("02".equals(ltExamStudentDTO.getExamState())){
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.havePassed"));
            }else if("03".equals(ltExamStudentDTO.getExamState())){
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.haveNoPassed"));
            }else if("05".equals(ltExamStudentDTO.getExamState())){
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.reviewing"));
            }
        }
        if(!"eachQuestion".equals(examInfoDTO.getDataCate())){
            if ("10".equals(ltExamStudentDTO.getExamState())) {
                log.info("ExamStudent is TimeOut");
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
            }
        }



        // 记录学员开始考试时间
        try{
            if (examInfoDTO != null && ltTestPaperDTO != null) {
                if ("course".equals(examInfoDTO.getSourceFrom())) {
                    List<LtCourseChapterDTO> list = ltCourseChapterMapper.toDto(ltCourseChapterRepository.findAllByChapterCodeAndCompanyAndDeleted(examInfoDTO.getSourceCode(), company, false));
                    if (list.size() == 1) {
                        testPaperAndExamVO.setSourceCode(list.get(0).getCourseCode());
                    }
                } else if ("train".equals(examInfoDTO.getSourceFrom())) {
                    List<String> sourceCodes = Arrays.asList(examInfoDTO.getSourceCode().split("-"));
                    if (sourceCodes.size() > 0) {
                        testPaperAndExamVO.setSourceCode(sourceCodes.get(0));
                    }
                }
                testPaperAndExamVO.setExamNote(examInfoDTO.getExamNote());
                testPaperAndExamVO.setReTestFlag(examInfoDTO.getReTestFlag());
                testPaperAndExamVO.setSourceFrom(examInfoDTO.getSourceFrom());
                testPaperAndExamVO.setTestPaperCode(ltExamStudentVO.getTestPaperCode());
                testPaperAndExamVO.setExamCode(ltExamStudentVO.getExamCode());
                testPaperAndExamVO.setExamName(examInfoDTO.getExamName());
                testPaperAndExamVO.setViewExamProcess(examInfoDTO.getViewExamProcess());
                testPaperAndExamVO.setTestPaperName(ltTestPaperDTO.getTestPaperName());
                testPaperAndExamVO.setExamState(ltExamStudentDTO.getExamState());
                testPaperAndExamVO.setSurplusExamCount(ltExamStudentDTO.getSurplusExamCount());
                testPaperAndExamVO.setExamCount(ltExamStudentDTO.getExamCount());
                if (!("02".equals(ltExamStudentDTO.getExamState()) || "03".equals(ltExamStudentDTO.getExamState()) || "05".equals(ltExamStudentDTO.getExamState()) || "06".equals(ltExamStudentDTO.getExamState()))) {
                    //ltExamStudentDTO.setExamState("01");
                }

                /*题目*/
                testPaperAndExamVO.setSingleChoiceCount(ltTestPaperDTO.getSingleChoiceCount());
                testPaperAndExamVO.setEverySingleScore(ltTestPaperDTO.getEverySingleScore());
                testPaperAndExamVO.setMultipleChoiceCount(ltTestPaperDTO.getMultipleChoiceCount());
                testPaperAndExamVO.setEveryMultipleScore(ltTestPaperDTO.getEveryMultipleScore());
                testPaperAndExamVO.setJudgmentalCount(ltTestPaperDTO.getJudgmentalCount());
                testPaperAndExamVO.setEveryJudgmentalScore(ltTestPaperDTO.getEveryJudgmentalScore());
                testPaperAndExamVO.setCompletionCount(ltTestPaperDTO.getCompletionCount());
                testPaperAndExamVO.setEveryCompletionScore(ltTestPaperDTO.getEveryCompletionScore());
                testPaperAndExamVO.setOpenCount(ltTestPaperDTO.getOpenCount());
                testPaperAndExamVO.setEveryOpenScore(ltTestPaperDTO.getEveryOpenScore());

                /*通过分数*/
                testPaperAndExamVO.setPaperMark(ltTestPaperDTO.getPaperMark());
                testPaperAndExamVO.setPassMark(ltTestPaperDTO.getPassMark());
                testPaperAndExamVO.setPublishUnit(examInfoDTO.getPublishUnit());
                /*最大考试次数*/
                testPaperAndExamVO.setRepeatCounts(examInfoDTO.getRepeatCounts());

                testPaperAndExamVO.setExamDuration(examInfoDTO.getExamDuration());
                testPaperAndExamVO.setMinExamDuration(examInfoDTO.getMinExamDuration());
                testPaperAndExamVO.setIsCopy(examInfoDTO.getIsCopy());
                testPaperAndExamVO.setQuestionDisOrder(examInfoDTO.getQuestionDisOrder());
                testPaperAndExamVO.setOptionDisOrder(examInfoDTO.getOptionDisOrder());
                testPaperAndExamVO.setCutScreenCounts(examInfoDTO.getCutScreenCounts());
                testPaperAndExamVO.setMaxPageDwellTime(examInfoDTO.getMaxPageDwellTime());
                testPaperAndExamVO.setNeedSignName(examInfoDTO.getNeedSignName());
            }
            log.info("fetchExamInfo-testPaperAndExamVO:{}",testPaperAndExamVO);
        }catch (Exception e){
            e.getStackTrace();
        }

        return ResponseEntity.ok().body(testPaperAndExamVO);
    }

    //apifox测试专用接口，不影响其他业务
    /**
     * 查看考试结果
     *
     * @param ltExamStudentVO
     * @return
     */
    @ApiOperation(value = "查看考试详情信息")
    @ApiOperationSupport(order = 20)
    @GetMapping("/lt-exam-info_bak")
    public ResponseEntity<PubRespInfoModel> fetchExamInfoBak(LtExamStudentVO ltExamStudentVO) {
        log.info("获取考试详情开始: {}", ltExamStudentVO);
        PubRespInfoModel pubRespInfoModel = new PubRespInfoModel();
        String company = userCache.getCurrentUserCompany();
        String trainCode = PubFun.getCurrentUser();
        Instant nowTime = PubFun.getCurrentDate();

        try{
            LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(ltExamStudentVO.getExamCode());
            log.info("fetchExamInfo-examInfoDTO: {}", examInfoDTO);
            if (examInfoDTO == null) {
                log.info("examInfoDTO is null");
                pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage1"));
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage1"));

            }
            if ( nowTime.isBefore(examInfoDTO.getExamBeginTime())) {
                log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage8"));
                pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage8"));
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage8"));

            }

            if (examInfoDTO.getExamEndTime() == null || examInfoDTO.getExamEndTime().isBefore(nowTime) && nowTime.isAfter(examInfoDTO.getExamEndTime())) {
                log.info(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
                pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));

            }

            List<LtExamStudentDTO> ltExamStudentDTOS = ltExamStudentMapper.toDto(ssLtExamStudentService.findAllByTrainCodeAndExamCode(ltExamStudentVO.getTrainCode(), ltExamStudentVO.getExamCode()));
            log.info("fetchExamInfo-ltExamStudentDTOS: {}", ltExamStudentDTOS);
            LtExamStudentDTO ltExamStudentDTO = new LtExamStudentDTO();
            if (ltExamStudentDTOS.size() == 0 ) {
                log.info("ltExamStudentDTOS is null");
                if (CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType())){
                    LtExamStudentDTO  newExamStudentDTO = ssLtExamStudentService.addExamStudent(trainCode,ltExamStudentVO.getExamCode(),examInfoDTO.getDataCate(),examInfoDTO.getRepeatCounts());
                    List<LtExamStudentDTO> examStudentDTOS = ltExamStudentMapper.toDto(ltExamStudentRepository.findAllByExamCodeAndTestPaperCodeAndTrainCodeAndStatusAndCompanyAndDeletedOrderByExamCountDesc(ltExamStudentVO.getExamCode(),ltExamStudentVO.getTestPaperCode(),trainCode,"1",company,false));

                    if (ObjectUtil.isNull(newExamStudentDTO) || examStudentDTOS.size() == 0){
                        pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                        pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
                        throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));

                    }else{
                        ltExamStudentDTO = examStudentDTOS.get(0);
                    }
                }else{
                    pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                    pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage3"));
                }
            }else{
                ltExamStudentDTO = ltExamStudentDTOS.get(0);
            }
            TestPaperAndExamVO testPaperAndExamVO = new TestPaperAndExamVO();



            LtTestPaperDTO ltTestPaperDTO = tmsCacheQueryService.redisQueryTestPaper(CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType())?examInfoDTO.getTestPaperCode():ltExamStudentVO.getTestPaperCode());
            log.info("fetchExamInfo-ltTestPaperDTO: {}", ltTestPaperDTO);

            if (ltTestPaperDTO == null) {
                log.info("ltTestPaperDTO is null");
                pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage2"));
            }

            if (CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType())&& "--".equals(ltExamStudentDTO.getTestPaperCode())){
                ltExamStudentVO.setTestPaperCode(examInfoDTO.getTestPaperCode());
                ltExamStudentDTO.setTestPaperCode(examInfoDTO.getTestPaperCode());
                ltExamStudentDTO.setSurplusExamCount(examInfoDTO.getRepeatCounts());
                ltExamStudentDTO.setPassMark(ltTestPaperDTO.getPassMark());
                ltExamStudentDTO.setPaperMark(ltTestPaperDTO.getPaperMark());
                if (("00".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                    ltExamStudentDTO.setExamState("10");
                }
                ltExamStudentService.save(ltExamStudentDTO);
            }else if (CodeConstants.REQUESTTYPE_QRCODE.equals(ltExamStudentVO.getRequestType()) && ltExamStudentDTOS.size() >= 1 && !ltExamStudentDTOS.get(0).getTestPaperCode().equals("--")) {
                if (("09".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                    ltExamStudentDTO.setExamState("10");
                    ltExamStudentService.save(ltExamStudentDTO);
                    redisUtil.del(RedisConstants.EXAM_STUDENT + "_" + ltExamStudentDTO.getExamCode() + "_" + ltExamStudentDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode());
                }else if("02".equals(ltExamStudentDTO.getExamState())){
                    pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                    pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.getExamInfo.havePassed"));
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.havePassed"));
                }else if("03".equals(ltExamStudentDTO.getExamState())){
                    pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                    pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.getExamInfo.haveNoPassed"));
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.haveNoPassed"));
                }else if("05".equals(ltExamStudentDTO.getExamState())){
                    pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                    pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.getExamInfo.reviewing"));
                    throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.getExamInfo.reviewing"));
                }
            }
            if ("10".equals(ltExamStudentDTO.getExamState())) {
                log.info("ExamStudent is TimeOut");
                pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
                pubRespInfoModel.setMsg(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
                throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage4"));
            }


        // 记录学员开始考试时间

            if (examInfoDTO != null && ltTestPaperDTO != null) {
                if ("course".equals(examInfoDTO.getSourceFrom())) {
                    List<LtCourseChapterDTO> list = ltCourseChapterMapper.toDto(ltCourseChapterRepository.findAllByChapterCodeAndCompanyAndDeleted(examInfoDTO.getSourceCode(), company, false));
                    if (list.size() == 1) {
                        testPaperAndExamVO.setSourceCode(list.get(0).getCourseCode());
                    }
                } else if ("train".equals(examInfoDTO.getSourceFrom())) {
                    List<String> sourceCodes = Arrays.asList(examInfoDTO.getSourceCode().split("-"));
                    if (sourceCodes.size() > 0) {
                        testPaperAndExamVO.setSourceCode(sourceCodes.get(0));
                    }
                }
                testPaperAndExamVO.setExamNote(examInfoDTO.getExamNote());
                testPaperAndExamVO.setSourceFrom(examInfoDTO.getSourceFrom());
                testPaperAndExamVO.setTestPaperCode(ltExamStudentVO.getTestPaperCode());
                testPaperAndExamVO.setExamCode(ltExamStudentVO.getExamCode());
                testPaperAndExamVO.setRandomNum(ltExamStudentVO.getRandomNum());
                testPaperAndExamVO.setExamName(examInfoDTO.getExamName());
                testPaperAndExamVO.setViewExamProcess(examInfoDTO.getViewExamProcess());
                testPaperAndExamVO.setTestPaperName(ltTestPaperDTO.getTestPaperName());
                if(ObjectUtil.isNull(ltExamStudentDTO) && "eachQuestion".equals(examInfoDTO.getDataCate())){

                    testPaperAndExamVO.setExamState("10");
                    testPaperAndExamVO.setSurplusExamCount(0);
                    testPaperAndExamVO.setExamCount(-1);
                }else{
                    testPaperAndExamVO.setExamState(ltExamStudentDTO.getExamState());
                    testPaperAndExamVO.setSurplusExamCount(ltExamStudentDTO.getSurplusExamCount());
                    testPaperAndExamVO.setExamCount(ltExamStudentDTO.getExamCount());
                    if (!("02".equals(ltExamStudentDTO.getExamState()) || "03".equals(ltExamStudentDTO.getExamState()) || "05".equals(ltExamStudentDTO.getExamState()) || "06".equals(ltExamStudentDTO.getExamState()))) {
                        //ltExamStudentDTO.setExamState("01");
                    }
                }


                /*题目*/
                testPaperAndExamVO.setSingleChoiceCount(ltTestPaperDTO.getSingleChoiceCount());
                testPaperAndExamVO.setEverySingleScore(ltTestPaperDTO.getEverySingleScore());
                testPaperAndExamVO.setMultipleChoiceCount(ltTestPaperDTO.getMultipleChoiceCount());
                testPaperAndExamVO.setEveryMultipleScore(ltTestPaperDTO.getEveryMultipleScore());
                testPaperAndExamVO.setJudgmentalCount(ltTestPaperDTO.getJudgmentalCount());
                testPaperAndExamVO.setEveryJudgmentalScore(ltTestPaperDTO.getEveryJudgmentalScore());
                testPaperAndExamVO.setCompletionCount(ltTestPaperDTO.getCompletionCount());
                testPaperAndExamVO.setEveryCompletionScore(ltTestPaperDTO.getEveryCompletionScore());
                testPaperAndExamVO.setOpenCount(ltTestPaperDTO.getOpenCount());
                testPaperAndExamVO.setEveryOpenScore(ltTestPaperDTO.getEveryOpenScore());

                /*通过分数*/
                testPaperAndExamVO.setPaperMark(ltTestPaperDTO.getPaperMark());
                testPaperAndExamVO.setPassMark(ltTestPaperDTO.getPassMark());
                testPaperAndExamVO.setPublishUnit(examInfoDTO.getPublishUnit());
                /*最大考试次数*/
                testPaperAndExamVO.setRepeatCounts(examInfoDTO.getRepeatCounts());

                testPaperAndExamVO.setExamDuration(examInfoDTO.getExamDuration());
                testPaperAndExamVO.setMinExamDuration(examInfoDTO.getMinExamDuration());
                testPaperAndExamVO.setIsCopy(examInfoDTO.getIsCopy());
                testPaperAndExamVO.setQuestionDisOrder(examInfoDTO.getQuestionDisOrder());
                testPaperAndExamVO.setOptionDisOrder(examInfoDTO.getOptionDisOrder());
                testPaperAndExamVO.setCutScreenCounts(examInfoDTO.getCutScreenCounts());
                testPaperAndExamVO.setMaxPageDwellTime(examInfoDTO.getMaxPageDwellTime());
                testPaperAndExamVO.setNeedSignName(examInfoDTO.getNeedSignName());
            }
            log.info("fetchExamInfo-testPaperAndExamVO:{}",testPaperAndExamVO);
        }catch (Exception e){
            log.info("+++++提示错误+++++");
            log.info(String.valueOf(e.getStackTrace()));
            return ResponseEntity.ok().body(pubRespInfoModel);
        }

        return ResponseEntity.ok().body(pubRespInfoModel);
    }


    /**
     * 获取考试详情（已考试）答题概览
     **/
    @ApiOperation(value = "考试详情分析-概览(已参加过考试后调用)")
    @ApiOperationSupport(order = 40)
    @GetMapping("/lt-test-papers-analysis-overview")
    public ResponseEntity<LtExamStudentDTO> getExamPaperAnalysisOverview(@RequestParam @ApiParam(name = "examCode", value = "考试编码", required = true) String examCode,
                                                                         @RequestParam @ApiParam(name = "testPaperCode", value = "试卷编码", required = true) String testPaperCode) {
        long startMillis = System.currentTimeMillis();
        log.info("获取试卷答题概览开始: {}", examCode);
        String userCode = PubFun.getCurrentUser();
        LtExamInfoDTO examInfoDTO = tmsCacheQueryService.redisQueryExam(examCode);
        if (examInfoDTO == null) {

        }
        LtExamStudentDTO ltExamStudentDTO = tmsCacheQueryService.redisQueryExamStudent(examCode, testPaperCode, userCode);
        if (ltExamStudentDTO == null) {
            ltExamStudentDTO = new LtExamStudentDTO();
        }

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取试卷答题概览结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(ltExamStudentDTO);
    }

    /**
     * 获取考试详情（已考试）答题解析
     **/
    @ApiOperation(value = "考试详情分析-解析(已参加过考试后调用)")
    @ApiOperationSupport(order = 50)
    @GetMapping("/lt-test-papers-analysis-detail")
    public ResponseEntity<List<LtTestPaperQuestionVO>> getExamPaperAnalysisDetail(@RequestParam @ApiParam(name = "examCode", value = "考试编码", required = true) String examCode,
                                                                                  @RequestParam @ApiParam(name = "testPaperCode", value = "试卷编码", required = true) String testPaperCode,
                                                                                  @RequestParam @ApiParam(name = "examCount", value = "考试次数", required = true) Integer examCount,
                                                                                  @RequestParam(required = false) @ApiParam(name = "randomNum", value = "随机序列") Integer randomNum,
                                                                                  @RequestParam(required = false) @ApiParam(name = "trainCode", value = "学员编码") String trainCode) {
        long startMillis = System.currentTimeMillis();
        log.info("获取试卷答题解析开始: {},{},{},{}", examCode,testPaperCode,examCount,trainCode);
        LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(testPaperCode);
        if (testPaperDTO == null) {
            log.info("testPaperDTO is null");
            throw new BusinessErrorException(messageUtil.getMessage("ExamStudent.submit.errorMessage1"));
        }
        List<LtTestPaperQuestionVO> testPaperQuestionVOS = new ArrayList<>();
        try{
            if (testPaperDTO != null) {
                String userCode = PubFun.getCurrentUser();
                if (trainCode != null && !"".equals(trainCode)) {
                    // 分析指定学员的考试详情，PC端解析时使用
                    userCode = trainCode;
                }
                testPaperQuestionVOS = ssLtTestPaperService.getTestPaperDetail(examCode, testPaperDTO, "analysis", userCode, examCount,randomNum);
            }
        }catch (Exception e){
            e.getStackTrace();
        }

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取试卷答题解析结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(testPaperQuestionVOS);
    }

    /**
     * 获取竞赛列表
     * trainCode 学员编码
     * 必须是已发布的试卷
     * examState 01-待考试，02-已考试
     **/
    @ApiOperation(value = "获取竞赛列表")
    @ApiOperationSupport(order = 60)
    @GetMapping("/lt-contest-list")
    public ResponseEntity<List<TestPaperAndExamVO>> getLtConTestList(@RequestParam(value = "name", required = false) @ApiParam(name = "name", value = "考试名称", required = false) String name,
                                                                     @RequestParam(value = "type", required = false) @ApiParam(name = "type", value = "类型", required = false) String type,
                                                                     @RequestParam @ApiParam(name = "dataCate", value = "数据类别(sureachQuestion每日一天)", required = true) String dataCate, Pageable pageable) {
        long startMillis = System.currentTimeMillis();
        log.info("获取考试列表开始: {}", dataCate);

        String userCode = PubFun.getCurrentUser();
        Page<LtExamInfoDTO> examPage = new PageImpl<>(new ArrayList<>(), pageable, 0);
        if("noexam".equals(type)){
            // 未参与的刷新列表
            ssltExamInfoService.updateExamInfoStudent(dataCate,null);
        }

        String[] stateArray = null;
        if("all".equals(type)){
            stateArray = new String[]{"01", "02", "03", "10"};
        }else if("noexam".equals(type)){
            stateArray = new String[]{"01", "10"};
        }else if("exam".equals(type)){
            stateArray = new String[]{"02" ,"03"};
        }

        examPage = ssltExamInfoService.findAllByTrainCodeAndExamState4(userCode, stateArray, dataCate, name,"eachQuestion", pageable);
        List<LtExamInfoDTO> examList = examPage.getContent();
        List<TestPaperAndExamVO> testPaperAndExamVOS = new ArrayList<>();
        for (LtExamInfoDTO examInfoDTO : examList) {
            TestPaperAndExamVO vo = new TestPaperAndExamVO();
            BeanCopyUtil.copyPropertiesIgnoreNull(examInfoDTO, vo);

            /*绑定试卷随机出*/
            List<LtExamStudent> ltExamStudents = ssLtExamStudentService.findAllByTrainCodeAndExamCode(userCode, examInfoDTO.getExamCode());

            LtTestPaperDTO testPaperDTO = tmsCacheQueryService.redisQueryTestPaper(examInfoDTO.getTestPaperCode());

            /*学员绑定试卷*/
            if (ltExamStudents.size() == 0) {
                throw new BusinessErrorException("ltExamStudents is fail");
            } else if (ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                LtExamStudentDTO ltExamStudentDTO = ltExamStudentMapper.toDto(ltExamStudents.get(0));
                ltExamStudentDTO.setPassMark(testPaperDTO.getPassMark());
                ltExamStudentDTO.setPaperMark(testPaperDTO.getPaperMark());
                ltExamStudentDTO.setTestPaperCode(examInfoDTO.getTestPaperCode());
                ltExamStudentDTO.setSurplusExamCount(examInfoDTO.getRepeatCounts());
                log.info("ltExamStudentDTO:{}", ltExamStudentDTO);
                if (("00".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                    ltExamStudentDTO.setExamState("10");
                }
                ltExamStudentService.save(ltExamStudentDTO);
                vo.setTestPaperCode(ltExamStudentDTO.getTestPaperCode());
                vo.setSurplusExamCount(ltExamStudentDTO.getSurplusExamCount());
            } else if (ltExamStudents.size() >= 1 && !ltExamStudents.get(0).getTestPaperCode().equals("--")) {
                LtExamStudentDTO ltExamStudentDTO = ltExamStudentMapper.toDto(ltExamStudents.get(0));
                if (("09".equals(ltExamStudentDTO.getExamState()) || "01".equals(ltExamStudentDTO.getExamState())) && examInfoDTO.getExamEndTime().isBefore(PubFun.getCurrentDate())) {
                    ltExamStudentDTO.setExamState("10");
                    ltExamStudentService.save(ltExamStudentDTO);
                    redisUtil.hdel(RedisConstants.EXAM_STUDENT, ltExamStudentDTO.getExamCode() + "_" + ltExamStudentDTO.getTestPaperCode() + "_" + ltExamStudentDTO.getTrainCode());

                }
                vo.setTestPaperCode(ltExamStudents.get(0).getTestPaperCode());
                vo.setSurplusExamCount(ObjectUtils.isEmpty(ltExamStudents.get(0).getSurplusExamCount()) ? 0 : ltExamStudents.get(0).getSurplusExamCount());
                vo.setWrongQuestionCount(ObjectUtils.isEmpty(ltExamStudents.get(0).getWrongQuestionCount()) ? 0 : ltExamStudents.get(0).getWrongQuestionCount());
            }

            if (testPaperDTO != null) {
                vo.setPaperMark(ObjectUtils.isEmpty(testPaperDTO.getPaperMark()) ? 0 : testPaperDTO.getPaperMark());
                vo.setPassMark(ObjectUtils.isEmpty(testPaperDTO.getPassMark()) ? 0 : testPaperDTO.getPassMark());
                vo.setSingleChoiceCount(ObjectUtils.isEmpty(testPaperDTO.getSingleChoiceCount()) ? 0 : testPaperDTO.getSingleChoiceCount());
                vo.setEverySingleScore(ObjectUtils.isEmpty(testPaperDTO.getEverySingleScore()) ? 0 : testPaperDTO.getEverySingleScore());
                vo.setMultipleChoiceCount(ObjectUtils.isEmpty(testPaperDTO.getMultipleChoiceCount()) ? 0 : testPaperDTO.getMultipleChoiceCount());
                vo.setEveryMultipleScore(ObjectUtils.isEmpty(testPaperDTO.getEveryMultipleScore()) ? 0 : testPaperDTO.getEveryMultipleScore());
                vo.setJudgmentalCount(ObjectUtils.isEmpty(testPaperDTO.getJudgmentalCount()) ? 0 : testPaperDTO.getJudgmentalCount());
                vo.setEveryJudgmentalScore(ObjectUtils.isEmpty(testPaperDTO.getEveryJudgmentalScore()) ? 0 : testPaperDTO.getEveryJudgmentalScore());
                vo.setTestPaperName(ObjectUtils.isEmpty(testPaperDTO.getTestPaperName()) ? "" : testPaperDTO.getTestPaperName());

            }
            LtExamStudentDTO examStudentDTO = tmsCacheQueryService.redisQueryExamStudent(vo.getExamCode(), vo.getTestPaperCode(), userCode);
            if (examStudentDTO != null) {
                vo.setStartTime(examStudentDTO.getStartTime());
                vo.setEndTime(examStudentDTO.getEndTime());
                vo.setScore(ObjectUtils.isEmpty(examStudentDTO.getScore()) ? 0 : examStudentDTO.getScore());
                vo.setExamState(examStudentDTO.getExamState());
                vo.setExamCount(ObjectUtils.isEmpty(examStudentDTO.getExamCount()) ? 0 : examStudentDTO.getExamCount());
            }
            testPaperAndExamVOS.add(vo);
        }
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取考试列表结束，耗时【" + usedTime + "】ms");
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), examPage);
        return ResponseEntity.ok().headers(headers).body(testPaperAndExamVOS);
    }

    /**
     * 获取竞赛列表
     * trainCode 学员编码
     * 必须是已发布的试卷
     **/
    @ApiOperation(value = "获取竞赛详情列表")
    @ApiOperationSupport(order = 70)
    @GetMapping("/lt-contest-details")
    public ResponseEntity<List<TestPaperAndExamVO>> fetchConTestDetails(@RequestParam @ApiParam(name = "examCode", value = "考试编码", required = true) String examCode,
                                                                        @RequestParam(value = "time", required = false) @ApiParam(name = "time", value = "时间值(2023-02-01)", required = false) String time,
                                                                        @RequestParam(value = "type", required = false) @ApiParam(name = "type", value = "类型(all:全部;noexam:未参与;exam:已参与)", required = false) String type,
                                                                        Pageable pageable) throws Exception {
        long startMillis = System.currentTimeMillis();
        log.info("获取竞赛详情列表开始: {}", examCode);
        String userCode = PubFun.getCurrentUser();
        LtExamInfoDTO ltExamInfoDTO = tmsCacheQueryService.redisQueryExam(examCode);
        Page<TestPaperAndExamVO> examPage = ssLtExamStudentService.findAllByTrainCodeAndExamCodeOrderByExamCountDesc(userCode,ltExamInfoDTO.getTestPaperCode(),type ,time,ltExamInfoDTO, pageable);
        List<TestPaperAndExamVO> testPaperAndExamVOS = examPage.getContent();

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取竞赛详情列表结束，耗时【" + usedTime + "】ms");
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), examPage);
        return ResponseEntity.ok().headers(headers).body(testPaperAndExamVOS);
    }

    /**
     * 获取错题库列表
     **/
    @ApiOperation(value = "获取错题库列表")
    @ApiOperationSupport(order = 80)
    @GetMapping("/lt-question-show-wrong")
    public ResponseEntity<List<LtTestPaperQuestionVO>> fetchWrongQuestions(@RequestParam(value = "dataCate", required = false)
                                                                           @ApiParam(name = "dataCate", value = "类型(all:全部;test:考试;practice:练习)", required = false) String dataCate,
                                                                           @RequestParam(value = "searchText", required = false)
                                                                           @ApiParam(name = "searchText", value = "搜索题干内容", required = false) String searchText,
                                                                           Pageable pageable) {
        long startMillis = System.currentTimeMillis();
        log.info("获取错题库列表开始: {}");
        String userCode = PubFun.getCurrentUser();
        Page<LtTestPaperQuestionVO> questionsPage = ssLtQuestionService.findAllWrongQuestions(dataCate,userCode, searchText,pageable);
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取错题库列表结束，耗时【" + usedTime + "】ms");
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), questionsPage);
        return ResponseEntity.ok().headers(headers).body(questionsPage.getContent());
    }

    /**
     * 获取错题库统计数据
     **/
    @ApiOperation(value = "获取错题库列表")
    @ApiOperationSupport(order = 80)
    @GetMapping("/lt-question-wrong-cal")
    public ResponseEntity<Map<String, String>> calWrongQuestions(@RequestParam(value = "dataCate", required = false) @ApiParam(name = "dataCate", value = "类型(all:全部;test:考试;practice:练习)", required = false) String dataCate) {
        long startMillis = System.currentTimeMillis();
        log.info("获取错题库统计数据: {}");
        String userCode = PubFun.getCurrentUser();
        Map<String, String> calData = ssLtQuestionService.calWrongQuestion(dataCate,userCode);
        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("获取错题库列表结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(calData);
    }

    @ApiOperation(value = "移除错题")
    @ApiOperationSupport(order = 90)
    @PostMapping("/remove-wrong-question")
    public ResponseEntity<PubRespInfoModel> removeWrongQuestion(@RequestBody List<String> examStudentQuestionList) {
        long startMillis = System.currentTimeMillis();
        log.info("获取错题库列表开始: {}");
        String userCode = PubFun.getCurrentUser();
        PubRespInfoModel pubRespInfoModel = ssLtExamQuestionStudentService.removeWrongQuestion(examStudentQuestionList);

        long usedTime = System.currentTimeMillis() - startMillis;
        log.info("移除错题结束，耗时【" + usedTime + "】ms");
        return ResponseEntity.ok().body(pubRespInfoModel);
    }







}
