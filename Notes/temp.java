package com.sinosoft.ss.service.tiejun;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.Lists;
import com.sinosoft.constant.ConstantField;
import com.sinosoft.domain.*;
import com.sinosoft.repository.*;
import com.sinosoft.service.BatchService;
import com.sinosoft.service.constants.CodeConstants;
import com.sinosoft.service.dto.SyncTjDepartmentDTO;
import com.sinosoft.service.dto.SysManageComDTO;
import com.sinosoft.service.mapper.SyncTjDepartmentMapper;
import com.sinosoft.service.mapper.SysManageComMapper;
import com.sinosoft.utils.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.sinosoft.constant.ConstantField.DATA_STATUS_ON_JOB;
import static com.sinosoft.constant.ConstantField.STRING_ZERO_ONE;

/**
 * Service Implementation for managing SyncStudent.
 */
@Service
@Transactional
public class SsSyncTJJingGuanService {

    private final Logger logger = LoggerFactory.getLogger(SsSyncTJJingGuanService.class);

    @Autowired
    private BatchService batchService;

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private SysManageComMapper sysManageComMapper;

    @Autowired
    private SysManageComRepository sysManageComRepository;

    @Autowired
    private SyncTjDepartmentRepository syncTjDepartmentRepository;

    @Autowired
    private SyncTjDepartmentMapper syncTjDepartmentMapper;

    @Autowired
    private SyncTjStudentRepository syncTjStudentRepository;

    @Autowired
    private SyncTjStudentAllRepository syncTjStudentAllRepository;

    @Autowired
    private LtStudentInfoRepository ltStudentInfoRepository;

    @Autowired
    private JhiUserRepository jhiUserRepository;

    @Autowired
    private LtBusinessCodeSelectRepository ltBusinessCodeSelectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SyncTjStudentLwExceptionRepository syncTjStudentLwExceptionRepository;

    public static void syncJingGuan(Map<String, String> paramMap) {

        ObjectMapper objectMapper = new ObjectMapper();

        // 读取JSON文件
        String filePath = "src/main/resources/templates/jingguan.json";
        StringBuilder jsonContent = new StringBuilder();

        try {
            // 创建一个BufferedReader来读取文件
            BufferedReader reader = new BufferedReader(new FileReader(filePath));

            // 逐行读取文件内容并添加到StringBuilder中
            String line;
            while ((line = reader.readLine()) != null) {
                jsonContent.append(line);
            }

            // 关闭文件读取器
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }

        // 将StringBuilder转换为字符串
        String jsonString = jsonContent.toString();

        JSONObject jsonObject = JSONObject.parseObject(jsonString);
        System.out.println("jsonString:"+jsonObject);
    }

