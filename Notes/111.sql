# hashcode 
# 123456
# $2a$10$qAbkKbkbVMnD5pY9aPCInuRIm37T74K0ICxp/XwPxgbLNBUoYNQiS

# hashcode
# Sinosoft0002
# $2a$10$Q4DzN.JmKfx6yvyFnrkqk.Ig9At5UCjzGnFI.3W2h.wr9E1idST9a

$2a$10$qAbkKbkbVMnD5pY9aPCInuRIm37T74K0ICxp/XwPxgbLNBUoYNQiS

# hashcode
# Byd@lms123
# $2a$10$KD7VbroPL4PIzP/rEdQsJOoK4kRG492rm6Dd/vBKwQGywTsJlTRda

# 梁石水
# $2a$10$gCehlmSQn2ZGSSVvJSYV6O45goErQqvN0.hKE2b2.q8Rj.kEMOB9O

# 张珊珊
# $2a$10$96t0tvtJqw9K0wey8jcACeRmJeu/dEVfZ5P2DZoE8m79t6wKeuRfe

111111111
$2a$10$WsWmRfZT4kUckpADcgyGd.NvhzXl5azYDjRaNME3/Snd2eMTaVnty
222222222
$2a$10$ED2xKyGljXL62/.k56oGKuuF1RR0wjhD7dVmyYz21cjPTZjPkPvr.
333333333
$2a$10$p6pWVK.VksGqvx5.0I1q4uT8F4U2qQ0f5xbFtYU9FhtHbJbOINqea
444444444
$2a$10$3Bt.2JXqMizAxlg.K68qrOK7O7g9BATTMvND0U1Y5qhWpi6ZKJTIW
555555555
$2a$10$H9itpZ2D3DGbKnqKNqhUC.Yf/O/r4s8NHktRAmBDZbbXS/cMONJTO
66666666
$2a$10$Q6Vi5ia8gXa5GL/jBYEPpO7VyVcZQOgX/voLiodg7eZqmQHL7mD7q
777777777
$2a$10$/k8D1AM2im05czozXrVB1OWC5R/j7R3PUTBs9ltOsQkBRCuRevyze

# sql查数据
# 2024年8月9日
# 资源类型
select file_type,count(1) from file_info where deleted = false  group by file_type order by file_type;
# 课程数量
select teach_way,count(1) from lt_course_info where deleted = false group by teach_way order by teach_way;
# 班级数量
select train_state,count(1) from lt_course_program  where deleted = false group by train_state order by train_state;
# 参训数量
select count(train_code),count(distinct train_code) from lt_course_program_enroll where deleted = false and exists(select 1 from lt_course_program  where deleted = false and program_code = lt_course_program_enroll.program_code);
# 直播数量
select count(1) from polyv_live_channel where deleted = false;
# 专题数量
select count(1) from lt_course_set where deleted = false;
# 专题学习人数
select count(train_code),count(distinct train_code) from lt_course_set_student where deleted = false;
# 学习地图数量
select count(1) from lt_game_map where deleted = false;
# 学习地图学习人数
select count(train_code),count(distinct train_code) from lt_game_map_student where deleted = false;
# 题目数量
select count(1) from lt_question where deleted = false;
# 试卷数量
select count(1) from lt_test_paper where deleted = false and data_cate = 'test' and test_paper_classify = 'common';
# 考试数量
select count(1) from lt_exam_info where deleted = false and data_cate = 'test' and source_from = 'common';
# 参加考试数量
select count(train_code),count(distinct train_code) from lt_exam_student where deleted = false and status = '1' and exists(select 1 from lt_exam_info where deleted = false and data_cate = 'test' and source_from = 'common' and exam_code = lt_exam_student.exam_code);
# 管理员数量
select count(1) from sys_user where deleted = false and status = '1';
# 学员数量
select stu_flag,count(1) from lt_student_info where deleted = false and agent_state = '01' group by stu_flag;
# 讲师数量
select teacher_type,count(1) from lt_teacher_info where deleted = false and agent_state = '01' group by teacher_type;
# 班主任数量
select name,count(1) from lt_master where deleted = false and agent_state = '01' group by name;




SELECT 
        b.NAME AS "姓名",
        b.staff_code AS "工号",
        b.manage_com_name AS "机构名称",
        ( CASE A.source_from WHEN 'course' THEN '课程中心' WHEN 'train' THEN '培训班级' ELSE'---' END ) AS "sourceFrom",
        ( CASE A.source_from WHEN 'course' THEN '--' WHEN 'train' THEN A.source_code ELSE'---' END ) AS "programCode",
        ( CASE A.source_from WHEN 'course' THEN '--' WHEN 'train' THEN ( SELECT program_name FROM lt_course_program WHERE program_code = A.source_code ) ELSE'---' END ) AS "programName",
        C.course_name AS "课程名称",
        A.begin_learn_time AS "开始学习时间",
        A.finish_learn_time AS "结束学习时间",
        A.is_finish AS "是否完成",

(SELECT ROUND((select sum(video_length) from counter_analyse_result where course_code = A.course_code and train_code = A.train_code and chapter_code in (select chapter_code from lt_course_chapter where course_code =  A.course_code and time_duration is not null and status = '1' and deleted = false) and source_from = 'course' and company = 'byd-group')::numeric / (select sum(time_duration) from Lt_course_chapter where course_code = A.course_code and time_duration is not null and status = '1' and deleted=false and company = 'byd-group') * 100, 2)) AS "result"
FROM
        lt_join_course_report
        A LEFT JOIN lt_student_info b ON A.train_code = b.train_code
        LEFT JOIN lt_course_info C ON A.course_code = C.course_code
        LEFT JOIN lt_course_program_schedule lcps ON lcps.schedule_type = 'online-course' 
        AND A.course_code = lcps.schedule_code 
        AND lcps.deleted = FALSE 
        AND ( '20240416145920731' IS NOT NULL OR NULL IS NOT NULL )
        LEFT JOIN lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code 
        AND lcpe.train_code = A.train_code 
        AND lcpe.deleted = FALSE 
        AND ( '20240416145920731' IS NOT NULL OR NULL IS NOT NULL )
        LEFT JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code 
