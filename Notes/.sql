集团保利威
zkr-byd-jt@local.com
polyv666

铁军保利威
zkr-byd-tj@local.com
polyv666

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
	AND lei.exam_code IN ( '4PY999S4RNS', '4PXRZB3RANG', '4PXRY8TUJ10', '4PXRX7628A8' ) ---直接使用具体的考试编码替换---
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

------更新某个字段-------
UPDATE lt_student_info
SET manage_com = (
    SELECT sys_manage_com.manage_com
    FROM sys_manage_com
    JOIN sync_tj_student_temp ON sys_manage_com.department_id = sync_tj_student_temp.department_id
    WHERE sync_tj_student_temp.train_code = lt_student_info.train_code
)
WHERE EXISTS (
    SELECT 1
    FROM sync_tj_student_temp
    WHERE sync_tj_student_temp.train_code = lt_student_info.train_code
);

/**
试卷编码反查题库编码
*/
select DISTINCT (question_bank_code) from
(SELECT
	question_bank_code,
	question_bank_name 
FROM
	lt_question_bank lqb,
	lt_question lq,
	lt_test_paper ltp,
	lt_test_paper_question ltpq 
WHERE
	ltp.test_paper_code = ltpq.test_paper_code 
	AND ltpq.question_code = lq.question_code 
	AND lq.source_code = lqb.question_bank_code
	and ltp.test_paper_code = '4PYMQK9EVPQ' ---调整为要查询试卷编码---
	)a;

/*
查询直播人数
**/
SELECT
	psvl.channel_id,
	plc.NAME,
	COUNT ( DISTINCT psvl.view_id ) AS unique_view_count 
FROM
	polyv_live_channel plc
	JOIN polyv_statistics_view_log psvl ON plc.channel_id = psvl.channel_id 
GROUP BY
	psvl.channel_id,
	plc.NAME 
HAVING
	COUNT ( DISTINCT psvl.view_id ) > 1 
ORDER BY
	COUNT ( DISTINCT psvl.view_id ) DESC;

/*
查询直播人次
**/
SELECT
	psvl.channel_id,
	plc.NAME,
	COUNT ( DISTINCT psvl.view_id ) AS unique_view_count 
FROM
	polyv_live_channel plc
	JOIN polyv_statistics_view_log psvl ON plc.channel_id = psvl.channel_id 
GROUP BY
	psvl.channel_id,
	plc.NAME 
HAVING
	COUNT ( * ) > 1 
ORDER BY
	COUNT ( DISTINCT psvl.view_id ) DESC;

/**
*专题课程学习进度，集团特供
*/
SELECT
	lsi.NAME 姓名,
	lsi.staff_code 工号,
	lsi.manage_com_name 所属机构,
	lci.course_code 课程编码,
	lci.course_name 课程名称,
	lcss.created_date 加入时间,
	ljcr.begin_learn_time 开始学习时间,
	ljcr.finish_learn_time 结束学习时间,
CASE
		lcss.is_finish 
		WHEN '0' THEN
		'未开始' 
		WHEN '1' THEN
		'进行中' 
		WHEN '4' THEN
		'已完成' 
	END AS "学习状态",
	(
        SELECT
            SUM(car.video_length * car.play_percent) /
            (
                SELECT COALESCE(SUM(time_duration), 0) 
                FROM lt_course_chapter 
                WHERE course_code = ljcr.course_code 
                AND time_duration IS NOT NULL 
                AND status = '1' 
                AND deleted = FALSE
            )::numeric(10, 4)
        FROM counter_analyse_result car
        WHERE ljcr.course_code = car.course_code 
        AND ljcr.train_code = car.train_code 
        AND car.chapter_code IN (
            SELECT chapter_code 
            FROM lt_course_chapter 
            WHERE course_code = ljcr.course_code 
            AND time_duration IS NOT NULL 
            AND status = '1' 
            AND deleted = FALSE
        ) 
        AND car.source_from = ljcr.source_from 
    ) AS "学习进度"
FROM
	lt_course_set_student lcss
	LEFT JOIN lt_student_info lsi ON lcss.train_code = lsi.train_code
	LEFT JOIN lt_course_set_rela lcsr ON lcss.course_set_code = lcsr.course_set_code
	LEFT JOIN lt_course_info lci ON lcsr.source_code = lci.course_code
	LEFT JOIN lt_join_course_report ljcr ON ljcr.course_code = lcsr.source_code 
	AND ljcr.train_code = lcss.train_code
