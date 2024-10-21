/*
学员库线上培训记录
**/
SELECT
	lsi.manage_com AS "机构编码",
	lsi.manage_com_name AS "所属机构",
	lsi.staff_code AS "工号",
	lsi.NAME AS "姓名",
	lci.course_code AS "课程编码",
	lci.course_name AS "课程名称",
	ljcr.begin_learn_time AS "开始学习时间",
	ljcr.finish_learn_time AS "结束学习时间",
CASE
		
		WHEN ljcr.is_finish = '1' THEN
		'进行中' 
		WHEN ljcr.is_finish = '4' THEN
		'已完成' 
	END AS "学习状态",
	(
		SUM ( car.video_length * car.play_percent ) / ( SELECT SUM ( time_duration ) FROM lt_course_chapter WHERE course_code = ljcr.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE ) 
	) AS "学习进度" 
FROM
	lt_join_course_report ljcr
	LEFT JOIN lt_student_info lsi ON ljcr.train_code = lsi.train_code
	LEFT JOIN lt_course_info lci ON ljcr.course_code = lci.course_code
	LEFT JOIN lt_course_program_schedule lcps ON lcps.schedule_type = 'online-course' 
	AND ljcr.course_code = lcps.schedule_code 
	AND lcps.deleted =
	FALSE LEFT JOIN lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code 
	AND lcpe.train_code = ljcr.train_code 
	AND lcpe.deleted =
	FALSE LEFT JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code
	LEFT JOIN counter_analyse_result car ON ljcr.course_code = car.course_code 
	AND ljcr.train_code = car.train_code 
	AND car.chapter_code IN (
	SELECT
		chapter_code 
	FROM
		lt_course_chapter 
	WHERE
		time_duration IS NOT NULL 
		AND status = '1' 
		AND deleted = FALSE 
		AND car.source_from = ljcr.source_from 
		AND car.company = lsi.company 
	) 
WHERE
		
	AND lsi.ID IS NOT NULL 
	AND lci.ID IS NOT NULL 
GROUP BY
	lsi.manage_com,
	lsi.manage_com_name,
	lsi.staff_code,
	lsi.NAME,
	lci.course_code,
	lci.course_name,
	ljcr.begin_learn_time,
	ljcr.finish_learn_time,
	ljcr.is_finish


/*
学员库外部培训记录
**/
SELECT
  lsi.manage_com AS "机构编码",
  lsi.manage_com_name AS "所属机构",
  lsi.staff_code AS "工号",
  lsi.NAME AS "姓名",
  lolr.begin_learn_time AS "开始学习时间",
  lolr.finish_learn_time AS "结束学习时间",
  lolr.remark AS "备注",
  lolr.created_by_name AS "导入人",
  lolr.created_date AS "导入时间" 
FROM
  lt_outer_learn_record lolr,
  lt_student_info lsi 
WHERE
  lolr.train_code = lsi.train_code 
ORDER BY
  lolr.begin_learn_time DESC;


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
考试成绩
**/
SELECT 
    lei.exam_code AS 考试编码,
    lei.exam_name AS 考试名称,
    MAX((SELECT code_name FROM sys_code_select WHERE code_type = 'examstate' AND code_value = les.exam_state)) AS 考试状态,
    MAX(les.score) AS 考试成绩,
    MAX(les.exam_count) AS 考试次数,
    MAX(lsi.staff_code) AS 工号,
    MAX(lsi."name") AS 姓名,
    MAX(lsi.job_position) AS 岗位,
    MAX(lsi.manage_com_name) AS 机构 
FROM 
    lt_exam_info lei
    INNER JOIN lt_exam_student les ON lei.exam_code = les.exam_code 
    INNER JOIN lt_exam_question_student leqs ON les.train_code = leqs.train_code AND les.exam_count = leqs.exam_count 
    INNER JOIN lt_question lq ON leqs.question_code = lq.question_code 
    INNER JOIN lt_student_info lsi ON les.train_code = lsi.train_code 
WHERE 
    lei.exam_code IN () 
GROUP BY 
    lei.exam_code,
   lei.exam_name,
    lsi.staff_code,
    lsi."name",
    lsi.job_position,
    lsi.manage_com_name
ORDER BY 
    lei.exam_code,
    lsi.staff_code;

