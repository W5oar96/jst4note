package com.sinosoft.ss.service;


import com.sinosoft.cache.UserCache;
import com.sinosoft.domain.LtCourseProgram;
import com.sinosoft.repository.LtCourseProgramOuterEnrollRepository;
import com.sinosoft.service.constants.CodeConstants;
import com.sinosoft.service.dto.LtCourseProgramOuterEnrollDTO;
import com.sinosoft.service.vo.PubRespInfoModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = Exception.class)
public class SsLtCourseProgramOuterEnrollService {
    private final LtCourseProgramOuterEnrollRepository ltCourseProgramOuterEnrollRepository;

    private final UserCache userCache;

    public SsLtCourseProgramOuterEnrollService(LtCourseProgramOuterEnrollRepository ltCourseProgramOuterEnrollRepository, UserCache userCache) {
        this.ltCourseProgramOuterEnrollRepository = ltCourseProgramOuterEnrollRepository;
        this.userCache = userCache;
    }

    public PubRespInfoModel removeStudentFromProgram(Map<String, String> map) {
        // 从 map 中获取 id 列表，以逗号分隔
        String idListStr = map.get("id");
        String programCode = map.get("programCode");
        String company = userCache.getCurrentUserCompany();
        PubRespInfoModel pubRespInfoModel = new PubRespInfoModel();

        List<Long> idList = Arrays.stream(idListStr.split(","))
            .filter(id -> id != null && !id.trim().isEmpty())
            .map(Long::valueOf)
            .collect(Collectors.toList());

        if (idList.isEmpty()) {
            pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
            pubRespInfoModel.setMsg("Invalid or empty id list.");
            return pubRespInfoModel;
        }

        try {
            ltCourseProgramOuterEnrollRepository.deleteByProgramCodeAndIdInAndCompany(programCode, idList, company);

            pubRespInfoModel.setFlg(PubRespInfoModel.FLG_SUCCESS);
            pubRespInfoModel.setMsg("Students removed successfully.");
        } catch (Exception e) {
            pubRespInfoModel.setFlg(PubRespInfoModel.FLG_ERROR);
            pubRespInfoModel.setMsg("Failed to remove students: " + e.getMessage());
        }

        return pubRespInfoModel;
    }
}