WHERE
	lsi.ID IS NOT NULL 
	AND lci.ID IS NOT NULL 
	AND lcsr.source_from = 'course' 
	AND lcsr.status = '1' 
	AND lcsr.stage_code IS NOT NULL 
	AND lcss.course_set_code = '4PRAH0EX9LR' 
	AND ljcr.begin_learn_time > '2024-11-16 00:00:00.000+08' 
	AND ljcr.begin_learn_time < '2024-11-19 00:00:00.000+08' 
	AND ljcr.begin_learn_time IS NOT NULL 

ORDER BY
	lcss.created_date DESC

/**没啥用*/
train_code = ,
branch_type = 'B',
manage_com='A8605',
stu_flag='2',
name = ,
sex= ,
e_mail = ,
agent_state ='01',
status ='1',
deleted =false,
company='byd-group'
created_by ='9c071fc337094a98a56ab100dc6e1971',
created_by_staff_code ='5056552', created_by_name='李观青',created_by_manage_com = 'A86',
created_date = VALUES(now()),
last_modified_by='5056552(李观青)',
last_modified_by='5056552(李观青)',
last_modified_date = VALUES(now()),
language = 'zh-CN',
initial ='Y',
created_by_manage_com_name = '比亚迪'

/*
工号姓名引入temp_account
临时账号手动添加
默认密码为Aa123456
**/
UPDATE temp_account
SET train_code = MD5(CONCAT(e_mail))
WHERE train_code IS NULL;

INSERT INTO lt_student_info select nextval ('sequence_generator'), train_code, 'B', 'A8605', NULL, '2', NULL, name, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, e_mail, NULL, NULL, NULL, NULL, NULL, '01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1', 0, NULL, 'f', 'byd-group', 'system', NULL, NULL, 'A8605', '2024-11-18 17:13:16.896+08', 'init', '2024-11-18 17:13:16.896+08', '2024-11-18 17:13:16.896+08', NULL, NULL, NULL, NULL, NULL, NULL, 'N', NULL, NULL, NULL, NULL, NULL, NULL from temp_account where not exists(select 1 from lt_student_info where train_code = temp_account.train_code);

insert into jhi_user(id,login,password_hash,activated,created_by) select nextval ('sequence_generator'),train_code,'$2a$10$E2huMDDkb1AOGRtTJ3qSXezNaHLJrcQOsELe5.iNsrin2Eaxsi7H2',true,'202411' from lt_student_info where not exists(select 1 from jhi_user where login = train_code);

insert into jhi_user_authority select id,'ROLE_USER' from jhi_user where not exists(select 1 from jhi_user_authority where user_id = jhi_user.id);


/*
课程章节
**/
select * from counter_analyse_result where created_by_staff_code = '7990757' and course_code = '001-000006';
select * from lt_join_course_report where created_by_staff_code = '7990757' and course_code = '001-000006';

/*
课时记录查询（创建临时表）
**/
-- 创建临时表
CREATE TEMPORARY TABLE IF NOT EXISTS temp_counter_trance_log AS
SELECT 
    course_code, 
    chapter_code, 
    COUNT(DISTINCT train_code) AS learnPerson, 
    SUM(duration_of_this_play) AS learnTimeSum, 
    COUNT(id) AS learnCount
FROM 
    counter_trance_log
GROUP BY 
    course_code, 
    chapter_code;

-- 主查询
SELECT 
    a.course_code AS 课程编码, 
    b.course_name AS 课程名称,
    b.created_by_staff_code AS 创建人工号,
    b.created_by_name AS 创建人姓名,
    b.created_by_manage_com_name AS 创建人机构,
    a.chapter_code AS 章节编码, 
    a.chapter_name AS 章节名称,
    (SELECT code_name FROM sys_code_select WHERE code_type = 'filetypeoption' AND code_value = a.file_type) AS 课件类型, 
    (SELECT code_name FROM sys_code_select WHERE code_type = 'status' AND code_value = a.status) AS 上下架管理,
    COALESCE(a.time_duration, 0) AS 课件时长, 
    tcl.learnPerson AS 参与学习人数, 
    tcl.learnTimeSum AS 学习分钟数, 
    tcl.learnCount AS 学习次数