WHERE
        b.ID IS NOT NULL 
        AND C.ID IS NOT NULL 
        AND ( b.branch_type LIKE'%B%' ) 
        AND ( b.company = 'byd-group' ) 
        AND ( NULL IS NULL OR A.train_code = CAST ( NULL AS VARCHAR ) ) 
        AND (
                ( NULL IS NULL OR NULL = 'contains' ) 
                AND ( NULL IS NULL OR b.manage_com LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
                OR ( NULL IS NULL OR NULL = 'equals' ) 
                AND ( NULL IS NULL OR b.manage_com = CAST ( NULL AS VARCHAR ) ) 
        ) 
        AND (
                ( NULL IS NULL OR NULL = 'contains' ) 
                AND ( NULL IS NULL OR b.mul_Manage_com LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
                OR ( NULL IS NULL OR NULL = 'equals' ) 
                AND ( NULL IS NULL OR b.mul_Manage_com = CAST ( NULL AS VARCHAR ) ) 
        ) 
        AND ( NULL IS NULL OR b.work_address LIKE CONCAT ( CAST ( NULL AS VARCHAR ), '%' ) ) 
        AND ( NULL IS NULL OR b.staff_code = CAST ( NULL AS VARCHAR ) ) 
        AND ( NULL IS NULL OR b.agent_state = CAST ( NULL AS VARCHAR ) ) 
        AND ( NULL IS NULL OR b.stu_flag = CAST ( NULL AS VARCHAR ) ) 
        AND (
                '20240416145920731' IS NULL 
                OR ( lcp.program_code = '20240416145920731' AND lcps.ID IS NOT NULL AND lcp.ID IS NOT NULL AND lcpe.ID IS NOT NULL ) 
        ) 
        AND (
        NULL IS NULL 
                OR (
                        lcp.program_name LIKE concat ( '%', NULL, '%' ) 
                        AND lcps.ID IS NOT NULL 
                        AND lcp.ID IS NOT NULL 
                        AND lcpe.ID IS NOT NULL 
                ) 
        ) 
        AND ( 'course' IS NULL OR A.source_from = CAST ( 'course' AS VARCHAR ) ) 
        AND ( NULL IS NULL OR C.course_code = CAST ( NULL AS VARCHAR ) ) 
        AND ( NULL IS NULL OR C.course_name LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
        AND ( COALESCE ( NULL, 'null' ) = 'null' OR A.begin_learn_time >= NULL ) 
        AND ( COALESCE ( NULL, 'null' ) = 'null' OR A.begin_learn_time <= NULL ) 
        AND ( NULL IS NULL OR b.NAME LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
        AND ( NULL IS NULL OR b.label_id LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
ORDER BY
        A.begin_learn_time



# 问卷明细
SELECT
  exam_code,
	test_paper_code,
  created_by_staff_code,
	created_by_name,
  MAX(CASE WHEN question_code = 'bVYYaaMcBaj' THEN user_answer ELSE NULL END) AS Q1,
  MAX(CASE WHEN question_code = 'G8KLriZ8utA' THEN user_answer ELSE NULL END) AS Q2,
	MAX(CASE WHEN question_code = 'jLiJm0t1X2z' THEN user_answer ELSE NULL END) AS Q3,
	MAX(CASE WHEN question_code = 'R5OkcX215xu' THEN user_answer ELSE NULL END) AS Q4,
	MAX(CASE WHEN question_code = 'zfFQMl2JcbG' THEN user_answer ELSE NULL END) AS Q5,
	last_modified_date
FROM
  lt_exam_question_student
WHERE
  exam_code = '20240816160902923-F9GCD9QQ8ID'
GROUP BY
  exam_code,
	test_paper_code,
  created_by_staff_code,
	created_by_name,
	last_modified_date;

# 专题数据

SELECT 
    jcr.created_date AS createdDate,
    A.source_code AS courseCode,
    A.limited_days AS limitedDays,
    (SELECT course_name FROM lt_course_info WHERE course_code = A.source_code) AS courseName,
    A.NAME AS name,
    A.manage_com AS manageCom,
    A.manage_com_name AS manageComName,
    A.train_code AS trainCode,
    A.staff_code AS staffCode,
    A.job_position AS jobPosition,
    jcr.is_finish AS isFinish,
    jcr.begin_learn_time AS beginLearnTime,
    jcr.finish_learn_time AS finishLearnTime,
    A.join_set_date AS joinSetDate
FROM (
    SELECT 
        csr.source_code,
        csr.limited_days,
        lsi.NAME,
        lsi.manage_com,
        lsi.manage_com_name,
        lsi.train_code,
        lsi.staff_code,
        lsi.job_position,
        css.join_set_date
    FROM 
        lt_student_info lsi
    JOIN 
        lt_course_set_student css ON css.train_code = lsi.train_code
    JOIN 
        lt_course_set_rela csr ON css.course_set_code = csr.course_set_code AND csr.source_from = 'course'
    WHERE 
        css.course_set_code = 'F9FETHD5O6P' -- 替换为实际的course_set_code参数
       
        AND css.is_finish != '0'
		 
) A
LEFT JOIN 
    lt_join_course_report jcr ON A.source_code = jcr.course_code AND A.train_code = jcr.train_code
ORDER BY 
    jcr.created_date;


INSERT INTO lt_student_info (
    id, train_code, branch_type, manage_com, com_depart_code, stu_flag, staff_code, name, 
    id_no_type, id_no, sex, birthday, employ_date, 
    agent_series, agent_grade, grade_start_date, job_position, phone, 
    e_mail, referrer_code, referrer_name, referrer_phone, up_agent_code, 
    up_agent_name, agent_group, branch_attr, branch_attr_name, out_work_date, 
    trade_source, open_id, degree, graduation_school, school_major, 
    fresh_student_year, fresh_student, work_address, employee_group, mul_auth, 
    employ_trace, on_duty_train, enroll_code, practice_certi_no, face_url, 
    signature, label, remark, lcic_user_id, status, 
    fail_times, locked_time, deleted, company, created_by, 
    created_by_staff_code, created_by_name, created_by_manage_com, created_date, last_modified_by, 
    last_modified_date, last_login_time, mul_auth_com, page_theme, user_code, 
    time_zone_preference,language, mul_manage_com, initial, part_time_job_position, 
    created_by_manage_com_name, manage_com_name, job_position_code, label_id
)
SELECT 
    nextval('sequence_generator'), temp_account.train_code, 'B', 'A8602', NULL, '3', 
    temp_account.staff_code, temp_account.name, NULL, NULL, NULL, NULL, 
    '2024-02-07 18:57:51+08', NULL, NULL, NULL, NULL, NULL, 
    temp_account.e_mail, NULL, NULL, NULL, NULL, NULL, '01', NULL, NULL, NULL, 
    NULL, 'TJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
    NULL, NULL, NULL, NULL, NULL, NULL, '1', 0, NULL, 'f', 'byd-group', 'system', 
    NULL, NULL, 'A8602', '2024-08-26 17:06:29.237+08', 'init', 
    '2024-08-26 10:34:42.523+08', '2024-08-26 10:34:42.523+08', NULL, NULL, NULL, 
    NULL, NULL, NULL, 'N', NULL, NULL, NULL, NULL, NULL
FROM temp_account
LEFT JOIN lt_student_info 
ON temp_account.train_code = lt_student_info.train_code
WHERE lt_student_info.train_code IS NULL;



# 腾势临时账号处理

--------手动同步---------
--------默认密码Aa123456---------

UPDATE temp_account
SET train_code = MD5(CONCAT(staff_code, 'TS')),
    e_mail = CONCAT(staff_code, '@TSPX.com')
WHERE train_code IS NULL;

INSERT INTO lt_student_info select nextval ('sequence_generator'), train_code, 'B', 'A8602', NULL, '3', staff_code, name, NULL, NULL, NULL, NULL, '2024-02-07 18:57:51+08', NULL, NULL, NULL, NULL, NULL, e_mail, NULL, NULL, NULL, NULL, NULL, '01', NULL, NULL, NULL, NULL, 'TJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', 0, NULL, 'f', 'byd-group', 'system', NULL, NULL, 'A8602', '2024-08-26 17:06:29.237+08', 'init', '2024-08-26 10:34:42.523+08', '2024-08-26 10:34:42.523+08', NULL, NULL, NULL, NULL, NULL, NULL, 'N', NULL, NULL, NULL, NULL, NULL, NULL from temp_account where not exists(select 1 from lt_student_info where train_code = temp_account.train_code);

update lt_student_info set manage_com_name = '腾势经销商' where manage_com like 'A8602%' and manage_com_name is null;

insert into jhi_user(id,login,password_hash,activated,created_by) select nextval ('sequence_generator'),train_code,'$2a$10$E2huMDDkb1AOGRtTJ3qSXezNaHLJrcQOsELe5.iNsrin2Eaxsi7H2',true,'202408' from lt_student_info where not exists(select 1 from jhi_user where login = train_code);

insert into jhi_user_authority select id,'ROLE_USER' from jhi_user where not exists(select 1 from jhi_user_authority where user_id = jhi_user.id);

select * from lt_student_info where qw_user_id is NULL and stu_flag='3' and manage_com ='A8602';

UPDATE lt_student_info set trade_source ='TS'   where qw_user_id is NULL and stu_flag='3' and manage_com ='A8602';
UPDATE lt_student_info set qw_user_id=staff_code  where qw_user_id is NULL and stu_flag='3' and manage_com ='A8602';


/*
方程豹临时账号
**/


update temp_account set train_code = md5(CONCAT(staff_code, 'FCB')),e_mail=concat(staff_code,'@fcb.com') where train_code is null;

INSERT INTO lt_student_info select nextval ('sequence_generator'), train_code, 'B', 'A8603', NULL, '3', staff_code, name, NULL, NULL, NULL, NULL, '2024-02-07 18:57:51+08', NULL, NULL, NULL, NULL, NULL, e_mail, NULL, NULL, NULL, NULL, NULL, '01', NULL, NULL, NULL, NULL, 'TJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', 0, NULL, 'f', 'byd-group', 'system', NULL, NULL, 'A8603', '2024-08-26 17:06:29.237+08', 'init', '2024-08-26 10:34:42.523+08', '2024-08-26 10:34:42.523+08', NULL, NULL, NULL, NULL, NULL, NULL, 'N', NULL, NULL, NULL, NULL, NULL, NULL from temp_account where not exists(select 1 from lt_student_info where train_code = temp_account.train_code);

update lt_student_info set manage_com_name = '方程豹经销商' where manage_com like 'A8603%' and manage_com_name is null;

insert into jhi_user(id,login,password_hash,activated,created_by) select nextval ('sequence_generator'),train_code,'$2a$10$E2huMDDkb1AOGRtTJ3qSXezNaHLJrcQOsELe5.iNsrin2Eaxsi7H2',true,'202408' from lt_student_info where not exists(select 1 from jhi_user where login = train_code);

insert into jhi_user_authority select id,'ROLE_USER' from jhi_user where not exists(select 1 from jhi_user_authority where user_id = jhi_user.id);

select * from lt_student_info where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'

UPDATE lt_student_info set trade_source ='FCB'   where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'
UPDATE lt_student_info set qw_user_id=staff_code  where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'



# admin@sg  
# Apas.training2
# $2a$10$ExnZD2tXFlbiT.55F8/Yh...fOqd7KzCPJMD3d54.NzkEW7TNFAoC


# 393367
# Aa123456
# $2a$10$iKPeqippEFCkgWRVodhdIOvXMFV8tWFUpfGUN.zCezVz3XHJZBt8S

# 专题数据
SELECT 
    jcr.created_date AS createdDate,
    A.source_code AS courseCode,
    A.limited_days AS limitedDays,
    (SELECT course_name FROM lt_course_info WHERE course_code = A.source_code) AS courseName,
    A.NAME AS name,
    A.manage_com AS manageCom,
    A.manage_com_name AS manageComName,
    A.train_code AS trainCode,
    A.staff_code AS staffCode,
    A.job_position AS jobPosition,
    jcr.is_finish ,
		case 
		WHEN	
			jcr.is_finish is NULL then '未开始'
			WHEN
			jcr.is_finish = '1' THEN '未完成'
			WHEN 
			jcr.is_finish = '4' THEN '已完成'
		END  AS isFinish,
    jcr.begin_learn_time AS beginLearnTime,
    jcr.finish_learn_time AS finishLearnTime,
    A.join_set_date AS joinSetDate
FROM (
    SELECT 
        csr.source_code,
        csr.limited_days,
        lsi.NAME,
        lsi.manage_com,
        lsi.manage_com_name,
        lsi.train_code,
        lsi.staff_code,
        lsi.job_position,
        css.join_set_date
    FROM 
        lt_student_info lsi
    JOIN 
        lt_course_set_student css ON css.train_code = lsi.train_code
    JOIN 
        lt_course_set_rela csr ON css.course_set_code = csr.course_set_code AND csr.source_from = 'course'
    WHERE 
        css.course_set_code = 'F9FETHD5O6P' -- 替换为实际的course_set_code参数
       
        AND css.is_finish != '0'
		 
) A
LEFT JOIN 
    lt_join_course_report jcr ON A.source_code = jcr.course_code AND A.train_code = jcr.train_code
ORDER BY 
    jcr.created_date;



# 问卷数据

SELECT
  leqs.exam_code as "问卷编码",
  lei.exam_name as "问卷名称",
  leqs.created_by_staff_code as "工号" ,
  leqs.created_by_name "姓名" ,
  leqs.created_by_manage_com as "机构编码",
  leqs.created_by_manage_com_name as "机构名称" ,
	MAX(leqs.last_modified_date) AS "提交时间",
  MAX(CASE WHEN question_code = 'UXyKjJwS92r' THEN user_answer ELSE NULL END) AS Q1,
  MAX(CASE WHEN question_code = 'bYTkNhC5oy9' THEN user_answer ELSE NULL END) AS Q2,
  -- 以此类推，为每个question_code添加一个列
  MAX(CASE WHEN question_code = 'hMmNgoU79rI' THEN user_answer ELSE NULL END) AS Q3,
  MAX(CASE WHEN question_code = 'hCvbsr5Knd0' THEN user_answer ELSE NULL END) AS Q4,
  MAX(CASE WHEN question_code = 'oJZnXncKXiY' THEN user_answer ELSE NULL END) AS Q5,
  MAX(CASE WHEN question_code = 'DUXtsny3WDH' THEN user_answer ELSE NULL END) AS Q6
FROM
  lt_exam_question_student leqs
  join lt_exam_info lei on lei.exam_code = leqs.exam_code
WHERE
  leqs.exam_code   like '%4PTZY8SCVRE%' and data_cate='survey'
GROUP BY
  leqs.exam_code,
  lei.exam_name,
  leqs.created_by_staff_code ,
  leqs.created_by_name,
  leqs.created_by_manage_com ,
  leqs.created_by_manage_com_name
  ;
  
 select  answer_code,answer_content  from lt_question_answers lqa  where id ='533303989'
 
 select question_code ,question_content  from lt_question lq  where question_code ='UXyKjJwS92r'
 select question_code ,question_content  from lt_question lq  where question_code ='bYTkNhC5oy9'
 select question_code ,question_content  from lt_question lq  where question_code ='hMmNgoU79rI'
 select question_code ,question_content  from lt_question lq  where question_code ='hCvbsr5Knd0'
 select question_code ,question_content  from lt_question lq  where question_code ='oJZnXncKXiY'
  select question_code ,question_content  from lt_question lq  where question_code ='DUXtsny3WDH'
  select leqs.question_code FROM
  lt_exam_question_student leqs
  join lt_exam_info lei on lei.exam_code = leqs.exam_code
WHERE
  leqs.exam_code   like '%4PTZY8SCVRE%' and data_cate='survey'
GROUP BY leqs.question_code
	;

select * FROM
  lt_exam_question_student leqs
  join lt_exam_info lei on lei.exam_code = leqs.exam_code
WHERE
  leqs.exam_code   like '%4PTZY8SCVRE%' and data_cate='survey'
	;	
 select * from lt_exam_info lei where exam_code like '%4PTZY8SCVRE%' and data_cate='survey';



/*
按工号重置密码
123456
*/
UPDATE jhi_user ju
SET password_hash ='$2a$10$qAbkKbkbVMnD5pY9aPCInuRIm37T74K0ICxp/XwPxgbLNBUoYNQiS'
FROM lt_student_info lsi
WHERE ju.login = lsi.train_code AND lsi.staff_code ='8500813'

/*
按邮箱重置密码
Aa123456
*/
UPDATE jhi_user ju
SET password_hash ='$2a$10$E2huMDDkb1AOGRtTJ3qSXezNaHLJrcQOsELe5.iNsrin2Eaxsi7H2'
FROM lt_student_info lsi
WHERE ju.login = lsi.train_code AND lsi.e_mail in ()

/*
课程学习记录
按课程编码搜索
*/
SELECT 
    b.manage_com_name as "所属机构",
		b.staff_code as "工号",
		b.name as "姓名", 
    b.manage_com as "manageCom", 
    b.manage_com_name as "manageComName", 
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
    CASE a.source_from 
        WHEN 'course' THEN '--' 
        WHEN 'train' THEN (SELECT program_name FROM lt_course_program WHERE program_code = a.source_code) 
        ELSE '---' 
    END as "programName", 
    a.course_code as "课程编码", 
    c.course_name as "课程名称", 
    a.begin_learn_time as "开始时间", 
    a.finish_learn_time as "完成时间", 
		a.is_finish ,
		case 
			WHEN a.is_finish ='4' THEN '已完成'
			WHEN a.is_finish ='1' THEN '进行中'
			END  as "是否已完成",
    (SUM(car.video_length * car.play_percent) / (SELECT SUM(time_duration) FROM lt_course_chapter WHERE course_code = a.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = false))  AS "学习进度"
FROM 
    lt_join_course_report a 
    LEFT JOIN lt_student_info b ON a.train_code = b.train_code 
    LEFT JOIN lt_course_info c ON a.course_code = c.course_code 
    LEFT JOIN counter_analyse_result car ON a.course_code = car.course_code AND a.train_code = car.train_code AND car.chapter_code IN (SELECT chapter_code FROM lt_course_chapter WHERE course_code = a.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = false) AND car.source_from = a.source_from AND car.company = b.company
WHERE 
    a.course_code = 'P3-07-010096' -- 直接使用具体的课程编码替换 '提供的课程编码'
    AND b.id is not null 
    AND c.id is not null 
GROUP BY 
    a.train_code, b.name, b.staff_code, b.manage_com, b.manage_com_name, b.agent_state, b.mul_auth, a.source_from, a.source_code, b.manage_com, b.label_id, a.course_code, c.course_name, a.begin_learn_time, a.finish_learn_time, a.is_finish;



/*班级培训记录*/
SELECT
    b.manage_com_name AS "所属机构",
    b.staff_code AS "工号",
		b.name AS "姓名",
    c.program_code AS "班级编码",
    c.program_name AS "班级名称",
    c.program_type AS "培训子类",
		cptype.type_name AS "培训子类", 
    c.course_start_time AS "培训开始时间",
    c.train_state AS "trainState",
		case 
			WHEN  c.train_state ='00' THEN '计划中'
			WHEN c.train_state ='01' THEN '报名中'
			WHEN c.train_state ='02' THEN '已结班'
			WHEN c.train_state ='03' THEN '已结束'
			END AS "班级状态",
    a.finish_state AS "finishState",
		(SELECT CAST(SUM(t.actual_course_hours) AS FLOAT) FROM lt_course_program_schedule t WHERE t.program_code = c.program_code) AS "累计学时",
		case 
			WHEN a.finish_state ='00' then '进行中'
			WHEN a.finish_state ='01' then '未结业'
			WHEN a.finish_state ='02' then '结业'
			ELSE '其他'
		END as "结业状态",
    a.finish_date AS "结训日期"
FROM
    lt_course_program_enroll a
    JOIN lt_student_info b ON a.train_code = b.train_code
    JOIN lt_course_program c ON a.program_code = c.program_code
		JOIN lt_course_program_type cptype ON c.program_type = cptype.type_code 
WHERE
    c.audit_state = '11'
    AND b.manage_com like '%A8600007003003%';


/*
按照机构查询班级参训记录
**/
SELECT
    b.manage_com_name AS "所属机构",
    b.staff_code AS "工号",
		b.name AS "姓名",
    c.program_code AS "班级编码",
    c.program_name AS "班级名称",
		cptype.type_name AS "培训子类", 
    c.course_start_time AS "培训开始时间",
		case 
			WHEN  c.train_state ='00' THEN '计划中'
			WHEN c.train_state ='01' THEN '报名中'
			WHEN c.train_state ='02' THEN '已结班'
			WHEN c.train_state ='03' THEN '已结束'
			END AS "班级状态",
		(SELECT CAST(SUM(t.actual_course_hours) AS FLOAT) FROM lt_course_program_schedule t WHERE t.program_code = c.program_code) AS "累计学时",
		case 
			WHEN a.finish_state ='00' then '进行中'
			WHEN a.finish_state ='01' then '未结业'
			WHEN a.finish_state ='02' then '结业'
			ELSE '其他'
		END as "结业状态",
    a.finish_date AS "结训日期"
FROM
    lt_course_program_enroll a
    JOIN lt_student_info b ON a.train_code = b.train_code
    JOIN lt_course_program c ON a.program_code = c.program_code
		JOIN lt_course_program_type cptype ON c.program_type = cptype.type_code 
WHERE
    c.audit_state = '11'
    AND b.manage_com like '%A8600007007%';

/*
考试详情
**/
SELECT 
    lei.exam_code 考试编码,
    lei.exam_name 考试名称,
    (SELECT code_name FROM sys_code_select WHERE code_type = 'examstate' AND code_value = les.exam_state) 考试状态,
    les.score 考试成绩,
    les.exam_count 考试次数,
    lq.question_code 题目编码,
    lq.question_content 题干,
    leqs.right_or_wrong 答题状态,
    lsi.staff_code 工号,
    lsi."name" 姓名,
    lsi.job_position 岗位,
    lsi.manage_com_name 机构 
FROM 
    lt_exam_info lei,
    lt_exam_student les,
    lt_exam_question_student leqs,
    lt_question lq,
    lt_student_info lsi 
WHERE 
    lei.exam_code = les.exam_code 
    AND lei.exam_code = leqs.exam_code 
    AND les.train_code = leqs.train_code 
    AND leqs.question_code = lq.question_code 
    AND les.exam_count = leqs.exam_count 
    AND les.train_code = lsi.train_code 
    AND lei.exam_code IN ('4PY999S4RNS', '4PXRZB3RANG', '4PXRY8TUJ10', '4PXRX7628A8') 
ORDER BY 
    lei.exam_code,
    leqs.exam_count,
    lsi.staff_code,
    lq.question_code;

/*
铁军人员数据
**/
SELECT
	staff_code 工号,
	NAME 姓名,
	manage_com_name 所属机构,
	employ_date 入职日期,
	job_position 岗位,
	part_time_job_position 兼职岗位,
	case 
		when label_id ='1DFCEEB5D013497FE0635C14090AF841' then '王朝直营'
		when label_id ='1DFC1FA93668BB5AE0635C14090A817B' then '海洋直营'
		when label_id ='1DFCEEB5D014497FE0635C14090AF841' then '腾势直营'
		when label_id ='1DFC920BA6C629A6E0635C14090A5BC2' then '方程豹直营'
	end as 品牌标签 
FROM
	lt_student_info 
WHERE
	stu_flag = '1' 
	AND label_id IS NOT NULL




逆向删除通常意味着将之前执行的插入操作撤销，即从目标表中删除之前插入的记录。根据你提供的SQL语句，我们可以编写相应的删除语句来实现这一目的。以下是逆向删除的SQL语句：
1. 删除 jhi_user_authority 表中的相关记录：
delete from jhi_user_authority
where user_id in (
    select id from jhi_user
    where login in (
        select train_code from lt_student_info
        where train_code in (
            select train_code from temp_account
        )
    )
);
2. 删除 jhi_user 表中的相关记录：
delete from jhi_user
where login in (
    select train_code from lt_student_info
    where train_code in (
        select train_code from temp_account
    )
);
3. 删除 lt_student_info 表中的相关记录：
delete from lt_student_info
where train_code in (
    select train_code from temp_account
);
4. 更新 temp_account 表，撤销之前做的更新：
update temp_account
set train_code = null,
    e_mail = null
where train_code in (
    select train_code from lt_student_info
);
这些SQL语句的逻辑是：
首先，从 jhi_user_authority 表中删除与 jhi_user 表中相关联的记录。
然后，从 jhi_user 表中删除之前插入的记录。
接着，从 lt_student_info 表中删除之前插入的记录。
最后，更新 temp_account 表，将之前设置的 train_code 和 e_mail 字段恢复为 null 。
请注意，在执行这些删除操作之前，确保备份数据库，以防万一需要恢复数据。此外，这些删除操作可能会影响数据库的完整性和业务逻辑，因此在生产环境中执行之前应该进行充分的测试。

/*
班级对应的课程
***/
SELECT
    lcp.program_code AS "班级编码",
    lcp.program_name AS "班级名称",
    COALESCE(lcpt1.type_name, lcpt2.type_name) AS "培训项目",
    lcpt2.type_name AS "培训子类",
    lcps.schedule_code AS "课程编码",
    lci.course_name AS "课程名称",
    CASE
        WHEN lci.course_level = 'department' THEN '部门'
        WHEN lci.course_level = 'BusinessUnit' THEN '事业部'
        WHEN lci.course_level = 'company' THEN '公司'
        WHEN lci.course_level = 'factory' THEN '工厂'
        WHEN lci.course_level = 'section' THEN '科室'
    END AS "课程层级",
    CASE
        WHEN lci.teach_way = '01' THEN '面授课程'
        WHEN lci.teach_way = '02' THEN '线上课程'
        ELSE '---'
    END AS "培训形式"
FROM
    lt_course_program lcp
    JOIN lt_course_program_schedule lcps ON lcp.program_code = lcps.program_code
    JOIN lt_course_info lci ON lcps.schedule_code = lci.course_code
    JOIN sys_code_select scs ON scs.code_type = 'courselevel' AND lci.course_level = scs.code_value
    LEFT JOIN lt_course_program_type lcpt1 ON split_part(lcp.category_string, ',', 1) = lcpt1.type_code
    JOIN lt_course_program_type lcpt2 ON lcpt2.type_code = lcp.program_type


收集别的
王新宇的文本

6849618

http://10.0.69.34:5601

393367366@qq.com


kubectl get pods -n sit-jt

kubectl logs -f tms-app-8495b57b84-2xq72 -n sit-jt --tail=100


kubectl get pods -n uat-jt

kubectl logs -f tms-app-798b8d46d6-fv28g -n uat-jt --tail=100

kubectl logs -f tms-app-79ddc5d5df-tnz55 -n uat-jt | grep 'REST request to staffCodes map'


日期：2024年8月7日

  select a.manage_com,a.name,b.timeSum,c.timeSum,(b.timeSum + c.timeSum) as timeSummm  from (select manage_com,name from sys_manage_com  where length(manage_com) = 11 ) a left join (  SELECT SUBSTRING(la.created_by_manage_com, 1, 11) AS manageCom, COALESCE(SUM(lcps.actual_course_hours), 0) AS timeSum FROM lt_attendance la,lt_course_program_schedule lcps WHERE  lcps.program_code = la.program_code AND lcps.schedule_code = la.course_code  AND lcps.deleted = 'f' AND la.deleted = 'f' and	LENGTH(la.created_by_manage_com) >= 11
GROUP BY SUBSTRING(la.created_by_manage_com, 1, 11)) b  on a.manage_com = b.manageCom left join 

(SELECT COALESCE (( SELECT ROUND( SUM ( ctl.duration_of_this_play) / 3600.0, 1 ) ),0 ) as timeSum,SUBSTRING(ctl.created_by_manage_com, 1, 11) AS manageCom FROM counter_trance_log ctl WHERE 
 	LENGTH(ctl.created_by_manage_com) >= 11 GROUP BY SUBSTRING(ctl.created_by_manage_com, 1, 11)) c on a.manage_com = c.manageCom  ORDER BY timeSummm Desc

2024年8月8日

  select a.staff_code,a.name,a.train_code,a.manage_com_name,b.timeSum,c.timeSum,(COALESCE(b.timeSum, 0) + COALESCE(c.timeSum, 0)) as timeSummm  from (select staff_code ,name ,train_code,manage_com_name  from lt_student_info  where manage_com like '%A8600001005004001%' ) a left join (  SELECT  COALESCE(SUM(lcps.actual_course_hours), 0) AS timeSum, la.train_code as trainCode   FROM lt_attendance la,lt_course_program_schedule lcps WHERE  lcps.program_code = la.program_code AND lcps.schedule_code = la.course_code  AND lcps.deleted = 'f' AND la.deleted = 'f' GROUP BY trainCode ) b  on a.train_code = b.trainCode left join 
(SELECT COALESCE (( SELECT ROUND( SUM ( ctl.duration_of_this_play) / 3600.0, 1 ) ),0 ) as timeSum, ctl.train_code as trainCode FROM counter_trance_log ctl GROUP BY trainCode ) c on c.trainCode = a.train_code  ORDER BY timeSummm Desc


A8600001005004001              比亚迪/职能/人资处/组织部/组织效能科


A8600001005010                   比亚迪/职能/人资处/培训学院

 
A8600001005                        比亚迪/职能/人资处

--------------------------------------2024年9月2日：人均学习学时，只计算各事业部G级以上的；以各事业部为单位进行排名
SELECT A.manage_com,A.NAME,b.timeSum,C.timeSum,( b.timeSum + C.timeSum ) AS timeSummm , (	SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E','F','G') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com) as StundetSum, ((b.timeSum + C.timeSum) / (SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E','F','G') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com)) as avageTimeSum
FROM
	( SELECT manage_com, NAME FROM sys_manage_com WHERE manage_com IN (SELECT DISTINCT(SUBSTRING( manage_com, 1, 11 )) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E','F','G')) )A 
	LEFT JOIN (
	SELECT SUBSTRING( la.created_by_manage_com, 1, 11 ) AS manageCom,
		COALESCE ( SUM ( lcps.actual_course_hours ), 0 ) AS timeSum 
	FROM
		lt_attendance la,
		lt_course_program_schedule lcps 
	WHERE
		lcps.program_code = la.program_code 
		AND lcps.schedule_code = la.course_code 
		AND lcps.begin_time <= '2024-08-31 16:00:00.597+08' 
		AND lcps.begin_time >= '2024-07-30 16:00:00.597+08' 
		AND lcps.deleted = 'f' 
		AND la.deleted = 'f' 
		AND la.train_code IN (SELECT train_code FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E','F','G'))
		AND LENGTH ( la.created_by_manage_com ) >= 11 
	GROUP BY
		SUBSTRING ( la.created_by_manage_com, 1, 11 ) 
	) b ON A.manage_com = b.manageCom
	LEFT JOIN (
	SELECT COALESCE
		( ( SELECT ROUND( SUM ( ctl.duration_of_this_play ) / 3600.0, 1 ) ), 0 ) AS timeSum,
		SUBSTRING ( ctl.created_by_manage_com, 1, 11 ) AS manageCom 
	FROM
		counter_trance_log ctl 
	WHERE
		LENGTH ( ctl.created_by_manage_com ) >= 11 
		AND ctl.created_date <= '2024-08-31 16:00:00.597+08' AND ctl.created_date >= '2024-07-30 16:00:00.597+08' 
		AND ctl.train_code IN (SELECT train_code FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E','F','G'))
	GROUP BY
		SUBSTRING ( ctl.created_by_manage_com, 1, 11 ) 
	) C ON A.manage_com = C.manageCom 
ORDER BY
	avageTimeSum DESC

--------------------------------------2024年9月14日，查找只有F级及以上的学员参加的面授课
SELECT
	( SELECT program_name FROM lt_course_program WHERE program_code = lcps.program_code ) AS programName,
	schedule_content,
	( SELECT smc.full_name FROM sys_manage_com smc, lt_teacher_info lti, lt_student_info lsi WHERE  smc.manage_com = lsi.manage_com AND lti.train_code = lsi.train_code AND lti.teacher_code = lcps.teacher_code ) AS teacherCom,
	teacher_name,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value = teach_level ) AS teachLevel 
FROM
	lt_course_program_schedule lcps 
WHERE
	schedule_type = 'offline-course' 
	AND begin_time IS NOT NULL 
	AND program_code IN (
	SELECT
		lcpe.program_code 
	FROM
		lt_course_program_enroll lcpe
		INNER JOIN lt_student_info lsi ON lcpe.train_code = lsi.train_code 
	GROUP BY
		lcpe.program_code 
	HAVING
	MAX ( CASE WHEN lsi.agent_grade IN ( 'G', 'H', 'I', 'N' ) THEN 1 ELSE 0 END ) = 0 
	);



--------------------------2024年9月14日  查找课程开发数
SELECT A.manage_com,A.NAME,b.courseCount,(	SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com) as StundetSum, (b.courseCount  / (SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com)) as avageTimeSum
FROM
	( SELECT manage_com, NAME FROM sys_manage_com WHERE manage_com IN (SELECT DISTINCT(SUBSTRING( manage_com, 1, 11 )) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E')) )A 
	LEFT JOIN (
	SELECT SUBSTRING( lci.created_by_manage_com, 1, 11 ) AS manageCom,
		COALESCE ( count ( lci.id ), 0 ) AS courseCount 
	FROM
		lt_course_info lci 
	WHERE
		 lci.created_date <= '2024-08-31 16:00:00.597+08' 
		AND lci.created_date >= '2024-07-30 16:00:00.597+08' 
		AND lci.deleted = 'f' 
		AND lci.teach_way = '02'
		AND LENGTH (  lci.created_by_manage_com ) >= 11 
	GROUP BY
		SUBSTRING (  lci.created_by_manage_com, 1, 11 ) 
	) b ON A.manage_com = b.manageCom
ORDER BY
	avageTimeSum DESC


-------------------------2024年9月14日  人均积分数
SELECT A.manage_com,A.NAME,b.courseCount,(	SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com) as StundetSum, (b.courseCount  / (SELECT count(1) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E') AND SUBSTRING( manage_com, 1, 11 ) = A.manage_com)) as avageTimeSum
FROM
	( SELECT manage_com, NAME FROM sys_manage_com WHERE manage_com IN (SELECT DISTINCT(SUBSTRING( manage_com, 1, 11 )) FROM lt_student_info WHERE  agent_grade IN ('A','B','C','D','E')) )A 
	LEFT JOIN (
	SELECT SUBSTRING( lsi.manage_com, 1, 11 ) AS manageCom,
		COALESCE ( sum ( lpt.price ), 0 ) AS courseCount 
	FROM
		lt_point_trace lpt ,
		lt_student_info lsi
	WHERE
		 lpt.created_date <= '2024-08-31 16:00:00.597+08' 
		AND lpt.created_date >= '2024-07-30 16:00:00.597+08' 
		AND lpt.deleted = 'f' 
		AND (lpt.point_behaviour = 'develop-course'  OR lpt.point_behaviour = 'teach-course' )
		AND lpt.train_code = lsi.train_code
		AND LENGTH (  lsi.manage_com ) >= 11 
	GROUP BY
		SUBSTRING (  lsi.manage_com, 1, 11 ) 
	) b ON A.manage_com = b.manageCom
ORDER BY
	avageTimeSum DESC
	
	
------------------------------------------集团推送oa拼接课程信息
SELECT
        CONCAT_WS ( '-', lcps.program_code, lcps.schedule_code ) AS "skid",
        lci.course_code AS "kcid",
        lci.course_name AS "kcmc",
        (
        SELECT
                string_agg ( classify_name, '/' ) AS RESULT 
        FROM
                ( SELECT classify_name FROM lt_classify WHERE classify_code IN ( lci.category, lci.subcategory ) ORDER BY classify_level ) subquery 
        ) AS kcfl,
        ( CASE WHEN lci.teach_way = '01' THEN '1' ELSE'0' END ) AS "pxs",
        ( SELECT code_name FROM sys_code_select WHERE code_type = 'courselevel' AND code_value = lci.course_level LIMIT 1 ) AS "kccj",
        ( SELECT code_name FROM sys_code_select WHERE code_type = 'workingtime' AND code_value = lcps.working_time LIMIT 1 ) AS "sksjlx",
        CONCAT_WS ( '', DATE ( ( lcps.begin_time + INTERVAL '8 hours' ) ) ) AS "skrq",
        CONCAT_WS ( '', ( SELECT to_char( lcps.begin_time + INTERVAL '8 hours', 'YYYY-MM-DD HH24:MI' ) ) ) AS "skkssj",
        CONCAT_WS ( '', ( SELECT to_char( lcps.end_time + INTERVAL '8 hours', 'YYYY-MM-DD HH24:MI' ) ) ) AS "skjssj",
        CONCAT_WS ( '', lcps.actual_course_hours ) AS "sksc",
        CONCAT_WS ( '', lcps.class_hour_coefficient ) AS "fl",
        lti.staff_code AS "jsgh",
        lti.NAME AS "jsxm",
        ( SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value = lcps.teach_level LIMIT 1 ) AS "jsdj",
        ( SELECT NAME FROM sys_manage_com WHERE manage_com = lcps.teacher_com LIMIT 1 ) AS "jszzz",
        ( SELECT code_name FROM sys_code_select WHERE code_type = 'teachertype' AND code_value = lcps.teacher_type LIMIT 1 ) AS "jslx",
        CONCAT_WS ( '', lcps.teacher_evaluation_score ) AS "jsskpgf",
        ( CASE WHEN lcps.certified = 'Y' THEN '已认证' ELSE'非认证' END ) AS "rzgx",
        (
        SELECT CAST
                (
                        ( SELECT COUNT ( * ) FROM lt_attendance WHERE program_code = lcps.program_code AND course_code = lcps.schedule_code AND deleted = FALSE ) AS VARCHAR 
                ) 
        ) AS "xysl" 
FROM
        lt_course_program_schedule lcps,
        lt_course_info lci,
        lt_teacher_info lti 
WHERE
        lcps.schedule_code = lci.course_code 
        AND lcps.teacher_code = lti.teacher_code 
        AND lcps.program_code = '20241017092712833' 
        AND lcps.schedule_code = 'M2-03-000002';
	


---------------------------授课数据
SELECT
	lcp.program_code AS "班级编码",
	lcp.program_name AS "班级名称",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'yesorno' AND code_value =lcp.is_important) AS "是否重要班级",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'publishrange' AND code_value =lcp.publish_range) AS "组织形式",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'traininglevel' AND code_value =lcp.training_level) AS "培训层级",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'trainstatus' AND code_value =lcp.train_state) AS "班级状态",
	(SELECT full_name FROM sys_manage_com WHERE manage_com = lcp.manage_com) AS "组织机构",
	lcp.created_by_staff_code AS "班级创建人工号",
	lcp.created_by_name AS "班级创建人姓名",
	CONCAT_WS ( '-', lcps.program_code, lcps.schedule_code ) AS "授课id",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'courselevel' AND code_value =lci.course_level) AS "课程层级",
	lci.course_code AS "课程编码",
	lcps.schedule_content AS "课程名称",
	lcps.working_time AS "是否工作时间",
	CONCAT_WS ( '', DATE ( ( lcps.begin_time + INTERVAL '8 hours' ) ) ) AS "授课日期",
	lcps.begin_time AS "授课开始时间",
	lcps.end_time AS "授课结束时间",
	lcps.flow_id AS "流程id",
	lcps.actual_course_hours AS "实际课时",
	lcps.class_hour_coefficient AS "费率",
	lcps.teacher_name AS "讲师姓名",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value =lcps.teach_level) AS "讲师级别",
	(SELECT full_name FROM sys_manage_com WHERE manage_com = lcps.teacher_com)  AS "讲师机构",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'teachertype' AND code_value =lcps.teacher_type) AS "讲师类型",
	lcps.teacher_evaluation_score AS "讲师评分",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'yesorno' AND code_value =lcps.certified) AS "认证状态",
	(SELECT code_name FROM sys_code_select WHERE code_type = 'auditstate' AND code_value =lcps.audit_state) AS "审批状态",

	(SELECT code_name FROM sys_code_select WHERE code_type = 'yesorno' AND code_value =lcps.is_push) AS "是否已推送",
	(
	SELECT CAST
		(
		CASE
				
				WHEN 'JT' = 'JT' THEN
				( SELECT COUNT ( * ) FROM lt_attendance WHERE program_code = lcps.program_code AND course_code = lcps.schedule_code AND deleted = FALSE ) ELSE ( SELECT COUNT ( 1 ) FROM lt_course_program_enroll WHERE program_code = lcps.program_code AND deleted = FALSE ) 
		END AS VARCHAR 
		) 
	) AS "学生数量",
	lcps.apply_time AS "提交OA时间",
	lcps.audit_time AS "OA结案时间",
		lcps.audit_option AS "OA结案意见"
FROM
	lt_course_program_schedule lcps,
	lt_course_program lcp,
	lt_course_info lci,
	lt_teacher_info lti 
WHERE
	lcps.teacher_code = lti.teacher_code 
	AND lcps.program_code = lcp.program_code 
	AND lcps.schedule_code = lci.course_code 
	AND lcps.schedule_type = 'offline-course' 
	AND lcps.end_time < now( ) 
	AND ( lcp.branch_type = 'B' ) 
	AND lcp.deleted = FALSE 
	AND ( NULL IS NULL OR lti.staff_code LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( NULL IS NULL OR lcps.teacher_com LIKE CONCAT ( CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( NULL IS NULL OR lcps.teacher_code = CAST ( NULL AS VARCHAR ) ) 
	AND ( NULL IS NULL OR lcps.teacher_name LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( NULL IS NULL OR lcps.teach_level = CAST ( NULL AS VARCHAR ) ) 
	AND (
	NULL IS NULL 
		OR (
		CASE
				
				WHEN 'JT' = 'JT' THEN
				CONCAT_WS ( '-', lcps.program_code, lcps.schedule_code ) ELSE CONCAT_WS ( '', lcps.ID ) 
			END 
			) LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) 
		) 
		AND ( NULL IS NULL OR lcp.program_code LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcp.program_name LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcp.category_string LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcp.created_by_staff_code LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcp.created_by_name LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcp.is_important = CAST ( NULL AS VARCHAR ) ) 
		AND (
			'contains' = 'contains' 
			AND ( 'A86' IS NULL OR lcp.manage_com LIKE CONCAT ( '%', CAST ( 'A86' AS VARCHAR ), '%' ) ) 
			OR 'contains' = 'equals' 
			AND ( 'A86' IS NULL OR lcp.manage_com = CAST ( 'A86' AS VARCHAR ) ) 
		) 
		AND ( NULL IS NULL OR lcps.schedule_code LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcps.schedule_content LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcps.flow_id LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		AND ( NULL IS NULL OR lcps.audit_state = CAST ( NULL AS VARCHAR ) ) 
		AND ( NULL IS NULL OR lcps.is_push = CAST ( NULL AS VARCHAR ) ) 
	AND ( COALESCE ( NULL, 'null' ) = 'null' OR lcps.begin_time >= NULL ) 
	AND ( COALESCE ( NULL, 'null' ) = 'null' OR lcps.begin_time <= NULL )
	

收集别的刘磊的文档

lms.byd.com/admin/user/login?secret=qwertyopmhtgvfsituatprd

6849618

http://10.0.69.34:5601

393367366@qq.com


kubectl get pods -n sit-jt

kubectl logs -f tms-app-8495b57b84-2xq72 -n sit-jt --tail=100


kubectl get pods -n uat-jt

kubectl logs -f tms-app-798b8d46d6-fv28g -n uat-jt --tail=100

kubectl logs -f tms-app-79ddc5d5df-tnz55 -n sit-jt | grep 'REST request to staffCodes map'


专题编码:【F89TH675Q78】专题名称:【2024明日之星应届生训练营（第一阶段）】




【总部创建】2024应届生群组（保温期） groupCode Ww28zc00xlu



/////////   换资源url
UPDATE lt_course_chapter set course_file = (select url from file_info where id = '370182709') where id = '246275699';


select url from file_info where id = '370182709';






SELECT * FROM ( SELECT jcr.created_date AS "createdDate", jcr.id AS "id", jcr.course_code AS 
"courseCode", ( SELECT course_name FROM lt_course_info WHERE course_code = jcr.course_code 
) AS "courseName", lsi.NAME AS "name", lsi.manage_com AS "manageCom", lsi.manage_com_name AS 
"manageComName", lsi.train_code AS "trainCode", lsi.staff_code AS "staffCode", lsi.id_no 
AS "idNo", jcr.is_finish AS "isFinish", jcr.begin_learn_time AS "beginLearnTime", jcr.finish_learn_time 
AS "finishLearnTime", css.join_set_date AS "joinSetDate" FROM lt_join_course_report jcr JOIN 
lt_student_info lsi ON jcr.train_code = lsi.train_code JOIN lt_course_set_rela csr ON csr.source_code 
= jcr.course_code JOIN lt_course_set_student css ON css.course_set_code = csr.course_set_code 
AND css.train_code = jcr.train_code WHERE csr.course_set_code = 'F89TH675Q78' AND csr.company 
= 'byd-group' AND EXISTS ( SELECT 1 FROM lt_course_set_student css2 WHERE css2.course_set_code 
= 'F89TH675Q78' AND css2.train_code = jcr.train_code ) AND (NULL IS NULL OR lsi.NAME LIKE CAST(NULL 
AS varchar)) AND lsi.train_code IN ( SELECT DISTINCT lcss.train_code FROM lt_course_set lcs 
JOIN lt_course_set_student lcss ON lcs.course_set_code = lcss.course_set_code WHERE lcss.course_set_code 
= 'F89TH675Q78' AND lcss.deleted = false ) AND (NULL IS NULL OR lsi.staff_code = CAST(NULL 
AS varchar)) AND (COALESCE(NULL, 'null') = 'null' OR jcr.begin_learn_time >= NULL) AND (COALESCE(NULL, 
'null') = 'null' OR jcr.begin_learn_time <= NULL) ) jcr order by jcr."createdDate" desc limit 
10 ;


----课程点击量学习人数修正---
update lt_course_info set 
view_count = (select count(1) from lt_interact_record where source_from = 'course' and source_code = lt_course_info.course_code and interact_type = 'click'),
collection_count = (select count(1) from lt_interact_record where source_from = 'course' and source_code = lt_course_info.course_code and interact_type = 'collect'),
like_count = (select count(1) from lt_interact_record where source_from = 'course' and source_code = lt_course_info.course_code and interact_type = 'like'),
learn_count = (select count(1) from lt_join_course_report where course_code = lt_course_info.course_code) ;
                                                                                                        
update lt_notice_info set 
view_count = (select count(1) from lt_interact_record where source_from = 'notice' and source_code = lt_notice_info.notice_code and interact_type = 'click');
                                                                                                                                                                                                                
-----视频切片查询-----
select * from file_info where id in (select file_id from lt_course_chapter where course_code = '003-03-000003' and deleted = false and status = '1')
-- 4478
-- tms/202408/VhAt8UKW6lDd2K922gGZeqRvnF8AdF.mp4
select * from lt_m3u8   where code = 'VhAt8UKW6lDd2K922gGZeqRvnF8AdF'





select * from (select (select code_name from lt_business_code_select where code_type = 'labelid' and code_value = lt_student_info.label_id) 品牌,count(1) 在职人数,sum(case when last_login_time >= '2024-08-30' and last_login_time <= '2024-09-05' then 1 else 0 end) 最近7天登录人数 from lt_student_info where agent_state = '01' and label_id <> '' group by label_id

union
select b.name 品牌,count(1) 在职人数,sum(case when last_login_time >= '2024-08-30' and last_login_time <= '2024-09-05' then 1 else 0 end) 最近7天登录人数 from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商') group by substr(a.manage_com,0,12),b.name

union
select b.name 品牌,count(1) 在职人数,sum(case when last_login_time >= '2024-08-30' and last_login_time <= '2024-09-05' then 1 else 0 end) 最近7天登录人数 from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势经销商') group by substr(a.manage_com,0,6),b.name) q order by 品牌;


-----铁军特供------
-----月活越数据------
select * from (
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,count(1) 在职人数,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) 活跃人数10月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-11') then 1 else 0 end) 活跃人数11月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-12') then 1 else 0 end) 活跃人数12月
from lt_student_info a where agent_state = '01' and label_id <> '' group by label_id
union
select '直营' 类型,b.name 品牌,count(1) 在职人数,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) 活跃人数10月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-11') then 1 else 0 end) 活跃人数11月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-12') then 1 else 0 end) 活跃人数12月
from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商') group by substr(a.manage_com,0,12),b.name
union
select '经销商' 类型,b.name 品牌,count(1) 在职人数,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) 活跃人数10月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-11') then 1 else 0 end) 活跃人数11月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-12') then 1 else 0 end) 活跃人数12月
from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') group by substr(a.manage_com,0,6),b.name) 
q order by 类型,品牌;

