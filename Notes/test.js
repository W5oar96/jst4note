表 lt_question中 字段 question_code，question_content
表 lt_exam_info 字段 exam_code, exam_name, data_cate，created_by_manage_com
表 lt_exam_question_student 字段 exam_code, created_by_staff_code, created_by_name，question_code, user_answer，last_modified_date

我想要查询manage_com like '%A86%' ,data_cate='survey'的所有考试相关信息