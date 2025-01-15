package com.sinosoft.ss.service;

import com.google.common.collect.Lists;
import com.google.gson.JsonObject;
import com.sinosoft.domain.FileInfo;
import com.sinosoft.domain.LtCourseInfo;
import com.sinosoft.domain.es.CourseInfoEntity;
import com.sinosoft.domain.es.SearchFormData;
import com.sinosoft.domain.es.SearchQuery;
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
     * 批量保存内容到ES
     */

    public PubRespInfoModel saveEntity(long id, String name) {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        CourseInfoEntity newEntity = new CourseInfoEntity(id,name);
        List<CourseInfoEntity> entityList = new ArrayList<>();
        entityList.add(newEntity);

        Bulk.Builder bulk = new Bulk.Builder();
        for(CourseInfoEntity entity : entityList) {
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


package com.sinosoft.domain.es;


import java.io.Serializable;


public class CourseInfoEntity implements Serializable{

    private static final long serialVersionUID = -763638353551774166L;

    public static final String INDEX_NAME = "course";

    public static final String TYPE = "course";

    private Long id;

    private String courseName;


    public CourseInfoEntity() {
        super();
    }

    public CourseInfoEntity(Long id, String courseName) {
        this.id = id;
        this.courseName = courseName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

}
