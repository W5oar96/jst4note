package com.sinosoft.ss.controller;


import com.sinosoft.service.vo.PubRespInfoModel;
import com.sinosoft.ss.service.SsLtCourseProgramOuterEnrollService;
import io.micrometer.core.annotation.Timed;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Api(tags = "班级外部学员")
@RequestMapping("/api/ss")
public class SsLtCourseProgramOuterEnrollResource {
    private final Logger log = LoggerFactory.getLogger(SsLtCourseProgramOuterEnrollResource.class);

    private static final String ENTITY_NAME = "ltCourseProgramOuterEnroll";

    @Value("${spring.application.name}")
    private String applicationName;

    private final SsLtCourseProgramOuterEnrollService ssLtCourseProgramOuterEnrollService;

    public SsLtCourseProgramOuterEnrollResource(SsLtCourseProgramOuterEnrollService ssLtCourseProgramOuterEnrollService) {
        this.ssLtCourseProgramOuterEnrollService = ssLtCourseProgramOuterEnrollService;
    }


    /**
     * 从班级中移除学员
     */
    @ApiOperation(value = "从班级中移除学员")
    @PostMapping("/lt-course-program-outer-enrolls/remove")
    @Timed
    public ResponseEntity<PubRespInfoModel> removeStudentFromProgram(@RequestBody Map<String, String> map) {
        PubRespInfoModel pubRespInfoModel = ssLtCourseProgramOuterEnrollService.removeStudentFromProgram(map);
        return ResponseEntity.ok()
            .body(pubRespInfoModel);
    }
}