FROM 
    lt_course_chapter a 
JOIN 
    lt_course_info b ON a.course_code = b.course_code
LEFT JOIN temp_counter_trance_log tcl ON a.course_code = tcl.course_code AND a.chapter_code = tcl.chapter_code
WHERE 
    a.parent_chapter_code <> '0';

-- 删除临时表（如果需要）
DROP TABLE temp_counter_trance_log;


/*
铁军上线以来活跃数据
**/
select * from (
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,count(1) 在职人数,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-08') then 1 else 0 end) 活跃人数8月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and  to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) as 活跃人数10月,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-011') then 1 else 0 end) 活跃人数11月,
from lt_student_info a where agent_state = '01' and label_id <> '' group by label_id

union
select '直营' 类型,b.name 品牌,count(1) 在职人数,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-08') then 1 else 0 end) 活跃人数8月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and  to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) 活跃人数10月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-11') then 1 else 0 end) 活跃人数11月
from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商') group by substr(a.manage_com,0,12),b.name

union
select '经销商' 类型,b.name 品牌,count(1) 在职人数,
sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-08') then 1 else 0 end) 活跃人数8月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-09') then 1 else 0 end) 活跃人数9月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and  to_char(c.created_date, 'YYYY-MM') = '2024-10') then 1 else 0 end) 活跃人数10月,sum(case when exists(select 1 from sys_session c where c.login = a.train_code and to_char(c.created_date, 'YYYY-MM') = '2024-11') then 1 else 0 end) 活跃人数11月 from lt_student_info a ,sys_manage_com b where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') group by substr(a.manage_com,0,6),b.name) 
q order by 类型,品牌;



select * from (
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a,sys_session c where agent_state = '01' and label_id <> '' and a.train_code = c.login and c.created_date >= '2024-08-01' group by label_id,to_char(c.created_date, 'YYYY-MM-DD')

union
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a,sys_session c where agent_state = '01' and label_id <> '' and a.train_code = c.login and c.created_date >= '2024-09-01' group by label_id,to_char(c.created_date, 'YYYY-MM-DD')

union
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a,sys_session c where agent_state = '01' and label_id <> '' and a.train_code = c.login and c.created_date >= '2024-10-01' group by label_id,to_char(c.created_date, 'YYYY-MM-DD')

union
select '品牌标签' 类型,(select code_name from lt_business_code_select where code_type = 'labelid' and code_value = a.label_id) 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a,sys_session c where agent_state = '01' and label_id <> '' and a.train_code = c.login and c.created_date >= '2024-11-01' group by label_id,to_char(c.created_date, 'YYYY-MM-DD')



union
select '直营' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商')  and a.train_code = c.login and c.created_date >= '2024-08-01' group by substr(a.manage_com,0,12),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '直营' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商')  and a.train_code = c.login and c.created_date >= '2024-09-01' group by substr(a.manage_com,0,12),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '直营' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商')  and a.train_code = c.login and c.created_date >= '2024-10-01' group by substr(a.manage_com,0,12),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '直营' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,12) = b.manage_com and b.short_name in ('王朝网','海洋网','腾势销售','方程豹','仰望','王朝网经销商','海洋网经销商')  and a.train_code = c.login and c.created_date >= '2024-11-01' group by substr(a.manage_com,0,12),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '经销商' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') and a.train_code = c.login and c.created_date >= '2024-08-01' group by substr(a.manage_com,0,6),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '经销商' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') and a.train_code = c.login and c.created_date >= '2024-09-01' group by substr(a.manage_com,0,6),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '经销商' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') and a.train_code = c.login and c.created_date >= '2024-10-01' group by substr(a.manage_com,0,6),b.name,to_char(c.created_date, 'YYYY-MM-DD')

union
select '经销商' 类型,b.name 品牌,to_char(c.created_date, 'YYYY-MM-DD') 日期,count(distinct login) 活跃人数 from lt_student_info a ,sys_manage_com b,sys_session c where agent_state = '01' and substr(a.manage_com,0,6) = b.manage_com and b.short_name in( '腾势','方程豹经销商') and a.train_code = c.login and c.created_date >= '2024-11-01' group by substr(a.manage_com,0,6),b.name,to_char(c.created_date, 'YYYY-MM-DD')
) 
q order by 类型,品牌;


