spring容器中，两个重要的概念，ioc 和 di
ioc，inversion of control，控制反转，用于资源的控制，创建、获取、销毁
di，dependency injection，依赖注入，用于组件之间的依赖关系

注册组件的方式1，@Bean注解，使用getBean()方法获取组件，getBeansOfType()按照类型获取组件
注册组件的方式2，使用SpringMVC分层注解 @Controller，@Service，@Repository，@Component
注册组件的方式3，使用@ComponentScan注解，组件批量扫描
注册组件的方式4，使用@Import注解，导入第三方组件
组件的作用域 @Scope，配合@Scope("singleton")，单例模式的时候才可以启用@Lazy 懒加载，仅在调用的时候才会注册
制造的某些对象比较复杂的时候，可以使用FactoryBean，工厂方法创建
注册组件的方式5，使用@Conditional注解，条件注册

