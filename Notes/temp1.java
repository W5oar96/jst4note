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

private List<Map<String, Object>> handlerData(List<Map<String, Object>> data, List<String> fieldList,JestResult result) {
    if (CollectionUtils.isEmpty(data) || result == null) {
        return new ArrayList<>();
    }
    if (CollectionUtils.isEmpty(fieldList)) {
        return data;
    }
    Map<String, Map<String, List<String>>> highlights = result.getJsonObject().getAsJsonObject("hits").getAsJsonObject("hits").entrySet().stream().collect(Collectors.toMap(
            e -> e.getAsJsonObject().get("_id").getAsString(),
            e -> {
                if (e.getAsJsonObject().has("highlight")) {
                    return e.getAsJsonObject().getAsJsonObject("highlight").entrySet().stream().collect(Collectors.toMap(
                            e1 -> e1.getKey(),
                            e1 -> Arrays.stream(e1.getValue().getAsJsonArray().toString().replace("\"", "").replace("[", "").replace("]", "").split(",")).collect(Collectors.toList())
                    ));
                } else {
                    return new HashMap<>();
                }
            }
    ));
    for (Map<String, Object> map : data) {
        String id = map.get("id").toString();
        Map<String, List<String>> highlight = highlights.get(id);
        if(highlight != null){
            for (String field : fieldList) {
                if (highlight.containsKey(field)) {
                    map.put(field,String.join(",",highlight.get(field)));
                }
            }
        }
    }
    return data;
}
