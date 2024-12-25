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
