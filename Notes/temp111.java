package com.sinosoft.ss.service;

import com.google.common.collect.Lists;
import com.google.gson.JsonObject;
import com.sinosoft.domain.FileInfo;
import com.sinosoft.domain.LtCourseInfo;
import com.sinosoft.domain.es.*;
import com.sinosoft.repository.LtCourseInfoRepository;
import com.sinosoft.service.dto.LtCourseInfoDTO;
import com.sinosoft.service.vo.es.QueryForm;
import com.sinosoft.service.vo.es.SearchDTO;
import com.sinosoft.service.vo.es.SearchVO;
import com.sinosoft.ss.vo.PubRespInfoModel;
import com.sinosoft.utils.StringUtils;
import io.searchbox.client.JestClient;
import io.searchbox.client.JestResult;
import io.searchbox.core.*;
import liquibase.pro.packaged.O;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.elasticsearch.action.admin.indices.delete.DeleteIndexRequest;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.support.master.AcknowledgedResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.CreateIndexResponse;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.elasticsearch.common.unit.Fuzziness;
import org.elasticsearch.index.query.*;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightBuilder;
import org.elasticsearch.search.fetch.subphase.highlight.HighlightField;
import org.elasticsearch.search.sort.SortOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


/**
 * Service Implementation for managing {@link FileInfo}.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class ElasticsearchService {

    private final Logger log = LoggerFactory.getLogger(ElasticsearchService.class);

    private static final String HIGHLIGHT_PRE_TAGS = "<span class='highlight'>";

    private static final String HIGHLIGHT_POST_TAGS = "</span>";

    private static final String PINYIN_SUFFIX = ".pinyin";

    private static final String[] FUZZY_FIELD_NAME = {"courseName","courseKeys"};//模糊匹配字段

    private static final String MUST_FIELD_NAME = "courseCode.keyword";//精准匹配字段

    private static final String COURSE_INDEX = "course";
    private static final String EXAM_INDEX = "exam";
    private static final String PROGRAM_INDEX = "program";
    private static final String NOTICE_INDEX = "notice";
    private static final String TYPE_FIELD = "type";

    @Autowired
    private JestClient jestClient;

    @Autowired
    private RestHighLevelClient restHighLevelClient;

    @Autowired
    private LtCourseInfoRepository ltCourseInfoRepository;


    public void createIndex(String indexName) throws IOException {
        //1.创建索引请求
        CreateIndexRequest request = new CreateIndexRequest(indexName);
        //2.客户端执行请求IndicesClient，执行create方法创建索引，请求后获得响应
        CreateIndexResponse response = restHighLevelClient.indices().create(request, RequestOptions.DEFAULT);
        System.out.println(response);
    }

    public PubRespInfoModel dataToEsSync(String indexName) throws IOException {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);
        indexName = CourseInfoEntity.INDEX_NAME;
        if(!existIndex(indexName)){
            //1.创建索引请求
            CreateIndexRequest request = new CreateIndexRequest(indexName);
            //2.客户端执行请求IndicesClient，执行create方法创建索引，请求后获得响应
            CreateIndexResponse response = restHighLevelClient.indices().create(request, RequestOptions.DEFAULT);
        }
        List<LtCourseInfo> all = ltCourseInfoRepository.findAll();

        return saveEntity(all);
    }

    public boolean existIndex(String indexName) throws IOException {
        //1.查询索引请求
        GetIndexRequest request=new GetIndexRequest(indexName);
        //2.执行exists方法判断是否存在
        return restHighLevelClient.indices().exists(request, RequestOptions.DEFAULT);
    }


    public void testDeleteIndex() throws IOException {
        //1.删除索引请求
        DeleteIndexRequest request=new DeleteIndexRequest("ljx666");
        //执行delete方法删除指定索引
        AcknowledgedResponse delete = restHighLevelClient.indices().delete(request, RequestOptions.DEFAULT);
        System.out.println(delete.isAcknowledged());
    }

    /**
     * 实体Entity转换
     */
    private Map<String, Object> convertToCommonEntity(Object entity, String type) {
        Map<String, Object> commonEntity = new HashMap<>();
        commonEntity.put("type", type);

        if (entity instanceof CourseEntity) {
            LtCourseInfo courseInfo = (LtCourseInfo) entity;
            commonEntity.put("code",courseInfo.getCourseCode());
            commonEntity.put("name",courseInfo.getCourseName());
        } else if (entity instanceof ExamEntity) {
            ExamEntity examinfo = (ExamEntity) entity;
            commonEntity.put("code",examinfo.getExamCode());
            commonEntity.put("name",examinfo.getExamName());
        } else if (entity instanceof CourseProgramEntity) {
            CourseProgramEntity courseProgram = (CourseProgramEntity) entity;
            commonEntity.put("code",courseProgram.getProgramCode());
            commonEntity.put("name",courseProgram.getProgramCode());
        }
        return commonEntity;
    }

    private String getIndexNameByType(String type) {
        switch (type) {
            case "course": return COURSE_INDEX;
            case "exam" : return EXAM_INDEX;
            case "program" : return PROGRAM_INDEX;
            case "notice" : return NOTICE_INDEX;
            default: return null;
        }
    }

    /**
     * 保存单个实体
     */

    public PubRespInfoModel saveEntity(Object entity, String type) {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        String indexName = getIndexNameByType(type);
        if (indexName == null) {
            infoModel.setMsg("未知的类型:" + type);
            return infoModel;
        }
        Index index = new Index.Builder(convertToCommonEntity(entity, type)).index(indexName).build();

        try {
            JestResult execute = jestClient.execute(index);
            if (execute.isSucceeded()) {
                log.info("ES 插入完成");
                infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
                infoModel.setMsg("操作成功");
            } else {
                log.error("es 插入失败");
                infoModel.setMsg("操作失败" + execute.getErrorMessage());
            }

        } catch (IOException e) {
            e.printStackTrace();
            infoModel.setMsg(e.getMessage());
            log.error(e.getMessage());
        }
        return infoModel;
    }

    /**
     *批量保存实体
     */

    public PubRespInfoModel bulkSaveEntities(List<?> entities, String type) {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        if (CollectionUtils.isEmpty(entities)) {
            infoModel.setMsg("实体列表为空");
            return infoModel;
        }

        String indexName = getIndexNameByType(type);
        if (indexName == null) {
            infoModel.setMsg("未知的类型：" + type);
            return infoModel;
        }

        Bulk.Builder bulkBuilder = new Bulk.Builder();
        for (Object entity : entities) {
            bulkBuilder.addAction(new Index.Builder(convertToCommonEntity(entity, type))
                .index(indexName)
                .build());
        }

        try {
            BulkResult bulkResult = jestClient.execute(bulkBuilder.build());
            if (bulkResult.isSucceeded()) {
                infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
                infoModel.setMsg("批量操作成功");
            } else {
                infoModel.setMsg("批量操作失败：" + bulkResult.getErrorMessage());
                log.error("批量操作失败：{}", bulkResult.getErrorMessage());
            }
        } catch (IOException e) {
            infoModel.setMsg(e.getMessage());
            log.error(e.getMessage());
        }
        return infoModel;
    }

    public PubRespInfoModel saveEntity(List<LtCourseInfo> entityList) {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        Bulk.Builder bulk = new Bulk.Builder();
        for(LtCourseInfo entity : entityList) {
            Index index = new Index.Builder(entity).index(CourseInfoEntity.INDEX_NAME).type(CourseInfoEntity.TYPE).build();
            bulk.addAction(index);
        }

        try {
            BulkResult execute = jestClient.execute(bulk.build());
            log.info("ES 插入完成");
            infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
            infoModel.setMsg("操作成功");
        } catch (IOException e) {
            e.printStackTrace();
            infoModel.setMsg(e.getMessage());
            log.error(e.getMessage());
        }
        return infoModel;
    }

    /**
     * 在ES中搜索内容
     */
    public PubRespInfoModel searchEntity(HttpServletRequest request, SearchQuery searchQuery){
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        String device = request.getHeader("X-Device");

        // 创建SearchSourceBuilder并设置查询
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();

        BoolQueryBuilder qb = QueryBuilders.boolQuery();

        // 添加模糊查询条件
        MultiMatchQueryBuilder fuzzyQuery = QueryBuilders.multiMatchQuery(searchQuery.getKeywords(), FUZZY_FIELD_NAME)
            .fuzziness(Fuzziness.AUTO);
        qb.must(fuzzyQuery);// 相当于and

        // 环境区分（集团、铁军）  亚太暂时没有这个搜索条件
        if (StringUtils.isBlank(searchQuery.getEnv()) || !"YT".equals(searchQuery.getEnv())) {
            qb.must(QueryBuilders.wildcardQuery("supportService", "*" + device + "*"));
        }

        // 个人受众为精准查询条件
        if(!CollectionUtils.isEmpty(searchQuery.getCodeList())){
            String[] stringArray = searchQuery.getCodeList().toArray(new String[0]);
            TermsQueryBuilder termsQueryBuilder = QueryBuilders.termsQuery(MUST_FIELD_NAME, stringArray);
            qb.must(termsQueryBuilder);
        }

        // company为精准查询条件
        if(StringUtils.isNotBlank(searchQuery.getCompany())){
            TermsQueryBuilder termsQueryBuilder = QueryBuilders.termsQuery("company.keyword", searchQuery.getCompany());
            qb.must(termsQueryBuilder);
        }


        searchSourceBuilder.query(qb);
        searchSourceBuilder.from(searchQuery.getPageNo() * searchQuery.getPageSize());
        searchSourceBuilder.size(searchQuery.getPageSize());
//        qb.mustNot()  // 相当于 and !=
//        qb.should())  // 相当于 or

        //排序  需要在索引创建时或在索引数据之前，为排序的字段添加映射。在映射中，确保指定了要排序字段的类型
//        searchSourceBuilder.sort("publishTime", SortOrder.DESC);

        String searchStr = searchSourceBuilder.toString();
        Search search = new Search.Builder(searchStr).build();

        try {
            JestResult result = jestClient.execute(search);
            List<LtCourseInfoDTO> list = result.getSourceAsObjectList(LtCourseInfoDTO.class);
            infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
            infoModel.setMsg("操作成功");
            infoModel.setData(list);
        } catch (IOException e) {
            log.error(e.getMessage());
            infoModel.setMsg(e.getMessage());
            e.printStackTrace();
        }
        return infoModel;
    }

    public PubRespInfoModel searchNew(QueryForm queryForm, List<String> types) throws IOException {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        String[] indexNames = getIndexNamesByTypes(types);
        if (indexNames == null || indexNames.length == 0) {
            indexNames = new String[]{COURSE_INDEX, EXAM_INDEX, PROGRAM_INDEX, NOTICE_INDEX};
        }

        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        BoolQueryBuilder boolQueryBuilder = QueryBuilders.boolQuery();

        // 构建查询条件 (使用 queryStringQuery，支持多字段匹配和特殊字符处理)
        for (SearchDTO dto : queryForm.getQueryStringList()) {
            final String field = dto.getField();
            String keyword = dto.getValue().trim();
            keyword = org.apache.lucene.queryparser.classic.QueryParser.escape(keyword);
            boolQueryBuilder.should(QueryBuilders.queryStringQuery(keyword).field(field).field(field.concat(PINYIN_SUFFIX)));
        }

        searchSourceBuilder.query(boolQueryBuilder);

        // 高亮设置
        HighlightBuilder highlightBuilder = new HighlightBuilder();
        highlightBuilder.preTags(HIGHLIGHT_PRE_TAGS);
        highlightBuilder.postTags(HIGHLIGHT_POST_TAGS);
        for (String field : queryForm.getHighlightFieldList()) {
            highlightBuilder.field(field, 0, 0).field(field.concat(PINYIN_SUFFIX), 0, 0);
        }
        highlightBuilder.requireFieldMatch(false); // 设置为 false，允许在多个字段中匹配高亮
        searchSourceBuilder.highlighter(highlightBuilder);

        // 分页
        searchSourceBuilder.from((queryForm.getPageNum() - 1) * queryForm.getPageSize());
        searchSourceBuilder.size(queryForm.getPageSize());

        SearchRequest searchRequest = new SearchRequest(indexNames);
        searchRequest.source(searchSourceBuilder);

        try {
            JestResult result = jestClient.execute(new Search.Builder(searchSourceBuilder.toString()).build());
            if (result != null && result.isSucceeded()) { // 空值和成功检查
                List<Map<String, Object>> data = new ArrayList<>();
                List<Map<String, Object>> sourceList = result.getSourceAsObjectList(Map.class);
                if(sourceList != null){
                    data.addAll(sourceList);
                }
                //高亮处理
                data = handlerData(data, queryForm.getHighlightFieldList(),result);
                SearchVO vo = new SearchVO();
                final String searchData = queryForm.getQueryStringList().stream().map(i -> i.getValue()).collect(Collectors.joining(","));
                vo.setRecords(data);
                vo.setTotal(Long.valueOf(result.getTotal()));
                vo.setPageNum(queryForm.getPageNum());
                vo.setPageSize(queryForm.getPageSize());
                infoModel.setMsg("搜索 <span class='highlight'>" + searchData + "</span> 找到 " + vo.getTotal() + " 个与之相关的内容");
                infoModel.setData(vo);
                infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
            } else if (result != null){
                infoModel.setMsg(result.getErrorMessage());
            }else{
                infoModel.setMsg("查询失败");
            }

        } catch (IOException e) {
            log.error(e.getMessage());
            infoModel.setMsg(e.getMessage());
            e.printStackTrace();
        }
        return infoModel;
    }
    private String[] getIndexNamesByTypes(List<String> types) {
        if (CollectionUtils.isEmpty(types)) {
            return null;
        }
        return types.stream().map(this::getIndexNameByType).filter(Objects::nonNull).toArray(String[]::new);
    }

    /**
     * 关键字高亮显示
     * @param queryForm 查询实体类
     * @return
     * @throws IOException
     */
    public PubRespInfoModel search(QueryForm queryForm) throws IOException {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);
        long startTime = System.currentTimeMillis();
        final String[] indexName = queryForm.getIndexNames();
        final List<SearchDTO> orSearchList = queryForm.getOrSearchList();
        final List<SearchDTO> sortFieldList = queryForm.getSortFieldList();
        final List<String> highlightFieldList = queryForm.getHighlightFieldList();
        final List<SearchDTO> queryStringList = queryForm.getQueryStringList();
        final Integer pageNum = queryForm.getPageNum();
        final Integer pageSize = queryForm.getPageSize();
        BoolQueryBuilder boolQueryBuilder = QueryBuilders.boolQuery();
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        //用于搜索文档，聚合，定制查询有关操作
        SearchRequest searchRequest = new SearchRequest();
        searchRequest.indices(indexName);
        //or查询
        BoolQueryBuilder orQuery = QueryBuilders.boolQuery();
        for (SearchDTO dto : orSearchList) {
            orQuery.should(QueryBuilders.termQuery(dto.getField(),dto.getValue()));
        }
        boolQueryBuilder.must(orQuery);

        //分词查询
        BoolQueryBuilder analysisQuery = QueryBuilders.boolQuery();
        for (SearchDTO dto : queryStringList) {
            final String field = dto.getField();
            //清除左右空格
            String keyword = dto.getValue().trim();
            //处理特殊字符
            keyword = QueryParser.escape(keyword);
            analysisQuery.should(QueryBuilders.queryStringQuery(keyword).field(field).field(field.concat(PINYIN_SUFFIX)));
        }
        boolQueryBuilder.must(analysisQuery);

        //高亮显示数据
        HighlightBuilder highlightBuilder = new HighlightBuilder();
        //设置关键字显示颜色
        highlightBuilder.preTags(HIGHLIGHT_PRE_TAGS);
        highlightBuilder.postTags(HIGHLIGHT_POST_TAGS);
        //设置显示的关键字
        for (String field : highlightFieldList) {
            highlightBuilder.field(field, 0, 0).field(field.concat(PINYIN_SUFFIX), 0, 0);
        }
        highlightBuilder.requireFieldMatch(false);
        //分页
        int start = 0;
        int end = 10000;
        if (queryForm.isNeedPage()) {
            start = (pageNum - 1) * pageSize;
            end = pageSize;
        }
        //设置高亮
        searchSourceBuilder.highlighter(highlightBuilder);
        searchSourceBuilder.from(start);
        searchSourceBuilder.size(end);
        //追踪分数开启
        searchSourceBuilder.trackScores(true);
        //注解
        searchSourceBuilder.explain(true);
        //排序
        for (SearchDTO dto : sortFieldList) {
            SortOrder sortOrder;
            final String desc = "desc";
            final String value = dto.getValue();
            final String field = dto.getField();
            if (desc.equalsIgnoreCase(value)) {
                sortOrder = SortOrder.DESC;
            } else {
                sortOrder = SortOrder.ASC;
            }
            searchSourceBuilder.sort(field,sortOrder);
        }
        searchSourceBuilder.query(boolQueryBuilder);
        searchRequest.source(searchSourceBuilder);
        SearchHits hits = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT).getHits();
        List<Map<String,Object>> data = new ArrayList<>();
        for (SearchHit hit : hits){
            Map<String,Object> sourceData = hit.getSourceAsMap();
            Map<String, HighlightField> highlightFields = hit.getHighlightFields();
            for (String key : highlightFields.keySet()){
                sourceData.put(key,highlightFields.get(key).getFragments()[0].string());
            }
            data.add(sourceData);
        }
        long endTime = System.currentTimeMillis();

        SearchVO vo = new SearchVO();
        final String searchData = queryStringList.stream().map(i -> i.getValue()).collect(Collectors.joining(","));
        final List<String> searchFieldList = queryStringList.stream().map(i -> i.getField()).collect(Collectors.toList());
        vo.setRecords(handlerData(data,searchFieldList));
        vo.setTotal(hits.getTotalHits());
        vo.setPageNum(queryForm.getPageNum());
        vo.setPageSize(queryForm.getPageSize());
        infoModel.setMsg("搜索 <span class='highlight'>" + searchData + "</span> 找到 " + vo.getTotal() + " 个与之相关的内容，耗时：" + (endTime - startTime) +"ms");
        //处理数据
        infoModel.setData(vo);
        infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
        return infoModel;
    }

    /**
     * 处理高亮后的数据
     * @param data ES查询结果集
     */
    private List<Map<String,Object>> handlerData(List<Map<String,Object>> data,List<String> fieldList) {
        log.info("查询结果：{}",data);
        if (CollectionUtils.isEmpty(data)) {
            return Lists.newArrayList();
        }
        if (CollectionUtils.isEmpty(fieldList)) {
            return data;
        }
        for (Map<String, Object> map : data) {
            for (String field : fieldList) {
                if (map.containsKey(field.concat(PINYIN_SUFFIX))) {
                    String result1 = map.get(field).toString();
                    String result2 = map.get(field.concat(PINYIN_SUFFIX)).toString();
                    //将同义词合并
                    for (;;) {
                        int start = result1.indexOf(HIGHLIGHT_PRE_TAGS);
                        int end = result1.indexOf(HIGHLIGHT_POST_TAGS);
                        if (start == -1 || end == -1) {
                            break;
                        }
                        String replaceKeyword = result1.substring(start, end).replace(HIGHLIGHT_PRE_TAGS, "");
                        result2 = result2.replaceAll(replaceKeyword, HIGHLIGHT_PRE_TAGS + replaceKeyword + HIGHLIGHT_POST_TAGS);
                        result1 = result1.substring(end + 1);
                    }
                    map.put(field, result2);
                    map.remove(field.concat(PINYIN_SUFFIX));
                }
            }
        }
        return data;
    }
}