------考试数据按编码查询------
SELECT
    ltexamstud0_.ID,
    ltexamstud0_.company,
    ltexamstud0_.created_by,
    ltexamstud0_.created_by_manage_com,
    ltexamstud0_.created_by_manage_com_name,
    ltexamstud0_.created_by_name,
    ltexamstud0_.created_by_staff_code,
    ltexamstud0_.created_date,
    ltexamstud0_.deleted,
    ltexamstud0_.last_modified_by,
    ltexamstud0_.last_modified_date,
    ltexamstud0_.all_question_count,
    ltexamstud0_.end_time,
    ltexamstud0_.exam_code,
    ltexamstud0_.exam_count,
    ltexamstud0_.exam_state,
    ltexamstud0_.paper_mark,
    ltexamstud0_.pass_mark,
    ltexamstud0_.random_num,
    ltexamstud0_.review_time,
    ltexamstud0_.reviewer,
    ltexamstud0_.revise_score,
    ltexamstud0_.score,
    ltexamstud0_.score_level,
    ltexamstud0_.sign_name_url,
    ltexamstud0_.start_time,
    ltexamstud0_.status,
    ltexamstud0_.submit_type,
    ltexamstud0_.surplus_exam_count,
    ltexamstud0_.test_paper_code,
    ltexamstud0_.train_code,
    ltexamstud0_.wrong_question_count 
FROM
    lt_exam_student ltexamstud0_
    INNER JOIN lt_student_info ltstudenti1_ ON ( ltexamstud0_.train_code = ltstudenti1_.train_code ) 
WHERE
    ltexamstud0_.exam_code = 'AP02GROUPTE24100001' ------可替换考试编码-------
    AND ( NULL IS NULL OR ltstudenti1_.staff_code IS NULL ) 
    AND ( NULL IS NULL OR ltstudenti1_.NAME LIKE ( '%' || NULL || '%' ) ) 
    AND ( NULL IS NULL OR ltexamstud0_.created_by_manage_com LIKE ( NULL || '%' ) ) 
    AND ( NULL IS NULL OR ltexamstud0_.exam_state IS NULL ) 
    AND ( NULL IS NULL OR ltexamstud0_.exam_count IS NULL ) 
ORDER BY
    ltexamstud0_.created_date DESC;


----用户课程学习数据----
SELECT
    lsi.ID,
    lsi.manage_com,
    lsi.train_code,
    lsi.staff_code,
    lsi.NAME,
    lsi.job_position,
    lsi.employ_date,
    lci.course_code,
    lci.course_name,
    lci.category_string,
    ( SELECT COALESCE(SUM(time_duration), 0) FROM lt_course_chapter WHERE course_code = lci.course_code ) AS timeDuration,
    (
        SELECT d.created_date 
        FROM counter_trance_log d 
        WHERE d.course_code = lci.course_code 
        AND d.train_code = lsi.train_code 
        ORDER BY d.created_date DESC 
        LIMIT 1 
    ) AS lastLearnTime,
    (
        SELECT is_finish 
        FROM lt_join_course_report ljcr 
        WHERE ljcr.course_code = lci.course_code 
        AND ljcr.source_code = lci.course_code 
        AND ljcr.source_from = 'course' 
        AND ljcr.train_code = lsi.train_code 
        LIMIT 1 
    ) AS isFinish,
    lci.teach_way,
    (
        SELECT COALESCE(SUM(COALESCE(d.duration_of_this_play, 0)), 0) 
        FROM counter_trance_log d 
        WHERE d.course_code = lci.course_code 
        AND d.train_code = lsi.train_code 
    ) AS learnTimeSum 
FROM
    lt_student_info lsi,
    counter_analyse_result car,
    lt_course_info lci 