-----日活跃数据------
select * from (
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a,sys_session c where agent_state = '01' and label_id <> '' and a.train_code = c.login and c.created_date >= '2024-09-01' and c.created_date < '2025-01-01' group by label_id,to_char(c.created_date, 'YYYY-MM-DD')
union
select '直营' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商')  and a.train_code = c.login and c.created_date >= '2024-09-01' and c.created_date < '2025-01-01' group by substr(a.manage_com,0,12),b.name,to_char(c.created_date, 'YYYY-MM-DD')
union
select '经销商' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') and a.train_code = c.login and c.created_date >= '2024-09-01' and c.created_date < '2025-01-01' group by substr(a.manage_com,0,6),b.name,to_char(c.created_date, 'YYYY-MM-DD')) 
q order by 类型,品牌;



----视频切片是否有错误-----
select * from file_info where id in (select file_id from lt_course_chapter where course_code = '003-03-000003' and deleted = false and status = '1')
-- 4478
-- tms/202408/VhAt8UKW6lDd2K922gGZeqRvnF8AdF.mp4
select * from lt_m3u8   where code = 'VhAt8UKW6lDd2K922gGZeqRvnF8AdF'


-- 定义查询条件
SELECT 
    a.course_code 课程编码, 
    b.course_name 课程名称,
		b.created_by_staff_code 创建人工号,
		b.created_by_name 创建人姓名,
		b.created_by_manage_com_name 创建人机构,
		a.chapter_code 章节编码, 
    a.chapter_name 章节名称,
		(SELECT code_name FROM sys_code_select WHERE code_type = 'filetypeoption' AND code_value = a.file_type) 课件类型, 
    (SELECT code_name FROM sys_code_select WHERE code_type = 'status' AND code_value = a.status) 上下架管理,
    COALESCE(a.time_duration, 0) 课件时长, 
    (SELECT COUNT(DISTINCT c.train_code) FROM counter_trance_log c WHERE c.course_code = a.course_code AND c.chapter_code = a.chapter_code) 参与学习人数, 
    (SELECT SUM(c.duration_of_this_play) FROM counter_trance_log c WHERE c.course_code = a.course_code AND c.chapter_code = a.chapter_code) 学习分钟数, 
    (SELECT COUNT(c.id) FROM counter_trance_log c WHERE c.course_code = a.course_code AND c.chapter_code = a.chapter_code) 学习次数
FROM 
    lt_course_chapter a 
JOIN 
    lt_course_info b ON a.course_code = b.course_code 
WHERE 
    a.parent_chapter_code <> '0' ;
    




SELECT
    a.course_code as "课程编码",
    a.course_name as "课程名称",
    a.category as "一级分类",
    a.subcategory as "二级分类",
    a.chapter_count as "章节总数",
    a.evaluation_score as "评估分",
    a.view_count as "浏览次数",
    a.created_by_name as "创建人",
    a.created_by_manage_com as "创建机构",
    a.category_string as "课程分类",
    (SELECT COALESCE(SUM(c.time_duration), 0) FROM lt_course_chapter c WHERE c.course_code = a.course_code) as "时长",
    (SELECT COUNT(c.train_code) FROM lt_join_course_report c WHERE c.course_code = a.course_code) as "加入人数",
    a.learn_count as "学习总量",
    (SELECT COUNT(c.train_code) FROM lt_join_course_report c WHERE c.course_code = a.course_code AND c.is_finish = '4') as "完成人数",
    (SELECT COUNT(DISTINCT c.train_code) FROM counter_analyse_result c WHERE c.course_code = a.course_code) as "学习人数",
    (SELECT COUNT(DISTINCT c.train_code) FROM counter_analyse_result c WHERE c.course_code = a.course_code AND c.play_percent > 0.1) as "realLearnPerson",
    (SELECT COALESCE(SUM(c.duration_of_this_play), 0) FROM counter_trance_log c WHERE c.course_code = a.course_code) as "学习时长总数",
    (SELECT COUNT(c.id) FROM lt_interact_record c WHERE c.source_from = 'course' AND c.source_code = a.course_code AND c.interact_type = 'click') as "学习次数",
    (SELECT COUNT(c.id) FROM lt_interact_record c WHERE c.source_from = 'course' AND c.source_code = a.course_code AND c.interact_type = 'collect') as "收藏人数",
    (SELECT COUNT(c.id) FROM lt_evaluation_trajectory c WHERE c.evaluation_object = 'online-course-content' AND c.object_code = a.course_code) as "评论人数"
FROM
    lt_course_info a
WHERE
    a.teach_way IN ('02', '03') AND a.audit_state = '11';


SELECT 
    subquery.exam_code 考试编码,
		lei.exam_name 考试名称,
    subquery.count_train_code,
    subquery.count_distinct_train_code 考试人数
FROM (
    SELECT 
        exam_code,
        COUNT(train_code) AS count_train_code,
        COUNT(DISTINCT train_code) AS count_distinct_train_code
    FROM 
        lt_exam_student
    WHERE 
        deleted = false 
        AND status = '1'
        AND EXISTS (
            SELECT 1 
            FROM lt_exam_info 
            WHERE 
                deleted = false 
                AND data_cate = 'test' 
                AND source_from = 'common' 
                AND exam_code = lt_exam_student.exam_code
        )
    GROUP BY 
        exam_code
) AS subquery
left join lt_exam_info lei on lei.exam_code = subquery.exam_code
ORDER BY 
    subquery.count_train_code DESC
LIMIT 10;



SELECT '累计登录人数' AS 类别, COUNT(1) AS 数量 FROM lt_student_info WHERE last_login_time IS NOT NULL
UNION ALL
SELECT '面授课程', COUNT(1) FROM lt_course_info WHERE teach_way = '01'
UNION ALL
SELECT '线上课程', COUNT(1) FROM lt_course_info WHERE teach_way = '02'
UNION ALL
SELECT '发布考试数量', COUNT(1) FROM lt_exam_info WHERE data_cate = 'test' AND source_from = 'common'
UNION ALL
SELECT '讲师数量', COUNT(1) FROM lt_teacher_info WHERE agent_state = '01'
UNION ALL
SELECT '计划中班级数量', COUNT(1) FROM lt_course_program WHERE train_state = '00'
UNION ALL
SELECT '报名中班级数量', COUNT(1) FROM lt_course_program WHERE train_state = '01'
UNION ALL
SELECT '进行中班级数量', COUNT(1) FROM lt_course_program WHERE train_state = '02'
UNION ALL
SELECT '已结班班级数量', COUNT(1) FROM lt_course_program WHERE train_state = '03';

  


SELECT
    subquery.manage_com,
    subquery.name,
    COUNT(lci.id) AS count  -- 假设 lt_cii_ion 表中有一个 id 字段用于计数
FROM
    (
        SELECT
            manage_com,
            name
        FROM
            sync_dict sd
        LEFT JOIN sync_org so ON so.org_grade = sd.code_value
        LEFT JOIN sys_manage_com subquery ON subquery.out_com_code = so.org_code
        WHERE
            sd.code_name = '事业部'
    ) subquery
LEFT JOIN lt_course_info lci ON lci.created_by_manage_com LIKE subquery.manage_com || '%'
GROUP BY
    subquery.manage_com,
    subquery.name
ORDER BY
    count DESC
		limit 10



SELECT
    subquery.manage_com,
    subquery.name,
    COUNT(lci.id) AS count  -- 假设 lt_cii_ion 表中有一个 id 字段用于计数
FROM
    (
        SELECT
            manage_com,
            name
        FROM
            sync_dict sd
        LEFT JOIN sync_org so ON so.org_grade = sd.code_value
        LEFT JOIN sys_manage_com subquery ON subquery.out_com_code = so.org_code
        WHERE
            sd.code_name = '事业部'
    ) subquery
LEFT JOIN lt_student_info lci ON lci.manage_com LIKE subquery.manage_com || '%'
where lci.last_login_time is not null
GROUP BY
    subquery.manage_com,
    subquery.name
ORDER BY
    count DESC
		limit 10





WITH LimitedLogin AS (
    SELECT
		subquery.name,
        subquery.manage_com,
        COUNT(lci.id) AS count_limited
    FROM
    (
        SELECT
            manage_com,name
        FROM
            sync_dict sd
        LEFT JOIN sync_org so ON so.org_grade = sd.code_value
        LEFT JOIN sys_manage_com subquery ON subquery.out_com_code = so.org_code
        WHERE
            sd.code_name = '事业部'
    ) subquery
    LEFT JOIN lt_student_info lci ON lci.manage_com LIKE subquery.manage_com || '%'
    WHERE lci.last_login_time IS NOT NULL
    GROUP BY
        subquery.manage_com,
				subquery.name
),
UnlimitedLogin AS (
    SELECT
		subquery.name,
        subquery.manage_com,
        COUNT(lci.id) AS count_unlimited
    FROM
    (
        SELECT
            manage_com,
						name
        FROM
            sync_dict sd
        LEFT JOIN sync_org so ON so.org_grade = sd.code_value
        LEFT JOIN sys_manage_com subquery ON subquery.out_com_code = so.org_code
        WHERE
            sd.code_name = '事业部'
    ) subquery
    LEFT JOIN lt_student_info lci ON lci.manage_com LIKE subquery.manage_com || '%'
    GROUP BY
        subquery.manage_com,subquery.name
)
SELECT
    ll.manage_com,
		ll.name,
		 ll.count_limited,
    u.count_unlimited,
   
    ll.count_limited * 1.0 / NULLIF(u.count_unlimited, 0) AS ratio -- 避免除以零的错误
FROM
    LimitedLogin ll
LEFT JOIN UnlimitedLogin u ON ll.manage_com = u.manage_com
ORDER BY
    ll.count_limited DESC
		LIMIT 12





SELECT 
    lei.exam_code,
    lei.exam_begin_time AS exam_start,
    lei.exam_end_time AS exam_end,
    lcps.schedule_code,
    lcps.begin_time AS schedule_begin_time,
    lcps.end_time AS schedule_end_time
FROM 
    lt_course_program_schedule lcps
JOIN 
    lt_exam_info lei 
ON 
    lei.exam_code = lcps.schedule_code
where lei.source_from='train'




UPDATE lt_exam_info lei
INNER JOIN lt_course_program_schedule lcps
ON lei.exam_code = lcps.schedule_code
SET lei.start = lcps.begin_time,
    lei.end = lcps.end_time;

/**修正考试数据*/
UPDATE lt_exam_info 
SET exam_begin_time = ( SELECT lcps.begin_time FROM lt_course_program_schedule lcps WHERE lt_exam_info.exam_code = lcps.schedule_code ),
exam_end_time = ( SELECT lcps.end_time FROM lt_course_program_schedule lcps WHERE lt_exam_info.exam_code = lcps.schedule_code ),
min_exam_duration = 1 
WHERE
	source_from = 'train' 
	AND created_date >= '2024-12-04' 
	AND (
		exam_begin_time <> ( SELECT lcps.begin_time FROM lt_course_program_schedule lcps WHERE lt_exam_info.exam_code = lcps.schedule_code ) 
	OR exam_end_time <> ( SELECT lcps.end_time FROM lt_course_program_schedule lcps WHERE lt_exam_info.exam_code = lcps.schedule_code ) 
	);

/**
集团考试问题数据
*/

SELECT
	lei.created_date,
	lcps.created_date,
	lei.last_modified_date,
	lcps.last_modified_date,
	lei.exam_code,
	lei.exam_begin_time AS exam_start,
	lei.exam_end_time AS exam_end,
	lcps.schedule_code,
	lcps.begin_time AS schedule_begin_time,
	lcps.end_time AS schedule_end_time 
FROM
	lt_course_program_schedule lcps
	JOIN lt_exam_info lei ON lei.exam_code = lcps.schedule_code 
WHERE
	lei.source_from = 'train' 
	AND lei.created_date > '2024-11-15'









-----考试查询-----

SELECT exam_code,count(DISTINCT(train_code)) FROM "lt_exam_student" WHERE created_date >= '2024-12-05 17:30:00.000' AND created_date < '2024-12-05 20:00:00.000' GROUP BY exam_code order by count DESC

TO_CHAR(created_date, 'YYYY-MM-DD HH24'),

select  TO_CHAR(created_date, 'YYYY-MM-DD'),count(1) from lt_exam_question_student where created_date >='2024-11-01 00:00:00.000'GROUP BY TO_CHAR(created_date, 'YYYY-MM-DD') ORDER BY TO_CHAR(created_date, 'YYYY-MM-DD')

select count(1) from sys_session where created_date >='2024-12-05 00:00:00.000' 

select * from lt_exam_info where test_paper_code ='4QNYW8D7XS0'

select * from lt_course_info where course_code ='4QNYXS17XF4'




----------授课记录查询---------
SELECT
	lcp.program_code AS "班级编码",
	lcp.program_name AS "班级名称",
	( SELECT type_name FROM lt_course_program_type WHERE type_code = lcp.program_type ) AS "培训子类",
CASE
		
		WHEN lcp.is_important = 'Y' THEN
		'是' 
		WHEN lcp.is_important = 'N' THEN
		'否' 
	END AS "是否是重点项目",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.publish_range AND code_type = 'publishrange' ) AS "组织形式",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.training_level AND code_type = 'traininglevel' ) AS "培训层级",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.training_methods AND code_type = 'trainingmethods' ) AS "培训方式",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.important_level AND code_type = 'importantlevel' ) AS "重要班级级别",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.train_state AND code_type = 'trainstatus' ) AS "班级状态",
	( SELECT ad_name FROM sys_ad_code WHERE ad_code = lcp.train_area ) AS "培训地区",
	lcp.program_address AS "班级地点",
	lcp.created_by_manage_com_name AS "机构名称",
	lcp.created_by_staff_code AS "创建人工号",
	lcp.created_by_name AS "创建人",
