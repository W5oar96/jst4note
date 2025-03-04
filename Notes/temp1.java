control层
处理学员同步sync_student表落入info表中
@GetMapping("/syncLtStudentInfo")
    @XxlJob("syncLtStudentInfo")