WHERE
    lci.course_code = car.source_code 
    AND lsi.train_code = car.train_code 
    AND lci.branch_type = 'B' 
    AND (lci.course_code = CAST(NULL AS VARCHAR) OR lci.course_code IS NULL) 
    AND (lsi.train_code = CAST(NULL AS VARCHAR) OR lsi.train_code IS NULL) 
    AND lsi.manage_com LIKE CONCAT('A86', '%') 
    AND (lsi.staff_code = CAST(NULL AS VARCHAR) OR lsi.staff_code IS NULL) 
    AND (lci.course_name LIKE CONCAT('%', CAST(NULL AS VARCHAR), '%') OR lci.course_name IS NULL) 
    AND (lsi.NAME LIKE CONCAT('%', CAST(NULL AS VARCHAR), '%') OR lsi.NAME IS NULL);

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
)；

-----视频切片----
select * from file_info where id in (select file_id from lt_course_chapter where course_code = '003-03-000003' and deleted = false and status = '1')
-- 4478
-- tms/202408/VhAt8UKW6lDd2K922gGZeqRvnF8AdF.mp4
select * from lt_m3u8   where code = 'VhAt8UKW6lDd2K922gGZeqRvnF8AdF'

-- 用户线上学习记录报表
SELECT 
    a.train_code AS "trainCode",
    b.name AS "name",
    b.staff_code AS "staffCode",
    b.manage_com AS "manageCom",
    b.manage_com_name AS "manageComName",
    b.agent_state AS "agentState",
    b.mul_auth AS "mulAuth",
    a.source_from AS "sourceFrom",
    CASE 
        WHEN a.source_from = 'course' THEN '--'
        WHEN a.source_from = 'train' THEN a.source_code
        ELSE '---'
    END AS "programCode",
    CASE 
        WHEN a.source_from = 'course' THEN '--'
        WHEN a.source_from = 'train' THEN (SELECT program_name FROM lt_course_program WHERE program_code = a.source_code)
        ELSE '---'
    END AS "programName",
    a.course_code AS "courseCode",
    c.course_name AS "courseName",
    a.begin_learn_time AS "beginLearnTime",
    a.finish_learn_time AS "finishLearnTime",
    a.is_finish AS "isFinish",
    b.label_id AS "labelId",
    b.label AS "label",
    b.employ_date AS "employDate",
    b.part_time_job_position AS "partTimeJobPosition"
FROM 
    lt_join_course_report a
LEFT JOIN 
    lt_student_info b ON a.train_code = b.train_code
LEFT JOIN 
    lt_course_info c ON a.course_code = c.course_code
LEFT JOIN 
    lt_course_program_schedule lcps ON lcps.schedule_type = 'online - course' 
    AND a.course_code = lcps.schedule_code 
    AND lcps.deleted = false 
    AND (NULL IS NOT NULL OR NULL IS NOT NULL)
LEFT JOIN 
    lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code 
    AND lcpe.train_code = a.train_code 
    AND lcpe.deleted = false 
    AND (NULL IS NOT NULL OR NULL IS NOT NULL)
LEFT JOIN 
    lt_course_program lcp ON lcps.program_code = lcp.program_code