CASE
		
		WHEN 'YT' = 'JT' THEN
		CONCAT_WS ( '-', lcps.program_code, lcps.schedule_code ) ELSE CONCAT_WS ( '', lcps.ID ) 
	END AS "唯一编码",
	lcp.category_string,
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.category_string AND code_type = 'classify' ) AS "分类",
	( SELECT code_name FROM sys_code_select WHERE code_value = lci.course_level AND code_type = 'courselevel' ) AS "课程层级",
	lci.course_code AS "课程编码",
	lci.is_company_registered,
CASE
		
		WHEN lci.is_company_registered = 'Y' THEN
		'是' 
		WHEN lci.is_company_registered = 'N' THEN
		'否' 
	END AS "是否公司备案课程",
	lcps.schedule_content AS "日程内容",
CASE
		
		WHEN lcps.schedule_type = 'offline-course' THEN
		'面授课程' 
		WHEN lcps.schedule_type = 'online-course' THEN
		'线上课程' 
	END AS "日程类型",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'workingtime' AND code_value = lcps.working_time ) AS "是否工作时间",
	TO_CHAR( lcps.begin_time + INTERVAL '8 hours', 'YYYY-MM-DD' ) AS "授课时间",
	lcps.begin_time AS "开始时间",
	lcps.end_time AS "结束时间",
	lcps.flow_id AS "流程id",
	lcps.actual_course_hours AS "实际课时",
	lcps.class_hour_coefficient AS "授课系数",
	lcps.teacher_name AS "讲师姓名(工号)",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value = lcps.teach_level ) AS "讲师级别",
	lcps.teacher_com AS "讲师机构",
	lti.manage_com_name AS "机构名称",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teachertype' AND code_value = lcps.teacher_type ) AS "讲师类型",