    public void syncJingGuanGetToken(Map<String, String> paramMap) {
        String urlString = "https://dems.byd.com:39200/api/cgi-bin/get/token";
        String appid = "64";
        String appsecret = "xnSmY9Fkr5KEoeerfkHvDf1PD70wc64";
        String key = "TJ_JINGGUAN_";
        try {
            URL url = new URL(urlString + "?appid=" + URLEncoder.encode(appid, "UTF-8") + "&appsecret=" + URLEncoder.encode(appsecret, "UTF-8"));
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String inputLine;
            StringBuilder response = new StringBuilder();

            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            String responseString = response.toString();
            redisUtil.hdel(key,"accessToken");
            String accessToken = responseString.substring(responseString.indexOf("access_token") + 15, responseString.indexOf("expires_in")-3);
            redisUtil.hset(key,"accessToken",accessToken,2L * 60 * 60 * 1000);
            System.out.println(response.toString());


            connection.disconnect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void syncJingGuanAllOrg(Object o) {
        String key = "TJ_JINGGUAN_";
        String accessToken = null;

        try {
            int currentPage = 1;
            int pageSize = 500;
            if(redisUtil.hHasKey(key,"accessToken")){
                accessToken = (String) redisUtil.hget(key,"accessToken");
            }
            long startTime = System.currentTimeMillis();
            String syncOrgUrl = "https://dems.byd.com:39200/api/out/department/list?token="+accessToken +"&page="+ currentPage +"&limit="+pageSize;

            RestTemplate restTemplate = new RestTemplate();
            logger.info("请求地址：{}",syncOrgUrl);

            String jsonStr = restTemplate.getForObject(syncOrgUrl,String.class);
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            logger.info("=======全量同步铁军经管机构接口调用花费时间：{}",duration);
    //        logger.info("jsonStr:{}",jsonStr);
            JSONObject dataJson = JSON.parseObject(jsonStr);
            Integer countPage = (Integer) dataJson.get("countPage");
            JSONArray firstData = (JSONArray) dataJson.get("data");
            List<SyncTjDepartment> insterDepartments = this.insterOrgData(firstData);
            for(int i = 1;i <= countPage ;i++){
                currentPage++;
                String otherUrl = "https://dems.byd.com:39200/api/out/department/list?token="+accessToken +"&page="+ currentPage +"&limit="+pageSize;
                logger.info("=======全量同步机构当前{}/{}页",currentPage,countPage);
                RestTemplate restTemplate2 = new RestTemplate();
                String jsonStr2 = restTemplate2.getForObject(otherUrl,String.class);
    //            logger.info("jsonStr2:{}",jsonStr2);
                JSONObject dataJson2 = JSON.parseObject(jsonStr2);
                JSONArray otherData = (JSONArray) dataJson2.get("data");
                List<SyncTjDepartment> insterDepartments2 = this.insterOrgData(otherData);
            }
            this.syncAllSySManageCom();
        }catch (Exception e){
            e.printStackTrace();
            logger.error("全量同步两网异常{}",e.getMessage());
        }
    }

    /**
     * 全量同步机构数据
     */
    public void syncAllSySManageCom() {
        List<SysManageCom> allSysManageCom = sysManageComRepository.findAll();
        Map<String,SysManageCom> allManageComMap = allSysManageCom.stream().collect(Collectors.toMap(item->item.getOrgId(), Function.identity(),(item1, item2)->item1));

        List<SyncTjDepartmentDTO> syncTjTopDepartments = syncTjDepartmentMapper.toDto(syncTjDepartmentRepository.findAllByDepthAndDeleted("1",false));
        List<SysManageComDTO> topManageComList = this.batchInster(syncTjTopDepartments,null,allManageComMap);

//        List<SyncTjDepartmentDTO> allSyncOrg = syncTjDepartmentMapper.toDto(syncTjDepartmentRepository.findAllByDeleted(false));
//        Map<Long,SyncTjDepartmentDTO> departmentMap = allSyncOrg.stream().collect(Collectors.toMap(item->item.getId(),Function.identity(),(item1,item2)->item1));

        List<SysManageComDTO> sysManageComDTOS = getChildrenManCom(topManageComList,allManageComMap);
        logger.info("=====开始处理sys_manage_com数量：{}",sysManageComDTOS.size());
        while (!sysManageComDTOS.isEmpty()) {
            logger.debug("刚判断departmentDTOS：{}",sysManageComDTOS.size());
            List<SysManageComDTO> coms = new ArrayList<>(sysManageComDTOS);
            sysManageComDTOS.clear();
            logger.debug("刚清除manageComs：{}",sysManageComDTOS.size());
            sysManageComDTOS.addAll(getChildrenManCom(coms,allManageComMap));
            logger.debug("刚赋值manageComs：{}",sysManageComDTOS.size());

        }
        logger.info("=====结束处理sys_manage_com数量：{}",sysManageComDTOS.size());
        //TODO 暂时清理B渠道管理机构数据，后期根据branchType进行清除
        //redisUtil.hdel("byd-group_TMS_BUSINESS_CODE_TYPE","managecomalldata_B");
    }

    /**
     * 查询机构子类
     * @param sysManageComDTOList
     * @return
     */
    private List<SysManageComDTO> getChildrenManCom(List<SysManageComDTO> sysManageComDTOList,Map<String,SysManageCom> allManageComMap) {
        List<SysManageComDTO> insterManageComs = new ArrayList<>();
        for (SysManageComDTO item:sysManageComDTOList){
            List<SyncTjDepartmentDTO> child = syncTjDepartmentMapper.toDto(syncTjDepartmentRepository.findAllByParentId(Long.valueOf(item.getOrgId())));
            List<SysManageComDTO> sysManageComDTOS = this.batchInster(child,item,allManageComMap);
            insterManageComs.addAll(sysManageComDTOS);
        }
        return insterManageComs;
    }

    /**
     *
     * @param childsDepartmentDTOS
     * @param sysManageComDTO
     * @return
     */
    private List<SysManageComDTO> batchInster(List<SyncTjDepartmentDTO> childsDepartmentDTOS,SysManageComDTO sysManageComDTO,Map<String,SysManageCom> allManageComMap) {
        List<SysManageCom> sysManageComs = new ArrayList<>();
        List<SysManageCom> inSysManageComs = new ArrayList<>();
        List<SysManageCom> upSysManageComs = new ArrayList<>();
        int maxNum = 0;
        String parentManageCom = null;
        String topCode = null;
        if(ObjectUtil.isNull(sysManageComDTO)){
            logger.info("++++++++++该次新增机构为顶级机构++++++++++");
            topCode = "A8601";
            parentManageCom = topCode;
        }else{
            SysManageCom maxManageCom = sysManageComRepository.findTopByUpManageComOrderByManageComDesc(sysManageComDTO.getManageCom());
            if(ObjectUtil.isNotNull(maxManageCom)){
                if(ObjectUtil.isNotNull(maxManageCom.getManageCom())){
                    String maxNoString = maxManageCom.getManageCom().substring(maxManageCom.getManageCom().length() - 3);
                    maxNum = Integer.valueOf(maxNoString);
                }

            }
            parentManageCom = sysManageComDTO.getManageCom();
        }

        for (SyncTjDepartmentDTO item:childsDepartmentDTOS){
            maxNum++;
            String s = String.format("%03d", maxNum);
            SysManageCom sysManageCom = new SysManageCom();
            sysManageCom.setManageCom(ObjectUtil.isNull(topCode)?parentManageCom + s:topCode+s);
            sysManageCom.setOutComCode(String.valueOf(item.getOrgId()));
            sysManageCom.setFormalName(item.getNameEn());
            sysManageCom.setUpManageCom(parentManageCom);
            sysManageCom.setName(item.getName());
            sysManageCom.setShortName(item.getName());
            sysManageCom.setStatus("1");
            sysManageCom.setCompany("byd-group");
            sysManageCom.setComArea(item.getArea());
            //sysManageCom.setRemark(item.getFull());
//            String fullName = this.getFullName(allManageComMap,sysManageCom.getOrgId(),sysManageCom.getShortName(),sysManageCom.getName());
            sysManageCom.setFullName(item.getFull());
            sysManageCom.setComGrade(item.getDepth());
            sysManageCom.setOrgId(String.valueOf(item.getOrgId()));
            if(ObjectUtil.isNull(allManageComMap.get(sysManageCom.getOrgId()))){

                inSysManageComs.add(sysManageCom);
            }else{
                SysManageCom oldSysManageCom = allManageComMap.get(sysManageCom.getOrgId());
                sysManageCom.setManageCom(oldSysManageCom.getManageCom());

                sysManageCom.setId(oldSysManageCom.getId());
                sysManageCom.setCreatedByManageCom(oldSysManageCom.getCreatedByManageCom());
                sysManageCom.setCreatedBy(oldSysManageCom.getCreatedBy());
                sysManageCom.setCreatedByManageComName(oldSysManageCom.getCreatedByManageComName());
                sysManageCom.setCreatedByName(oldSysManageCom.getCreatedByName());
                sysManageCom.setCreatedByStaffCode(oldSysManageCom.getCreatedByStaffCode());
                sysManageCom.setCreatedDate(oldSysManageCom.getCreatedDate());
                sysManageCom.setDeleted(oldSysManageCom.getDeleted());
                upSysManageComs.add(sysManageCom);
            }
        }
        logger.info("新增机构数量：{}",inSysManageComs.size());
        batchService.batchInsert(inSysManageComs);
        logger.info("++++++++新增机构完毕+++++++");

        logger.info("更新机构数量：{}",upSysManageComs.size());
        batchService.batchUpdate(upSysManageComs);
        logger.info("++++++++更新机构完毕+++++++");

        sysManageComs.addAll(inSysManageComs);
        sysManageComs.addAll(upSysManageComs);
        logger.info("该级机构数量：{}",sysManageComs.size());

        return sysManageComMapper.toDto(sysManageComs);
    }

    /**
     * 批量删除或更新
     * @param updateDepartmentDTO
     * @param type
     * @return
     */
    private List<SysManageComDTO> batchUpdateOrDelete(List<SyncTjDepartmentDTO> updateDepartmentDTO,String type,Map<String,SysManageCom> allManageComMap){
        List<SysManageCom> list= new ArrayList<>();
        for(SyncTjDepartmentDTO syncTjDepartment:updateDepartmentDTO){
            SysManageCom sysManageCom = sysManageComRepository.findTopByOrgIdOrderByCreatedDate(String.valueOf(syncTjDepartment.getOrgId()));
            sysManageCom.setFormalName(syncTjDepartment.getNameEn());
            sysManageCom.setName(syncTjDepartment.getName());
            sysManageCom.setStatus("update".equals(type)?"1":"2");
            sysManageCom.setCompany("byd-group");
            if(ObjectUtil.isNull(allManageComMap)){
                sysManageCom.setFullName(syncTjDepartment.getFull());
            }else{
                String fullName = this.getFullName(allManageComMap,sysManageCom.getOrgId(),sysManageCom.getShortName(),sysManageCom.getName());
                sysManageCom.setFullName(fullName);
            }
            sysManageCom.setShortName(syncTjDepartment.getAbbreviation());
            sysManageCom.setComArea(syncTjDepartment.getArea());
            //sysManageCom.setRemark(item.getFull());
            sysManageCom.setComGrade(syncTjDepartment.getDepth());
            list.add(sysManageCom);
        }
        batchService.batchUpdate(list);
        return sysManageComMapper.toDto(list);
    }


    /**
     * 同步机构数据落地
     * @param datas
     * @return
     */
    private List<SyncTjDepartment> insterOrgData(JSONArray datas){
        logger.debug("开始数据落地");
        List<SyncTjDepartment> allDepatments = syncTjDepartmentRepository.findAll();
        Map<Long,SyncTjDepartment> departmentMap = allDepatments.stream().collect(Collectors.toMap(item->item.getOrgId(),Function.identity(), (t1, t2) -> t1));
        List<SyncTjDepartment> inDepartments = new ArrayList<>();
        List<SyncTjDepartment> upDepartments = new ArrayList<>();
        for (int i = 0; i < datas.size(); i++){
            JSONObject jsonObject = datas.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            SyncTjDepartment syncTjDepartment= BeanUtil.mapToBean(map,SyncTjDepartment.class,true);
            syncTjDepartment.setOrgId(syncTjDepartment.getId());
            syncTjDepartment.setId(null);
            syncTjDepartment.setCompany("byd-group");
            if (syncTjDepartment.getFull().length() > 500){
                System.out.println("+++++++++++++++++++++syncTjDepartment++++++++++++++++++++");
                logger.info("syncTjDepartment:{}",syncTjDepartment);
            }
            if(ObjectUtil.isNull(departmentMap.get(syncTjDepartment.getOrgId()))){
                inDepartments.add(syncTjDepartment);
            }else{
                SyncTjDepartment oldDepartment = departmentMap.get(syncTjDepartment.getOrgId());
                syncTjDepartment.setId(oldDepartment.getId());
                syncTjDepartment.setDeleted(oldDepartment.getDeleted());
                syncTjDepartment.setCreatedDate(oldDepartment.getCreatedDate());
                syncTjDepartment.setCreatedByStaffCode(oldDepartment.getCreatedByStaffCode());
                syncTjDepartment.setCreatedBy(oldDepartment.getCreatedBy());
                syncTjDepartment.setCreatedByManageCom(oldDepartment.getCreatedByManageCom());
                syncTjDepartment.setCreatedByName(oldDepartment.getCreatedByName());
                upDepartments.add(syncTjDepartment);
            }

        }
        logger.debug("inDepartments：{}",inDepartments.size());
        batchService.batchInsert(inDepartments);
        logger.debug("+++++新增机构结束+++++");

        logger.debug("upDepartments：{}",upDepartments.size());
        batchService.batchUpdate(upDepartments);
        logger.debug("+++++更新机构结束+++++");

        allDepatments = null;
        upDepartments = null;
        logger.info("开始释放allDepatments,upDepartments内存");
        System.gc();

        return inDepartments;
    }

    /**
     * 更新同步数据
     * @param jsonData
     * @param type
     */
    private List<SyncTjDepartment> updateOrgData(JSONArray jsonData,String type) {
        List<SyncTjDepartment> departments = new ArrayList<>();
        for (int i = 0; i < jsonData.size(); i++){
            JSONObject jsonObject = jsonData.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            SyncTjDepartment syncTjDepartment= BeanUtil.mapToBean(map,SyncTjDepartment.class,true);
            syncTjDepartment.setOrgId(syncTjDepartment.getId());
            syncTjDepartment.setId(null);
            syncTjDepartment.setCompany("byd-group");
            if (syncTjDepartment.getFull().length() > 500){
                System.out.println("+++++++++++++++++++++syncTjDepartment++++++++++++++++++++");
                logger.debug("syncTjDepartment:{}",syncTjDepartment);
            }
            SyncTjDepartment oldDepartment = syncTjDepartmentRepository.findTopByOrgIdOrderByOrgId(syncTjDepartment.getOrgId());
            if (ObjectUtil.isNotNull(oldDepartment)){
                syncTjDepartment.setId(oldDepartment.getId());
                syncTjDepartment.setCreatedBy(oldDepartment.getCreatedBy());
                syncTjDepartment.setCreatedByManageCom(oldDepartment.getCreatedByManageCom());
                syncTjDepartment.setCreatedByName(oldDepartment.getCreatedByName());
                syncTjDepartment.setCreatedByStaffCode(oldDepartment.getCreatedByStaffCode());
                syncTjDepartment.setCreatedDate(oldDepartment.getCreatedDate());
                syncTjDepartment.setDeleted(!oldDepartment.getDeleted() && "update".equals(type)?false:true);
                departments.add(syncTjDepartment);
            }
        }
        logger.debug("departments：{}",departments.size());
        batchService.batchUpdate(departments);
        return departments;
    }

    public void syncInsertAndUpdateOrg(String type,String dateString) {
        String key = "TJ_JINGGUAN_";
        String accessToken = null;
        String time = null;
        if(redisUtil.hHasKey(key,"accessToken")){
            accessToken = (String) redisUtil.hget(key,"accessToken");
        }
        if (ObjectUtil.isNull(dateString)){
            time = ltStudentInfoRepository.getDate();

        }else{
            time = dateString;
        }

        String syncOrgUrl = "https://dems.byd.com:39200/api/out/add/department?token="+accessToken +"&time="+ time +"&type="+type;
        RestTemplate restTemplate = new RestTemplate();
        String jsonStr = restTemplate.getForObject(syncOrgUrl,String.class);
        logger.info("jsonStr:{}",jsonStr);
        JSONObject dataJson = JSON.parseObject(jsonStr);
        System.out.println(dataJson.size());
        String code = String.valueOf((Integer) dataJson.get("code"));
        if("200".equals(code)){
            JSONArray jsonData = (JSONArray) dataJson.get("data");
            List<SyncTjDepartment> departments = new ArrayList<>();
            if("create".equals(type)){
                departments = this.insterOrgData(jsonData);
            }else{
                departments = this.updateOrgData(jsonData,type);
            }
            this.syncInsertOrUpdateManageCom(type,departments);
            logger.debug("类型：{},更新数量：{}",type,departments.size());
        }


    }

    /**
     * 将SyncJtDepartment同步到sysManageCom中
     * @param type
     * @param syncTjDepartments
     */
    private void syncInsertOrUpdateManageCom(String type,List<SyncTjDepartment> syncTjDepartments){
        List<SysManageCom> allSysManageCom = sysManageComRepository.findAll();
        Map<String,SysManageCom> allManageComMap = allSysManageCom.stream().collect(Collectors.toMap(item->item.getManageCom(), Function.identity(),(item1, item2)->item1));

        if ("create".equals(type)){
            Set<Long> sets = syncTjDepartments.stream()
                .map(item -> item.getParentId())
                .collect(Collectors.toCollection(TreeSet::new));
            List<SysManageCom> insertManageCom = new ArrayList<>();
            for(Long id:sets){
                List<SyncTjDepartmentDTO> childDepartments=  syncTjDepartmentMapper.toDto(syncTjDepartments.stream().filter(item -> item.getParentId().equals(id)).collect(Collectors.toList()));
                SysManageComDTO parentManageDTO = sysManageComMapper.toDto(sysManageComRepository.findTopByOrgIdOrderByCreatedDate(String.valueOf(id)));
                if(ObjectUtil.isNull(parentManageDTO)){
                    parentManageDTO = sysManageComMapper.toDto(insertManageCom.stream()
                        .filter(com -> com.getOrgId().equals(id))
                        .findFirst()
                        .orElse(null));
                    allManageComMap.put(parentManageDTO.getManageCom(),sysManageComMapper.toEntity(parentManageDTO));
                }
                if(ObjectUtil.isNotNull(parentManageDTO)){
                    insertManageCom.addAll(sysManageComMapper.toEntity(this.batchInster(childDepartments,parentManageDTO, allManageComMap)));

                }
            }
        }else{
            this.batchUpdateOrDelete(syncTjDepartmentMapper.toDto(syncTjDepartments),type,allManageComMap);
        }
    }

    private String getFullName(Map<String,SysManageCom> allManageComMap,String manageCom,String shortName,String name){
        String full = "";
        String topLevel = "A8601";
        int topLevelLength = topLevel.length();
        String finalName = "";
        if(ObjectUtil.isEmpty(shortName)){
            finalName = name;
        }else{
            finalName = shortName;
        }

        // 判断原字符串是否包含顶层字符串
        if (ObjectUtil.isNotNull(manageCom) && manageCom.startsWith(topLevel)) {
            // 计算原字符串除去顶层字符串后的长度
            int remainingLength = manageCom.length() - topLevelLength;

            // 每三位长度为一层，计算总共的层级
            int numLevels = remainingLength / 3;

            // 输出每一层的编码
            for (int i = topLevelLength; i <= manageCom.length(); i += 3) {
                String manageComCode = manageCom.substring(0, i);
                SysManageCom sysManageCom = allManageComMap.get(manageComCode);
                if(ObjectUtil.isNotNull(sysManageCom)){
                    if(i == topLevelLength){
                        full = sysManageCom.getShortName();
                    }else if(manageComCode.equals(manageCom)){
                        full += "/" + finalName;
                    }else{
                        full += ObjectUtil.isNull(sysManageCom.getShortName()) || "".equals(sysManageCom.getShortName())?"/"+sysManageCom.getName():"/"+sysManageCom.getShortName();
                    }
                }else if(manageComCode.equals(manageCom)){
                    full += "/" + finalName;
                }
            }
        }

        return full;
    }


    public JSONObject getJSONArrayStudent(Integer currentPage){
        logger.info("======调用两网接口获取人员开始======");

        String key = "TJ_JINGGUAN_";
        String accessToken = null;
        int pageSize = 500;
        if(redisUtil.hHasKey(key,"accessToken")){
            accessToken = (String) redisUtil.hget(key,"accessToken");
        }
        long startTime = System.currentTimeMillis();
        String otherUrl = "https://dems.byd.com:39200/api/out/user/info?token="+accessToken +"&page="+ currentPage +"&limit="+pageSize;
        RestTemplate restTemplate = new RestTemplate();
        String jsonStr = restTemplate.getForObject(otherUrl,String.class);
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        logger.info("======调用两网接口获取人员结束，花费时间：{}",duration);
//        logger.info("jsonStr:{}",jsonStr);
        JSONObject dataJson = JSON.parseObject(jsonStr);
        return dataJson;
    }

    public List<SyncTjStudent> insterSyncStudentData(JSONArray datas,Integer currentPage){
        //logger.debug("开始数据落地");
        if (ObjectUtil.isNull(datas)){
            logger.debug("======当前token失效======");
            this.syncJingGuanGetToken(null);
            logger.debug("======token已生成，重新获取当前{}页数据======",currentPage);

            JSONObject otherDataJson = this.getJSONArrayStudent(currentPage);
            datas = (JSONArray) otherDataJson.get("data");
            logger.debug("datas:{}",datas.size());
        }
        List<SyncTjStudent> allSyncStudent = syncTjStudentRepository.findAll();
        Map<String,SyncTjStudent> SyncStudentMap = allSyncStudent.stream().collect(Collectors.toMap(item->item.getUserid(),Function.identity(), (t1, t2) -> t1));
        List<SyncTjStudent> syncTjStudents = new ArrayList<>();
        for (int i = 0; i < datas.size(); i++){
            JSONObject jsonObject = datas.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            SyncTjStudent syncTjStudent= BeanUtil.mapToBean(map,SyncTjStudent.class,true);
            syncTjStudent.setId(null);
            syncTjStudent.setCompany("byd-group");
            if(ObjectUtil.isNull(SyncStudentMap.get(syncTjStudent.getUuid()))){
                syncTjStudents.add(syncTjStudent);
            }

        }
        logger.debug("syncTjStudents：{}",syncTjStudents.size());
        //batchService.batchInsert(syncTjStudents);
        return syncTjStudents;
    }

    /**
     * 全量同步学员到ltStudentInfo
     */
    public void syncLtStudentInfo() {

        // 当前页码，从0开始
        int currentPage = 0;
        // 每页的大小
        int pageSize = 10000;

        Pageable pageable = PageRequest.of(currentPage, pageSize, Sort.by("id"));
        Page<SyncTjStudent> page = syncTjStudentRepository.findAllByStatusAndDeleted("在职",false, pageable);
        List<SyncTjStudent> syncStudents = page.getContent();
        logger.info("syncStudents:{}",syncStudents.size());
        List<SysManageCom> sysManageComs = sysManageComRepository.findAllByManageComNotInAndDeleted(new String[]{"A86", "A8601"},false);
        Map<String,SysManageCom> sysManageMap = sysManageComs.stream().collect(Collectors.toMap(SysManageCom::getOrgId, Function.identity(), (d1, d2) -> d1));
        List<LtStudentInfo> ltStudentInfos = ltStudentInfoRepository.findAllByDeletedOrderByEmployDate(false);
        logger.info("allLtStudentInfos:{}",ltStudentInfos.size());
        Map<String,LtStudentInfo> allLtStudentMap = ltStudentInfos.stream().collect(Collectors.toMap(LtStudentInfo::getStaffCode, Function.identity(), (d1, d2) -> d1));
//        Map<String,SysManageCom> manageComMap = findParentManageComName(sysManageComs,sysManageMap);
        List<JhiUser> jhiUsers = jhiUserRepository.findAll();
        Map<String,JhiUser> jhiUserMap = jhiUsers.stream().collect(Collectors.toMap(JhiUser::getLogin, Function.identity(), (d1, d2) -> d1));
        this.handlePageSyncStudents(syncStudents,sysManageMap,jhiUserMap,allLtStudentMap);
        int totalPages = page.getTotalPages();
        for (int i = 0; i < totalPages; i++) {

            // 还有更多的页面需要处理
            currentPage++;
            pageable = PageRequest.of(currentPage, pageSize, Sort.by("id"));
            Page<SyncTjStudent> pageNext = syncTjStudentRepository.findAllByStatusAndDeleted("在职",false, pageable);
            List<SyncTjStudent> syncStudentNext = pageNext.getContent();
            logger.info(">>>>>>>>>>>>>>>>>同步学员当前进度：{}/{}",i,totalPages);
            logger.info("syncStudentNext:{}",syncStudentNext.size());
            this.handlePageSyncStudents(syncStudentNext,sysManageMap,jhiUserMap,allLtStudentMap);
        }
    }

    private Map<String, SysManageCom> findParentManageComName(List<SysManageCom> manageComs,Map<String, SysManageCom> sysManageMap) {
        Map<String,SysManageCom> manageComMap = new HashMap<>();
        for (SysManageCom sysManageCom:manageComs){
            String sourceName = sysManageCom.getName();
            sourceName = groupManageComName(sourceName,sysManageCom.getUpManageCom(),sysManageMap);
            manageComMap.put(sourceName,sysManageCom);
        }
        return manageComMap;
    }

    private String groupManageComName(String sourceName, String upManageCom, Map<String, SysManageCom> sysManageMap) {
        SysManageCom sysManageCom = sysManageMap.get(upManageCom);
        if (ObjectUtil.isNotNull(sysManageCom)){
            sourceName = sysManageCom.getName() + "/" + sourceName;
            sourceName = groupManageComName(sourceName,sysManageCom.getUpManageCom(),sysManageMap);

        }
        return  sourceName;
    }

    /**
     * 分页处理syncTjStudent
     * @param syncStudents
     */
    private void handlePageSyncStudents( List<SyncTjStudent> syncStudents,Map<String,SysManageCom> manageComMap,Map<String,JhiUser> jhiUserMap,Map<String,LtStudentInfo> allLtStudentMap) {
        if (CollectionUtils.isNotNullList(syncStudents)) {
            //定义最终提交数据库的数据
            String encryptedPassword = null;
            List<SyncTjStudent> studentsData = syncStudents.stream().filter(a -> !a.getUuid().isEmpty() && !a.getUserid().isEmpty() && !a.getStatus().isEmpty()).collect(Collectors.toList());
            logger.info("--------》获取类型参数1，studentsData:{}",studentsData.size());
            List<SysManageCom> sysManageComs = sysManageComRepository.findAll();
            List<LtStudentInfo> batchInsertData = new ArrayList<>();
            List<LtStudentInfo> batchUpdateData = new ArrayList<>();
            List<JhiUser> batchJhiUserData = new ArrayList<>();
            List<JhiUser> newbatchJhiUserData = new ArrayList<>();
            List<JhiUserAuthority> batchJhiUserAuthorityData = new ArrayList<>();
            Map<String,SysManageCom> manageComMapByOrgId = sysManageComs.stream()
                .collect(Collectors.toMap(SysManageCom::getOrgId, Function.identity() , (d1, d2) -> d1));
            logger.info("manageComMapByOrgId,{}",manageComMapByOrgId.size());
            List<SyncTjStudent> outWorkStudents = syncTjStudentRepository.findAllByStatusInAndDeleted(new String[]{"02", "05", "06"},false);
            Map<String,SyncTjStudent> outWorkStudentMap = outWorkStudents.stream()
                .collect(Collectors.toMap(SyncTjStudent::getUuid, Function.identity() , (d1, d2) -> d1));
            Map<String,SysManageCom> manageComMapByOutCode = sysManageComs.stream()
                .collect(Collectors.toMap(SysManageCom::getOutComCode, Function.identity() , (d1, d2) -> d1));
            logger.info("manageComMapByOutCode,{}",manageComMapByOutCode.size());

            /**step.  获取已经在 lt_stduent_Indfo 表中存在的数据 此处可以考虑只返回id**/
            logger.info("设置Map值");
            logger.info("studentsData，{}",studentsData.size());

            for (SyncTjStudent syncStudent:syncStudents){

                //临时对象用来加到最后的数据库中
                LtStudentInfo ltStudentInfoNew = new LtStudentInfo();
                if (syncStudent.getMobile().length() > 15){
                    syncStudent.setMobile(null);
                }
                String employDate = syncStudent.getCreatedAt();

                //拷贝到新对象中，防止修改的时候直接修改数据库
                DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                ZoneOffset offset = OffsetDateTime.now().atZoneSameInstant(ZoneId.of("UTC")).getOffset();
                if (employDate != null){
                    LocalDateTime employDateTime = LocalDateTime.parse(employDate,dateTimeFormatter);
                    ltStudentInfoNew.setEmployDate(employDateTime.toInstant(offset));
                }
                ltStudentInfoNew.setManageComName(syncStudent.getDepartment());
                ltStudentInfoNew.setManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setCreatedByManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setCreatedByManageComName(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getFullName():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setPhone(syncStudent.getMobile());
                ltStudentInfoNew.setIdNo(syncStudent.getIdNumber());
                ltStudentInfoNew.setTradeSource(ConstantField.SYNC_TRADE_SOURCE_LW);
                ltStudentInfoNew.setFaceUrl(syncStudent.getFace());
                ltStudentInfoNew.seteMail(syncStudent.getEmail());
                ltStudentInfoNew.setStaffCode(syncStudent.getUserid());
                ltStudentInfoNew.setJobPosition(syncStudent.getPost());
                ltStudentInfoNew.setStuFlag("3");
                Pattern pattern = Pattern.compile("\"(.*?)\"");
                Matcher matcher = pattern.matcher(syncStudent.getPartTime());
                StringBuilder result = new StringBuilder();
                while (matcher.find()) {
                    String param = matcher.group(1); // 获取参数数据
                    result.append(param);
                    result.append(",");
                }

                String finalResult = null;
                if(ObjectUtil.isNotNull(result) && !("[]".equals(syncStudent.getPartTime()) || "".equals(syncStudent.getPartTime()))){
                    finalResult = result.toString().substring(0, result.length() - 1);

                }

                ltStudentInfoNew.setPartTimeJobPosition(finalResult);
                ltStudentInfoNew.setStuFlag("3");
                ltStudentInfoNew.setName(syncStudent.getName());
                //类型默认为B
                ltStudentInfoNew.setBranchType(ConstantField.BRANCHTYPE_B);

                //招聘为1/EHR为2

                //招聘默认01 todo 修改
                ltStudentInfoNew.setAgentState("在职".equals(syncStudent.getStatus())?"01":"04");
                ltStudentInfoNew.setStatus("在职".equals(syncStudent.getStatus())?"1":"0");


                // company 需要处理
                ltStudentInfoNew.setCompany("byd-group");
//                ltStudentInfoNew.setAgentGrade(syncStudent.getPost());
                if(ObjectUtil.isNull(allLtStudentMap.get(syncStudent.getUserid()))){
                    if("BYD-DingMingYue".equals(ltStudentInfoNew.getStaffCode())){
                        String trainCode = syncStudent.getUuid().replace("-","");
                        trainCode=trainCode.replace(trainCode.charAt(trainCode.length()-1)+"","1");
                        ltStudentInfoNew.setTrainCode(trainCode);
                    }else{
                        ltStudentInfoNew.setTrainCode(syncStudent.getUuid().replace("-",""));

                    }

                    if(manageComMapByOrgId.get(ltStudentInfoNew.getManageCom())!= null){
                        ltStudentInfoNew.setManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                        ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
                    }
                    if(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom())!= null){
                        ltStudentInfoNew.setMulManageCom(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom()).getManageCom());
                    }

                    ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
                    ltStudentInfoNew.setId(null);

                    //拷贝同步表对象
                    if(ObjectUtil.isNull(outWorkStudentMap.get(ltStudentInfoNew.getTrainCode()))){
                        batchInsertData.add(ltStudentInfoNew);
                    }
                }else{
                    LtStudentInfo oldStudent  = allLtStudentMap.get(syncStudent.getUserid());
                    if("3".equals(oldStudent.getStuFlag())){
                        ltStudentInfoNew.setId(oldStudent.getId());
                        ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode());
                        ltStudentInfoNew.setCreatedBy(oldStudent.getCreatedBy());
                        ltStudentInfoNew.setCreatedByManageComName(oldStudent.getCreatedByManageComName());
                        ltStudentInfoNew.setCreatedByManageCom(oldStudent.getCreatedByManageCom());
                        ltStudentInfoNew.setCreatedByName(oldStudent.getCreatedByName());
                        ltStudentInfoNew.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
                        ltStudentInfoNew.setCreatedDate(oldStudent.getCreatedDate());
                        batchUpdateData.add(ltStudentInfoNew);
                    }

                }


            }

            logger.info("++++++++++++新增学员开始+++++++++++");
            batchService.batchInsert(batchInsertData);
            logger.info("++++++++++++新增学员结束,新增数：{}+++++++++++",batchInsertData.size());

            logger.info("++++++++++++更新学员开始+++++++++++");
            batchService.batchUpdate(batchUpdateData);
            logger.info("++++++++++++更新学员结束,更新数：{}+++++++++++",batchUpdateData.size());


            for (LtStudentInfo ltStudentInfo:batchInsertData){
                if(ObjectUtil.isNull(jhiUserMap.get(ltStudentInfo.getTrainCode()))){
                    encryptedPassword = ltStudentInfo.getIdNo().length() > 6?ltStudentInfo.getIdNo().substring(ltStudentInfo.getIdNo().length() - 6):"";
                    if (StringUtils.isBlank(encryptedPassword)) {
                        encryptedPassword = AESCBCUtil.decrypt("jMSk65U6UvslALqfb7LeMg==", "SYSTRAINAesEncry");;
                    }
                    String password = passwordEncoder.encode(encryptedPassword);
                    JhiUser jhiUser = new JhiUser();
                    jhiUser.setLogin(ltStudentInfo.getTrainCode());
                    jhiUser.setActivated(true);
                    jhiUser.setCreatedBy("admin");
                    jhiUser.setPasswordHash(password);
                    batchJhiUserData.add(jhiUser);
                }
            }
            logger.info("batchJhiUserData,{}",batchJhiUserData.size());
            batchService.batchInsert(batchJhiUserData);
            List<String> needAddJhiUserLogin = batchJhiUserData.stream().map(JhiUser::getLogin).collect(Collectors.toList());

            logger.info("jhiUser表插入");
            newbatchJhiUserData = jhiUserRepository.findAllByLoginIn(needAddJhiUserLogin);
            logger.info("jhiUser插入结束,{}",newbatchJhiUserData.size());

            for (JhiUser jhiUser:newbatchJhiUserData){
                JhiUserAuthority jhiUserAuthority = new JhiUserAuthority();
                jhiUserAuthority.setUserId(jhiUser.getId());
                jhiUserAuthority.setAuthorityName("ROLE_USER");
                batchJhiUserAuthorityData.add(jhiUserAuthority);
            }
            logger.info("jhiUserAuthority表插入");
            batchService.batchInsert(batchJhiUserAuthorityData);
            logger.info("jhiUserAuthority表插入,{}",batchJhiUserAuthorityData.size());
        }
    }



