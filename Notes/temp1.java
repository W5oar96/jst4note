if ("受众成员导入".equals(templateType)) {
                swb.setSheetName(0, messageUtil.getMessage("ssSysExcelImportTemplateService.downloadTemplate.audienceStudentImport"));
                Sheet sheet = swb.getSheetAt(0);
                Row row = sheet.createRow(0);
                Cell cell = null;
                CellStyle style = swb.createCellStyle();
                style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
                style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                style.setAlignment(HorizontalAlignment.CENTER);// 水平居中
                style.setVerticalAlignment(VerticalAlignment.CENTER);// 垂直居中
                style.setWrapText(CodeConstants.TRUE);//自动换行
                Font font = swb.createFont();
                font.setColor(IndexedColors.RED.getIndex());
                style.setFont(font);

                cell = row.createCell(0);
                if (CodeConstants.BusinessLine.铁军.getCode().equals(businessLines)) {
                    cell.setCellValue(messageUtil.getMessage("global.excelTitle.staffCodeIdNo"));
                }else {
                    cell.setCellValue(messageUtil.getMessage("global.excelTitle.staffCode"));
                }
                cell.setCellStyle(style);

                cell = row.createCell(1);
                cell.setCellValue(messageUtil.getMessage("global.excelTitle.name"));
                cell.setCellStyle(style);

                byte[] bytes = PoiExcelUtil.pubOutputExcel(swb);
                return new ResponseEntity<>(bytes, HttpStatus.OK);

            }