/*
考试成绩
**/
select count(1) from(
SELECT 
    lei.exam_code AS 考试编码,
    lei.exam_name AS 考试名称,
    MAX((SELECT code_name FROM sys_code_select WHERE code_type = 'examstate' AND code_value = les.exam_state)) AS 考试状态,
    MAX(les.score) AS 考试成绩,
    les.exam_count AS 考试次数,
    MAX(lsi.staff_code) AS 工号,
    MAX(lsi.name) AS 姓名,
    MAX(lsi.job_position) AS 岗位,
    MAX(lsi.manage_com_name) AS 机构 
FROM 
    lt_exam_info lei
    INNER JOIN lt_exam_student les ON lei.exam_code = les.exam_code 
    INNER JOIN lt_exam_question_student leqs ON les.train_code = leqs.train_code AND les.exam_count = leqs.exam_count 
    INNER JOIN lt_question lq ON leqs.question_code = lq.question_code 
    INNER JOIN lt_student_info lsi ON les.train_code = lsi.train_code 
WHERE 
    lei.exam_code IN () 
GROUP BY 
    lei.exam_code,
   lei.exam_name,
    lsi.staff_code,
    lsi.name,
    lsi.job_position,
    lsi.manage_com_name,
		les.exam_count
ORDER BY 
    lei.exam_code,
    lsi.staff_code)a;

/*
铁军辰阳 会要
**/
SELECT
	* 
FROM
	(
	SELECT
		( SELECT code_name FROM lt_business_code_select WHERE code_type = 'labelid' AND code_value = lt_student_info.label_id ) 品牌,
		COUNT ( 1 ) 在职人数,
	SUM ( CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END ) 最近 7天登录人数 
FROM
	lt_student_info 
WHERE
	agent_state = '01' 
	AND label_id <> '' 
GROUP BY
	label_id UNION
SELECT
	b.NAME 品牌,
	COUNT ( 1 ) 在职人数,
	SUM ( CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END ) 最近 7天登录人数 
FROM
	lt_student_info A,
	sys_manage_com b 
WHERE
	agent_state = '01' 
	AND substr( A.manage_com, 0, 12 ) = b.manage_com 
	AND b.short_name IN ( '王朝网', '海洋网', '腾势销售', '方程豹', '仰望', '王朝网经销商', '海洋网经销商' ) 
GROUP BY
	substr( A.manage_com, 0, 12 ),
	b.NAME UNION
SELECT
	b.NAME 品牌,
	COUNT ( 1 ) 在职人数,
	SUM ( CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END ) 最近 7天登录人数 
FROM
	lt_student_info A,
	sys_manage_com b 
WHERE
	agent_state = '01' 
	AND substr( A.manage_com, 0, 6 ) = b.manage_com 
	AND b.short_name IN ( '腾势经销商' ) 
GROUP BY
	substr( A.manage_com, 0, 6 ),
	b.NAME 
	) q 
ORDER BY
	品牌;


/*
铁军需要
**/
SELECT
    品牌,
    在职人数,
    最近7天登录人数
FROM
(
    SELECT
        ( SELECT code_name FROM lt_business_code_select WHERE code_type = 'labelid' AND code_value = lt_student_info.label_id ) AS 品牌,
        COUNT(*) AS 在职人数,
        SUM(CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END) AS 最近7天登录人数
    FROM
        lt_student_info
    WHERE
        agent_state = '01'
        AND label_id <> ''
    GROUP BY
        label_id

    UNION ALL

    SELECT
        b.NAME AS 品牌,
        COUNT(*) AS 在职人数,
        SUM(CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END) AS 最近7天登录人数
    FROM
        lt_student_info A
    JOIN
        sys_manage_com b ON substr(A.manage_com, 1, 12) = b.manage_com
    WHERE
        agent_state = '01'
        AND b.short_name IN ('王朝网', '海洋网', '腾势销售', '方程豹', '仰望', '王朝网经销商', '海洋网经销商')
    GROUP BY
        b.NAME

    UNION ALL

    SELECT
        b.NAME AS 品牌,
        COUNT(*) AS 在职人数,
        SUM(CASE WHEN last_login_time >= '2024-08-30' AND last_login_time <= '2024-09-05' THEN 1 ELSE 0 END) AS 最近7天登录人数
    FROM
        lt_student_info A
    JOIN
        sys_manage_com b ON substr(A.manage_com, 1, 6) = b.manage_com
    WHERE
        agent_state = '01'
        AND b.short_name = '腾势经销商'
    GROUP BY
        b.NAME
) AS q
ORDER BY
    品牌;