    public JSONObject getInsertOrUpdateStudent(int i,String accessToken,String time,String type,String useridStr, String batchNumber) {
        int size = 500;
        if("create".equals(type)){
            size = 1000;
        }

        long startTime = System.currentTimeMillis();
        String syncOrgUrl = "https://dems.byd.com:39200/api/out/add/users?token="+accessToken +"&time="+ time +"&type="+type + "&limit=" + size + "&page="+i;
        RestTemplate restTemplate = new RestTemplate();
        logger.info("增量同步铁军请求地址：{}",syncOrgUrl);
        String jsonStr = restTemplate.getForObject(syncOrgUrl,String.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        logger.info("增量同步铁军经管学员接口调用花费时间：{}",duration);

        JSONObject dataJson = JSON.parseObject(jsonStr);
        String code = String.valueOf(dataJson.get("code"));
        if("200".equals(code)){
            JSONArray jsonData = (JSONArray) dataJson.get("data");
            List<SyncTjStudent> students = this.updateStudentData(jsonData,type,useridStr, batchNumber);
            logger.info("-----------处理完毕{}数据，student数量{}----------",type,students.size());
        }else{
            logger.info("------------请求增量接口返回错误{}------------",dataJson);
        }
        return dataJson;
    }

    public void saveStudentInfo(String type,String batchNumber){
        logger.info("======{}数据落库开始======",type);
        long startTime = System.currentTimeMillis();
        List<SyncTjStudent> list = syncTjStudentRepository.findAllByBatchNumber(batchNumber);

        if(list.isEmpty()) {
            logger.info("------------{}数据为空------------",type);
            return;
        }

        List<SysManageCom> sysManageComs = sysManageComRepository.findAllByManageComLikeAndDeleted("A8601%", false);
        Map<String, SysManageCom> manageComMap = sysManageComs.stream().collect(Collectors.toMap(SysManageCom::getOrgId, Function.identity(), (d1, d2) -> d1));

        List<LtBusinessCodeSelect> ltBusinessCodeSelects = ltBusinessCodeSelectRepository.findAllByCodeType(CodeConstants.POSITION_TYPE);
        Map<String, LtBusinessCodeSelect> positionMap = ltBusinessCodeSelects.stream().collect(Collectors.toMap(LtBusinessCodeSelect::getCodeName, Function.identity(), (d1, d2) -> d1));

        List<String> needHandleUserIds = list.stream().map(SyncTjStudent::getUserid).filter(Objects::nonNull).collect(Collectors.toList());
        List<LtStudentInfo> hasStudentInfos1 = ltStudentInfoRepository.findAllByStaffCodeInAndTradeSource(needHandleUserIds, ConstantField.SYNC_TRADE_SOURCE_LW);
        Map<String, LtStudentInfo> studentInfo1Map = hasStudentInfos1.stream()
            .collect(Collectors.toMap(LtStudentInfo::getStaffCode, Function.identity(), (d1, d2) -> d1));
        logger.info("增量同步铁军经管学员落地lt_student_info表开始，总数为{}",list.size());

        //分批处理
        List<List<SyncTjStudent>> partition = Lists.partition(list, 1000);
        for (List<SyncTjStudent> tjStudentList : partition) {
            this.syncUpdateStudentInfo(tjStudentList, manageComMap, studentInfo1Map, positionMap);
        }
        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        logger.info("增量同步铁军经管学员接口调用花费时间：{} ms",duration);
        logger.info("增量同步铁军经管学员落地lt_student_info表结束，总数为{}",list.size());

    }

    private Map<String, SysManageCom> findParentManageComName(List<SysManageCom> manageComs, Map<String, SysManageCom> sysManageMap, Map<String, String> fullNameCache) {
        Map<String, SysManageCom> manageComMap = new HashMap<>();
        for (SysManageCom sysManageCom : manageComs) {
            // 如果缓存中已经有全名，则直接使用
            String fullName = fullNameCache.computeIfAbsent(sysManageCom.getManageCom(), k -> groupManageComName(sysManageCom.getName(), sysManageCom.getUpManageCom(), sysManageMap, fullNameCache));
            manageComMap.put(fullName, sysManageCom);
        }
        return manageComMap;
    }

    private String groupManageComName(String sourceName, String upManageCom, Map<String, SysManageCom> sysManageMap, Map<String, String> fullNameCache) {
        // 检查是否已经缓存了上级组织的全名
        if (ObjectUtil.isNotEmpty(upManageCom) && !fullNameCache.containsKey(upManageCom)) {
            SysManageCom parentCom = sysManageMap.get(upManageCom);
            if (ObjectUtil.isNotNull(parentCom)) {
                // 递归构建上级组织的全名并缓存
                String parentFullName = groupManageComName(parentCom.getName(), parentCom.getUpManageCom(), sysManageMap, fullNameCache);
                fullNameCache.put(upManageCom, parentFullName);
            }
        }
        // 获取上级组织的全名并拼接当前组织名称
        return ObjectUtil.isNotEmpty(upManageCom) ? fullNameCache.get(upManageCom) + "/" + sourceName : sourceName;
    }

    /**
     * 增量处理同步学员数据到ltStudent
     * @param type
     * @param students
     */
    private void syncInsertOrUpdateStudentInfo(String type, List<SyncTjStudent> students,Map<String,SysManageCom> manageComMap,Map<String,JhiUser> jhiUserMap,Map<String,LtStudentInfo> studentInfoMap,Map<String,LtBusinessCodeSelect> jobPositionMap) {
        List<LtStudentInfo> insertData = new ArrayList<>();
        List<LtStudentInfo> updateData = new ArrayList<>();
        List<JhiUser> batchJhiUserData = new ArrayList<>();
        List<JhiUser> newbatchJhiUserData = new ArrayList<>();
        List<JhiUserAuthority> batchJhiUserAuthorityData = new ArrayList<>();
        if ("create".equals(type)){
            for (SyncTjStudent syncStudent:students){
                //临时对象用来加到最后的数据库中
                LtStudentInfo ltStudentInfoNew = new LtStudentInfo();
                if (syncStudent.getMobile().length() > 15){
                    syncStudent.setMobile(null);
                }
                String employDate = syncStudent.getCreatedAt();


                //拷贝到新对象中，防止修改的时候直接修改数据库
                DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                ZoneOffset offset = OffsetDateTime.now().atZoneSameInstant(ZoneId.of("UTC")).getOffset();
                if (employDate != null){
                    LocalDateTime employDateTime = LocalDateTime.parse(employDate,dateTimeFormatter);
                    ltStudentInfoNew.setEmployDate(employDateTime.toInstant(offset));
                }
                ltStudentInfoNew.setTrainCode(syncStudent.getUuid().replace("-",""));
                ltStudentInfoNew.setPhone(syncStudent.getMobile());
                ltStudentInfoNew.setManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?syncStudent.getDepartment():manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom());
                ltStudentInfoNew.setCreatedByManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?syncStudent.getDepartment():manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom());
                ltStudentInfoNew.setCreatedByManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?syncStudent.getDepartment():manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getFullName());
                ltStudentInfoNew.setManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?syncStudent.getDepartment():manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getFullName());
                ltStudentInfoNew.setIdNo(syncStudent.getIdNumber());
                ltStudentInfoNew.setJobPosition(syncStudent.getPost());
                ltStudentInfoNew.setStuFlag("3");
                Pattern pattern = Pattern.compile("\"(.*?)\"");
                Matcher matcher = pattern.matcher(syncStudent.getPartTime());
                StringBuilder result = new StringBuilder();
                while (matcher.find()) {
                    String param = matcher.group(1); // 获取参数数据
                    result.append(param);
                    result.append(",");
                }