WHERE 
    b.id IS NOT NULL
    AND c.id IS NOT NULL
    AND (b.branch_type LIKE '%B%')
    AND (b.company = 'byd - group')
    AND (NULL IS NULL OR a.train_code = CAST(NULL AS varchar))
    AND (
        ('contains' IS NULL OR 'contains' = 'contains') 
        AND ('A86' IS NULL OR b.manage_com LIKE CONCAT('%', CAST('A86' AS varchar), '%')) 
        OR ('contains' IS NULL OR 'contains' = 'equals') 
        AND ('A86' IS NULL OR b.manage_com = CAST('A86' AS varchar))
    )
    AND (
        (NULL IS NULL OR NULL = 'contains') 
        AND (NULL IS NULL OR b.mul_Manage_com LIKE CONCAT('%', CAST(NULL AS varchar), '%')) 
        OR (NULL IS NULL OR NULL = 'equals') 
        AND (NULL IS NULL OR b.mul_Manage_com = CAST(NULL AS varchar))
    )
    AND (NULL IS NULL OR b.work_address LIKE CONCAT(CAST(NULL AS varchar), '%'))
    AND (NULL IS NULL OR b.staff_code = CAST(NULL AS varchar))
    AND (NULL IS NULL OR b.agent_state = CAST(NULL AS varchar))
    AND (NULL IS NULL OR b.stu_flag = CAST(NULL AS varchar))
    AND (NULL IS NULL OR (lcp.program_code = NULL AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (NULL IS NULL OR (lcp.program_name LIKE CONCAT('%', NULL, '%') AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (NULL IS NULL OR a.source_from = CAST(NULL AS varchar))
    AND (NULL IS NULL OR c.course_code = CAST(NULL AS varchar))
    AND (NULL IS NULL OR c.course_name LIKE CONCAT('%', CAST(NULL AS varchar), '%'))
    AND (COALESCE(NULL, 'null') = 'null' OR a.begin_learn_time >= NULL)
    AND (COALESCE(NULL, 'null') = 'null' OR a.begin_learn_time <= NULL)
    AND (NULL IS NULL OR b.name LIKE CONCAT('%', CAST(NULL AS varchar), '%'))
    AND (NULL IS NULL OR b.label_id LIKE CONCAT('%', CAST(NULL AS varchar), '%'))
ORDER BY 
    a.begin_learn_time DESC
LIMIT 10;

用户线上学习记录报表count
SELECT 
    COUNT(1)
FROM 
    lt_join_course_report a
LEFT JOIN 
    lt_student_info b ON a.train_code = b.train_code
LEFT JOIN 
    lt_course_info c ON a.course_code = c.course_code
LEFT JOIN 
    lt_course_program_schedule lcps ON lcps.schedule_type = 'online - course' 
    AND a.course_code = lcps.schedule_code 
    AND lcps.deleted = false 
    AND (NULL IS NOT NULL OR NULL IS NOT NULL)
LEFT JOIN 
    lt_course_program_enroll lcpe ON lcps.program_code = lcpe.program_code 
    AND lcpe.train_code = a.train_code 
    AND lcpe.deleted = false 
    AND (NULL IS NOT NULL OR NULL IS NOT NULL)
LEFT JOIN 
    lt_course_program lcp ON lcps.program_code = lcp.program_code
WHERE 
    b.id IS NOT NULL
    AND c.id IS NOT NULL
    AND (b.branch_type LIKE '%B%')
    AND (b.company = 'byd - group')
    AND (NULL IS NULL OR a.train_code = CAST(NULL AS varchar))
    AND (
        ('contains' IS NULL OR 'contains' = 'contains') 
        AND ('A86' IS NULL OR b.manage_com LIKE CONCAT('%', CAST('A86' AS varchar), '%')) 
        OR ('contains' IS NULL OR 'contains' = 'equals') 
        AND ('A86' IS NULL OR b.manage_com = CAST('A86' AS varchar))
    )
    AND (
        (NULL IS NULL OR NULL = 'contains') 
        AND (NULL IS NULL OR b.mul_Manage_com LIKE CONCAT('%', CAST(NULL AS varchar), '%')) 
        OR (NULL IS NULL OR NULL = 'equals') 
        AND (NULL IS NULL OR b.mul_Manage_com = CAST(NULL AS varchar))
    )
    AND (NULL IS NULL OR b.work_address LIKE CONCAT(CAST(NULL AS varchar), '%'))
    AND (NULL IS NULL OR b.staff_code = CAST(NULL AS varchar))
    AND (NULL IS NULL OR b.agent_state = CAST(NULL AS varchar))
    AND (NULL IS NULL OR b.stu_flag = CAST(NULL AS varchar))
    AND (NULL IS NULL OR (lcp.program_code = NULL AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (NULL IS NULL OR (lcp.program_name LIKE CONCAT('%', NULL, '%') AND lcps.id IS NOT NULL AND lcp.id IS NOT NULL AND lcpe.id IS NOT NULL))
    AND (NULL IS NULL OR a.source_from = CAST(NULL AS varchar))
    AND (NULL IS NULL OR c.course_code = CAST(NULL AS varchar))
    AND (NULL IS NULL OR c.course_name LIKE CONCAT('%', CAST(NULL AS varchar), '%'))
    AND (COALESCE(NULL, 'null') = 'null' OR a.begin_learn_time >= NULL)
    AND (COALESCE(NULL, 'null') = 'null' OR a.begin_learn_time <= NULL)
    AND (NULL IS NULL OR b.name LIKE CONCAT('%', CAST(NULL AS varchar), '%'))
    AND (NULL IS NULL OR b.label_id LIKE CONCAT('%', CAST(NULL AS varchar), '%'));