package com.sinosoft.repository;

import com.sinosoft.domain.LtCourseProgramOuterEnroll;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data  repository for the LtCourseProgramOuterEnroll entity.
 *
 * @author sinochx-trainadmin
 * @date 2023/01/01
 */
@SuppressWarnings("unused")
@Repository
public interface LtCourseProgramOuterEnrollRepository extends JpaRepository<LtCourseProgramOuterEnroll, Long>, JpaSpecificationExecutor<LtCourseProgramOuterEnroll> {

    /**
     * 根据班级编码查询此班级中外部导入学员
     * @param programCode
     * @param company
     * @param deleted
     * @return
     */
    List<LtCourseProgramOuterEnroll> findAllByProgramCodeAndCompanyAndDeleted(String programCode, String company, boolean deleted);
    /**
     * 根据班级编码查询此班级中外部导入学员
     * @param programCode
     * @param company
     * @param deleted
     * @return
     */
    Page<LtCourseProgramOuterEnroll> findAllByCompanyAndDeletedAndProgramCode(String company, boolean deleted, String programCode, Pageable pageable);
    /**
     * 批量删除外部学员
     */
    void deleteByProgramCodeAndIdInAndCompany(String programCode, List<Long> idList, String company);
}