                String finalResult = null;
                List<String> results = new ArrayList<>();
                if(ObjectUtil.isNotNull(result) && !("[]".equals(syncStudent.getPartTime()) || "".equals(syncStudent.getPartTime()))){
                    finalResult = result.toString().substring(0, result.length() - 1);
                    results = Arrays.asList(finalResult.split(","));
                }
                ltStudentInfoNew.setPartTimeJobPosition(finalResult);
                ltStudentInfoNew.setJobPositionCode(dealJobCode(syncStudent.getPost(),jobPositionMap));
                String codes = "";
                for (String item:results){
                    int i = results.indexOf(item);
                    if(ObjectUtil.isNotNull(jobPositionMap.get(item))){
                        if(i==0){
                            codes = jobPositionMap.get(item).getCodeValue();
                        }else{
                            codes += "," + jobPositionMap.get(item).getCodeValue();
                        }
                    }
                }
                ltStudentInfoNew.setPartTimeJobPositionCode(codes);
                ltStudentInfoNew.setTradeSource(ConstantField.SYNC_TRADE_SOURCE_LW);
                ltStudentInfoNew.setFaceUrl(syncStudent.getFace());
                ltStudentInfoNew.seteMail(syncStudent.getEmail());
                ltStudentInfoNew.setStaffCode(syncStudent.getUserid());
                ltStudentInfoNew.setName(syncStudent.getName());
                //类型默认为B
                ltStudentInfoNew.setBranchType(ConstantField.BRANCHTYPE_B);

                //招聘为1/EHR为2

                //招聘默认01 todo 修改
                ltStudentInfoNew.setAgentState("在职".equals(syncStudent.getStatus())?"01":"04");
                ltStudentInfoNew.setStatus("在职".equals(syncStudent.getStatus())?"1":"0");


                // company 需要处理
                ltStudentInfoNew.setCompany("byd-group");
//                ltStudentInfoNew.setAgentGrade(syncStudent.getPost());
//                if(manageComMapByOrgId.get(ltStudentInfoNew.getManageCom())!= null){
//                    ltStudentInfoNew.setManageCom(manageComMapByOrgId.get(ltStudentInfoNew.getManageCom()).getManageCom());
//                    ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
//                }
//                if(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom())!= null){
//                    ltStudentInfoNew.setMulManageCom(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom()).getManageCom());
//                }

