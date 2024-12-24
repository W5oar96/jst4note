package com.sinosoft.ss.controller.tiejun;

import cn.hutool.core.util.ObjectUtil;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.sinosoft.constant.ConstantField;
import com.sinosoft.domain.LtBusinessCodeSelect;
import com.sinosoft.domain.LtStudentInfo;
import com.sinosoft.domain.SyncTjStudent;
import com.sinosoft.repository.LtBusinessCodeSelectRepository;
import com.sinosoft.repository.LtStudentInfoRepository;
import com.sinosoft.service.BatchService;
import com.sinosoft.ss.service.tiejun.SsSyncTJJingGuanService;
import com.sinosoft.utils.NError;
import com.sinosoft.utils.RedisUtil;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import io.swagger.annotations.Api;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * REST controller for managing {@link com.sinosoft.domain.SyncDict}.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@RestController
@Api(tags = "同步铁军经管")
@RequestMapping("/sync/tj")
public class SsSyncTJJingGuanResource {

    private final Logger logger = LoggerFactory.getLogger(SsSyncTJJingGuanResource.class);

    @Autowired
    private SsSyncTJJingGuanService ssSyncTJJingGuanService;

    @Autowired
    private LtBusinessCodeSelectRepository ltBusinessCodeSelectRepository;

    @Autowired
    private LtStudentInfoRepository ltStudentInfoRepository;

    @Autowired
    private BatchService batchService;

    @Autowired
    private RedisUtil redisUtil;

    /**
     * 获取token
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanGetToken")
    @XxlJob("syncJingGuanGetToken")
    public NError syncJingGuan(Map<String, String> paramMap) {
        ssSyncTJJingGuanService.syncJingGuanGetToken(paramMap);
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 全量同步机构
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanAllOrg")
    @XxlJob("syncJingGuanAllOrg")
    public NError syncJingGuanAllOrg(Map<String, String> paramMap) {
        ssSyncTJJingGuanService.syncJingGuanAllOrg(null);
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 机构增量更新
     * @param paramMap
     * @return
     */
    @GetMapping("/syncInsertAndUpdateOrg")
    @XxlJob("syncInsertAndUpdateOrg")
    public NError syncInsertAndUpdateOrg(Map<String, String> paramMap) {
        ssSyncTJJingGuanService.syncInsertAndUpdateOrg("create",null);
        ssSyncTJJingGuanService.syncInsertAndUpdateOrg("update",null);
        ssSyncTJJingGuanService.syncInsertAndUpdateOrg("delete",null);
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 手动同步机构增量更新
     * @return
     */
    @GetMapping("/handSyncInsertAndUpdateOrg")
    @XxlJob("handSyncInsertAndUpdateOrg")
    public NError handSyncInsertAndUpdateOrg() {
        String dateString = XxlJobHelper.getJobParam();
        // 指定的日期格式的正则表达式
        String pattern = "\\d{4}-\\d{1,2}-\\d{1,2}\\|\\d{4}-\\d{1,2}-\\d{1,2}";

        // 创建 Pattern 对象
        Pattern r = Pattern.compile(pattern);

        // 创建 Matcher 对象
        Matcher m = r.matcher(dateString);
        if(ObjectUtil.isNotNull(dateString) ||m.matches()){
            logger.info(">>>>>>>>>>>>>接收格式正确：{}<<<<<<<<<<<<<",dateString);
            ssSyncTJJingGuanService.handSyncInsertAndUpdateOrg(dateString);
            return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);

        }else{
            logger.info("=============接收格式错误：{}==============",dateString);
            return new NError(ConstantField.ERROR_CODE, NError.NO_RESULT);

        }
    }

