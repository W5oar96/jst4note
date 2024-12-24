/**
     * 分页处理syncTjStudent
     * @param syncStudents
     */
    private void handlePageSyncStudents( List<SyncTjStudent> syncStudents,Map<String,SysManageCom> manageComMap,Map<String,JhiUser> jhiUserMap,Map<String,LtStudentInfo> allLtStudentMap) {
        if (CollectionUtils.isNotNullList(syncStudents)) {
            //定义最终提交数据库的数据
            String encryptedPassword = null;
            List<SyncTjStudent> studentsData = syncStudents.stream().filter(a -> !a.getUuid().isEmpty() && !a.getUserid().isEmpty() && !a.getStatus().isEmpty()).collect(Collectors.toList());
            logger.info("--------》获取类型参数1，studentsData:{}",studentsData.size());
            List<SysManageCom> sysManageComs = sysManageComRepository.findAll();
            List<LtStudentInfo> batchInsertData = new ArrayList<>();
            List<LtStudentInfo> batchUpdateData = new ArrayList<>();
            List<JhiUser> batchJhiUserData = new ArrayList<>();
            List<JhiUser> newbatchJhiUserData = new ArrayList<>();
            List<JhiUserAuthority> batchJhiUserAuthorityData = new ArrayList<>();
            Map<String,SysManageCom> manageComMapByOrgId = sysManageComs.stream()
                .collect(Collectors.toMap(SysManageCom::getOrgId, Function.identity() , (d1, d2) -> d1));
            logger.info("manageComMapByOrgId,{}",manageComMapByOrgId.size());
            List<SyncTjStudent> outWorkStudents = syncTjStudentRepository.findAllByStatusInAndDeleted(new String[]{"02", "05", "06"},false);
            Map<String,SyncTjStudent> outWorkStudentMap = outWorkStudents.stream()
                .collect(Collectors.toMap(SyncTjStudent::getUuid, Function.identity() , (d1, d2) -> d1));
            Map<String,SysManageCom> manageComMapByOutCode = sysManageComs.stream()
                .collect(Collectors.toMap(SysManageCom::getOutComCode, Function.identity() , (d1, d2) -> d1));
            logger.info("manageComMapByOutCode,{}",manageComMapByOutCode.size());

            /**step.  获取已经在 lt_stduent_Indfo 表中存在的数据 此处可以考虑只返回id**/
            logger.info("设置Map值");
            logger.info("studentsData，{}",studentsData.size());

            for (SyncTjStudent syncStudent:syncStudents){

                //临时对象用来加到最后的数据库中
                LtStudentInfo ltStudentInfoNew = new LtStudentInfo();
                if (syncStudent.getMobile().length() > 15){
                    syncStudent.setMobile(null);
                }
                String employDate = syncStudent.getCreatedAt();

                //拷贝到新对象中，防止修改的时候直接修改数据库
                DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                ZoneOffset offset = OffsetDateTime.now().atZoneSameInstant(ZoneId.of("UTC")).getOffset();
                if (employDate != null){
                    LocalDateTime employDateTime = LocalDateTime.parse(employDate,dateTimeFormatter);
                    ltStudentInfoNew.setEmployDate(employDateTime.toInstant(offset));
                }
                ltStudentInfoNew.setManageComName(syncStudent.getDepartment());
                ltStudentInfoNew.setManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setCreatedByManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setCreatedByManageComName(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getFullName():String.valueOf(syncStudent.getDepartmentId()));
                ltStudentInfoNew.setPhone(syncStudent.getMobile());
                ltStudentInfoNew.setIdNo(syncStudent.getIdNumber());
                ltStudentInfoNew.setTradeSource(ConstantField.SYNC_TRADE_SOURCE_LW);
                ltStudentInfoNew.setFaceUrl(syncStudent.getFace());
                ltStudentInfoNew.seteMail(syncStudent.getEmail());
                ltStudentInfoNew.setStaffCode(syncStudent.getUserid());
                ltStudentInfoNew.setJobPosition(syncStudent.getPost());
                ltStudentInfoNew.setStuFlag("3");
                Pattern pattern = Pattern.compile("\"(.*?)\"");
                Matcher matcher = pattern.matcher(syncStudent.getPartTime());
                StringBuilder result = new StringBuilder();
                while (matcher.find()) {
                    String param = matcher.group(1); // 获取参数数据
                    result.append(param);
                    result.append(",");
                }

                String finalResult = null;
                if(ObjectUtil.isNotNull(result) && !("[]".equals(syncStudent.getPartTime()) || "".equals(syncStudent.getPartTime()))){
                    finalResult = result.toString().substring(0, result.length() - 1);

                }

                ltStudentInfoNew.setPartTimeJobPosition(finalResult);
                ltStudentInfoNew.setStuFlag("3");
                ltStudentInfoNew.setName(syncStudent.getName());
                //类型默认为B
                ltStudentInfoNew.setBranchType(ConstantField.BRANCHTYPE_B);

                //招聘为1/EHR为2

                //招聘默认01 todo 修改
                ltStudentInfoNew.setAgentState("在职".equals(syncStudent.getStatus())?"01":"04");
                ltStudentInfoNew.setStatus("在职".equals(syncStudent.getStatus())?"1":"0");


                // company 需要处理
                ltStudentInfoNew.setCompany("byd-group");
//                ltStudentInfoNew.setAgentGrade(syncStudent.getPost());
                if(ObjectUtil.isNull(allLtStudentMap.get(syncStudent.getUserid()))){
                    
                }else{
                    LtStudentInfo oldStudent  = allLtStudentMap.get(syncStudent.getUserid());
                    if("3".equals(oldStudent.getStuFlag())){
                        ltStudentInfoNew.setId(oldStudent.getId());
                        ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode());
                        ltStudentInfoNew.setCreatedBy(oldStudent.getCreatedBy());
                        ltStudentInfoNew.setCreatedByManageComName(oldStudent.getCreatedByManageComName());
                        ltStudentInfoNew.setCreatedByManageCom(oldStudent.getCreatedByManageCom());
                        ltStudentInfoNew.setCreatedByName(oldStudent.getCreatedByName());
                        ltStudentInfoNew.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
                        ltStudentInfoNew.setCreatedDate(oldStudent.getCreatedDate());
                        batchUpdateData.add(ltStudentInfoNew);
                    }

                }


                if(ObjectUtil.isNull(allLtStudentMap.get(syncStudent.getIdNumber()))){
                    if(ObjectUtil.isNull(allLtStudentMap.get(syncStudent.getUserid()))){
                        if("BYD-DingMingYue".equals(ltStudentInfoNew.getStaffCode())){
                        String trainCode = syncStudent.getUuid().replace("-","");
                        trainCode=trainCode.replace(trainCode.charAt(trainCode.length()-1)+"","1");
                        ltStudentInfoNew.setTrainCode(trainCode);
                    }else{
                        ltStudentInfoNew.setTrainCode(syncStudent.getUuid().replace("-",""));

                    }

                    if(manageComMapByOrgId.get(ltStudentInfoNew.getManageCom())!= null){
                        ltStudentInfoNew.setManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                        ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
                    }
                    if(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom())!= null){
                        ltStudentInfoNew.setMulManageCom(manageComMapByOutCode.get(ltStudentInfoNew.getMulManageCom()).getManageCom());
                    }

                    ltStudentInfoNew.setCreatedByManageCom(ltStudentInfoNew.getManageCom());
                    ltStudentInfoNew.setId(null);

                    //拷贝同步表对象
                    if(ObjectUtil.isNull(outWorkStudentMap.get(ltStudentInfoNew.getTrainCode()))){
                        batchInsertData.add(ltStudentInfoNew);
                    }
                    
                } else {
                    if("1".equals(oldStudent.getStuFlag())){
                        ltStudentInfoNew.setId(oldStudent.getId());
                        ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode());
                        ltStudentInfoNew.setCreatedBy(oldStudent.getCreatedBy());
                        ltStudentInfoNew.setCreatedByManageComName(syncStudent.getCreatedByManageComName());
                        ltStudentInfoNew.setCreatedByManageCom(syncStudent.getCreatedByManageCom());
                        ltStudentInfoNew.setCreatedByName(oldStudent.getCreatedByName());
                        ltStudentInfoNew.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
                        ltStudentInfoNew.setCreatedDate(oldStudent.getCreatedDate());
                        ltStudentInfoNew.setIdNo(syncStudent.getIdNumber());
                        batchUpdateData.add(ltStudentInfoNew);
                        }
                }
                
                else {
                    if("1".equals(oldStudent.getStuFlag())){
                        ltStudentInfoNew.setId(oldStudent.getId());
                        ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode());
                        ltStudentInfoNew.setCreatedBy(oldStudent.getCreatedBy());
                        ltStudentInfoNew.setCreatedByName(oldStudent.getCreatedByName());
                        ltStudentInfoNew.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
                        ltStudentInfoNew.setCreatedDate(oldStudent.getCreatedDate());
                        ltStudentInfoNew.setQwUserId(syncStudent.getEmployeeNumber());
                        ltStudentInfoNew.setManageComName(syncStudent.getDepartment());
                        ltStudentInfoNew.setManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                        ltStudentInfoNew.setCreatedByManageCom(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getManageCom():String.valueOf(syncStudent.getDepartmentId()));
                        ltStudentInfoNew.setCreatedByManageComName(ObjectUtil.isNotNull(manageComMap.get(String.valueOf(syncStudent.getDepartmentId())))?manageComMap.get(String.valueOf(syncStudent.getDepartmentId())).getFullName():String.valueOf(syncStudent.getDepartmentId()));
                        ltStudentInfoNew.setPhone(syncStudent.getMobile());
                        ltStudentInfoNew.seteMail(syncStudent.getEmail());
                        ltStudentInfoNew.setJobPosition(syncStudent.getPost());
                        batchUpdateData.add(ltStudentInfoNew);
                    } else if("3".equals(oldStudent.getStuFlag())){
                        ltStudentInfoNew.setId(oldStudent.getId());
                        ltStudentInfoNew.setTrainCode(oldStudent.getTrainCode());
                        ltStudentInfoNew.setCreatedBy(oldStudent.getCreatedBy());
                        ltStudentInfoNew.setCreatedByManageComName(oldStudent.getCreatedByManageComName());
                        ltStudentInfoNew.setCreatedByManageCom(oldStudent.getCreatedByManageCom());
                        ltStudentInfoNew.setCreatedByName(oldStudent.getCreatedByName());
                        ltStudentInfoNew.setCreatedByStaffCode(oldStudent.getCreatedByStaffCode());
                        ltStudentInfoNew.setCreatedDate(oldStudent.getCreatedDate());
                        batchUpdateData.add(ltStudentInfoNew);
                    }
                }
                    
                    
                }


            }

            logger.info("++++++++++++新增学员开始+++++++++++");
            batchService.batchInsert(batchInsertData);
            logger.info("++++++++++++新增学员结束,新增数：{}+++++++++++",batchInsertData.size());

            logger.info("++++++++++++更新学员开始+++++++++++");
            batchService.batchUpdate(batchUpdateData);
            logger.info("++++++++++++更新学员结束,更新数：{}+++++++++++",batchUpdateData.size());


            for (LtStudentInfo ltStudentInfo:batchInsertData){
                if(ObjectUtil.isNull(jhiUserMap.get(ltStudentInfo.getTrainCode()))){
                    encryptedPassword = ltStudentInfo.getIdNo().length() > 6?ltStudentInfo.getIdNo().substring(ltStudentInfo.getIdNo().length() - 6):"";
                    if (StringUtils.isBlank(encryptedPassword)) {
                        encryptedPassword = AESCBCUtil.decrypt("jMSk65U6UvslALqfb7LeMg==", "SYSTRAINAesEncry");;
                    }
                    String password = passwordEncoder.encode(encryptedPassword);
                    JhiUser jhiUser = new JhiUser();
                    jhiUser.setLogin(ltStudentInfo.getTrainCode());
                    jhiUser.setActivated(true);
                    jhiUser.setCreatedBy("admin");
                    jhiUser.setPasswordHash(password);
                    batchJhiUserData.add(jhiUser);
                }
            }
            logger.info("batchJhiUserData,{}",batchJhiUserData.size());
            batchService.batchInsert(batchJhiUserData);
            List<String> needAddJhiUserLogin = batchJhiUserData.stream().map(JhiUser::getLogin).collect(Collectors.toList());

            logger.info("jhiUser表插入");
            newbatchJhiUserData = jhiUserRepository.findAllByLoginIn(needAddJhiUserLogin);
            logger.info("jhiUser插入结束,{}",newbatchJhiUserData.size());

            for (JhiUser jhiUser:newbatchJhiUserData){
                JhiUserAuthority jhiUserAuthority = new JhiUserAuthority();
                jhiUserAuthority.setUserId(jhiUser.getId());
                jhiUserAuthority.setAuthorityName("ROLE_USER");
                batchJhiUserAuthorityData.add(jhiUserAuthority);
            }
            logger.info("jhiUserAuthority表插入");
            batchService.batchInsert(batchJhiUserAuthorityData);
            logger.info("jhiUserAuthority表插入,{}",batchJhiUserAuthorityData.size());
        }
    }