CASE
		
		WHEN 'YT' = 'JT' THEN
		lcps.teacher_evaluation_score ELSE lcps.evaluation_score 
	END AS "讲师综合评分",
CASE
		
		WHEN lcps.certified = 'Y' THEN
		'已认证' 
		WHEN lcps.certified = 'N' THEN
		'非认证' 
	END AS "认证状态",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'auditstate' AND code_value = lcps.audit_state ) AS "面授授课记录审批状态",
	case when lcps.is_push = 'Y' then '是' when lcps.is_push = 'N' then '否' end as "面授授课记录是否已推送",
	lcps.audit_option AS "审批意见",
	CAST (
	CASE
			
			WHEN 'YT' = 'JT' THEN
			(
			SELECT COUNT
				( * ) 
			FROM
				lt_attendance 
			WHERE
				program_code = lcps.program_code 
				AND course_code = lcps.schedule_code 
				AND train_code IN ( SELECT train_code FROM lt_course_program_enroll WHERE program_code = lcps.program_code AND enroll_state = '02' AND deleted = FALSE ) 
				AND deleted = FALSE 
			) ELSE ( SELECT COUNT ( 1 ) FROM lt_course_program_enroll WHERE program_code = lcps.program_code AND enroll_state = '02' AND deleted = FALSE ) 
	END AS VARCHAR 
	) AS "学员数量",
	lcps.apply_time AS "申请时间",
	lcps.audit_time AS "审批时间",
	lcps.remark AS "备注",
	TO_CHAR( lcps.begin_time + INTERVAL '8 hours', 'YYYY-MM-DD HH24:MI' ) AS "授课开始时间",
	CONCAT_WS ( '', lcps.actual_course_hours ) AS "实际课时",
	'线下' AS "培训形式",
	'人力资源处' AS "数据来源",
	lcp.last_modified_by AS "最后一次修改人" 
