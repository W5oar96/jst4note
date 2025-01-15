package com.sinosoft.ss.service;

// ... (导入)

@Service
@Transactional(rollbackFor = Exception.class)
public class ElasticsearchService {

    // ... (其他字段)

    private static final String COURSE_INDEX = "course";
    private static final String EXAM_INDEX = "exam";
    private static final String PROGRAM_INDEX = "program";
    private static final String NOTICE_INDEX = "notice";

    private Map<String, Object> convertToCommonEntity(Object entity, String type) {
        // ... (转换逻辑，之前已提供)
    }

    private String getIndexNameByType(String type) {
        // ... (根据类型返回索引名，之前已提供)
    }

    // 新方法名：bulkSaveEntitiesNew
    public PubRespInfoModel bulkSaveEntitiesNew(List<Object> entitiesWithType) {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        if (CollectionUtils.isEmpty(entitiesWithType)) {
            infoModel.setMsg("实体列表为空");
            return infoModel;
        }

        Bulk.Builder bulkBuilder = new Bulk.Builder();
        for (Object entityWithType : entitiesWithType) {
            if (entityWithType instanceof Map){
                Map<String,Object> entityMap = (Map<String, Object>) entityWithType;
                String type = (String) entityMap.get("type");
                String indexName = getIndexNameByType(type);
                if (indexName == null) {
                    log.error("未知的类型：{}",type);
                    continue;
                }
                bulkBuilder.addAction(new Index.Builder(entityMap)
                        .index(indexName)
                        .build());
            }else{
                log.error("实体类型错误：{}",entityWithType.getClass());
            }
        }

        try {
            BulkResult bulkResult = jestClient.execute(bulkBuilder.build());
            if (bulkResult.isSucceeded()) {
                infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
                infoModel.setMsg("批量操作成功");
            } else {
                infoModel.setMsg("批量操作失败：" + bulkResult.getErrorMessage());
                log.error("批量操作失败：{}", bulkResult.getErrorMessage());
                for (BulkResult.BulkResultItem item : bulkResult.getItems()) {
                    if (item.isFailed()) {
                        log.error("单个操作失败：{}", item.error);
                    }
                }
            }
        } catch (IOException e) {
            infoModel.setMsg(e.getMessage());
            log.error(e.getMessage());
        }
        return infoModel;
    }

    // 新方法名：searchNew
    public PubRespInfoModel searchNew(QueryForm queryForm, List<String> types) throws IOException {
        PubRespInfoModel infoModel = new PubRespInfoModel();
        infoModel.setFlg(PubRespInfoModel.FLG_ERROR);

        String[] indexNames = getIndexNamesByTypes(types);
        if (indexNames == null || indexNames.length == 0) {
            indexNames = new String[]{COURSE_INDEX, EXAM_INDEX, PROGRAM_INDEX, NOTICE_INDEX};
        }

        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        BoolQueryBuilder boolQueryBuilder = QueryBuilders.boolQuery();

        //构建查询条件
        for (SearchDTO dto : queryForm.getQueryStringList()) {
            final String field = dto.getField();
            //清除左右空格
            String keyword = dto.getValue().trim();
            //处理特殊字符
            keyword = org.apache.lucene.queryparser.classic.QueryParser.escape(keyword);
            boolQueryBuilder.should(QueryBuilders.queryStringQuery(keyword).field(field).field(field.concat(PINYIN_SUFFIX)));
        }

        searchSourceBuilder.query(boolQueryBuilder);

        //高亮
        HighlightBuilder highlightBuilder = new HighlightBuilder();
        //设置关键字显示颜色
        highlightBuilder.preTags(HIGHLIGHT_PRE_TAGS);
        highlightBuilder.postTags(HIGHLIGHT_POST_TAGS);
        //设置显示的关键字
        for (String field : queryForm.getHighlightFieldList()) {
            highlightBuilder.field(field, 0, 0).field(field.concat(PINYIN_SUFFIX), 0, 0);
        }
        highlightBuilder.requireFieldMatch(false);
        searchSourceBuilder.highlighter(highlightBuilder);

        searchSourceBuilder.from((queryForm.getPageNum() - 1) * queryForm.getPageSize());
        searchSourceBuilder.size(queryForm.getPageSize());

        SearchRequest searchRequest = new SearchRequest(indexNames);
        searchRequest.source(searchSourceBuilder);

        try {
            JestResult result = jestClient.execute(new Search.Builder(searchSourceBuilder.toString()).build());
            if (result.isSucceeded()) {
                List<Map<String, Object>> data = result.getSourceAsObjectList(Map.class);
                //高亮处理
                data = handlerData(data, queryForm.getHighlightFieldList());
                SearchVO vo = new SearchVO();
                final String searchData = queryForm.getQueryStringList().stream().map(i -> i.getValue()).collect(Collectors.joining(","));
                vo.setRecords(data);
                vo.setTotal(Long.valueOf(result.getTotal()));
                vo.setPageNum(queryForm.getPageNum());
                vo.setPageSize(queryForm.getPageSize());
                infoModel.setMsg("搜索 <span class='highlight'>" + searchData + "</span> 找到 " + vo.getTotal() + " 个与之相关的内容");
                infoModel.setData(vo);
                infoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
            } else {
                infoModel.setMsg(result.getErrorMessage());
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

    private List<Map<String, Object>> handlerData(List<Map<String, Object>> data, List<String> fieldList) {
       // ... (高亮处理逻辑，之前已提供)
    }
}
