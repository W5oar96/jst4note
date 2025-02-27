SELECT 
    (SELECT COUNT(*) 
     FROM file_info c, lt_course_chapter d 
     WHERE c.data_cate = 'course' 
       AND c.created_date > '2024-09-01 00:00:00' 
       AND a.train_code = c.developer_code 
       AND c.id = d.file_id) AS "mainDevelopCourseCount",
    (SELECT COUNT(*) 
     FROM file_info c, lt_course_chapter d 
     WHERE c.data_cate = 'course' 
       AND c.created_date > '2024-09-01 00:00:00' 
       AND a.train_code IN (c.minor_developer_code) 
       AND c.id IN (d.file_id)) AS "minDevelopCourseCount",
    (SELECT COUNT(*) 
     FROM file_info c, lt_course_chapter d 
     WHERE c.data_cate = 'case' 
       AND c.created_date > '2024-09-01 00:00:00' 
       AND a.train_code = c.developer_code 
       AND c.id = d.file_id) AS "mainDevelopCaseCount",
    (SELECT COUNT(*) 
     FROM file_info c, lt_course_chapter d 
     WHERE c.data_cate = 'case' 
       AND c.created_date > '2024-09-01 00:00:00' 
       AND a.train_code IN (c.minor_developer_code) 
       AND c.id IN (d.file_id)) AS "minDevelopCaseCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'teach-course' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'teach-course' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "teachCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'develop-course' AND a.point_level = 'BusinessUnit' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'develop-course' AND a.point_level = 'BusinessUnit' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "developCourseBusinessUnitCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'develop-course' AND a.point_level = 'company' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'develop-course' AND a.point_level = 'company' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "developCourseCompanyCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'develop-case' AND a.point_level = 'BusinessUnit' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'develop-case' AND a.point_level = 'BusinessUnit' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "developCaseBusinessUnitCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'develop-case' AND a.point_level = 'company' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'develop-case' AND a.point_level = 'company' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "developCaseCompanyCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'teach-course' AND a.point_level = 'BusinessUnit' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'teach-course' AND a.point_level = 'BusinessUnit' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "teachBusinessUnitCount",
    SUM(CASE 
        WHEN a.point_behaviour = 'teach-course' AND a.point_level = 'company' AND a.point_type = 'gain' THEN 1
        WHEN a.point_behaviour = 'teach-course' AND a.point_level = 'company' AND a.point_type = 'consume' THEN -1
        ELSE 0 
    END) AS "teachCompanyCount",
    COALESCE(SUM(CASE 
        WHEN a.point_behaviour = 'develop-course' THEN a.price
        WHEN a.point_behaviour = 'develop-case' THEN a.price
        WHEN a.point_behaviour = 'teach-course' THEN a.price
        ELSE 0 
    END), 0) AS "price",
    b.name AS "trainName",
    b.staff_code AS "staffCode",
    b.manage_com AS "trainManageCom",
    a.train_code AS "trainCode"
FROM lt_point_trace a, lt_student_info b
WHERE a.train_code = b.train_code
  AND a.point_behaviour IN ('develop-course', 'develop-case', 'teach-course')
  -- 动态条件部分
GROUP BY a.train_code, b.name, b.staff_code, b.manage_com;