FROM
	lt_course_program_schedule lcps
	JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code
	JOIN lt_course_info lci ON lcps.schedule_code = lci.course_code
	JOIN lt_teacher_info lti ON lcps.teacher_code = lti.teacher_code
	JOIN lt_course_program_type lcpt ON lcpt.type_code = lcp.program_type 
WHERE
	lcps.schedule_type = 'offline-course' 
	AND lcps.end_time < NOW( ) 
	AND lcp.deleted = FALSE 
	AND lcp.manage_com LIKE'%A86%' 
ORDER BY
	lcps.begin_time;






------集团授课记录------
----------授课记录查询---------
SELECT
	lcp.program_code AS "班级编码",
	lcp.program_name AS "班级名称",
	( SELECT type_name FROM lt_course_program_type WHERE type_code = lcp.program_type ) AS "培训子类",
CASE
		
		WHEN lcp.is_important = 'Y' THEN
		'是' 
		WHEN lcp.is_important = 'N' THEN
		'否' 
	END AS "是否是重点项目",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.publish_range AND code_type = 'publishrange' ) AS "组织形式",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.training_level AND code_type = 'traininglevel' ) AS "培训层级",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.training_methods AND code_type = 'trainingmethods' ) AS "培训方式",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.important_level AND code_type = 'importantlevel' ) AS "重要班级级别",
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.train_state AND code_type = 'trainstatus' ) AS "班级状态",
	( SELECT ad_name FROM sys_ad_code WHERE ad_code = lcp.train_area ) AS "培训地区",
	lcp.program_address AS "班级地点",
	lcp.created_by_manage_com_name AS "机构名称",
	lcp.created_by_staff_code AS "创建人工号",
	lcp.created_by_name AS "创建人",
CASE
		
		WHEN 'YT' = 'JT' THEN
		CONCAT_WS ( '-', lcps.program_code, lcps.schedule_code ) ELSE CONCAT_WS ( '', lcps.ID ) 
	END AS "唯一编码",
	lcp.category_string,
	( SELECT code_name FROM sys_code_select WHERE code_value = lcp.category_string AND code_type = 'classify' ) AS "分类",
	( SELECT code_name FROM sys_code_select WHERE code_value = lci.course_level AND code_type = 'courselevel' ) AS "课程层级",
	lci.course_code AS "课程编码",
	lci.is_company_registered,
CASE
		
		WHEN lci.is_company_registered = 'Y' THEN
		'是' 
		WHEN lci.is_company_registered = 'N' THEN
		'否' 
	END AS "是否公司备案课程",
	lcps.schedule_content AS "日程内容",