    /**
     * 全量同步学员信息
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanAllStudent")
    @XxlJob("syncJingGuanAllStudent")
    public NError syncJingGuanAllStudent(Map<String, String> paramMap) {
        Integer currentPage = 1;
        JSONObject fDataJson = ssSyncTJJingGuanService.getJSONArrayStudent(1);
        JSONArray fData = (JSONArray) fDataJson.get("data");
        Integer countPage = (Integer) fDataJson.get("countPage");
        List<SyncTjStudent> syncTjStudents = ssSyncTJJingGuanService.insterSyncStudentData(fData,currentPage);
        System.out.println("countPage:"+countPage+"页");
        for(int i = 1;currentPage <= countPage ;i++){
            currentPage++;
            logger.info("==============开始获取第{}页数据=============",currentPage);

            JSONObject otherDataJson = ssSyncTJJingGuanService.getJSONArrayStudent(currentPage);
            JSONArray otherData = (JSONArray) otherDataJson.get("data");
            if (ObjectUtil.isNull(otherData)){
                logger.debug("======当前token失效======");
                ssSyncTJJingGuanService.syncJingGuanGetToken(null);
                logger.debug("======token已生成，重新获取当前"+ currentPage +"页数据======");

                JSONObject otherDataJson1 = ssSyncTJJingGuanService.getJSONArrayStudent(currentPage);
                otherData = (JSONArray) otherDataJson1.get("data");
                logger.debug("datas:{}",otherData.size());
            }
            List<SyncTjStudent> syncTjStudents2 = ssSyncTJJingGuanService.insterSyncStudentData(otherData,currentPage);
            syncTjStudents.addAll(syncTjStudents2);
            if (currentPage%10 == 0){
                logger.info("第{}页-第{}页数据开始同步",currentPage-9,currentPage);
                batchService.batchInsert(syncTjStudents);
                syncTjStudents.clear();
            }else if (currentPage == countPage){
                logger.info("第{}页-第{}页数据开始同步",currentPage-countPage%10,currentPage);
                batchService.batchInsert(syncTjStudents);
                syncTjStudents.clear();
            }
        }

        logger.debug("数据落地完毕");
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 学员数据同步
     * @param paramMap
     * @return
     */
    @GetMapping("/syncLtStudentInfo")
    @XxlJob("syncLtStudentInfo")
    public NError syncLtStudentInfo(Map<String, String> paramMap) {
        long startTime = System.currentTimeMillis();
        ssSyncTJJingGuanService.syncLtStudentInfo();
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        logger.info("全员同步铁军经管学员数据花费时间：{}",duration);
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 增量学员更新 (两网)
     * @return
     */
    @GetMapping("/insertOrUpdateStudentInfo")
    @XxlJob("insertOrUpdateStudentInfo")
    public NError insertOrUpdateStudentInfo() {
        long startTime1 = System.currentTimeMillis();
        this.insertOrUpdateStudentInfo("create",null,null);

        long endTime1 = System.currentTimeMillis();
        long duration1 = endTime1 - startTime1;

        logger.info("增量同步铁军学员数据（create）花费时间：{}",duration1);

        long startTime = System.currentTimeMillis();
        this.insertOrUpdateStudentInfo("update",null,null);
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        logger.info("增量同步铁军学员数据（update）花费时间：{}",duration);

        //异常表校验
        ssSyncTJJingGuanService.checkException();
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    @GetMapping("/exception")
    public NError exception(){
        //异常表校验
        ssSyncTJJingGuanService.checkException();
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 手动更新学员
     * @return
     */
    @GetMapping("/handInsertOrUpdateStudentInfo")
    @XxlJob("handInsertOrUpdateStudentInfo")
    public NError handInsertOrUpdateStudentInfo() {
        String dateString = XxlJobHelper.getJobParam();
        // 指定的日期格式的正则表达式
        String pattern = "\\d{4}-\\d{1,2}-\\d{1,2}\\|\\d{4}-\\d{1,2}-\\d{1,2}";

        // 创建 Pattern 对象
        Pattern r = Pattern.compile(pattern);

        // 创建 Matcher 对象
        Matcher m = r.matcher(dateString);
        if(ObjectUtil.isNotNull(dateString) || m.matches()){
            logger.info(">>>>>>>>>>>>>接收格式正确：{}<<<<<<<<<<<<<",dateString);
            this.handInsertOrUpdateStudentInfo(dateString);
            return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);

        }else{
            logger.info("=============接收格式错误：{}==============",dateString);
            return new NError(ConstantField.ERROR_CODE, NError.NO_RESULT);

        }
    }

    /**
     * 手动更新某日、哪些学员信息
     * @return
     */
    @GetMapping("/handInsertOrUpdateStudentInfoByDateAndUserIds")
    @XxlJob("handInsertOrUpdateStudentInfoByDateAndUserIds")
    public NError handInsertOrUpdateStudentInfoByDateAndUserIds() {
        String strString = XxlJobHelper.getJobParam();
        //String strString = "{2024-08-29|2024-08-29,(BYD-HeDaQiang;BYD-HuangYu27)}";
        // 指定的日期格式的正则表达式
        String pattern = "\\{(\\d{4}-\\d{2}-\\d{2}(\\|\\d{4}-\\d{2}-\\d{2})*);(\\(([^,()]+)(;[^,()]+)*\\))\\}";        // 创建 Pattern 对象
        Pattern r = Pattern.compile(pattern);

        // 创建 Matcher 对象
        Matcher m = r.matcher(strString);
        if(ObjectUtil.isNotNull(strString) || m.matches()){
            logger.info(">>>>>>>a>>>>>>接收格式正确：{}<<<<<<<<<<<<<",strString);
            String regex = "\\{([^}]*)\\}";
            Pattern patternstr = Pattern.compile(regex);
            Matcher matcher = patternstr.matcher(strString);
            if (matcher.find()) {
                String innerContent = matcher.group(1); // 提取大括号内的内容
                System.out.println("大括号内的内容: " + innerContent);
                List<String> strlist = Arrays.asList(innerContent.split(","));
                String dateString = strlist.get(0);
                String outputStr = strlist.get(1).replace("(", "").replace(")", "");
                this.handInsertOrUpdateByDateAndUserIds(dateString,outputStr);
                return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
            } else {
                logger.info("没有找到大括号内的内容");
                return new NError(ConstantField.ERROR_CODE, NError.NO_RESULT);
            }


        }else{
            logger.info("=============接收格式错误：{}==============",strString);
            return new NError(ConstantField.ERROR_CODE, NError.NO_RESULT);

        }
    }

    private void handInsertOrUpdateByDateAndUserIds(String dateString, String outputStr) {
        insertOrUpdateStudentInfo("create",dateString,outputStr);
        insertOrUpdateStudentInfo("update",dateString,outputStr);
    }

    public void handInsertOrUpdateStudentInfo(String dateString) {
        insertOrUpdateStudentInfo("create",dateString,null);
        insertOrUpdateStudentInfo("update",dateString,null);

    }

    /**
     * 增量处理新增、删除、更新人员信息
     * @param type
     */
    public void insertOrUpdateStudentInfo(String type,String dateString,String userids) {
        String key = "TJ_JINGGUAN_";
        String accessToken = null;
        String time = null;
        if(redisUtil.hHasKey(key,"accessToken")){
            accessToken = (String) redisUtil.hget(key,"accessToken");
        }
        if(ObjectUtil.isNull(dateString)){
            logger.info("自动跑批");
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH,-2);
            String yesDay = sdf.format(cal.getTime());
            cal = Calendar.getInstance();
            cal.add(Calendar.DATE, 1);// 会有时区问题 当前时间+1天
            String today = sdf.format(cal.getTime());
            time = yesDay + "|" +today;
            logger.info("自动跑批,时间：{};类型：{}",time,type);

        }else{
            time = dateString;
            logger.info("手动跑批,时间：{};类型：{}",time,type);

        }
        try{
            //同一批数据的批次号
            String batchNumber = type + "_" + UUID.randomUUID().toString().replaceAll("-", "");
            logger.info("增量铁军同步处理批次号为：{}",batchNumber);
            Integer currentPage = 1;
            logger.info("==============开始获取第{}页数据=============", currentPage);
            JSONObject dataJson = ssSyncTJJingGuanService.getInsertOrUpdateStudent(currentPage,accessToken,time,type,userids, batchNumber);
            if(!ObjectUtil.isNull(dataJson)
                && "200".equals(dataJson.getString("code"))) {
                Integer countPage = (Integer) dataJson.get("countPage");
                logger.info("==============countPage=============: {}", countPage);
                for (int i = 2; i <= countPage; i++) {
                    logger.info("==============开始获取第{}页/{}页数据=============", i, countPage);
                    ssSyncTJJingGuanService.getInsertOrUpdateStudent(i, accessToken, time, type, userids, batchNumber);
                    logger.info("==============结束获取第{}页/{}页数据=============", i, countPage);
                }
            }

            //统一更新ltStudentInfo
            ssSyncTJJingGuanService.saveStudentInfo(type,batchNumber);
        }catch (Exception e){
            e.printStackTrace();
            logger.info("铁军经管学员增量接口同步异常:{}",e.getMessage());
        }
    }

    /**
     * 手动输入日期，将中间表数据同步到学院表
     * @return
     */
    @GetMapping("/handInsertOrUpdateStudentInfoByDate")
    @XxlJob("handInsertOrUpdateStudentInfoByDate")
    public NError handInsertOrUpdateStudentInfoByDate() {
        String dateString = XxlJobHelper.getJobParam();
        // 指定的日期格式的正则表达式
        String pattern = "\\d{4}-\\d{1,2}-\\d{1,2}\\,\\d{4}-\\d{1,2}-\\d{1,2}";

        // 创建 Pattern 对象
        Pattern r = Pattern.compile(pattern);

        // 创建 Matcher 对象
        Matcher m = r.matcher(dateString);
        if(ObjectUtil.isNotNull(dateString) ||m.matches()){
            logger.info(">>>>>>>>>>>>>接收格式正确：{}<<<<<<<<<<<<<",dateString);
            ssSyncTJJingGuanService.handInsertOrUpdateStudentInfoByDate(dateString);
            return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);

        }else{
            logger.info("=============接收格式错误：{}==============",dateString);
            return new NError(ConstantField.ERROR_CODE, NError.NO_RESULT);

        }
    }

