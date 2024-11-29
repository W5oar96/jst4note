// 铁军管理端扫码登录
        if (login.startsWith("scanCode-")) {
            String substring = login.substring(login.indexOf('-') + 1);
            String branch = substring.substring(0,substring.indexOf(':')).toUpperCase();
            String code = substring.substring(substring.indexOf(':')+1);
            SysUserDTO sysUser = null;
            Instant nowTime = PubFun.getCurrentDate();
            List<LtStudentInfo> studentInfoList = ltStudentInfoRepository.findFirstByStaffCodeOrUserIdByBranch(code, branch);
            List<SysUserDTO> sysUserDTOS = sysUserMapper.toDto(sysUserRepository.findAllByUserCode(loginVM.getUsername()));

            if(!studentInfoList.isEmpty()){
                LtStudentInfo ltStudentInfo = studentInfoList.get(0);
                log.info("---------当前登录人来源：{}，姓名：{}，账号数量：{}，工号：{}，trainCode：{}",ltStudentInfo.getTradeSource(),ltStudentInfo.getName(),studentInfoList.size(),ltStudentInfo.getStaffCode(),ltStudentInfo.getTrainCode());
                loginVM.setUsername("empty:" + ltStudentInfo.getTrainCode());
                return ResponseEntity.ok(loginVM.getUsername());
            }else{
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (sysUserDTOS.isEmpty()) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            sysUser = sysUserDTOS.get(0);
            if (!"1".equals(sysUser.getStatus())) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (sysUser.getExpireDate() != null) {
                if (sysUser.getExpireDate().isBefore(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExpired"));
                }

                String userCode = Optional.ofNullable(sysUser.getTrainCode()).orElse(sysUser.getUserCode());
                loginVM.setUsername(userCode);
            }

            // 集团企微登录
        if (login.startsWith("code:")) {
            String code = login.substring(login.indexOf(':') + 1);
            List<LtStudentInfo> studentInfoList = ltStudentInfoRepository.findFirstByStaffCodeAndStatusAndAgentStateAndDeleted(code, "1", "01",false);
            if (!studentInfoList.isEmpty()) {
                LtStudentInfo ltStudentInfo = studentInfoList.get(0);
                loginVM.setUsername("empty:" + ltStudentInfo.getTrainCode());
                return ResponseEntity.ok(loginVM.getUsername());
            } else {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }

        }


        String longinPrefix = "";
        if (StringUtils.isEmpty(loginVM.getRole())) {
            // 登录角色为空时则默认为是管理员登录
            loginVM.setRole("admin");
        }
        // Role现在有：admin-管理员,student-学员,teacher-讲师
        SysUserDTO sysUser = null;
        Instant nowTime = PubFun.getCurrentDate();
        Map<String, String> userConfig = ssSysVarService.querySysVarBySysType(ConstantField.SYS_VAR_APPTYPE_SYSCONFIG_USER_CONFIG, ConstantField.SYS_VAR_APPTYPE_SYSCONFIG);
        long lockTime = Long.parseLong(userConfig.getOrDefault("lockTime", "30"));
        if ("admin".equals(loginVM.getRole())) {

            if(login.startsWith("sso:")){
                String ssoUser = login.substring(login.indexOf(':') + 1);
                loginVM.setUsername(ssoUser);
            }
            List<SysUserDTO> sysUserDTOS = sysUserMapper.toDto(sysUserRepository.findAllByUserCode(loginVM.getUsername()));
            if (sysUserDTOS.isEmpty()) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            sysUser = sysUserDTOS.get(0);
            if (!"1".equals(sysUser.getStatus())) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (sysUser.getExpireDate() != null) {
                if (sysUser.getExpireDate().isBefore(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExpired"));
                }
            }
            if (sysUser.getLockedTime() != null) {
                // 判定账户锁定是否过了30分钟
                if (sysUser.getLockedTime().plus(lockTime, ChronoUnit.MINUTES).isAfter(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessageByObj("login.error.message.accountLocked", new Object[]{lockTime}));
                }
            }
            String userCode = Optional.ofNullable(sysUser.getTrainCode()).orElse(sysUser.getUserCode());
            loginVM.setUsername(userCode);

            //sso免密登录
            if(login.startsWith("sso:")){
                loginVM.setUsername("empty:"+userCode);
            }
        }
        LtStudentInfoDTO ltStudentInfoDTO = null;
        if ("student".equals(loginVM.getRole()) && !login.startsWith("eMail:")) {

            // 学员登录是trainCode登录，密码是empty
            ltStudentInfoDTO = tmsCacheQueryService.redisQueryStudent(loginVM.getUsername());
            if (ltStudentInfoDTO == null) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (!"1".equals(ltStudentInfoDTO.getStatus()) || !"01".equals(ltStudentInfoDTO.getAgentState())) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (ltStudentInfoDTO.getLockedTime() != null) {
                // 判定账户锁定是否过了30分钟
                if (ltStudentInfoDTO.getLockedTime().plus(lockTime, ChronoUnit.MINUTES).isAfter(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessageByObj("login.error.message.accountLocked", new Object[]{lockTime}));
                }
            }
            longinPrefix = "empty:";
            loginVM.setUsername(longinPrefix + loginVM.getUsername());
        }
        if ("student".equals(loginVM.getRole()) && login.startsWith("eMail:")) {
            String email = login.substring(login.indexOf(':') + 1);

            // 学员登录是trainCode登录，密码是empty
            List<LtStudentInfoDTO> ltStudentInfoDTOList = ltStudentInfoMapper.toDto(ltStudentInfoRepository.findFirstByeMailAndStatusAndAgentStateAndDeleted(email, "1", "01", false));

            if (CollectionUtils.isEmpty(ltStudentInfoDTOList)) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            ltStudentInfoDTO = ltStudentInfoDTOList.get(0);
            if (ltStudentInfoDTO.getLockedTime() != null) {
                // 判定账户锁定是否过了30分钟
                if (ltStudentInfoDTO.getLockedTime().plus(lockTime, ChronoUnit.MINUTES).isAfter(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessageByObj("login.error.message.accountLocked", new Object[]{lockTime}));
                }
            }
            loginVM.setUsername(ltStudentInfoDTO.getTrainCode());
        }

        LtTeacherInfoDTO teacherInfo = null;
        if ("teacher".equals(loginVM.getRole())) {
            // 讲师登录时用户名为姓名，密码是证件号码
            LtStudentInfoDTO dto = tmsCacheQueryService.redisQueryStudentByNameAndIdNoTypeAndIdNo(loginVM.getUsername(), "0", loginVM.getPassword());
            if (dto == null) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            } else {
                // 看学员是否有讲师身份
                teacherInfo = tmsCacheQueryService.redisQueryTeacherByTrainCode(dto.getTrainCode());
                if (teacherInfo == null) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.ccountExistIdentity"));
                } else {
                    // 讲师存在了 为了让生成的token为讲师表的teacher Code，这里做个转化
                    loginVM.setUsername(teacherInfo.getTeacherCode());
                    loginVM.setPassword("empty");
                }
            }
        }

        redisUtil.set(key, loginVM.getUsername(), RedisConstants.ONE_HOURS);

        return ResponseEntity.ok(loginVM.getUsername());
    }



     if ("admin".equals(loginVM.getRole())) {

            if(login.startsWith("sso:")){
                String ssoUser = login.substring(login.indexOf(':') + 1);
                loginVM.setUsername(ssoUser);
            }
            List<SysUserDTO> sysUserDTOS = sysUserMapper.toDto(sysUserRepository.findAllByUserCode(loginVM.getUsername()));
            if (sysUserDTOS.isEmpty()) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            sysUser = sysUserDTOS.get(0);
            if (!"1".equals(sysUser.getStatus())) {
                return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExist"));
            }
            if (sysUser.getExpireDate() != null) {
                if (sysUser.getExpireDate().isBefore(nowTime)) {
                    return ResponseEntity.ok("notActivated:" + messageUtil.getMessage("login.error.message.accountExpired"));
                }
            }

            String userCode = Optional.ofNullable(sysUser.getTrainCode()).orElse(sysUser.getUserCode());
            loginVM.setUsername(userCode);

            //sso免密登录
            if(login.startsWith("sso:")){
                loginVM.setUsername("empty:"+userCode);
            }
        }