/*
处理课程进度为更新为已完成
**/
update lt_join_course_report SET is_finish = '4',finish_learn_time = (select max(q.last_modified_date) from counter_analyse_result q where q.course_code = lt_join_course_report.course_code and q.train_code = lt_join_course_report.train_code) where is_finish = '1' 
        AND (
        SELECT COUNT
                ( 1 ) 
        FROM
                lt_course_chapter b 
        WHERE
                b.course_code = lt_join_course_report.course_code 
                AND b.course_file IS NOT NULL 
                AND b.status = '1' 
                ) = (
        SELECT COUNT
                ( 1 ) 
        FROM
                counter_analyse_result C 
        WHERE
                C.course_code = lt_join_course_report.course_code 
                AND C.train_code = lt_join_course_report.train_code 
                AND C.is_finish = '4' 
        AND chapter_code IN ( SELECT chapter_code FROM lt_course_chapter b WHERE b.course_code = lt_join_course_report.course_code AND b.course_file IS NOT NULL AND b.status = '1' ) 
        )  ;


/*
根据班级编码
查看某一个班级下的所有课程的学习进度
**/
SELECT
	ljcr.NAME AS "姓名",
	ljcr.staff_code AS "工号",
	ljcr.manage_com_name AS "机构名称",
	( CASE ljcr.source_from WHEN 'course' THEN '课程中心' WHEN 'train' THEN '培训班级' ELSE'---' END ) AS "sourceFrom",
	( CASE ljcr.source_from WHEN 'course' THEN '--' WHEN 'train' THEN ljcr.source_code ELSE'---' END ) AS "programCode",
	( CASE ljcr.source_from WHEN 'course' THEN '--' WHEN 'train' THEN ( SELECT program_name FROM lt_course_program WHERE program_code = ljcr.source_code ) ELSE'---' END ) AS "programName",
	lci.course_name AS "课程名称",
	ljcr.begin_learn_time AS "开始学习时间",
	ljcr.finish_learn_time AS "结束学习时间",
	ljcr.is_finish AS "是否完成",
	(
	SELECT
		ROUND(
			(
			SELECT SUM
				( video_length ) 
			FROM
				counter_analyse_result 
			WHERE
				course_code = ljcr.course_code 
				AND train_code = ljcr.train_code 
				AND chapter_code IN ( SELECT chapter_code FROM lt_course_chapter WHERE course_code = ljcr.course_code AND time_duration IS NOT NULL AND status = '1' AND deleted = FALSE ) 
				AND source_from = 'course' 
				AND company = 'byd-group' 
				) :: NUMERIC / (
			SELECT SUM
				( time_duration ) 
			FROM
				Lt_course_chapter 
			WHERE
				course_code = ljcr.course_code 
				AND time_duration IS NOT NULL 
				AND status = '1' 
				AND deleted = FALSE 
				AND company = 'byd-group' 
			) * 100,
			2 
		) 
	) AS "result" 
FROM
	lt_join_course_report ljcr
	LEFT JOIN lt_student_info lsi ON ljcr.train_code = lsi.train_code
	LEFT JOIN lt_course_info lci ON ljcr.course_code = lci.course_code
	LEFT JOIN lt_course_program_schedule lcps ON lcps.schedule_type = 'online-course' 
	AND ljcr.course_code = lcps.schedule_code 
	AND lcps.deleted = FALSE 
	AND ( '20240416145920731' IS NOT NULL OR NULL IS NOT NULL )
	LEFT JOIN lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code 
	AND lcpe.train_code = ljcr.train_code 
	AND lcpe.deleted = FALSE 
	AND ( '20240416145920731' IS NOT NULL OR NULL IS NOT NULL )
	LEFT JOIN lt_course_program lcp ON lcps.program_code = lcp.program_code 