CASE
		
		WHEN lcps.schedule_type = 'offline-course' THEN
		'面授课程' 
		WHEN lcps.schedule_type = 'online-course' THEN
		'线上课程' 
	END AS "日程类型",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'workingtime' AND code_value = lcps.working_time ) AS "是否工作时间",
	TO_CHAR( lcps.begin_time + INTERVAL '8 hours', 'YYYY-MM-DD' ) AS "授课时间",
	lcps.begin_time AS "开始时间",
	lcps.end_time AS "结束时间",
	lcps.flow_id AS "流程id",
	lcps.actual_course_hours AS "实际课时",
	lcps.class_hour_coefficient AS "授课系数",
	lcps.teacher_name AS "讲师姓名(工号)",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value = lcps.teach_level ) AS "讲师级别",
	lcps.teacher_com AS "讲师机构",
	lti.manage_com_name AS "机构名称",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teachertype' AND code_value = lcps.teacher_type ) AS "讲师类型",
		lcps.teacher_evaluation_score  AS "讲师综合评分",
CASE
		
		WHEN lcps.certified = 'Y' THEN
		'已认证' 
		WHEN lcps.certified = 'N' THEN
		'非认证' 
	END AS "认证状态",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'auditstate' AND code_value = lcps.audit_state ) AS "面授授课记录审批状态",
	case when lcps.is_push = 'Y' then '是' when lcps.is_push = 'N' then '否' end as "面授授课记录是否已推送",
	lcps.audit_option AS "审批意见",
	CAST (
	CASE
			
			WHEN 'YT' = 'JT' THEN
			(
			SELECT COUNT
				( * ) 
			FROM
				lt_attendance 
			WHERE
				program_code = lcps.program_code 
				AND course_code = lcps.schedule_code 
				AND train_code IN ( SELECT train_code FROM lt_course_program_enroll WHERE program_code = lcps.program_code AND enroll_state = '02' AND deleted = FALSE ) 
				AND deleted = FALSE 
			) ELSE ( SELECT COUNT ( 1 ) FROM lt_course_program_enroll WHERE program_code = lcps.program_code AND enroll_state = '02' AND deleted = FALSE ) 
	END AS VARCHAR 
	) AS "学员数量",
	lcps.apply_time AS "申请时间",
	lcps.audit_time AS "审批时间",
	lcps.remark AS "备注",
	TO_CHAR( lcps.begin_time + INTERVAL '8 hours', 'YYYY-MM-DD HH24:MI' ) AS "授课开始时间",
	CONCAT_WS ( '', lcps.actual_course_hours ) AS "实际课时",
	'线下' AS "培训形式",
	'人力资源处' AS "数据来源",
	lcp.last_modified_by AS "最后一次修改人" 
FROM
	lt_course_program_schedule lcps
	JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code
	JOIN lt_course_info lci ON lcps.schedule_code = lci.course_code
	JOIN lt_teacher_info lti ON lcps.teacher_code = lti.teacher_code
	JOIN lt_course_program_type lcpt ON lcpt.type_code = lcp.program_type 
WHERE
	lcps.schedule_type = 'offline-course' 
	AND lcps.end_time < NOW( ) 
	AND lcp.deleted = FALSE 
	AND lcp.manage_com LIKE'%A86%' 
ORDER BY
	lcps.begin_time;



------考试成绩按编码查询--------
SELECT
	lei.exam_code 考试编码,
	lei.exam_name 考试名称,
	lei.test_paper_code 试卷编码,
	lei.test_paper_name 试卷名称,
	les.start_time 开始时间,
	les.end_time 结束时间,
	lsi.NAME 姓名,
	lsi.staff_code 工号,
	lsi.manage_com_name 学员所属机构,
	les.exam_count 考试次数,
	( les.all_question_count - les.wrong_question_count ) AS "答对题数",
	les.wrong_question_count 答错题数,
	les.score 考试成绩 
FROM
	lt_exam_info lei
	INNER JOIN lt_exam_student les ON ( lei.exam_code = les.exam_code )
	INNER JOIN lt_student_info lsi ON ( les.train_code = lsi.train_code ) 
WHERE
	lei.exam_code = '4QETUDD7BOT-4QETSPJQ8WW' ----考试编码可替换---
	
ORDER BY
	les.created_date DESC;



-- 查询用户课程学习报表的SQL语句
SELECT * FROM (
  SELECT DISTINCT 
    b.manage_com_name AS "所属机构",
    b.staff_code AS "工号",
    b.name AS "姓名",
    lci.course_code AS "课程编码",
    lci.course_name AS "课程名称",
    lci.category_string AS "课程分类",
    (SELECT COALESCE(SUM(time_duration), 0) FROM lt_course_chapter WHERE course_code = lci.course_code) AS "timeDuration",
    (SELECT d.created_date FROM counter_trance_log d WHERE d.course_code = lci.course_code AND d.train_code = b.train_code ORDER BY d.created_date DESC LIMIT 1) AS "lastLearnTime",
    (SELECT case when is_finish = '1' then '学习中' when is_finish ='4' then '已完成' end as isfinish FROM lt_join_course_report ljcr WHERE ljcr.course_code = lci.course_code AND ljcr.source_code = lci.course_code AND ljcr.source_from = 'course' AND ljcr.train_code = b.train_code LIMIT 1) AS "课程学习进度",
    case when lci.teach_way ='02' then '线上课程' end AS "培训形式",
     (SELECT ROUND(SUM(COALESCE(d.duration_of_this_play, 0)) / 3600, 2) as learnTime FROM counter_trance_log d WHERE d.course_code = lci.course_code AND d.train_code = b.train_code) AS "学习时长（时）",
		     (SELECT COALESCE(SUM(COALESCE(d.duration_of_this_play, 0))) FROM counter_trance_log d WHERE d.course_code = lci.course_code AND d.train_code = b.train_code) AS "学习时长（秒）"
  FROM 
    lt_student_info b,
    counter_analyse_result c,
    lt_course_info lci
  WHERE 
    lci.course_code = c.source_code AND
    b.train_code = c.train_code and lci.course_code = 'P4-07-001150'
) AS subquery;


-----班级人数对不上------
SELECT
	* 
FROM
	lt_course_program_enroll 
WHERE
	program_code = '4PXFQUQG6P9' 
	AND train_code NOT IN ( SELECT train_code FROM lt_student_info WHERE train_code IN ( SELECT train_code FROM lt_course_program_enroll WHERE program_code = '4PXFQUQG6P9' AND deleted = FALSE ) );


-------课程评价--------
SELECT
	ltett.source_code 课程编码,
	ltett.source_name 课程名称,
	ltett.CONTENT 内容,
CASE
		
		WHEN ltett.status = '0' THEN
		'待审批' 
		WHEN ltett.status = '1' THEN
		'通过' 
		WHEN ltett.status = '9' THEN
		'驳回' 
	END AS 审批状态,
	ltett.created_by_manage_com_name 所属机构 ,
	ltett.created_by_staff_code 工号,
	ltett.created_by_name 姓名,
	ltett.created_date 评估时间,
	ltett.last_modified_by 最后修改人,
	ltett.last_modified_date 最后修改时间 
FROM
	lt_evaluation_trajectory ltett 
WHERE
	ltett.parent_id = 0 
	AND ltett.evaluation_object = 'online-course-content' 
	AND ( UPPER ( ltett.created_by_manage_com ) LIKE'%A86%' ) 
	AND ltett.company = 'byd-group' 
	AND ltett.deleted = FALSE 
ORDER BY
	ltett.created_date DESC 

-------面授课程学习记录---------
SELECT
	lsi.manage_com_name 所属机构,
	lsi.staff_code 工号,
	lsi.NAME 姓名,
	lcp.program_code 班级编码,
	lcp.program_name 班级名称,
	COALESCE ( lcpt1.type_name, lcpt2.type_name ) AS "培训项目",
	lcpt2.type_name AS "培训子类",
	( SELECT code_name FROM sys_code_select WHERE code_type = 'trainstatus' AND code_value = lcp.train_state ) AS "班级状态",
	lcps.schedule_code 课程编码,
	lcps.schedule_content 课程名称,
	lcps.teacher_name 讲师工号姓名,
	lti.manage_com_name 讲师机构,
	CONCAT_WS ( '', DATE ( ( lcps.begin_time + INTERVAL '8 hours' ) ) ) 授课日期,
	lcps.begin_time 授课开始时间,
	lcps.end_time 授课结束时间,
	lcps.course_hours 课程学时,
CASE
		
		WHEN lcpe.finish_state = '00' THEN
		'进行中' 
		WHEN lcpe.finish_state = '01' THEN
		'未结业' 
		WHEN lcpe.finish_state = '02' THEN
		'结业' ELSE'其他' 
	END AS "结业状态",
	(
	CASE
			
			WHEN EXISTS (
			SELECT
				1 
			FROM
				lt_attendance la 
			WHERE
				la.program_code = lcp.program_code 
				AND la.course_code = lcps.schedule_code 
				AND la.train_code = lcpe.train_code 
				AND la.deleted = 'f' 
				) THEN
				lcps.actual_course_hours ELSE 0 
			END 
			) 实际课时 
		FROM
			lt_course_program_enroll lcpe,
			lt_student_info lsi,
			lt_course_program lcp,
			lt_course_program_schedule lcps,
			lt_teacher_info lti,
			lt_course_program_type cptype,
			lt_course_program_type lcpt1,
			lt_course_program_type lcpt2 
		WHERE
			lcpe.train_code = lsi.train_code 
			AND lcpe.deleted = 'f' 
			AND lcps.teacher_code = lti.teacher_code 
			AND lcpe.program_code = lcp.program_code 
			AND lcp.program_code = lcps.program_code 
			AND lcps.deleted = 'f' 
			AND lcps.schedule_type = 'offline-course' 
			AND lcp.audit_state = '11' 
			AND lcp.program_type = cptype.type_code 
			AND split_part( lcp.category_string, ',', 1 ) = lcpt1.type_code 
			AND lcpt2.type_code = lcp.program_type 
			AND lsi.work_address = '3146403108' 
	ORDER BY
	lcp.course_start_time DESC;




-----课程学习记录按课程编码搜索
SELECT
	b.manage_com_name AS "所属机构",
	b.staff_code AS "工号",
	b.NAME AS "姓名",
	A.course_code AS "课程编码",
	C.course_name AS "课程名称",
	A.begin_learn_time AS "开始时间",
	A.finish_learn_time AS "完成时间",
CASE
		
		WHEN A.is_finish = '4' THEN
		'已完成' 
		WHEN A.is_finish = '1' THEN
		'进行中' 
	END AS "是否已完成",
	(
		SUM ( car.video_length * car.play_percent ) / ( SELECT SUM ( time_duration ) FROM lt_course_chapter WHERE course_code = A.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE ) 
	) AS "学习进度" 
FROM
	lt_join_course_report
	A LEFT JOIN lt_student_info b ON A.train_code = b.train_code
	LEFT JOIN lt_course_info C ON A.course_code = C.course_code
	LEFT JOIN counter_analyse_result car ON A.course_code = car.course_code 
	AND A.train_code = car.train_code 
	AND car.chapter_code IN ( SELECT chapter_code FROM lt_course_chapter WHERE course_code = A.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE ) 
	AND car.source_from = A.source_from 
	AND car.company = b.company 
WHERE
	b.ID IS NOT NULL 
	AND C.ID IS NOT NULL 
	AND b.work_address = '3146403108' 
GROUP BY
	A.course_code,
	C.course_name,
	A.source_code,
	b.manage_com,
	b.manage_com_name,
	A.train_code,
	b.NAME,
	b.staff_code,
	b.agent_state,
	b.mul_auth,
	A.source_from,
	b.label_id,
	A.begin_learn_time,
	A.finish_learn_time,
	A.is_finish;


-----课程编码查询课程素材-----
SELECT
	lci.course_code 课程编码,
	lci.course_name 课程名称,
	lcc.course_file 课程素材
FROM
	lt_course_info lci
	JOIN lt_course_chapter lcc ON lci.course_code = lcc.course_code 
WHERE
lcc.parent_chapter_code <> '0'
and
	lci.course_code IN ( 
	'M2-01-000008',
'M4-01-005636',
'M4-05-005566',
'M3-08-000007',
'P3-06-000007',
'G3-0324030001',
'M4-01-000019',
'M2-01-000002',
'M2-06-000003',
'M4-01-000063',
'M2-01-000011',
'P4-05-000063'
)


-------讲师库信息------
SELECT
	staff_code 工号,
	NAME 姓名,
	manage_com_name 所属机构,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'agentstate' AND code_value = agent_state ) 在职状态,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'teacherlevel' AND code_value = teach_level ) 讲师等级,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'state' AND code_value = teacher_state ) 讲师状态,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'yesorno' AND code_value = is_mob_display ) 是否展示在云库
FROM
	lt_teacher_info 