    /**
     * 全量同步岗位信息
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanJobPosition")
    @XxlJob("syncJingGuanJobPosition")
    public NError syncJingGuanJobPosition(Map<String, String> paramMap) {
        Integer currentPage = 1;
        JSONObject fDataJson = ssSyncTJJingGuanService.getJSONArrayJobPosition();
        JSONArray fData = (JSONArray) fDataJson.get("data");
        ssSyncTJJingGuanService.syncJingGuanJobPosition(fData);

        logger.info("数据落地完毕");
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 全量学员信息同步岗位编码
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanJobPositionCode")
    @XxlJob("syncJingGuanJobPositionCode")
    public NError syncJingGuanJobPositionCode(Map<String, String> paramMap) {
        logger.info(">>>>>>>>>>>>>全铁军经管学员岗位编码同步开始<<<<<<<<<<<<<<");
        List<LtBusinessCodeSelect> ltBusinessCodeSelects = ltBusinessCodeSelectRepository.findAllByCodeType("jobposition");
        Map<String,LtBusinessCodeSelect> positionMap = ltBusinessCodeSelects.stream().collect(Collectors.toMap(LtBusinessCodeSelect::getCodeName,Function.identity(),(d1,d2)->d1));
        // 当前页码，从0开始
        int currentPage = 0;
        // 每页的大小
        int pageSize = 10000;

        Pageable pageable = PageRequest.of(currentPage, pageSize, Sort.by("id"));
        Page<LtStudentInfo> page = ltStudentInfoRepository.findAllByStuFlag("3",pageable);

        List<LtStudentInfo> ltStudentInfos = page.getContent();
        logger.info("ltStudentInfos:{}",ltStudentInfos.size());
        ssSyncTJJingGuanService.syncJingGuanJobPositionCode(ltStudentInfos,positionMap);

        int totalPages = page.getTotalPages();
        for (int i = 0; i < totalPages; i++) {

            // 还有更多的页面需要处理
            currentPage++;
            pageable = PageRequest.of(currentPage, pageSize, Sort.by("id"));
            Page<LtStudentInfo> pageNext = ltStudentInfoRepository.findAllByStuFlag("3",pageable);
            List<LtStudentInfo> ltStudentInfoNext = pageNext.getContent();
            logger.info(">>>>>>>>>>>>>>>>>处理全量学员信息同步岗位编码当前进度：{}/{}",i,totalPages);
            logger.info("ltStudentInfoNext:{}",ltStudentInfoNext.size());
            ssSyncTJJingGuanService.syncJingGuanJobPositionCode(ltStudentInfoNext,positionMap);
        }

        logger.info(">>>>>>>>>>>>>全铁军经管学员岗位编码同步结束<<<<<<<<<<<<<<");
        return new NError(ConstantField.SUCCESS_CODE, NError.SUCCESS);
    }

    /**
     * 全量学员信息同步机构信息
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanDepartment")
    @XxlJob("syncJingGuanDepartment")
    public NError syncJingGuanDepartment(Map<String, String> paramMap) {
        logger.info(">>>>>>>>>>>>>全铁军经管学员机构信息同步开始<<<<<<<<<<<<<<");
        NError nerror = ssSyncTJJingGuanService.syncJingGuanDepartment();
        logger.info(">>>>>>>>>>>>>全铁军经管学员岗位编码同步结束<<<<<<<<<<<<<<");
        return nerror;
    }


    /**
     * 全量同步学员信息 (到新中间表 sync_tj_student_all)
     * @param paramMap
     * @return
     */
    @GetMapping("/syncJingGuanAllStudentAll")
    @XxlJob("syncJingGuanAllStudentAll")
    public NError syncJingGuanAllStudentAll(Map<String, String> paramMap) {
        String dateString = XxlJobHelper.getJobParam();
        int page = 1;
        if(StringUtils.isNotBlank(dateString)){
            page = Integer.parseInt(dateString);
        }

        return ssSyncTJJingGuanService.syncStudentAll(page);
    }

}