WHERE
	lsi.ID IS NOT NULL 
	AND lci.ID IS NOT NULL 
	AND ( lsi.branch_type LIKE'%B%' ) 
	AND ( lsi.company = 'byd-group' ) 
	AND ( NULL IS NULL OR ljcr.train_code = CAST ( NULL AS VARCHAR ) ) 
	AND (
		( NULL IS NULL OR NULL = 'contains' ) 
		AND ( NULL IS NULL OR lsi.manage_com LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		OR ( NULL IS NULL OR NULL = 'equals' ) 
		AND ( NULL IS NULL OR lsi.manage_com = CAST ( NULL AS VARCHAR ) ) 
	) 
	AND (
		( NULL IS NULL OR NULL = 'contains' ) 
		AND ( NULL IS NULL OR lsi.mul_Manage_com LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
		OR ( NULL IS NULL OR NULL = 'equals' ) 
		AND ( NULL IS NULL OR lsi.mul_Manage_com = CAST ( NULL AS VARCHAR ) ) 
	) 
	AND ( NULL IS NULL OR lsi.work_address LIKE CONCAT ( CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( NULL IS NULL OR lsi.staff_code = CAST ( NULL AS VARCHAR ) ) 
	AND ( NULL IS NULL OR lsi.agent_state = CAST ( NULL AS VARCHAR ) ) 
	AND ( NULL IS NULL OR lsi.stu_flag = CAST ( NULL AS VARCHAR ) ) 
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
	AND ( 'course' IS NULL OR ljcr.source_from = CAST ( 'course' AS VARCHAR ) ) 
	AND ( NULL IS NULL OR lci.course_code = CAST ( NULL AS VARCHAR ) ) 
	AND ( NULL IS NULL OR lci.course_name LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( COALESCE ( NULL, 'null' ) = 'null' OR ljcr.begin_learn_time >= NULL ) 
	AND ( COALESCE ( NULL, 'null' ) = 'null' OR ljcr.begin_learn_time <= NULL ) 
	AND ( NULL IS NULL OR lsi.NAME LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
	AND ( NULL IS NULL OR lsi.label_id LIKE CONCAT ( '%', CAST ( NULL AS VARCHAR ), '%' ) ) 
ORDER BY
	ljcr.begin_learn_time


/*
根据考试编码
查询某个考试（问卷）答题明细
要知道题目编码以及题目答案
**/
SELECT
	exam_code,
	test_paper_code,
	created_by_staff_code,
	created_by_name,
	MAX ( CASE WHEN question_code = 'bVYYaaMcBaj' THEN user_answer ELSE NULL END ) AS Q1,
	MAX ( CASE WHEN question_code = 'G8KLriZ8utA' THEN user_answer ELSE NULL END ) AS Q2,
	MAX ( CASE WHEN question_code = 'jLiJm0t1X2z' THEN user_answer ELSE NULL END ) AS Q3,
	MAX ( CASE WHEN question_code = 'R5OkcX215xu' THEN user_answer ELSE NULL END ) AS Q4,
	MAX ( CASE WHEN question_code = 'zfFQMl2JcbG' THEN user_answer ELSE NULL END ) AS Q5,
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

/*
根据专题编码查看专题进度
**/
SELECT
	jcr.created_date AS createdDate,
	A.source_code AS courseCode,
	A.limited_days AS limitedDays,
	( SELECT course_name FROM lt_course_info WHERE course_code = A.source_code ) AS courseName,
	A.NAME AS NAME,
	A.manage_com AS manageCom,
	A.manage_com_name AS manageComName,
	A.train_code AS trainCode,
	A.staff_code AS staffCode,
	A.job_position AS jobPosition,
	jcr.is_finish AS isFinish,
	jcr.begin_learn_time AS beginLearnTime,
	jcr.finish_learn_time AS finishLearnTime,
	A.join_set_date AS joinSetDate 
FROM
	(
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
		JOIN lt_course_set_student css ON css.train_code = lsi.train_code
		JOIN lt_course_set_rela csr ON css.course_set_code = csr.course_set_code 
		AND csr.source_from = 'course' 
	WHERE
		css.course_set_code = 'F9FETHD5O6P' -- 替换为实际的course_set_code参数
		
		AND css.is_finish != '0' 
	)
	A LEFT JOIN lt_join_course_report jcr ON A.source_code = jcr.course_code 
	AND A.train_code = jcr.train_code 
ORDER BY
	jcr.created_date;

/*
工号姓名引入temp_account
腾势临时账号手动添加
默认密码为Aa123456
**/
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
工号姓名引入temp_account
方程豹临时账号手动添加
默认密码为Aa123456
**/
update temp_account set train_code = md5(CONCAT(staff_code, 'FCB')),e_mail=concat(staff_code,'@fcb.com') where train_code is null;

INSERT INTO lt_student_info select nextval ('sequence_generator'), train_code, 'B', 'A8603', NULL, '3', staff_code, name, NULL, NULL, NULL, NULL, '2024-02-07 18:57:51+08', NULL, NULL, NULL, NULL, NULL, e_mail, NULL, NULL, NULL, NULL, NULL, '01', NULL, NULL, NULL, NULL, 'TJ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', 0, NULL, 'f', 'byd-group', 'system', NULL, NULL, 'A8603', '2024-08-26 17:06:29.237+08', 'init', '2024-08-26 10:34:42.523+08', '2024-08-26 10:34:42.523+08', NULL, NULL, NULL, NULL, NULL, NULL, 'N', NULL, NULL, NULL, NULL, NULL, NULL from temp_account where not exists(select 1 from lt_student_info where train_code = temp_account.train_code);

update lt_student_info set manage_com_name = '方程豹经销商' where manage_com like 'A8603%' and manage_com_name is null;

insert into jhi_user(id,login,password_hash,activated,created_by) select nextval ('sequence_generator'),train_code,'$2a$10$E2huMDDkb1AOGRtTJ3qSXezNaHLJrcQOsELe5.iNsrin2Eaxsi7H2',true,'202408' from lt_student_info where not exists(select 1 from jhi_user where login = train_code);

insert into jhi_user_authority select id,'ROLE_USER' from jhi_user where not exists(select 1 from jhi_user_authority where user_id = jhi_user.id);

select * from lt_student_info where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'

UPDATE lt_student_info set trade_source ='FCB'   where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'
UPDATE lt_student_info set qw_user_id=staff_code  where qw_user_id is NULL and stu_flag='3' and manage_com ='A8603'

/*
按工号重置密码
123456
*/
UPDATE jhi_user ju
SET password_hash ='$2a$10$qAbkKbkbVMnD5pY9aPCInuRIm37T74K0ICxp/XwPxgbLNBUoYNQiS'
FROM lt_student_info lsi
WHERE ju.login = lsi.train_code AND lsi.staff_code =''

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
**/ 
SELECT
lsi.manage_com_name AS "所属机构",
lsi.staff_code AS "工号",
lsi.NAME AS "姓名",
lsi.manage_com AS "机构编码",
lsi.manage_com_name AS "机构名称",
CASE
		ljcr.source_from 
		WHEN 'course' THEN
		'课程中心' 
		WHEN 'train' THEN
		'培训班级' ELSE'---' 
	END AS "sourceFrom",
CASE
		ljcr.source_from 
		WHEN 'course' THEN
		'--' 
		WHEN 'train' THEN
		ljcr.source_code ELSE'---' 
	END AS "programCode",
CASE
		ljcr.source_from 
		WHEN 'course' THEN
		'--' 
		WHEN 'train' THEN
		( SELECT program_name FROM lt_course_program WHERE program_code = ljcr.source_code ) ELSE'---' 
	END AS "programName",
	ljcr.course_code AS "课程编码",
	lci.course_name AS "课程名称",
	ljcr.begin_learn_time AS "开始时间",
	ljcr.finish_learn_time AS "完成时间",
	ljcr.is_finish,
CASE
		
		WHEN ljcr.is_finish = '4' THEN
		'已完成' 
		WHEN ljcr.is_finish = '1' THEN
		'进行中' 
	END AS "是否已完成",
	(
    SUM(car.video_length * car.play_percent) * 100.0 /
    (
        SELECT COALESCE(SUM(time_duration), 0) 
        FROM lt_course_chapter 
        WHERE course_code = ljcr.course_code 
        AND time_duration IS NOT NULL 
        AND status = '1' 
        AND deleted = FALSE
    )
)::numeric(10, 4) AS "学习进度"
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
WHERE
	ljcr.course_code = 'P3-07-010096' -- 直接使用具体的课程编码替换 '提供的课程编码'---
	AND lsi.ID IS NOT NULL 
	AND lci.ID IS NOT NULL 
GROUP BY
	ljcr.train_code,
	lsi.NAME,
	lsi.staff_code,
	lsi.manage_com,
	lsi.manage_com_name,
	lsi.agent_state,
	lsi.mul_auth,
	ljcr.source_from,
	ljcr.source_code,
	lsi.manage_com,
	lsi.label_id,
	ljcr.course_code,
	lci.course_name,
	ljcr.begin_learn_time,
	ljcr.finish_learn_time,
	ljcr.is_finish;


/*
按照机构查看
班级培训记录
**/
SELECT
lsi.manage_com_name AS "所属机构",
lsi.staff_code AS "工号",
lsi.NAME AS "姓名",
lcp.program_code AS "班级编码",
lcp.program_name AS "班级名称",
lcp.program_type AS "培训子类",
lcpt.type_name AS "培训子类名称",
lcp.course_start_time AS "培训开始时间",
lcp.train_state AS "trainState",
CASE
		
		WHEN lcp.train_state = '00' THEN
		'计划中' 
		WHEN lcp.train_state = '01' THEN
		'报名中' 
		WHEN lcp.train_state = '02' THEN
		'已结班' 
		WHEN lcp.train_state = '03' THEN
		'已结束' 
	END AS "班级状态",
lcpe.finish_state AS "finishState",
	( SELECT CAST ( SUM ( T.actual_course_hours ) AS FLOAT ) FROM lt_course_program_schedule T WHERE T.program_code = lcp.program_code ) AS "累计学时",
CASE
		
		WHEN lcpe.finish_state = '00' THEN
		'进行中' 
		WHEN lcpe.finish_state = '01' THEN
		'未结业' 
		WHEN lcpe.finish_state = '02' THEN
		'结业' ELSE'其他' 
	END AS "结业状态",
lcpe.finish_date AS "结训日期" 
FROM
	lt_course_program_enroll lcpe 
JOIN lt_student_info lsi ON lcpe.train_code = lsi.train_code
JOIN lt_course_program lcp ON lcpe.program_code = lcp.program_code
JOIN lt_course_program_type lcpt ON lcp.program_type = lcpt.type_code 
WHERE
	lcp.audit_state = '11' 
	AND lsi.manage_com LIKE'%A8600007003003%'; -- 直接使用具体的班级编码替换 '提供的课程编码'---

/*
考试详情
按照考试编码查询
**/
SELECT
	lei.exam_code 考试编码,
	lei.exam_name 考试名称,
	( SELECT code_name FROM sys_code_select WHERE code_type = 'examstate' AND code_value = les.exam_state ) 考试状态,
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
	AND lei.exam_code IN ( '4PY999S4RNS', '4PXRZB3RANG', '4PXRY8TUJ10', '4PXRX7628A8' ) -- 直接使用具体的考试编码替换 '提供的课程编码'---
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
CASE
		
		WHEN label_id = '1DFCEEB5D013497FE0635C14090AF841' THEN
		'王朝直营' 
		WHEN label_id = '1DFC1FA93668BB5AE0635C14090A817B' THEN
		'海洋直营' 
		WHEN label_id = '1DFCEEB5D014497FE0635C14090AF841' THEN
		'腾势直营' 
		WHEN label_id = '1DFC920BA6C629A6E0635C14090A5BC2' THEN
		'方程豹直营' 
	END AS 品牌标签 
FROM
	lt_student_info 
WHERE
	stu_flag = '1' 
	AND label_id IS NOT NULL

/*逆向删除**/
/*1. 删除 jhi_user_authority 表中的相关记录**/
delete from jhi_user_authority
where user_id in (
    select id from jhi_user
    where login in (
        select train_code from lt_student_info
        where train_code in (
            select train_code from temp_account where staff_code in
						()
        )
    )
);
/*2. 删除 jhi_user 表中的相关记录**/
delete from jhi_user
where login in (
    select train_code from lt_student_info
    where train_code in (
        select train_code from temp_account where staff_code in
						()
    )
);
/*3. 删除 lt_student_info 表中的相关记录**/
delete from lt_student_info
where train_code in (
    select train_code from temp_account where staff_code in
						()
);
/*4. 删除 temp_account 表中的相关记录**/
delete from temp_account
where train_code in (
    select train_code from temp_account where staff_code in
						()
);

/*
考试成绩
按编码查询
**/
SELECT 
    lei.exam_code AS 考试编码,
    lei.exam_name AS 考试名称,
    MAX((SELECT code_name FROM sys_code_select WHERE code_type = 'examstate' AND code_value = les.exam_state)) AS 考试状态,
    MAX(les.score) AS 考试成绩,
    MAX(les.exam_count) AS 考试次数,
    MAX(lsi.staff_code) AS 工号,
    MAX(lsi.name) AS 姓名,
    MAX(lsi.job_position) AS 岗位,
    MAX(lsi.manage_com_name) AS 机构 
FROM 
    lt_exam_info lei
    INNER JOIN lt_exam_student les ON lei.exam_code = les.exam_code 
    INNER JOIN lt_exam_question_student leqs ON les.train_code = leqs.train_code AND les.exam_count = leqs.exam_count 
    INNER JOIN lt_question lq ON leqs.question_code = lq.question_code 
    INNER JOIN lt_student_info lsi ON les.train_code = lsi.train_code 
WHERE 
    lei.exam_code IN ('safwe') ---编码可替换---
GROUP BY 
    lei.exam_code,
   lei.exam_name,
    lsi.staff_code,
    lsi.name,
    lsi.job_position,
    lsi.manage_com_name
ORDER BY 
    lei.exam_code,
    lsi.staff_code;