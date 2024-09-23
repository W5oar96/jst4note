SELECT
    a.train_code ,
    b.name  ,
    b.staff_code,
    b.manage_com,
    b.manage_com_name,
    b.agent_state,
    b.mul_auth,
    CASE a.source_from
        WHEN 'course' THEN '课程中心'
        WHEN 'train' THEN '培训班级'
        ELSE '---'
    END as "sourceFrom",
    CASE a.source_from
        WHEN 'course' THEN '--'
        WHEN 'train' THEN a.source_code
        ELSE '---'
    END as "programCode",
    (CASE a.source_from
        WHEN 'course' THEN '--'
        WHEN 'train' THEN (SELECT program_name FROM lt_course_program WHERE program_code = a.source_code)
        ELSE '---'
    END) as "programName",
    a.course_code ,
    c.course_name,
    a.begin_learn_time,
    a.finish_learn_time,
    a.is_finish
FROM
    lt_join_course_report a
    LEFT JOIN lt_student_info b ON a.train_code = b.train_code
    LEFT JOIN lt_course_info c ON a.course_code = c.course_code
    LEFT JOIN lt_course_program_schedule lcps ON lcps.schedule_type = 'online-course' AND a.course_code = lcps.schedule_code AND lcps.deleted = false AND (:#{#studyRecordVO.programCode} IS NOT NULL OR :#{#studyRecordVO.programName} IS NOT NULL)
    LEFT JOIN lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code AND lcpe.train_code = a.train_code AND lcpe.deleted = false AND (:#{#studyRecordVO.programCode} IS NOT NULL OR :#{#studyRecordVO.programName} IS NOT NULL)
    LEFT JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code
WHERE
    b.id IS NOT NULL
    AND c.id IS NOT NULL
    AND (b.branch_type LIKE :branchType)
    AND (b.company = :company)
    AND (:#{#studyRecordVO.trainCode} IS NULL OR a.train_code = :#{#studyRecordVO.trainCode})
    AND ((:#{#studyRecordVO.manageComCondition} IS NULL OR :#{#studyRecordVO.manageComCondition} = 'contains' AND b.manage_com LIKE '%' || :#{#studyRecordVO.manageCom} || '%') OR (:#{#studyRecordVO.manageComCondition} IS NULL OR :#{#studyRecordVO.manageComCondition} = 'equals' AND b.manage_com = :#{#studyRecordVO.manageCom}))
    AND ((:#{#studyRecordVO.mulManageComCondition} IS NULL OR :#{#studyRecordVO.mulManageComCondition} = 'contains' AND b.mul_manage_com LIKE '%' || :#{#studyRecordVO.mulManageCom} || '%') OR (:#{#studyRecordVO.mulManageComCondition} IS NULL OR :#{#studyRecordVO.mulManageComCondition} = 'equals' AND b.mul_manage_com = :#{#studyRecordVO.mulManageCom}))
    AND (:#{#studyRecordVO.workAddress} IS NULL OR b.work_address LIKE :#{#studyRecordVO.workAddress} || '%')
    AND (:#{#studyRecordVO.staffCode} IS NULL OR b.staff_code = :#{#studyRecordVO.staffCode})
    AND (:#{#studyRecordVO.agentState} IS NULL OR b.agent_state = :#{#studyRecordVO.agentState})
    AND (:#{#studyRecordVO.stuFlag} IS NULL OR b.stu_flag = :#{#studyRecordVO.stuFlag})
    AND (:#{#studyRecordVO.programCode} IS NULL OR (lcp.program_code = :#{#studyRecordVO.programCode} AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (:#{#studyRecordVO.programName} IS NULL OR (lcp.program_name LIKE '%' || :#{#studyRecordVO.programName} || '%' AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (:#{#studyRecordVO.sourceFrom} IS NULL OR a.source_from = :#{#studyRecordVO.sourceFrom})
    AND (:#{#studyRecordVO.courseCode} IS NULL OR c.course_code = :#{#studyRecordVO.courseCode})
    AND (:#{#studyRecordVO.courseName} IS NULL OR c.course_name LIKE '%' || :#{#studyRecordVO.courseName} || '%')
    AND (COALESCE(:#{#studyRecordVO.beginLearnTimeStart}, 'null') = 'null' OR a.begin_learn_time >= :#{#studyRecordVO.beginLearnTimeStart})
    AND (COALESCE(:#{#studyRecordVO.beginLearnTimeEnd}, 'null') = 'null' OR a.begin_learn_time <= :#{#studyRecordVO.beginLearnTimeEnd})
    AND (:#{#studyRecordVO.name} IS NULL OR b.name LIKE '%' || :#{#studyRecordVO.name} || '%')
    AND (:#{#studyRecordVO.labelId} IS NULL OR b.label_id LIKE '%' || :#{#studyRecordVO.labelId} || '%');