                LtStudentInfo oldStudent = studentInfoMap.get(ltStudentInfoNew.getStaffCode());
                if(ObjectUtil.isNull(oldStudent)){
                    ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
                    ltStudentInfoNew.setId(null);

                    //拷贝同步表对象
                    insertData.add(ltStudentInfoNew);
                }else if(ObjectUtil.isNotNull(oldStudent) && !"在职".equals(syncStudent.getStatus())){
                    ltStudentInfoNew.setId(oldStudent.getId());
                    ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode().replace("-",""));
                    ltStudentInfoNew.setLastLoginTime(oldStudent.getLastLoginTime());
                    updateData.add(ltStudentInfoNew);
                }

            }
            logger.info(">>>>>>>>>>>>铁军新增人员数量：{}",insertData.size());
            batchService.batchInsert(insertData);
            logger.info(">>>>>>>>>>>>铁军更新人员数量：{}",updateData.size());
            batchService.batchUpdate(updateData);

        }else{
            for(SyncTjStudent item:students){
                LtStudentInfo ltStudentInfo = studentInfoMap.get(item.getUserid());
                if(ObjectUtil.isNull(ltStudentInfo)){
                    ltStudentInfo = new LtStudentInfo();
                    if (item.getMobile().length() > 15){
                        item.setMobile(null);
                    }
                    String employDate = item.getCreatedAt();


                    //拷贝到新对象中，防止修改的时候直接修改数据库
                    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                    ZoneOffset offset = OffsetDateTime.now().atZoneSameInstant(ZoneId.of("UTC")).getOffset();
                    if (employDate != null){
                        LocalDateTime employDateTime = LocalDateTime.parse(employDate,dateTimeFormatter);
                        ltStudentInfo.setEmployDate(employDateTime.toInstant(offset));
                    }
                    ltStudentInfo.setTrainCode(item.getUuid().replace("-",""));
                    ltStudentInfo.setPhone(item.getMobile());
                    ltStudentInfo.setManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                    ltStudentInfo.setCreatedByManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                    ltStudentInfo.setCreatedByManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                    ltStudentInfo.setManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                    ltStudentInfo.setIdNo(item.getIdNumber());
                    ltStudentInfo.setTradeSource(ConstantField.SYNC_TRADE_SOURCE_LW);
                    ltStudentInfo.setFaceUrl(item.getFace());
                    ltStudentInfo.setJobPosition(item.getPost());
                    Pattern pattern = Pattern.compile("\"(.*?)\"");
                    Matcher matcher = pattern.matcher(item.getPartTime());
                    StringBuilder result = new StringBuilder();
                    while (matcher.find()) {
                        String param = matcher.group(1); // 获取参数数据
                        result.append(param);
                        result.append(",");
                    }

                    String finalResult = null;
                    List<String> results = new ArrayList<>();
                    if(ObjectUtil.isNotNull(result) && !("[]".equals(item.getPartTime()) || "".equals(item.getPartTime()))){
                        finalResult = result.toString().substring(0, result.length() - 1);
                        results = Arrays.asList(finalResult.split(","));
                    }
                    ltStudentInfo.setPartTimeJobPosition(finalResult);
                    ltStudentInfo.setJobPositionCode(dealJobCode(item.getPost(),jobPositionMap));
                    String codes = "";
                    for (String res:results){
                        int i = results.indexOf(res);
                        if(ObjectUtil.isNotNull(jobPositionMap.get(res))){
                            if(i==0){
                                codes = jobPositionMap.get(res).getCodeValue();
                            }else{
                                codes += "," + jobPositionMap.get(res).getCodeValue();
                            }
                        }
                    }
                    ltStudentInfo.setPartTimeJobPositionCode(codes);
                    ltStudentInfo.seteMail(item.getEmail());
                    ltStudentInfo.setStaffCode(item.getUserid());
                    ltStudentInfo.setStuFlag("3");
                    ltStudentInfo.setName(item.getName());
                    //类型默认为B
                    ltStudentInfo.setBranchType(ConstantField.BRANCHTYPE_B);

                    //招聘为1/EHR为2

                    //招聘默认01 todo 修改
                    ltStudentInfo.setAgentState("在职".equals(item.getStatus())?"01":"04");
                    ltStudentInfo.setStatus("在职".equals(item.getStatus())?"1":"0");


                    // company 需要处理
                    ltStudentInfo.setCompany("byd-group");
//                    ltStudentInfo.setAgentGrade(item.getPost());
                    ltStudentInfo.setCreatedByManageCom(ltStudentInfo.getManageCom());
                    ltStudentInfo.setId(null);
                    insertData.add(ltStudentInfo);
                }else{
                    ltStudentInfo.setStaffCode(item.getUserid());
                    ltStudentInfo.setName(item.getName());
                    ltStudentInfo.setStatus("在职".equals(item.getStatus())?"1":"0");
                    ltStudentInfo.setManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                    ltStudentInfo.setCreatedByManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                    ltStudentInfo.setCreatedByManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                    ltStudentInfo.setManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                    ltStudentInfo.setCompany("byd-group");
                    ltStudentInfo.setAgentState("在职".equals(item.getStatus())?"01":"04");
                    ltStudentInfo.setPhone(item.getMobile());
                    ltStudentInfo.setJobPosition(item.getPost());
                    Pattern pattern = Pattern.compile("\"(.*?)\"");
                    Matcher matcher = pattern.matcher(item.getPartTime());
                    StringBuilder result = new StringBuilder();
                    while (matcher.find()) {
                        String param = matcher.group(1); // 获取参数数据
                        result.append(param);
                        result.append(",");
                    }

                    String finalResult = null;
                    List<String> results = new ArrayList<>();
                    if(ObjectUtil.isNotNull(result) && !("[]".equals(item.getPartTime()) || "".equals(item.getPartTime()))){
                        finalResult = result.toString().substring(0, result.length() - 1);
                        results = Arrays.asList(finalResult.split(","));
                    }
                    ltStudentInfo.setPartTimeJobPosition(finalResult);
                    ltStudentInfo.setJobPositionCode(dealJobCode(item.getPost(),jobPositionMap));
                    String codes = "";
                    for (String res:results){
                        int i = results.indexOf(res);
                        if(ObjectUtil.isNotNull(jobPositionMap.get(res))){
                            if(i==0){
                                codes = jobPositionMap.get(res).getCodeValue();
                            }else{
                                codes += "," + jobPositionMap.get(res).getCodeValue();
                            }
                        }
                    }

                    ltStudentInfo.setPartTimeJobPositionCode(codes);

                    ltStudentInfo.setIdNo(item.getIdNumber());
                    //sysManageCom.setRemark(item.getFull());
//                    ltStudentInfo.setAgentGrade(item.getPost());
                    updateData.add(ltStudentInfo);


                }

            }
            logger.info(">>>>>>>>>>>>铁军新增人员数量：{}",insertData.size());
            batchService.batchInsert(insertData);
            logger.info(">>>>>>>>>>>>铁军更新人员数量：{}",updateData.size());
            batchService.batchUpdate(updateData);

        }

        if(insertData.size() > 0){
            for (LtStudentInfo ltStudentInfo:insertData){
                if(ObjectUtil.isNull( jhiUserMap.get(ltStudentInfo.getTrainCode()))){
                    String encryptedPassword = ltStudentInfo.getIdNo().length() > 6?ltStudentInfo.getIdNo().substring(ltStudentInfo.getIdNo().length() - 6):"";
                    if (StringUtils.isBlank(encryptedPassword)) {
                        encryptedPassword = AESCBCUtil.decrypt("jMSk65U6UvslALqfb7LeMg==", "SYSTRAINAesEncry");;
                    }
                    String password = passwordEncoder.encode(encryptedPassword);
                    JhiUser jhiUser = new JhiUser();
                    jhiUser.setLogin(ltStudentInfo.getTrainCode());
                    jhiUser.setActivated(true);
                    jhiUser.setCreatedBy("admin");
                    jhiUser.setPasswordHash(password);
                    batchJhiUserData.add(jhiUser);
                }


            }
            logger.info("batchJhiUserData,{}",batchJhiUserData.size());
            batchService.batchInsert(batchJhiUserData);
            List<String> needAddJhiUserLogin = batchJhiUserData.stream().map(JhiUser::getLogin).collect(Collectors.toList());

            logger.info("jhiUser表插入");
            newbatchJhiUserData = jhiUserRepository.findAllByLoginIn(needAddJhiUserLogin);
            logger.info("jhiUser插入结束,{}",newbatchJhiUserData.size());

            for (JhiUser jhiUser:newbatchJhiUserData){
                JhiUserAuthority jhiUserAuthority = new JhiUserAuthority();
                jhiUserAuthority.setUserId(jhiUser.getId());
                jhiUserAuthority.setAuthorityName("ROLE_USER");
                batchJhiUserAuthorityData.add(jhiUserAuthority);
            }
            logger.info("jhiUserAuthority表插入");
            batchService.batchInsert(batchJhiUserAuthorityData);
            logger.info("jhiUserAuthority表插入,{}",batchJhiUserAuthorityData.size());
        }
    }


    /**
     * 增量处理同步学员数据到ltStudent  两网 (新)
     * @param students
     */
    private void syncUpdateStudentInfo(List<SyncTjStudent> students, Map<String, SysManageCom> manageComMap,
                                       Map<String, LtStudentInfo> studentInfoMap, Map<String, LtBusinessCodeSelect> jobPositionMap) {
        if (students.isEmpty()) {
            logger.info("没有数据需要处理");
            return;
        }

        List<LtStudentInfo> insertData = new ArrayList<>();
        List<LtStudentInfo> updateData = new ArrayList<>();

        for (SyncTjStudent item : students) {
            LtStudentInfo ltStudentInfo = studentInfoMap.get(item.getUserid());
            if (ltStudentInfo == null) {
                ltStudentInfo = new LtStudentInfo();
                processStudentData(item, ltStudentInfo, manageComMap, jobPositionMap);
                insertData.add(ltStudentInfo);
            } else {
                updateStudentData(item, ltStudentInfo, manageComMap, jobPositionMap);
                updateData.add(ltStudentInfo);
            }
        }

        //批量写入and更新
        if (!insertData.isEmpty()) {
            logger.info(">>>>>>>>>>>>lt_student_info新增人员数量：{}", insertData.size());
            batchService.batchInsert(insertData);
        }
        if (!updateData.isEmpty()) {
            logger.info(">>>>>>>>>>>>lt_student_info更新人员数量：{}", updateData.size());
            batchService.batchUpdate(updateData);
        }

        if (!insertData.isEmpty()) {
            this.saveJhiUser(insertData);
        }
    }

    private void processStudentData(SyncTjStudent item, LtStudentInfo ltStudentInfo, Map<String, SysManageCom> manageComMap,
                                    Map<String, LtBusinessCodeSelect> jobPositionMap) {
        if (item.getMobile().length() > 15) {
            item.setMobile(null);
        }

        // 设置基本信息
        String employDate = item.getCreatedAt();
        if (employDate != null) {
            ltStudentInfo.setEmployDate(parseEmployDate(employDate));
        }

        ltStudentInfo.setTrainCode(UUID.randomUUID().toString().replaceAll("-", ""));
        ltStudentInfo.setPhone(item.getMobile());
        ltStudentInfo.setIdNo(item.getIdNumber());
        ltStudentInfo.setTradeSource(ConstantField.SYNC_TRADE_SOURCE_LW);
        ltStudentInfo.setFaceUrl(item.getFace());
        ltStudentInfo.setJobPosition(item.getPost());
        ltStudentInfo.setPartTimeJobPosition(parsePartTimeJobs(item.getPartTime()));
        ltStudentInfo.setJobPositionCode(dealJobCode(item.getPost(), jobPositionMap));
        ltStudentInfo.setPartTimeJobPositionCode(parsePartTimeJobCodes(item.getPartTime(), jobPositionMap));
        ltStudentInfo.seteMail(item.getEmail());
        ltStudentInfo.setStaffCode(item.getUserid());
        ltStudentInfo.setStuFlag("3");
        ltStudentInfo.setName(item.getName());
        ltStudentInfo.setBranchType(ConstantField.BRANCHTYPE_B);
        ltStudentInfo.setAgentState("在职".equals(item.getStatus()) ? "01" : "04");
        ltStudentInfo.setStatus("在职".equals(item.getStatus()) ? "1" : "0");
        ltStudentInfo.setCompany("byd-group");
        ltStudentInfo.setId(null);

        // 处理组织结构信息
        setManageComInfo(ltStudentInfo, item, manageComMap);
    }

    private void updateStudentData(SyncTjStudent item, LtStudentInfo ltStudentInfo, Map<String, SysManageCom> manageComMap,
                                   Map<String, LtBusinessCodeSelect> jobPositionMap) {

        String employDate = item.getCreatedAt();
        if (employDate != null) {
            ltStudentInfo.setEmployDate(parseEmployDate(employDate));
        }
        ltStudentInfo.seteMail(item.getEmail());
        ltStudentInfo.setFaceUrl(item.getFace());
        ltStudentInfo.setStaffCode(item.getUserid());
        ltStudentInfo.setName(item.getName());
        ltStudentInfo.setAgentState("已离职".equals(item.getStatus()) ? "04" : "01");
        ltStudentInfo.setStatus("在职".equals(item.getStatus()) ? "1" : "0");
        ltStudentInfo.setPhone(item.getMobile());
        ltStudentInfo.setJobPosition(item.getPost());
        ltStudentInfo.setPartTimeJobPosition(parsePartTimeJobs(item.getPartTime()));
        ltStudentInfo.setJobPositionCode(dealJobCode(item.getPost(), jobPositionMap));
        ltStudentInfo.setPartTimeJobPositionCode(parsePartTimeJobCodes(item.getPartTime(), jobPositionMap));
        ltStudentInfo.setIdNo(item.getIdNumber());

        // 更新组织结构信息
        setManageComInfo(ltStudentInfo, item, manageComMap);
    }

    private void setManageComInfo(LtStudentInfo ltStudentInfo, SyncTjStudent item, Map<String, SysManageCom> manageComMap) {
        SysManageCom manageCom = manageComMap.get(String.valueOf(item.getDepartmentId()));
        String manageComName = (manageCom == null) ? item.getDepartment() : manageCom.getFullName();
        String manageComCode = (manageCom == null) ? item.getDepartment() : manageCom.getManageCom();

        ltStudentInfo.setManageCom(manageComCode);
        ltStudentInfo.setManageComName(manageComName);
        ltStudentInfo.setCreatedByManageCom(manageComCode);
        ltStudentInfo.setCreatedByManageComName(manageComName);
    }

    private String parsePartTimeJobs(String partTimeJson) {
        // 解析兼职信息
        Pattern pattern = Pattern.compile("\"(.*?)\"");
        Matcher matcher = pattern.matcher(partTimeJson);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            result.append(matcher.group(1)).append(",");
        }
        return result.length() > 0 ? result.substring(0, result.length() - 1) : null;
    }

    private String parsePartTimeJobCodes(String partTimeJson, Map<String, LtBusinessCodeSelect> jobPositionMap) {
        String parsePartTimeJobs = parsePartTimeJobs(partTimeJson);
        if(parsePartTimeJobs == null ){
            return null;
        }
        // 解析兼职职位代码
        List<String> results = Arrays.asList(parsePartTimeJobs.split(","));
        StringBuilder codes = new StringBuilder();
        for (int i = 0; i < results.size(); i++) {
            LtBusinessCodeSelect jobPosition = jobPositionMap.get(results.get(i));
            if (jobPosition != null) {
                if (i > 0) codes.append(",");
                codes.append(jobPosition.getCodeValue());
            }
        }
        return codes.toString();
    }

    private Instant parseEmployDate(String employDate) {
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        ZoneOffset offset = OffsetDateTime.now().atZoneSameInstant(ZoneId.of("UTC")).getOffset();
        LocalDateTime employDateTime = LocalDateTime.parse(employDate, dateTimeFormatter);
        return employDateTime.toInstant(offset);
    }


    /**
     * @param insertData
     */
    private void saveJhiUser(List<LtStudentInfo> insertData) {
        List<JhiUser> batchJhiUserData = new ArrayList<>();
        List<JhiUser> newBatchJhiUserData = new ArrayList<>();
        List<JhiUserAuthority> batchJhiUserAuthorityData = new ArrayList<>();

        for (LtStudentInfo ltStudentInfo : insertData){
            String encryptedPassword = ltStudentInfo.getIdNo().length() > 6?ltStudentInfo.getIdNo().substring(ltStudentInfo.getIdNo().length() - 6):"";
            if (StringUtils.isBlank(encryptedPassword)) {
                encryptedPassword = AESCBCUtil.decrypt("jMSk65U6UvslALqfb7LeMg==", "SYSTRAINAesEncry");;
            }
            String password = passwordEncoder.encode(encryptedPassword);
            JhiUser jhiUser = new JhiUser();
            jhiUser.setLogin(ltStudentInfo.getTrainCode());
            jhiUser.setActivated(true);
            jhiUser.setCreatedBy("admin");
            jhiUser.setPasswordHash(password);
            batchJhiUserData.add(jhiUser);
        }

        batchService.batchInsert(batchJhiUserData);
        logger.info("jhiUser表插入结束,总数为{}",batchJhiUserData.size());
        List<String> needAddJhiUserLogin = batchJhiUserData.stream().map(JhiUser::getLogin).collect(Collectors.toList());
        newBatchJhiUserData = jhiUserRepository.findAllByLoginIn(needAddJhiUserLogin);

        for (JhiUser jhiUser : newBatchJhiUserData){
            JhiUserAuthority jhiUserAuthority = new JhiUserAuthority();
            jhiUserAuthority.setUserId(jhiUser.getId());
            jhiUserAuthority.setAuthorityName("ROLE_USER");
            batchJhiUserAuthorityData.add(jhiUserAuthority);
        }
        batchService.batchInsert(batchJhiUserAuthorityData);
        logger.info("jhiUserAuthority表插入,总数为{}",batchJhiUserAuthorityData.size());
    }


    private List<SyncTjStudent> updateSyncStudentInfo(List<SyncTjStudent> upSyncTjStudents,Map<String,SysManageCom> manageComMap) {
        List<SyncTjStudent> others = new ArrayList<>();
        List<LtBusinessCodeSelect> ltBusinessCodeSelects = ltBusinessCodeSelectRepository.findAllByCodeType("jobposition");
        Map<String,LtBusinessCodeSelect> jobPositionMap = ltBusinessCodeSelects.stream().collect(Collectors.toMap(LtBusinessCodeSelect::getCodeName,Function.identity(),(d1,d2)->d1));
        List<LtStudentInfo> updateStudents = new ArrayList<>();
        for (SyncTjStudent item:upSyncTjStudents){
            LtStudentInfo ltStudentInfo =ltStudentInfoRepository.findTopByStaffCodeAndIdNoAndDeletedOrderByEmployDateDesc(item.getUserid(),item.getIdNumber(),false);
            if(ObjectUtil.isNotNull(ltStudentInfo)) {
                ltStudentInfo.setStaffCode(item.getUserid());
                ltStudentInfo.setName(item.getName());
                ltStudentInfo.setStatus("在职".equals(item.getStatus())?"1":"0");
                ltStudentInfo.setManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                ltStudentInfo.setCreatedByManageCom(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getManageCom());
                ltStudentInfo.setCreatedByManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                ltStudentInfo.setManageComName(ObjectUtil.isNull(manageComMap.get(String.valueOf(item.getDepartmentId())))?item.getDepartment():manageComMap.get(String.valueOf(item.getDepartmentId())).getFullName());
                ltStudentInfo.setCompany("byd-group");
                ltStudentInfo.setAgentState("在职".equals(item.getStatus())?"01":"04");
                ltStudentInfo.setPhone(item.getMobile());
                ltStudentInfo.setJobPosition(item.getPost());
                Pattern pattern = Pattern.compile("\"(.*?)\"");
                Matcher matcher = pattern.matcher(item.getPartTime());
                StringBuilder result = new StringBuilder();
                while (matcher.find()) {
                    String param = matcher.group(1); // 获取参数数据
                    result.append(param);
                    result.append(",");
                }

                String finalResult = null;
                List<String> results = new ArrayList<>();
                if(ObjectUtil.isNotNull(result) && !("[]".equals(item.getPartTime()) || "".equals(item.getPartTime()))){
                    finalResult = result.toString().substring(0, result.length() - 1);
                    results = Arrays.asList(finalResult.split(","));
                }
                ltStudentInfo.setPartTimeJobPosition(finalResult);
                ltStudentInfo.setJobPositionCode(dealJobCode(item.getPost(),jobPositionMap));
                String codes = "";
                for (String res:results){
                    int i = results.indexOf(res);
                    if(ObjectUtil.isNotNull(jobPositionMap.get(res))){
                        if(i==0){
                            codes = jobPositionMap.get(res).getCodeValue();
                        }else{
                            codes += "," + jobPositionMap.get(res).getCodeValue();
                        }
                    }
                }
                ltStudentInfo.setPartTimeJobPositionCode(codes);

                ltStudentInfo.setIdNo(item.getIdNumber());
                updateStudents.add(ltStudentInfo);
            }else{
                others.add(item);
            }


        }
        logger.info("syncTjStudent存在,同时ltStudentInfo也存在的学员，需要更新数：{}",updateStudents.size());
        batchService.batchUpdate(updateStudents);
        logger.info("syncTjStudent存在,同时ltStudentInfo也存在的学员；更新结束");

        logger.info("syncTjStudent存在,但ltStudentInfo不存在的学员，数量：{}",others.size());

        return others;
    }


    public String dealJobCode(String postname,Map<String,LtBusinessCodeSelect> jobPositionMap){
        if(postname == null || "".equals(postname)){
            return null;
        }
        LtBusinessCodeSelect codeSelect = jobPositionMap.get(postname);
        return codeSelect == null?null:codeSelect.getCodeValue();
    }


    /**
     * 增量处理新增、更新、删除学员
     * @param jsonData
     * @param type
     * @return
     */
    private List<SyncTjStudent> updateStudentData(JSONArray jsonData, String type,String useridStr, String batchNumber) {
        logger.info("开始处理{}数据,数量{}",type,jsonData.size());
        List<SyncTjStudent> updateStudents = new ArrayList<>();
        List<SyncTjStudent> insertStudents = new ArrayList<>();
        List<String> staffCodes = new ArrayList<>();
        if (ObjectUtil.isNotNull(useridStr)){
            staffCodes = Arrays.asList(useridStr.split(";"));
        }

        List<String> uuids = jsonData.stream()
            .map(jsonObj -> ((JSONObject) jsonObj).getString("uuid"))
            .filter(ObjectUtil::isNotEmpty)  // 过滤掉空的 UUID
            .collect(Collectors.toList());

        // 批量查询已有的学生数据
        Map<String, SyncTjStudent> existingStudentsMap = syncTjStudentRepository.findAllByUuidIn(uuids)
            .stream()
            .collect(Collectors.toMap(
                student -> student.getUserid() + "_" + student.getUuid(),
                Function.identity(),
                (existing, replacement) -> existing
            ));


        for (int i = 0; i < jsonData.size(); i++){
            JSONObject jsonObject = jsonData.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            SyncTjStudent syncTjStudent = BeanUtil.mapToBean(map, SyncTjStudent.class, true);
            syncTjStudent.setId(null);
            syncTjStudent.setCompany("byd-group");
            syncTjStudent.setBatchNumber(batchNumber);

            // 检查 UUID 是否为空，如果为空则跳过查询并作为新增数据处理
            String uuid = syncTjStudent.getUuid();
            // 检查 userId 是否为空，如果为空则跳过查询并作为新增数据处理
            String userId = syncTjStudent.getUserid();
            SyncTjStudent oldStudent = ObjectUtil.isNotEmpty(userId) && ObjectUtil.isNotEmpty(uuid) ? existingStudentsMap.get(userId + "_" + uuid) : null;

            if (ObjectUtil.isNull(useridStr)) {
                // 处理无用户 ID 的情况
                handleStudentData(updateStudents, insertStudents, syncTjStudent, oldStudent, "job");
            } else if (ObjectUtil.isNotNull(useridStr) && staffCodes.contains(syncTjStudent.getUserid())) {
                // 处理有用户 ID 的情况
                handleStudentData(updateStudents, insertStudents, syncTjStudent, oldStudent, "job");
            }
        }
        updateStudents = removeOnJob(updateStudents);
        insertStudents = removeOnJob(insertStudents);
        batchService.batchUpdate(updateStudents);
        logger.info("铁军同步类型{}，更新数量{}", type, updateStudents.size());
        batchService.batchInsert(insertStudents);
        logger.info("铁军同步类型{}，新增数量{}", type, insertStudents.size());
        updateStudents.addAll(insertStudents);

        return updateStudents;
    }

    private void handleStudentData(List<SyncTjStudent> updateStudents, List<SyncTjStudent> insertStudents,
                                   SyncTjStudent syncTjStudent, SyncTjStudent oldStudent, String jobName) {
        if (ObjectUtil.isNotNull(oldStudent)) {
            // 更新已有学生数据
            syncTjStudent.setId(oldStudent.getId());
            syncTjStudent.setCreatedBy(oldStudent.getCreatedBy());
            syncTjStudent.setCreatedByManageCom(oldStudent.getCreatedByManageCom());
            syncTjStudent.setCreatedByName(oldStudent.getCreatedByName());
            syncTjStudent.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
            syncTjStudent.setCreatedDate(oldStudent.getCreatedDate());
            syncTjStudent.setLastModifiedBy(jobName);
            syncTjStudent.setLastModifiedDate(PubFun.getCurrentDate());
            syncTjStudent.setDeleted(oldStudent.getDeleted());
            updateStudents.add(syncTjStudent);
        } else {
            syncTjStudent.setCreatedBy(jobName);
            syncTjStudent.setCreatedByName(jobName);
            syncTjStudent.setCreatedByStaffCode(jobName);
            syncTjStudent.setCreatedDate(PubFun.getCurrentDate());
            syncTjStudent.setDeleted(false);
            syncTjStudent.setLastModifiedBy(jobName);
            syncTjStudent.setLastModifiedDate(PubFun.getCurrentDate());
            insertStudents.add(syncTjStudent);
        }
    }

    public void handSyncInsertAndUpdateOrg(String dateString) {
        logger.info(">>>>>>>>>>>>>>>>手动执行新增机构开始");
        syncInsertAndUpdateOrg("create",dateString);
        logger.info(">>>>>>>>>>>>>>>>手动执行新增机构结束");

        logger.info(">>>>>>>>>>>>>>>>手动执行修改机构开始");
        syncInsertAndUpdateOrg("update",dateString);
        logger.info(">>>>>>>>>>>>>>>>手动执行修改机构开始");

        logger.info(">>>>>>>>>>>>>>>>手动执行删除机构结束");
        syncInsertAndUpdateOrg("delete",dateString);
        logger.info(">>>>>>>>>>>>>>>>手动执行删除机构结束");


    }


    public void handInsertOrUpdateStudentInfoByDate(String dateString) {
        List<String> datelist = Arrays.asList(dateString.split(","));
        if (datelist.size() == 2){
            String startDateStr = datelist.get(0);
            String endDateStr = datelist.get(1);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(startDateStr, formatter);
            LocalDate endDate = LocalDate.parse(endDateStr, formatter);

            List<String> dateList = new ArrayList<>();
            LocalDate currentDate = startDate;

            while (!currentDate.isAfter(endDate)) {
                dateList.add(currentDate.format(formatter));
                currentDate = currentDate.plusDays(1);
            }
            List<SysManageCom> sysManageComs = sysManageComRepository.findAllByManageComNotInAndDeleted(new String[]{"A86", "A8601"},false);
            Map<String,SysManageCom> sysManageMap = sysManageComs.stream().collect(Collectors.toMap(SysManageCom::getManageCom, Function.identity(), (d1, d2) -> d1));
            Map<String,SysManageCom> manageComMap = findParentManageComName(sysManageComs,sysManageMap);
            List<JhiUser> jhiUsers = jhiUserRepository.findAll();
            Map<String,JhiUser> jhiUserMap = jhiUsers.stream().collect(Collectors.toMap(JhiUser::getLogin, Function.identity(), (d1, d2) -> d1));
            List<LtBusinessCodeSelect> ltBusinessCodeSelects = ltBusinessCodeSelectRepository.findAllByCodeType("jobposition");
            Map<String,LtBusinessCodeSelect> positionMap = ltBusinessCodeSelects.stream().collect(Collectors.toMap(LtBusinessCodeSelect::getCodeName,Function.identity(),(d1,d2)->d1));

            for (String date : dateList) {
                Instant timeStart = PubFun.stringToInstant(date, "00:00:00");
                Instant timeEnd = PubFun.stringToInstant(date, "23:59:59");
                logger.info("开始处理：{}",date);

                logger.info("+++++开始处理新增数据++++");
                List<SyncTjStudent> createSyncTjStudents = syncTjStudentRepository.findAllByCreatedDateBetweenOrderByCreatedDateByCreate(timeStart,timeEnd);
                logger.info("需要处理新增学员信息数量：{}",createSyncTjStudents.size());
                List<String> createUserids = createSyncTjStudents.stream().map(item->item.getUserid()).collect(Collectors.toList());
                List<LtStudentInfo> hasStudentInfos1 = ltStudentInfoRepository.findAllByStaffCodeInOrderByCreatedDate(createUserids);
                Map<String,LtStudentInfo> studentInfo1Map = hasStudentInfos1.stream()
                    .collect(Collectors.toMap(LtStudentInfo::getStaffCode, Function.identity() , (d1, d2) -> d1));
                if(createSyncTjStudents.size() > 0){
                    this.syncInsertOrUpdateStudentInfo("create",createSyncTjStudents,manageComMap,jhiUserMap,studentInfo1Map,positionMap);

                }
                logger.info("+++++结束处理新增数据++++");

                logger.info("+++++开始处理更新数据++++");
                List<SyncTjStudent> updateSyncTjStudents = syncTjStudentRepository.findAllByCreatedDateBetweenOrderByCreatedDateByUpdate(timeStart,timeEnd);
                logger.info("需要处理更新学员信息数量：{}",updateSyncTjStudents.size());
                List<String> updateUserids = updateSyncTjStudents.stream().map(item->item.getUserid()).collect(Collectors.toList());
                List<LtStudentInfo> hasStudentInfos2 = ltStudentInfoRepository.findAllByStaffCodeInOrderByCreatedDate(updateUserids);
                Map<String,LtStudentInfo> updateStudentInfoMap = hasStudentInfos2.stream()
                    .collect(Collectors.toMap(LtStudentInfo::getStaffCode, Function.identity() , (d1, d2) -> d1));
                if(updateSyncTjStudents.size() > 0){
                    this.syncInsertOrUpdateStudentInfo("update",updateSyncTjStudents,manageComMap,jhiUserMap,updateStudentInfoMap,positionMap);
                }
                logger.info("+++++结束处理更新数据++++");


            }
        }

    }

    public JSONObject getJSONArrayJobPosition() {
        String key = "TJ_JINGGUAN_";
        String accessToken = null;
        int pageSize = 1500;
        String startTime = "2000-01-01";
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH,0);
        cal = Calendar.getInstance();
        String endTime = sdf.format(cal.getTime());
        if(redisUtil.hHasKey(key,"accessToken")){
            accessToken = (String) redisUtil.hget(key,"accessToken");
        }
        String otherUrl = "https://dems.byd.com:39200/api/out/posts/complete?token="+accessToken +"&start_time="+ startTime +"&end_time="+ endTime +"&limit="+pageSize;
        RestTemplate restTemplate = new RestTemplate();
        String jsonStr = restTemplate.getForObject(otherUrl,String.class);
        logger.info("jsonStr:{}",jsonStr);
        JSONObject dataJson = JSON.parseObject(jsonStr);
        return dataJson;

    }

    public void syncJingGuanJobPosition(JSONArray fData) {

        if (ObjectUtil.isNull(fData)){
            logger.info("======当前token失效======");
            this.syncJingGuanGetToken(null);
            logger.info("======token已生成，重新获取数据");

            JSONObject otherDataJson = this.getJSONArrayJobPosition();
            fData = (JSONArray) otherDataJson.get("data");
            logger.info("datas:{}",fData.size());
        }
        List<LtBusinessCodeSelect> insertList = new ArrayList<>();
        ltBusinessCodeSelectRepository.deleteByType("jobposition");
        for (int i = 0; i < fData.size(); i++){
            JSONObject jsonObject = fData.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            LtBusinessCodeSelect ltBusinessCodeSelect = new LtBusinessCodeSelect();
            ltBusinessCodeSelect.setCodeType("jobposition");
            ltBusinessCodeSelect.setParentCodeValue(String.valueOf((Integer) map.get("parent_id")));
            ltBusinessCodeSelect.setCodeName((String) map.get("title"));
            ltBusinessCodeSelect.setCodeValue(String.valueOf((Integer) map.get("post_id")));
            ltBusinessCodeSelect.setParam1("tj");
            ltBusinessCodeSelect.setCompany("byd-group");
            ltBusinessCodeSelect.setStatus("1");
            ltBusinessCodeSelect.setCreatedBy("tj");
            ltBusinessCodeSelect.setCreatedDate(Instant.now());
            ltBusinessCodeSelect.setLastModifiedBy("tj");
            ltBusinessCodeSelect.setLastModifiedDate(Instant.now());

            insertList.add(ltBusinessCodeSelect);
        }

        logger.info(">>>>>>>>>>>>铁军新增岗位数量：{}",insertList.size());
        batchService.batchInsert(insertList);


        redisUtil.hdel("byd-group_TMS_BUSINESS_CODE_TYPE", "jobposition");

        logger.info("++++++++++++++岗位信息同步结束++++++++++++++ ");

    }

    public void syncJingGuanJobPositionCode(List<LtStudentInfo> ltStudentInfoNext, Map<String, LtBusinessCodeSelect> paramMap) {

        logger.info("开始处理学员岗位，{}",ltStudentInfoNext.size());
        List<LtStudentInfo> updateLists = new ArrayList<>();
        for (LtStudentInfo ltStudentInfo:ltStudentInfoNext){
            List<String> results  = new ArrayList<>();
            if(ObjectUtil.isNotNull(ltStudentInfo.getPartTimeJobPosition())){
                results = Arrays.asList(ltStudentInfo.getPartTimeJobPosition().split(","));
            }
            ltStudentInfo.setJobPositionCode(dealJobCode(ltStudentInfo.getJobPosition(),paramMap));
            String codes = "";
            for (String item:results){
                int i = results.indexOf(item);
                if(ObjectUtil.isNotNull(paramMap.get(item))){
                    if(i==0){
                        codes = paramMap.get(item).getCodeValue();
                    }else{
                        codes += "," + paramMap.get(item).getCodeValue();
                    }
                }
            }
            ltStudentInfo.setPartTimeJobPositionCode(codes);
            updateLists.add(ltStudentInfo);
        }

        batchService.batchUpdate(updateLists);
        logger.info("处理学员岗位结束");

    }

    public NError syncJingGuanDepartment() {
        NError nError = new NError();

        try{
            List<LtStudentInfo> infos = new ArrayList<>();
            List<Map<String,String>> studentInfoMaps = syncTjStudentRepository.handleTjStudentDepartment();
            logger.info("studentInfoMaps,{}",studentInfoMaps.size());
            List<Map<String, String>> filteredStudentInfoMaps = studentInfoMaps.stream()
                .filter(map -> map.get("fullName") != null && !map.get("fullName").isEmpty() && map.get("manageCom") != null && !map.get("manageCom").isEmpty())
                .collect(Collectors.toList());
            logger.info("filteredStudentInfoMaps,{}",filteredStudentInfoMaps.size());

            Map<String, String> trainCodeToDepartmentMap = filteredStudentInfoMaps.stream()
                .collect(Collectors.toMap(
                    map -> map.get("trainCode"),
                    map -> map.get("department"),
                    (t1,t2) -> t2
                ));

            Map<String, String> manageComByFullNameMap = filteredStudentInfoMaps.stream()
                .collect(Collectors.toMap(
                    map -> map.get("department"),
                    map -> map.get("manageCom"),
                    (t1,t2) -> t2
                ));

            List<LtStudentInfo> noDepartmentStudents = ltStudentInfoRepository.findAllByNoDepartment();
            logger.info("=============机构不对的学员数量:{}=============",noDepartmentStudents.size());

            for (LtStudentInfo ltStudentInfo:noDepartmentStudents){
                if (ObjectUtil.isNotNull(trainCodeToDepartmentMap.get(ltStudentInfo.getTrainCode()))){
                    String department = trainCodeToDepartmentMap.get(ltStudentInfo.getTrainCode());
                    ltStudentInfo.setManageCom(ObjectUtil.isNull(manageComByFullNameMap.get(department))?ltStudentInfo.getManageCom():manageComByFullNameMap.get(department));
                    ltStudentInfo.setManageComName(department);
                    infos.add(ltStudentInfo);

                }
            }


            logger.info("=============需要更新机构的学员数量:{}=============",infos.size());
            batchService.batchUpdate(infos);
            logger.info("=============更新完毕！=============");

            nError.setCode(ConstantField.SUCCESS_CODE);
            nError.setCode(NError.SUCCESS);
        }catch (Exception e){
            nError.setCode(ConstantField.ERROR_CODE);
            nError.setCode(NError.SYS_ERROR);
            e.printStackTrace();
        } finally {
            logger.info("修复学员存在错误机构程序已执行");
        }
        return nError;
    }


    public NError syncStudentAll(int page) {
        NError nError = new NError();

        try{
            logger.info("======开始获取第{}页数据======",page);
            JSONObject fDataJson = this.getJSONArrayStudent(page);
            JSONArray fData = (JSONArray) fDataJson.get("data");
            int countPage = fDataJson.getInteger("countPage");
            logger.info("======总共{}页数据======",countPage);
            this.insterSyncStudentDataAll(fData,page);

            page = page + 1;
            for(int i = 0;page <= countPage ;i++){
                logger.info("======开始获取第{}/{}页数据======",page,countPage);
                JSONObject otherDataJson = this.getJSONArrayStudent(page);
                JSONArray otherData = (JSONArray) otherDataJson.get("data");
                if (ObjectUtil.isNull(otherData)){
                    logger.debug("======当前token失效======");
                    this.syncJingGuanGetToken(null);
                    logger.debug("======token已生成，重新获取当前"+ page +"页数据======");

                    JSONObject otherDataJson1 = this.getJSONArrayStudent(page);
                    otherData = (JSONArray) otherDataJson1.get("data");
                    logger.debug("datas:{}",otherData.size());
                }
                this.insterSyncStudentDataAll(otherData,page);
                page++;
            }
            logger.info("数据落地完毕");
            nError.setCode(ConstantField.SUCCESS_CODE);
            nError.setCode(NError.SUCCESS);
        }catch (Exception e){
            nError.setCode(ConstantField.ERROR_CODE);
            nError.setCode(NError.SYS_ERROR);
            e.printStackTrace();
            logger.info("同步异常：{}",e.getMessage());
        } finally {
            logger.info("修复学员存在错误机构程序已执行");
        }
        return nError;
    }



    public List<SyncTjStudentAll> insterSyncStudentDataAll(JSONArray datas,Integer currentPage){
        logger.info("======开始数据落地");
        if (ObjectUtil.isNull(datas)){
            logger.debug("======当前token失效======");
            this.syncJingGuanGetToken(null);
            logger.debug("======token已生成，重新获取当前{}页数据======",currentPage);

            JSONObject otherDataJson = this.getJSONArrayStudent(currentPage);
            datas = (JSONArray) otherDataJson.get("data");
            logger.debug("datas:{}",datas.size());
        }
//        List<SyncTjStudentAll> allSyncStudent = syncTjStudentAllRepository.findAll();
//        Map<String,SyncTjStudentAll> studentMap = allSyncStudent.stream().collect(Collectors.toMap(item->item.getUuid(),Function.identity(), (t1, t2) -> t1));
        List<SyncTjStudentAll> syncTjStudents = new ArrayList<>();
        for (int i = 0; i < datas.size(); i++){
            JSONObject jsonObject = datas.getJSONObject(i);
            Map<String, Object> map = jsonObject.getInnerMap();
            SyncTjStudentAll syncTjStudent = BeanUtil.mapToBean(map,SyncTjStudentAll.class,true);
            syncTjStudent.setId(null);
            syncTjStudent.setCompany("byd-group");
//            SyncTjStudentAll syncTjStudentAll = studentMap.get(syncTjStudent.getUuid());
            syncTjStudents.add(syncTjStudent);
        }

        batchService.batchInsert(syncTjStudents);
        logger.info("======新增用户数：{}",syncTjStudents.size());
        return syncTjStudents;
    }

    /**
     * 将已在其他品牌在职的数据保存到异常表，新数据不插入到业务表
     * @param syncTjStudentList
     * @return
     */
    private List<SyncTjStudent> removeOnJob(List<SyncTjStudent> syncTjStudentList){
        List<SyncTjStudentLwException> syncTjStudentLwExceptionList = new ArrayList<>();
        List<SyncTjStudent> syncTjStudentRemoveList = new ArrayList<>();
        for (SyncTjStudent syncTjStudent : syncTjStudentList){
            //只对在职人员进行多品牌在职校验
            if (DATA_STATUS_ON_JOB.equals(syncTjStudent.getStatus())){
                //通过身份证号去lt_student_info判断是否在腾势和方程豹有在职品牌
                List<LtStudentInfo> ltStudentInfoList = ltStudentInfoRepository.findLwByIdNo(syncTjStudent.getIdNumber());
                if (!ltStudentInfoList.isEmpty()){
                    for (LtStudentInfo ltStudentInfo : ltStudentInfoList) {
                        //将多品牌在职的信息记录到异常list
                        SyncTjStudentLwException syncTjStudentLwException = getExceptionDTO(syncTjStudent);
                        syncTjStudentLwException.setOldIdent(ltStudentInfo.getTradeSource());
                        syncTjStudentLwException.setOldPost(ltStudentInfo.getJobPosition());
                        syncTjStudentLwException.setOldManageCom(ltStudentInfo.getManageComName());

                        List<SyncTjStudentLwException> syncTjStudentLwExceptionList1 = syncTjStudentLwExceptionRepository.findByIdNo(syncTjStudentLwException.getIdNumber());
                        boolean result = syncTjStudentLwExceptionList1.stream()
                            .noneMatch(syncTjStudentLwException1 -> syncTjStudentLwException.getOldIdent().equals(syncTjStudentLwException1.getOldIdent()));
                        if (result) {
                            syncTjStudentLwExceptionList.add(syncTjStudentLwException);
                        }
                    }
                    syncTjStudentRemoveList.add(syncTjStudent);
                }else {
                    //如果新增数据在student_info表中没有腾势和方程豹的在职数据，删除对应异常表数据
                    syncTjStudentLwExceptionRepository.deleteByIdNumber(syncTjStudent.getIdNumber());
                }
            }
        }
        //统一移除移除数据
        syncTjStudentList.removeAll(syncTjStudentRemoveList);
        //将异常list保存到异常表
        syncTjStudentLwExceptionRepository.saveAll(syncTjStudentLwExceptionList);

        return syncTjStudentList;
    }

    /**
     * 异常数据转换
     * @param syncTjStudent
     * @return
     */
    private SyncTjStudentLwException getExceptionDTO(SyncTjStudent syncTjStudent){
        SyncTjStudentLwException syncTjStudentLwException = new SyncTjStudentLwException();
        syncTjStudentLwException.setUuid(syncTjStudent.getUuid());
        syncTjStudentLwException.setName(syncTjStudent.getName());
        syncTjStudentLwException.setEmail(syncTjStudent.getEmail());
        syncTjStudentLwException.setUserid(syncTjStudent.getUserid());
        syncTjStudentLwException.setMobile(syncTjStudent.getMobile());
        syncTjStudentLwException.setFace(syncTjStudent.getFace());
        syncTjStudentLwException.setStatus(syncTjStudent.getStatus());
        syncTjStudentLwException.setIdNumber(syncTjStudent.getIdNumber());
        syncTjStudentLwException.setEducation(syncTjStudent.getEducation());
        syncTjStudentLwException.setNationality(syncTjStudent.getNationality());
        syncTjStudentLwException.setMarriage(syncTjStudent.getMarriage());
        syncTjStudentLwException.setDepartment(syncTjStudent.getDepartment());
        syncTjStudentLwException.setPost(syncTjStudent.getPost());
        syncTjStudentLwException.setPostId(syncTjStudent.getPostId());
        syncTjStudentLwException.setPartTime(syncTjStudent.getPartTime());
        syncTjStudentLwException.setCreatedAt(syncTjStudent.getCreatedAt());
        syncTjStudentLwException.setBatchNumber(syncTjStudent.getBatchNumber());
        syncTjStudentLwException.setDepartmentId(syncTjStudent.getDepartmentId());
        syncTjStudentLwException.setId(syncTjStudent.getId());
        syncTjStudentLwException.setDeleted(syncTjStudent.getDeleted());
        syncTjStudentLwException.setCompany(syncTjStudent.getCompany());
        syncTjStudentLwException.setCreatedBy(syncTjStudent.getCreatedBy());
        syncTjStudentLwException.setCreatedByStaffCode(syncTjStudent.getCreatedByStaffCode());
        syncTjStudentLwException.setCreatedByName(syncTjStudent.getCreatedByName());
        syncTjStudentLwException.setCreatedByManageCom(syncTjStudent.getCreatedByManageCom());
        syncTjStudentLwException.setCreatedByManageComName(syncTjStudent.getCreatedByManageComName());
        syncTjStudentLwException.setCreatedDate(syncTjStudent.getCreatedDate());
        syncTjStudentLwException.setLastModifiedBy(syncTjStudent.getLastModifiedBy());
        syncTjStudentLwException.setLastModifiedDate(syncTjStudent.getLastModifiedDate());

        return  syncTjStudentLwException;
    }

    /**
     * 将异常表的数据对比lt_student_info，
     * 如果此人在培训平台没有在职信息，将保存的异常的信息正常存入培训平台。
     */
    public void checkException() {
        List<SyncTjStudentLwException> syncTjStudentLwExceptionList = syncTjStudentLwExceptionRepository.findAll();
        List<SyncTjStudent> syncTjStudentList = new ArrayList<>();
        for (SyncTjStudentLwException syncTjStudentLwException : syncTjStudentLwExceptionList){
            List<LtStudentInfo> ltStudentInfoList = ltStudentInfoRepository.findByIdNo(syncTjStudentLwException.getIdNumber());
            boolean onJob = false;
            for (LtStudentInfo ltStudentInfo : ltStudentInfoList){
                if (ltStudentInfo.getAgentState().equals(STRING_ZERO_ONE)) {
                    onJob = true;
                    break;
                }
            }
            if (!onJob){
                SyncTjStudent syncTjStudent = exceptionInsertSyncTjStudent(syncTjStudentLwException);
                boolean exist = syncTjStudentList.stream()
                    .anyMatch(exciting -> exciting.getIdNumber().equals(syncTjStudent.getIdNumber()));
                if (!exist){
                    syncTjStudentList.add(syncTjStudent);
                }
                syncTjStudentLwExceptionRepository.delete(syncTjStudentLwException);
            }
        }
        //更新修改时间
        try {
            Thread.sleep(2000); // 暂停 2000 毫秒（即 2 秒）
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        String modify = DateUtils.getToday();
        Instant modifyDate = DateUtils.transferShortDateToInstant(modify);
        for (SyncTjStudent syncTjStudent : syncTjStudentList){
            SyncTjStudent topByUuid = syncTjStudentRepository.findTopByUuid(syncTjStudent.getUuid());
            if (topByUuid ==null){
                syncTjStudent.setLastModifiedDate(modifyDate);
                syncTjStudentRepository.save(syncTjStudent);
            }else if (!DATA_STATUS_ON_JOB.equals(topByUuid.getStatus())){
                syncTjStudentRepository.delete(topByUuid);
                syncTjStudent.setLastModifiedDate(modifyDate);
                syncTjStudentRepository.save(syncTjStudent);
            }
        }
    }

    private SyncTjStudent exceptionInsertSyncTjStudent(SyncTjStudentLwException syncTjStudentLwException){
        SyncTjStudent syncTjStudent = new SyncTjStudent();
        syncTjStudent.setUuid(syncTjStudentLwException.getUuid());
        syncTjStudent.setName(syncTjStudentLwException.getName());
        syncTjStudent.setEmail(syncTjStudentLwException.getEmail());
        syncTjStudent.setUserid(syncTjStudentLwException.getUserid());
        syncTjStudent.setMobile(syncTjStudentLwException.getMobile());
        syncTjStudent.setFace(syncTjStudentLwException.getFace());
        syncTjStudent.setStatus(syncTjStudentLwException.getStatus());
        syncTjStudent.setIdNumber(syncTjStudentLwException.getIdNumber());
        syncTjStudent.setEducation(syncTjStudentLwException.getEducation());
        syncTjStudent.setNationality(syncTjStudentLwException.getNationality());
        syncTjStudent.setMarriage(syncTjStudentLwException.getMarriage());
        syncTjStudent.setDepartment(syncTjStudentLwException.getDepartment());
        syncTjStudent.setPost(syncTjStudentLwException.getPost());
        syncTjStudent.setPostId(syncTjStudentLwException.getPostId());
        syncTjStudent.setPartTime(syncTjStudentLwException.getPartTime());
        syncTjStudent.setCreatedAt(syncTjStudentLwException.getCreatedAt());
        syncTjStudent.setBatchNumber(syncTjStudentLwException.getBatchNumber());
        syncTjStudent.setDepartmentId(syncTjStudentLwException.getDepartmentId());
        syncTjStudent.setId(syncTjStudentLwException.getId());
        syncTjStudent.setDeleted(syncTjStudentLwException.getDeleted());
        syncTjStudent.setCompany(syncTjStudentLwException.getCompany());
        syncTjStudent.setCreatedBy(syncTjStudentLwException.getCreatedBy());
        syncTjStudent.setCreatedByStaffCode(syncTjStudentLwException.getCreatedByStaffCode());
        syncTjStudent.setCreatedByName(syncTjStudentLwException.getCreatedByName());
        syncTjStudent.setCreatedByManageCom(syncTjStudentLwException.getCreatedByManageCom());
        syncTjStudent.setCreatedByManageComName(syncTjStudentLwException.getCreatedByManageComName());
        syncTjStudent.setCreatedDate(syncTjStudentLwException.getCreatedDate());
        syncTjStudent.setLastModifiedBy(syncTjStudentLwException.getLastModifiedBy());
        syncTjStudent.setLastModifiedDate(syncTjStudentLwException.getLastModifiedDate());

        return syncTjStudent;
    }


}