WHERE
	deleted = FALSE;


-----按考试编码查询每道题正确数量-----
SELECT
    leqs.exam_code 考试编码,
    lq.question_code 题目编码,
		lq.question_content 题目内容,
    CASE leqs.right_or_wrong
        WHEN 'right' THEN '正确'
        WHEN 'wrong' THEN '错误'
        ELSE '未知'
    END AS "是否正确",
    COUNT(*) AS "答对人数"
FROM
    lt_exam_question_student leqs
JOIN
    lt_question lq ON leqs.question_code = lq.question_code
		
		where leqs.exam_code = '4QQFD2QKMH8'
GROUP BY
    leqs.exam_code,
    lq.question_code,
    leqs.right_or_wrong,
    lq.question_content
ORDER BY
    leqs.exam_code, lq.question_code, leqs.right_or_wrong 




--select schedule_code from lt_course_program_schedule where schedule_type = 'online-course' and program_code in ('20240507133744407','20240416151258097','20240416145920731','20240415174039412')

SELECT
lcps.program_code 班级编码,
            ( SELECT program_name FROM lt_course_program WHERE program_code = lcps.program_code ) 
  AS "班级名称",
	ljcr.course_code AS "课程编码",
    lci.course_name AS "课程名称",
    lsi.manage_com_name AS "所属机构",
    lsi.staff_code AS "工号",
    lsi.NAME AS "姓名",
    lsi.manage_com AS "机构编码",
    ljcr.begin_learn_time AS "开始时间",
    ljcr.finish_learn_time AS "完成时间",
    CASE
        WHEN ljcr.is_finish = '4' THEN
            '已完成' 
        WHEN ljcr.is_finish = '1' THEN
            '进行中' 
    END AS "是否已完成",
    (
        SUM(car.video_length * car.play_percent) /
        (
            SELECT COALESCE(SUM(time_duration), 0) 
            FROM lt_course_chapter 
            WHERE course_code = ljcr.course_code 
            AND time_duration IS NOT NULL 
            AND status = '1' 
            AND deleted = FALSE
        )
    )::numeric(10, 4) AS "学习进度",
    ROUND(
        SUM(car.video_length * car.play_percent) / NULLIF(
            (SELECT SUM(time_duration) FROM lt_course_chapter WHERE course_code = ljcr.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE),
            0
        ) * 100,
        4
    ) AS "学习进度百分比"
FROM
    lt_join_course_report ljcr
    LEFT JOIN lt_student_info lsi ON ljcr.train_code = lsi.train_code
    LEFT JOIN lt_course_info lci ON ljcr.course_code = lci.course_code
    LEFT JOIN counter_analyse_result car ON ljcr.course_code = car.course_code 
        AND ljcr.train_code = car.train_code 
        AND car.chapter_code IN ( SELECT chapter_code FROM lt_course_chapter WHERE course_code = ljcr.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE ) 
        AND car.source_from = ljcr.source_from 
        AND car.company = lsi.company 
    LEFT JOIN lt_course_program_schedule lcps ON ljcr.course_code = lcps.schedule_code 
WHERE
    lcps.program_code in ('20240507133744407','20240416151258097','20240416145920731','20240415174039412')

GROUP BY
lcps.program_code,
ljcr.source_code,
    ljcr.course_code,
    lci.course_name,
		lsi.manage_com,
    lsi.manage_com_name,
    ljcr.train_code,
    lsi.NAME,
    lsi.staff_code,
    
    lsi.agent_state,
    lsi.mul_auth,
    lsi.label_id,
    ljcr.source_from,
    
    ljcr.begin_learn_time,
    ljcr.finish_learn_time,
    ljcr.is_finish,
    lcps.schedule_code




-------创建临时表处数据过多------
create TABLE temp_count_log as 
select course_code,train_code ,sum(duration_of_this_play) playtime from counter_trance_log group by course_code,train_code;

SELECT
    stu.manage_com_name AS "所属机构",
    stu.staff_code AS "工号",
    stu.name AS "姓名",
    cou.course_code AS "课程编码",
    cou.course_name AS "课程名称",
    ctl.playtime AS "总学习时长(秒)"
FROM lt_course_info cou 
JOIN temp_count_log ctl  ON ctl.course_code = cou.course_code
JOIN lt_student_info stu ON ctl.train_code = stu.train_code
WHERE cou.deleted=false and stu.staff_code is not null
GROUP BY stu.manage_com_name, stu.staff_code, stu.name, cou.course_code, cou.course_name, cou.category_string, ctl.train_code, ctl.course_code,ctl.playtime 
ORDER BY stu.manage_com_name, stu.staff_code, stu.name, cou.course_code;



--------临时表查询课程学习数据-----------

DROP TABLE IF EXISTS tmp_course_duration;

-- 创建临时表：存储课程总时长
CREATE TEMP TABLE tmp_course_duration AS
SELECT a.course_code, COALESCE(SUM(c.time_duration), 0) AS total_duration
FROM lt_course_info a
LEFT JOIN lt_course_chapter c ON c.course_code = a.course_code
WHERE a.teach_way IN ('02','03') AND a.audit_state = '11'
GROUP BY a.course_code;
CREATE INDEX idx_tmp_course_duration ON tmp_course_duration (course_code);

DROP TABLE IF EXISTS tmp_joiners;

-- 创建临时表：存储参与人数
CREATE TEMP TABLE tmp_joiners AS
SELECT a.course_code, COUNT(c.train_code) AS join_count
FROM lt_course_info a
LEFT JOIN lt_join_course_report c ON c.course_code = a.course_code
WHERE a.teach_way IN ('02','03') AND a.audit_state = '11'
GROUP BY a.course_code;
CREATE INDEX idx_tmp_joiners ON tmp_joiners (course_code);

DROP TABLE IF EXISTS tmp_learners;
-- 创建临时表：存储学习人数和完成人数
CREATE TEMP TABLE tmp_learners AS
SELECT a.course_code, COUNT(DISTINCT c.train_code) AS learner_count, COUNT(CASE WHEN c.is_finish = '4' THEN c.train_code ELSE NULL END) AS finish_person
FROM lt_course_info a
LEFT JOIN lt_join_course_report c ON c.course_code = a.course_code
WHERE a.teach_way IN ('02','03') AND a.audit_state = '11'
GROUP BY a.course_code;
CREATE INDEX idx_tmp_learners ON tmp_learners (course_code);

-- 添加新字段：实际学习人数
ALTER TABLE tmp_learners
ADD COLUMN real_learner_count INT NOT NULL DEFAULT 0;

-- 更新临时表：实际学习人数 (PostgreSQL 正确语法，使用 JOIN)
UPDATE tmp_learners l
SET real_learner_count = subquery.real_learner_count
FROM (
    SELECT c.course_code, COUNT(DISTINCT c.train_code) AS real_learner_count
    FROM counter_analyse_result c
    WHERE c.play_percent > 0.1
    GROUP BY c.course_code
) AS subquery
WHERE l.course_code = subquery.course_code;

-- 创建临时表：存储学习总时间
CREATE TEMP TABLE tmp_total_learning_time AS
SELECT course_code, COALESCE(SUM(duration_of_this_play), 0) AS total_learning_time
FROM counter_trance_log
GROUP BY course_code;
CREATE INDEX idx_tmp_total_learning_time ON tmp_total_learning_time (course_code);

-- 创建临时表：存储播放次数
CREATE TEMP TABLE tmp_play_count AS
SELECT source_code AS course_code, COUNT(*) AS play_count
FROM lt_interact_record
WHERE source_from = 'course' AND interact_type = 'click'
GROUP BY source_code;
CREATE INDEX idx_tmp_play_count ON tmp_play_count (course_code);

-- 创建临时表：存储收藏人数
CREATE TEMP TABLE tmp_collect_count AS
SELECT source_code AS course_code, COUNT(*) AS collect_count
FROM lt_interact_record
WHERE source_from = 'course' AND interact_type = 'collect'
GROUP BY source_code;
CREATE INDEX idx_tmp_collect_count ON tmp_collect_count (course_code);

-- 创建临时表：存储评价人数
CREATE TEMP TABLE tmp_evaluation_count AS
SELECT object_code AS course_code, COUNT(*) AS evaluation_count
FROM lt_evaluation_trajectory
WHERE evaluation_object = 'online-course-content'
GROUP BY object_code;
CREATE INDEX idx_tmp_evaluation_count ON tmp_evaluation_count (course_code);

-- 主查询：使用临时表 (使用中文别名)
SELECT a.course_code AS "课程代码",
       a.course_name AS "课程名称",
       -- ... 其他字段
       ttlt.total_learning_time AS "学习总时间",
       tpc.play_count AS "播放次数",
       tcc.collect_count AS "收藏人数",
       tec.evaluation_count AS "评价人数",
       t.total_duration AS "总时长",
       j.join_count AS "参与人数",
       a.learn_count AS "学习人数",
       l.finish_person AS "完成人数",
       l.learner_count AS "学习总人数",
       l.real_learner_count AS "实际学习人数"
FROM lt_course_info a
LEFT JOIN tmp_course_duration t ON t.course_code = a.course_code
LEFT JOIN tmp_joiners j ON j.course_code = a.course_code
LEFT JOIN tmp_learners l ON l.course_code = a.course_code
LEFT JOIN tmp_total_learning_time ttlt ON ttlt.course_code = a.course_code
LEFT JOIN tmp_play_count tpc ON tpc.course_code = a.course_code
LEFT JOIN tmp_collect_count tcc ON tcc.course_code = a.course_code
LEFT JOIN tmp_evaluation_count tec ON tec.course_code = a.course_code
WHERE a.teach_way IN ('02','03')
  AND a.audit_state = '11';
	
	-- 删除可能已存在的临时表
DROP TABLE IF EXISTS tmp_course_duration;
DROP TABLE IF EXISTS tmp_joiners;
DROP TABLE IF EXISTS tmp_learners;
DROP TABLE IF EXISTS tmp_total_learning_time;
DROP TABLE IF EXISTS tmp_play_count;
DROP TABLE IF EXISTS tmp_collect_count;
DROP TABLE IF EXISTS tmp_evaluation_count;


select 
lci.course_code AS "课程编码",
lci.course_name AS "课程名称",
    CASE
        WHEN lci.course_level = 'department' THEN '部门'
        WHEN lci.course_level = 'BusinessUnit' THEN '事业部'
        WHEN lci.course_level = 'company' THEN '公司'
        WHEN lci.course_level = 'factory' THEN '工厂'
        WHEN lci.course_level = 'section' THEN '科室'
    END AS "课程层级",
    CASE
        WHEN lci.teach_way = '01' THEN '面授课程'
        WHEN lci.teach_way = '02' THEN '线上课程'
        ELSE '---'
    END AS "培训形式",
		lci.created_by_staff_code 创建人工号,
		lci.created_by_name 创建人姓名,
		lci.created_by_manage_com_name 所属机构,
		lci.created_date 创建时间
		
		from lt_course_info lci 
		where lci.created_by_staff_code in ('3510636'    , '7239404' ) and deleted =false;

--------2025年1月2日------
--------trade_source=tj---------

update lt_student_info set trade_source = 'TJ' WHERE id in (
select id from lt_student_info where staff_code is null and e_mail like '%@temp.com' and manage_com = 'A8603' and trade_source is not null and stu_flag = '3');


--------面授总课时计算---------
SELECT SUM( lcps.actual_course_hours ) AS 面授课程总实际课时
FROM lt_attendance la
JOIN lt_course_program_schedule lcps ON la.course_code = lcps.schedule_code
JOIN lt_student_info lsi ON lsi.train_code = la.train_code
WHERE
    lcps.schedule_type = 'offline-course'
    AND la.created_date < '2025-01-01'
    AND lcps.deleted = 'f'
    AND la.deleted = 'f'
    AND lsi.agent_grade IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'O')
    AND lsi.work_address IN (
        SELECT code_value FROM sync_dict WHERE code_name NOT LIKE 'F%' AND code_type = 'BYD工作地点'
    )
    AND lsi.trade_source='HR';

--------线上总课时计算---------
SELECT
    SUM(ctl.duration_of_this_play) / 3600 AS "线上课程总学习时长(小时)"
FROM
    counter_trance_log ctl
JOIN
    lt_student_info lsi ON ctl.train_code = lsi.train_code
WHERE
    lsi.agent_grade IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'O')
    AND lsi.trade_source = 'HR'
    AND ctl.created_date < '2025-01-01'
    AND lsi.work_address IN (
        SELECT code_value 
        FROM sync_dict 
        WHERE code_name NOT LIKE 'F%' AND code_type = 'BYD工作地点'
    )
    AND ctl.deleted = FALSE;
